import { ActiveEvent, SimulationState, Stock, Region, LearningToken } from '../types';

// This file contains a bespoke, from-scratch MicroLLM (Large Language Model).
// It implements the core architectural principles of a modern Transformer model,
// including embeddings, positional encoding, multi-head attention, and feed-forward networks.
// It is self-contained, runs entirely in the browser, composes articles
// token-by-token, and learns from market feedback via reinforcement.


// --- 1. Vocabulary and Tokenization (Simplified) ---
export enum TokenType {
    // Control Tokens
    START_OF_SEQUENCE, END_OF_SEQUENCE,
    // Subjects
    SUBJECT_COMPANY, SUBJECT_MARKET, SUBJECT_SECTOR, SUBJECT_REGION, SUBJECT_REGULATORS, SUBJECT_ANALYSTS,
    // Verbs (Sentiment-driven)
    VERB_POS, VERB_NEG, VERB_NEUTRAL, VERB_SPECULATE, VERB_MERGER,
    // Objects & Concepts
    OBJECT_INNOVATION, OBJECT_POSITIVE_FINANCIALS,
    OBJECT_NEGATIVE_EVENT, OBJECT_ECONOMIC_HEADWINDS,
    OBJECT_UPDATE, OBJECT_POLITICAL_TENSION, OBJECT_DISASTER, OBJECT_INFLATION, OBJECT_INTEREST_RATES, OBJECT_REGULATORY_SCRUTINY,
    // Connectors
    CONJUNCTION_CAUSE, CONJUNCTION_RESULT, PREPOSITION,
    // Adjectives
    ADJECTIVE_POS, ADJECTIVE_NEG,
    // Contextual Descriptors
    CONTEXT_BULLISH, CONTEXT_BEARISH, CONTEXT_VOLATILE_MARKET,
    // Details & Data
    DATA_PRICE_CHANGE, DATA_MARKET_IMPACT, DATA_SECTOR_PERFORMANCE, DATA_52_WEEK_RANGE, DATA_VOLATILITY,
    // Analysis
    ANALYST_QUOTE_POS, ANALYST_QUOTE_NEG, ANALyst_QUOTE_NEUTRAL,
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
    region: Region | 'Global';
    sentiment: 'positive' | 'negative' | 'neutral';
    magnitude: number; // 0 to 1, how strong is the event
    event: ActiveEvent;
    state: SimulationState;
};

// --- Helper Functions for Linear Algebra ---
const dot = (a: number[], b: number[]): number => a.reduce((sum, val, i) => sum + val * b[i], 0);
const add = (a: number[], b: number[]): number[] => a.map((val, i) => val + b[i]);
const scale = (a: number[], s: number): number[] => a.map(val => val * s);
const dropout = (x: number[], rate: number): number[] => {
    if (rate === 0) return x;
    return x.map(val => (Math.random() > rate ? val : 0));
};


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
    
    // Using GELU approximation for a smoother activation than ReLU
    private gelu(x: number): number {
        return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3))));
    }

    forward(x: number[]): number[] {
        const hidden = this.w1.map((weights, i) => this.gelu(dot(x, weights) + this.b1[i]));
        const output = this.w2.map((weights, i) => dot(hidden, weights) + this.b2[i]);
        return output;
    }
}

class TransformerLayer {
    private attention: MultiHeadAttention;
    private ff: FeedForwardLayer;
    private norm1: LayerNorm;
    private norm2: LayerNorm;
    private dropoutRate: number;

    constructor(private embeddingDim: number, private numHeads: number, ffDim: number, dropoutRate: number = 0.1) {
        this.attention = new MultiHeadAttention(embeddingDim, numHeads);
        this.ff = new FeedForwardLayer(embeddingDim, ffDim);
        this.norm1 = new LayerNorm(embeddingDim);
        this.norm2 = new LayerNorm(embeddingDim);
        this.dropoutRate = dropoutRate;
    }

    forward(sequence: number[][]): number[][] {
        // Pre-Layer Normalization architecture
        const norm1_out = sequence.map(vec => this.norm1.forward(vec));
        let attentionOutput = this.attention.forward(norm1_out);
        attentionOutput = attentionOutput.map(vec => dropout(vec, this.dropoutRate));
        const residual1 = sequence.map((vec, i) => add(vec, attentionOutput[i]));

        const norm2_out = residual1.map(vec => this.norm2.forward(vec));
        let ffOutput = norm2_out.map(vec => this.ff.forward(vec));
        ffOutput = ffOutput.map(vec => dropout(vec, this.dropoutRate));
        return residual1.map((vec, i) => add(vec, ffOutput[i]));
    }
}

// --- 3. The MicroLLM Class ---
class MicroLLM {
    private embeddingDim = 64; 
    private maxSeqLen = 120; // Increased capacity for longer articles
    private vocabulary: TokenType[];
    private embeddings: Map<TokenType, number[]>;
    private contextFeatureEmbeddings: Map<string, number[]>;
    private positionalEncoding: number[][];
    private transformerLayers: TransformerLayer[];
    private outputProjection: number[][];
    private finalNorm: LayerNorm;
    private learningRate = 0.005;

    constructor(numLayers = 4, numHeads = 8) {
        this.vocabulary = Object.values(TokenType).filter(v => typeof v === 'number') as TokenType[];
        this.embeddings = this.createEmbeddings();
        this.contextFeatureEmbeddings = this.createContextFeatureEmbeddings();
        this.positionalEncoding = this.createPositionalEncoding();
        this.transformerLayers = Array.from({length: numLayers}, () => new TransformerLayer(this.embeddingDim, numHeads, this.embeddingDim * 4, 0.1));
        this.finalNorm = new LayerNorm(this.embeddingDim);
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
    
    private createContextFeatureEmbeddings(): Map<string, number[]> {
        const features = [
            'sentiment_positive', 'sentiment_negative', 'sentiment_neutral',
            'type_positive', 'type_negative', 'type_neutral', 'type_split', 'type_merger', 'type_alliance', 'type_political', 'type_disaster',
            'region_North America', 'region_Europe', 'region_Asia', 'region_Global'
        ];
        const embeddings = new Map<string, number[]>();
        features.forEach(feature => {
            embeddings.set(feature, Array.from({ length: this.embeddingDim }, () => Math.random() * 2 - 1));
        });
        return embeddings;
    }

    private createPositionalEncoding(): number[][] {
        const pe: number[][] = [];
        for (let pos = 0; pos < this.maxSeqLen + 1; pos++) { // +1 for context vector
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
    
    private createAndEmbedContext(context: GenerationContext): number[] {
        const sentimentFeature = `sentiment_${context.sentiment}`;
        const typeFeature = `type_${context.event.type}`;
        const regionFeature = `region_${context.region}`;

        const sentimentEmb = this.contextFeatureEmbeddings.get(sentimentFeature) || new Array(this.embeddingDim).fill(0);
        const typeEmb = this.contextFeatureEmbeddings.get(typeFeature) || new Array(this.embeddingDim).fill(0);
        const regionEmb = this.contextFeatureEmbeddings.get(regionFeature) || new Array(this.embeddingDim).fill(0);
        
        let combined = add(add(sentimentEmb, typeEmb), regionEmb);
        combined = scale(combined, 1/3); // average
        combined = scale(combined, 1 + context.magnitude); // Weight by importance
        
        return combined;
    }

    private getContext(event: ActiveEvent, state: SimulationState): GenerationContext {
        const subjectStock = event.stockSymbol ? state.stocks.find(s => s.symbol === event.stockSymbol) : null;
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        if (['positive', 'split', 'merger', 'alliance'].includes(event.type)) sentiment = 'positive';
        if (['negative', 'disaster', 'political'].includes(event.type) && event.impact && (typeof event.impact === 'number' ? event.impact < 1 : true)) sentiment = 'negative';
        
        const getMagnitude = () => {
             if (typeof event.impact === 'number') return Math.min(1, Math.abs(event.impact - 1) * 10);
             return 0.5;
        }

        return {
            subjectStock,
            companyName: event.stockName || (subjectStock ? subjectStock.name : 'The Market'),
            symbol: subjectStock?.symbol || 'MARKET',
            sector: subjectStock?.sector || 'Global Economy',
            region: subjectStock?.region || 'Global',
            sentiment,
            magnitude: getMagnitude(),
            event,
            state,
        };
    }

    private decode(logits: number[], previousTokens: TokenType[], temperature: number, top_p: number, repetition_penalty: number): TokenType {
        // 1. Apply repetition penalty
        const penalizedLogits = [...logits];
        const tokenSet = new Set(previousTokens.slice(-20)); 
        tokenSet.forEach(tokenType => {
            const index = this.vocabulary.indexOf(tokenType);
            if (index !== -1) {
                if (penalizedLogits[index] > 0) penalizedLogits[index] /= repetition_penalty;
                else penalizedLogits[index] *= repetition_penalty;
            }
        });

        // 2. Prepare for Top-P sampling
        const indexedLogits = penalizedLogits.map((logit, index) => ({ logit, index }));
        indexedLogits.sort((a, b) => b.logit - a.logit);

        // 3. Apply temperature and calculate probabilities (softmax)
        const scaledLogits = indexedLogits.map(item => item.logit / temperature);
        const maxLogit = scaledLogits[0] || 0;
        const exps = scaledLogits.map(l => Math.exp(l - maxLogit));
        const sumExps = exps.reduce((a, b) => a + b, 0);
        const probs = exps.map((e, i) => ({ prob: e / (sumExps || 1), index: indexedLogits[i].index }));

        // 4. Filter with Top-P (Nucleus)
        let cumulativeProb = 0;
        const nucleus = [];
        for (const probItem of probs) {
            nucleus.push(probItem);
            cumulativeProb += probItem.prob;
            if (cumulativeProb >= top_p) break;
        }
        if (nucleus.length === 0 && probs.length > 0) nucleus.push(probs[0]);


        // 5. Sample from the nucleus
        const nucleusSum = nucleus.reduce((a, b) => a + b.prob, 0);
        const normalizedNucleus = nucleus.map(item => ({...item, prob: item.prob / (nucleusSum || 1)}));

        const rand = Math.random();
        let sampleCumulativeProb = 0;
        for (const item of normalizedNucleus) {
            sampleCumulativeProb += item.prob;
            if (rand < sampleCumulativeProb) {
                return this.vocabulary[item.index];
            }
        }
        
        return this.vocabulary[nucleus[0]?.index] || TokenType.END_OF_SEQUENCE;
    }
    
    private detokenize(tokens: TokenType[], context: GenerationContext): string {
        const textMap: Record<number, () => string> = {
            // Subjects
            [TokenType.SUBJECT_COMPANY]: () => this.pick([`Shares of ${context.companyName}`, `${context.companyName} (${context.symbol})`, `The ${context.sector} firm`, `${context.companyName}`]),
            [TokenType.SUBJECT_MARKET]: () => this.pick(["The broader market", "Investor sentiment", "The global economy", "Wall Street"]),
            [TokenType.SUBJECT_SECTOR]: () => `The ${context.sector} sector`,
            [TokenType.SUBJECT_REGION]: () => `${context.region} markets`,
            [TokenType.SUBJECT_REGULATORS]: () => this.pick(["Regulators", "Government agencies", "A key oversight committee"]),
            [TokenType.SUBJECT_ANALYSTS]: () => this.pick(["Analysts", "Market watchers", "Investment experts"]),
            // Verbs
            [TokenType.VERB_POS]: () => context.magnitude > 0.5 ? this.pick(["skyrocketed", "surged", "rallied", "jumped"]) : this.pick(["climbed", "rose", "edged higher"]),
            [TokenType.VERB_NEG]: () => context.magnitude > 0.5 ? this.pick(["plummeted", "cratered", "was hammered"]) : this.pick(["slumped", "faced headwinds", "retreated"]),
            [TokenType.VERB_NEUTRAL]: () => this.pick(["reported", "saw", "experienced", "remained steady"]),
            [TokenType.VERB_SPECULATE]: () => this.pick(["are speculating", "are closely watching", "are debating the impact of"]),
            [TokenType.VERB_MERGER]: () => `announced its acquisition of ${context.event.mergerDetails?.acquired || 'a rival'}`,
            // Objects
            [TokenType.OBJECT_INNOVATION]: () => this.pick(["a significant technological breakthrough", "its promising innovation pipeline"]),
            [TokenType.OBJECT_POSITIVE_FINANCIALS]: () => this.pick(["better-than-expected quarterly earnings", `a major strategic deal`, "an upgrade from a prominent analyst"]),
            [TokenType.OBJECT_NEGATIVE_EVENT]: () => this.pick(["a stunning product failure", "a widespread corporate scandal", "a downgrade from a major ratings agency"]),
            [TokenType.OBJECT_ECONOMIC_HEADWINDS]: () => this.pick(["growing fears of a recession", "ongoing supply chain disruptions"]),
            [TokenType.OBJECT_UPDATE]: () => "a routine operational update",
            [TokenType.OBJECT_POLITICAL_TENSION]: () => "rising geopolitical tensions",
            [TokenType.OBJECT_DISASTER]: () => "a large-scale natural disaster",
            [TokenType.OBJECT_INFLATION]: () => "persistent inflation concerns",
            [TokenType.OBJECT_INTEREST_RATES]: () => "speculation about interest rate changes",
            [TokenType.OBJECT_REGULATORY_SCRUTINY]: () => "increased regulatory scrutiny",
            // Connectors & Adjectives
            [TokenType.CONJUNCTION_CAUSE]: () => this.pick(["as", "following", "on the back of", "driven by"]),
            [TokenType.CONJUNCTION_RESULT]: () => this.pick(["which", "leading to", "prompting", "sending shockwaves through"]),
            [TokenType.PREPOSITION]: () => this.pick(["amid", "in response to", "despite"]),
            [TokenType.ADJECTIVE_POS]: () => this.pick(["strong", "robust", "impressive"]),
            [TokenType.ADJECTIVE_NEG]: () => this.pick(["weak", "disappointing", "lackluster"]),
            // Context
            [TokenType.CONTEXT_BULLISH]: () => "a generally bullish market sentiment",
            [TokenType.CONTEXT_BEARISH]: () => "a backdrop of bearish market sentiment",
            [TokenType.CONTEXT_VOLATILE_MARKET]: () => "a period of heightened market volatility",
            // Data
            [TokenType.DATA_PRICE_CHANGE]: () => {
                if (!context.subjectStock) return "market volatility";
                const { close } = context.subjectStock.history.slice(-1)[0];
                const prevClose = context.subjectStock.history.slice(-2)[0].close;
                const changePercent = ((close - prevClose) / prevClose * 100).toFixed(2);
                return `to close at $${close.toFixed(2)}, a move of ${changePercent}% on the day`;
            },
            [TokenType.DATA_MARKET_IMPACT]: () => "spillover effects across the global economy",
            [TokenType.DATA_SECTOR_PERFORMANCE]: () => `a rally in the broader ${context.sector} sector`,
            [TokenType.DATA_52_WEEK_RANGE]: () => {
                if (!context.subjectStock) return "";
                const high = Math.max(...context.subjectStock.history.slice(-252).map(h => h.high));
                return `approaching its 52-week high of $${high.toFixed(2)}`;
            },
            [TokenType.DATA_VOLATILITY]: () => "a spike in trading volume and volatility",
            // Analysis
            [TokenType.ANALYST_QUOTE_POS]: () => '"This is a clear and decisive move that demonstrates their market leadership," commented one analyst.',
            [TokenType.ANALYST_QUOTE_NEG]: () => '"The situation is developing, but this is a major headwind for the company," stated a market expert.',
            [TokenType.ANALyst_QUOTE_NEUTRAL]: () => '"This appears to be a non-event for the stock\'s long-term valuation," an analyst noted.',
            [TokenType.OUTLOOK_POS]: () => "Looking ahead, the company appears well-positioned to capitalize on this momentum.",
            [TokenType.OUTLOOK_NEG]: () => "The firm faces a challenging road to recovery, with uncertainty clouding its future.",
            [TokenType.OUTLOOK_NEUTRAL]: () => "The outlook remains largely unchanged as investors digest the news.",
            // Punctuation
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

    public generate(event: ActiveEvent, state: SimulationState): { article: Article, learningTokens: LearningToken[] } {
        const context = this.getContext(event, state);
        const contextVector = this.createAndEmbedContext(context);
        
        const outputTokens: TokenType[] = [TokenType.START_OF_SEQUENCE];
        const learningTokens: LearningToken[] = [];

        for (let i = 0; i < this.maxSeqLen - 1; i++) {
            if (outputTokens[outputTokens.length-1] === TokenType.END_OF_SEQUENCE || outputTokens.length >= this.maxSeqLen) break;

            const tokenEmbeddings = outputTokens.map(t => this.embeddings.get(t)!);
            let sequence = [contextVector, ...tokenEmbeddings];
            
            sequence = sequence.map((vec, pos) => add(vec, this.positionalEncoding[pos]));
            
            for (const layer of this.transformerLayers) {
                sequence = layer.forward(sequence);
            }

            let lastVector = sequence[sequence.length - 1];
            lastVector = this.finalNorm.forward(lastVector);
            
            const logits = this.outputProjection.map(weights => dot(lastVector, weights));
            
            const nextToken = this.decode(logits, outputTokens, 0.9, 0.95, 1.2);
            outputTokens.push(nextToken);
            
            if (nextToken !== TokenType.END_OF_SEQUENCE) {
                learningTokens.push({ token: nextToken, hiddenState: lastVector });
            }
        }
        
        const cleanTokens = outputTokens.filter(t => t !== TokenType.START_OF_SEQUENCE && t !== TokenType.END_OF_SEQUENCE);
        const fullText = this.detokenize(cleanTokens, context);
        const headline = event.eventName;
        const summary = fullText.split('. ')[0] + '.';

        return { article: { headline, summary, fullText }, learningTokens };
    }

    public learn(trackedTokens: LearningToken[], outcome: number): void {
        // This simulates a policy gradient update on the final layer.
        // It reinforces the weights that led to the chosen tokens based on the market's reaction (outcome).
        if (!Array.isArray(trackedTokens)) return;
        
        trackedTokens.forEach(({ token, hiddenState }) => {
            if (token === undefined || !hiddenState) return;

            const tokenIndex = this.vocabulary.indexOf(token);
            if (tokenIndex === -1) return;

            const gradient = hiddenState;
            const update = scale(gradient, this.learningRate * outcome);

            this.outputProjection[tokenIndex] = add(this.outputProjection[tokenIndex], update);
        });
    }
}

export const newsGeneratorAI = new MicroLLM();

export const generateNewsArticle = (event: ActiveEvent, state: SimulationState): { article: Article, learningTokens: LearningToken[] } => {
    return newsGeneratorAI.generate(event, state);
};
