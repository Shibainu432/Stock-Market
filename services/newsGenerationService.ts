import { ActiveEvent, SimulationState, Stock, Region } from '../types';

// This file contains a bespoke, from-scratch MicroLLM (Large Language Model).
// It implements the core architectural principles of a modern Transformer model,
// including embeddings, positional encoding, multi-head attention, and feed-forward networks.
// It is self-contained, runs entirely in the browser, composes articles
// token-by-token, and learns from market feedback via reinforcement.


// --- 1. Vocabulary and Tokenization ---
export enum TokenType {
    // Control Tokens
    START_OF_SEQUENCE, END_OF_SEQUENCE,
    // Subjects
    SUBJECT_COMPANY, SUBJECT_MARKET, SUBJECT_SECTOR, SUBJECT_REGION,
    // Verbs (Sentiment-driven)
    VERB_POS, VERB_NEG, VERB_NEUTRAL,
    // Objects & Concepts
    OBJECT_BREAKTHROUGH, OBJECT_EARNINGS, OBJECT_DEAL,
    OBJECT_FAILURE, OBJECT_SCANDAL, OBJECT_DOWNTURN,
    OBJECT_UPDATE, OBJECT_POLITICAL_TENSION, OBJECT_DISASTER,
    // Connectors
    CONJUNCTION_CAUSE, CONJUNCTION_RESULT, PREPOSITION,
    // Details & Data
    DATA_PRICE_CHANGE, DATA_MARKET_IMPACT, DATA_SECTOR_PERFORMANCE, DATA_52_WEEK_RANGE,
    // Analysis
    ANALYST_QUOTE_POS, ANALYST_QUOTE_NEG, ANALYST_QUOTE_NEUTRAL,
    OUTLOOK_POS, OUTLOOK_NEG, OUTLOOK_NEUTRAL,
    // Punctuation
    PUNCTUATION_COMMA, PUNCTUATION_PERIOD,
}

type Article = { headline: string; summary: string; fullText: string };
type GenerationContext = {
    subjectStock: Stock | null;
    companyName: string;
    symbol: string;
    sector: string;
    // Fix: Allow the region to be 'Global' to align with the data source from ActiveEvent.
    region: Region | 'Global';
    sentiment: 'positive' | 'negative' | 'neutral';
    event: ActiveEvent;
    state: SimulationState;
};

// --- Helper Functions for Linear Algebra ---
const dot = (a: number[], b: number[]): number => a.reduce((sum, val, i) => sum + val * b[i], 0);
const add = (a: number[], b: number[]): number[] => a.map((val, i) => val + b[i]);
const scale = (a: number[], s: number): number[] => a.map(val => val * s);

// --- 2. Core Transformer Components ---

class LayerNorm {
    private gain: number[];
    private bias: number[];
    constructor(private size: number, private epsilon = 1e-5) {
        this.gain = new Array(size).fill(1);
        this.bias = new Array(size).fill(0);
    }
    forward(x: number[]): number[] {
        const mean = x.reduce((a, b) => a + b, 0) / this.size;
        const variance = x.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.size;
        const std = Math.sqrt(variance + this.epsilon);
        return x.map((val, i) => this.gain[i] * (val - mean) / std + this.bias[i]);
    }
}

class MultiHeadAttention {
    private wq: number[][][]; // Head -> Dim -> Dim
    private wk: number[][][];
    private wv: number[][][];
    private wo: number[][]; // Dim -> Dim

    constructor(private embeddingDim: number, private numHeads: number) {
        const headDim = embeddingDim / numHeads;
        if (embeddingDim % numHeads !== 0) {
            throw new Error("Embedding dimension must be divisible by number of heads.");
        }
        this.wq = Array.from({ length: numHeads }, () => this.xavierInit(embeddingDim, headDim));
        this.wk = Array.from({ length: numHeads }, () => this.xavierInit(embeddingDim, headDim));
        this.wv = Array.from({ length: numHeads }, () => this.xavierInit(embeddingDim, headDim));
        this.wo = this.xavierInit(embeddingDim, embeddingDim);
    }
    
    private xavierInit(fanIn: number, fanOut: number): number[][] {
        const limit = Math.sqrt(6 / (fanIn + fanOut));
        return Array.from({ length: fanOut }, () => Array.from({ length: fanIn }, () => (Math.random() * 2 - 1) * limit));
    }

    private scaledDotProductAttention(q: number[][], k: number[][], v: number[][]): number[][] {
        const d_k = q[0].length;
        const scores = q.map(q_i => k.map(k_j => dot(q_i, k_j) / Math.sqrt(d_k)));
        const attentionWeights = scores.map(row => {
            const max = Math.max(...row);
            const exps = row.map(s => Math.exp(s - max));
            const sum = exps.reduce((a, b) => a + b, 0);
            return exps.map(e => e / (sum || 1));
        });
        return attentionWeights.map(weights => v[0].map((_, i) => weights.reduce((sum, w, j) => sum + w * v[j][i], 0)));
    }
    
    forward(sequence: number[][]): number[][] {
        const heads = Array.from({ length: this.numHeads }).map((_, h) => {
            const q = sequence.map(vec => this.wq[h].map(weights => dot(vec, weights)));
            const k = sequence.map(vec => this.wk[h].map(weights => dot(vec, weights)));
            const v = sequence.map(vec => this.wv[h].map(weights => dot(vec, weights)));
            return this.scaledDotProductAttention(q, k, v);
        });

        const concatenated = sequence.map((_, i) => heads.flatMap(h => h[i]));
        return concatenated.map(vec => this.wo.map(weights => dot(vec, weights)));
    }
}

class FeedForwardLayer {
    private w1: number[][];
    private b1: number[];
    private w2: number[][];
    private b2: number[];

    constructor(private embeddingDim: number, private ffDim: number) {
        this.w1 = this.xavierInit(embeddingDim, ffDim);
        this.b1 = new Array(ffDim).fill(0);
        this.w2 = this.xavierInit(ffDim, embeddingDim);
        this.b2 = new Array(embeddingDim).fill(0);
    }
    
    private xavierInit(fanIn: number, fanOut: number): number[][] {
        const limit = Math.sqrt(6 / (fanIn + fanOut));
        return Array.from({ length: fanOut }, () => Array.from({ length: fanIn }, () => (Math.random() * 2 - 1) * limit));
    }
    
    private relu(x: number): number { return Math.max(0, x); }

    forward(x: number[]): number[] {
        let hidden = this.w1.map((weights, i) => this.relu(dot(x, weights) + this.b1[i]));
        let output = this.w2.map((weights, i) => dot(hidden, weights) + this.b2[i]);
        return output;
    }
}

class TransformerLayer {
    private attention: MultiHeadAttention;
    private ff: FeedForwardLayer;
    private norm1: LayerNorm;
    private norm2: LayerNorm;

    constructor(private embeddingDim: number, private numHeads: number, ffDim: number) {
        this.attention = new MultiHeadAttention(embeddingDim, numHeads);
        this.ff = new FeedForwardLayer(embeddingDim, ffDim);
        this.norm1 = new LayerNorm(embeddingDim);
        this.norm2 = new LayerNorm(embeddingDim);
    }

    forward(sequence: number[][]): number[][] {
        const attentionInput = sequence.map(vec => this.norm1.forward(vec));
        const attentionOutput = this.attention.forward(attentionInput);
        const residual1 = sequence.map((vec, i) => add(vec, attentionOutput[i]));

        const ffInput = residual1.map(vec => this.norm2.forward(vec));
        const ffOutput = ffInput.map(vec => this.ff.forward(vec));
        return residual1.map((vec, i) => add(vec, ffOutput[i]));
    }
}

// --- 3. The MicroLLM Class ---
class MicroLLM {
    private embeddingDim = 32;
    private maxSeqLen = 60;
    private vocabulary: TokenType[];
    private embeddings: Map<TokenType, number[]>;
    private positionalEncoding: number[][];
    private transformerLayers: TransformerLayer[];
    private outputProjection: number[][];
    private learningRate = 0.01;

    constructor(numLayers = 2, numHeads = 4) {
        this.vocabulary = Object.values(TokenType).filter(v => typeof v === 'number') as TokenType[];
        this.embeddings = this.createEmbeddings();
        this.positionalEncoding = this.createPositionalEncoding();
        this.transformerLayers = Array.from({length: numLayers}, () => new TransformerLayer(this.embeddingDim, numHeads, this.embeddingDim * 4));
        this.outputProjection = this.xavierInit(this.embeddingDim, this.vocabulary.length);
    }
    
    private xavierInit(fanIn: number, fanOut: number): number[][] {
        const limit = Math.sqrt(6 / (fanIn + fanOut));
        return Array.from({ length: fanOut }, () => Array.from({ length: fanIn }, () => (Math.random() * 2 - 1) * limit));
    }

    private createEmbeddings(): Map<TokenType, number[]> {
        const embeddings = new Map<TokenType, number[]>();
        this.vocabulary.forEach(token => {
            embeddings.set(token, Array.from({ length: this.embeddingDim }, () => Math.random() * 2 - 1));
        });
        return embeddings;
    }

    private createPositionalEncoding(): number[][] {
        const pe: number[][] = [];
        for (let pos = 0; pos < this.maxSeqLen; pos++) {
            const peRow: number[] = [];
            for (let i = 0; i < this.embeddingDim; i++) {
                if (i % 2 === 0) {
                    peRow.push(Math.sin(pos / Math.pow(10000, i / this.embeddingDim)));
                } else {
                    peRow.push(Math.cos(pos / Math.pow(10000, (i - 1) / this.embeddingDim)));
                }
            }
            pe.push(peRow);
        }
        return pe;
    }

    private getContext(event: ActiveEvent, state: SimulationState): GenerationContext {
        const subjectStock = event.stockSymbol ? state.stocks.find(s => s.symbol === event.stockSymbol) : null;
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        if (['positive', 'split', 'merger', 'alliance'].includes(event.type)) sentiment = 'positive';
        if (['negative', 'disaster', 'political'].includes(event.type) && event.impact && (typeof event.impact === 'number' ? event.impact < 1 : true)) sentiment = 'negative';
        
        return {
            subjectStock,
            companyName: event.stockName || (subjectStock ? subjectStock.name : 'The Market'),
            symbol: subjectStock?.symbol || 'MARKET',
            sector: subjectStock?.sector || 'Global Economy',
            region: subjectStock?.region || event.region || 'Global',
            sentiment,
            event,
            state,
        };
    }

    private sample(logits: number[], temperature: number): TokenType {
        const scaledLogits = logits.map(l => l / temperature);
        const maxLogit = Math.max(...scaledLogits);
        const exps = scaledLogits.map(logit => Math.exp(logit - maxLogit));
        const sumExps = exps.reduce((a, b) => a + b, 0);
        const probs = exps.map(e => e / sumExps);
        const rand = Math.random();
        let cumulativeProb = 0;
        for (let i = 0; i < probs.length; i++) {
            cumulativeProb += probs[i];
            if (rand < cumulativeProb) {
                return this.vocabulary[i];
            }
        }
        return this.vocabulary[this.vocabulary.length - 1]; // Fallback
    }

    private detokenize(tokens: TokenType[], context: GenerationContext): string {
        const textMap: Record<number, () => string> = {
            [TokenType.SUBJECT_COMPANY]: () => this.pick([`Shares of ${context.companyName}`, `${context.companyName} (${context.symbol})`, `The ${context.sector} firm`]),
            [TokenType.SUBJECT_MARKET]: () => this.pick(["The broader market", "Investor sentiment", "The global economy"]),
            [TokenType.SUBJECT_SECTOR]: () => `The ${context.sector} sector`,
            [TokenType.SUBJECT_REGION]: () => `${context.region} markets`,
            [TokenType.VERB_POS]: () => this.pick(["surged", "climbed", "rallied", "announced", "soared"]),
            [TokenType.VERB_NEG]: () => this.pick(["plummeted", "tumbled", "faced headwinds", "slumped"]),
            [TokenType.VERB_NEUTRAL]: () => this.pick(["reported", "saw", "experienced", "remained steady"]),
            [TokenType.OBJECT_BREAKTHROUGH]: () => "a significant technological breakthrough",
            [TokenType.OBJECT_EARNINGS]: () => "better-than-expected earnings",
            [TokenType.OBJECT_DEAL]: () => "a major strategic deal",
            [TokenType.OBJECT_FAILURE]: () => "a stunning product failure",
            [TokenType.OBJECT_SCANDAL]: () => "a widespread corporate scandal",
            [TokenType.OBJECT_DOWNTURN]: () => "a significant market downturn",
            [TokenType.OBJECT_UPDATE]: () => "a routine operational update",
            [TokenType.OBJECT_POLITICAL_TENSION]: () => "rising geopolitical tensions",
            [TokenType.OBJECT_DISASTER]: () => "a large-scale natural disaster",
            [TokenType.CONJUNCTION_CAUSE]: () => this.pick(["as", "following", "on the back of"]),
            [TokenType.CONJUNCTION_RESULT]: () => this.pick(["which", "leading to", "prompting"]),
            [TokenType.PREPOSITION]: () => this.pick(["amid", "in response to", "despite"]),
            [TokenType.DATA_PRICE_CHANGE]: () => {
                if (!context.subjectStock) return "a period of market volatility";
                const { close } = context.subjectStock.history.slice(-1)[0];
                const prevClose = context.subjectStock.history.slice(-2)[0].close;
                const changePercent = ((close - prevClose) / prevClose * 100).toFixed(2);
                return `closing at $${close.toFixed(2)}, a move of ${changePercent}%`;
            },
            [TokenType.DATA_MARKET_IMPACT]: () => "spillover effects across the global economy",
            [TokenType.DATA_SECTOR_PERFORMANCE]: () => `strong performance in the ${context.sector} sector`,
            [TokenType.DATA_52_WEEK_RANGE]: () => {
                if (!context.subjectStock) return "";
                const high = Math.max(...context.subjectStock.history.slice(-252).map(h => h.high));
                return `approaching its 52-week high of $${high.toFixed(2)}`;
            },
            [TokenType.ANALYST_QUOTE_POS]: () => '"This is a clear and decisive move that demonstrates their market leadership," commented one analyst.',
            [TokenType.ANALYST_QUOTE_NEG]: () => '"The situation is developing, but this is a major headwind for the company," stated a market expert.',
            [TokenType.ANALYST_QUOTE_NEUTRAL]: () => '"This appears to be a non-event for the stock\'s long-term valuation," an analyst noted.',
            [TokenType.OUTLOOK_POS]: () => "Looking ahead, the company appears well-positioned to capitalize on this momentum.",
            [TokenType.OUTLOOK_NEG]: () => "The firm faces a challenging road to recovery, with uncertainty clouding its future.",
            [TokenType.OUTLOOK_NEUTRAL]: () => "The outlook remains largely unchanged as investors digest the news.",
            [TokenType.PUNCTUATION_COMMA]: () => ",",
            [TokenType.PUNCTUATION_PERIOD]: () => ".",
        };

        let text = tokens.map(t => textMap[t] ? textMap[t]() : '').join(' ');
        text = text.replace(/\s,/g, ',').replace(/\s\./g, '.').replace(/ ,/g, ',').replace(/ \./g, '.');
        return text.split('. ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('. ');
    }

    private pick<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    public generate(event: ActiveEvent, state: SimulationState): { article: Article, tokens: TokenType[] } {
        const context = this.getContext(event, state);
        
        let outputTokens: TokenType[] = [TokenType.START_OF_SEQUENCE];
        for (let i = 0; i < this.maxSeqLen - 1; i++) {
            if (outputTokens[outputTokens.length-1] === TokenType.END_OF_SEQUENCE || outputTokens.length >= this.maxSeqLen) break;

            let sequence = outputTokens.map(t => this.embeddings.get(t)!);
            sequence = sequence.map((vec, pos) => add(vec, this.positionalEncoding[pos]));
            
            for (const layer of this.transformerLayers) {
                sequence = layer.forward(sequence);
            }
            
            const lastVector = sequence[sequence.length - 1];
            const logits = this.outputProjection.map(weights => dot(lastVector, weights));
            
            const nextToken = this.sample(logits, 0.8); // Use temperature for more creative output
            outputTokens.push(nextToken);
        }
        
        const cleanTokens = outputTokens.filter(t => t !== TokenType.START_OF_SEQUENCE && t !== TokenType.END_OF_SEQUENCE);
        const fullText = this.detokenize(cleanTokens, context);
        const headline = event.eventName;
        const summary = fullText.split('. ')[0] + '.';

        return { article: { headline, summary, fullText }, tokens: cleanTokens };
    }

    public learn(tokens: TokenType[], outcome: number): void {
        // This is a simplified reinforcement learning mechanism, not backpropagation.
        // It nudges the embeddings of used tokens based on the outcome.
        const outcomeVector = new Array(this.embeddingDim).fill(outcome);

        tokens.forEach(token => {
            const currentEmbedding = this.embeddings.get(token);
            if (currentEmbedding) {
                // Nudge the embedding towards the outcome vector
                const delta = scale(add(outcomeVector, scale(currentEmbedding, -1)), this.learningRate);
                const newEmbedding = add(currentEmbedding, delta);
                this.embeddings.set(token, newEmbedding);
            }
        });
    }
}

export const newsGeneratorAI = new MicroLLM();

export const generateNewsArticle = (event: ActiveEvent, state: SimulationState): { article: Article, tokens: TokenType[] } => {
    return newsGeneratorAI.generate(event, state);
};
