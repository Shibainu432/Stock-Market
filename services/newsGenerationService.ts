
import { ActiveEvent, SimulationState, MicroLLM } from '../types';

export type Article = { headline: string; summary: string; fullText: string };
export type GenerationResult = { article: Article; generatedText: string };

// This corpus simulates the data a character-level LLM would be trained on.
// It is written in a style mimicking financial news sources like AP, CNN, and Google News.
const TRAINING_CORPUS = `
Innovate Corp (INNV) saw its stock price surge by over 15% today following the announcement of its new AI platform, "Odyssey." Analysts suggest this breakthrough could disrupt the entire technology sector. The company's CEO stated, "Odyssey represents a quantum leap in machine learning capabilities, and we are confident in its potential to drive significant long-term growth." Trading volume for INNV was five times the daily average, reflecting strong investor optimism.
Meanwhile, the broader market faced headwinds as the Federal Reserve signaled a potential interest rate hike. The market index dropped 0.8% on the news. HealthSphere (HLTH) shares tumbled after their flagship drug failed its Phase III clinical trials, raising concerns about the company's future revenue pipeline. The FDA's decision was unexpected and sent shockwaves through the health sector.
In energy news, Solaris Energy (SOLR) secured a major government contract to build a new solar farm, boosting its stock price. Conversely, Petro-Global (PTRL) is under scrutiny for an environmental issue at one of its refineries. Regulators are investigating the incident, which could lead to significant fines.
FinEx Solutions (FINX) reported better-than-expected quarterly earnings, driven by the strong performance of its new fintech payment network. The report indicates robust growth in user adoption and transaction volume. This positive development comes amid growing competition in the financial technology space.
Geopolitical tensions in Asia are creating uncertainty. A new trade agreement is being negotiated, but its outcome remains unclear, impacting global supply chains. The industrials sector, particularly companies like Global Shipping (SHIP), is watching the situation closely. Any disruption could have widespread economic consequences.
In technology, Quantum Leap (QUAN) announced a strategic partnership with CyberSec Corp (CYBR) to develop next-generation security protocols for quantum computing. This alliance aims to address emerging threats in the digital landscape. The collaboration is seen as a proactive move by both companies.
The market is also reacting to a new set of regulations targeting the tech industry's data privacy practices. Companies like DataMine Inc. (DATA) may face increased compliance costs. An analyst commented, "While these regulations aim to protect consumers, they could also stifle innovation if implemented too broadly."
BioFuture Labs (BIOF) unveiled promising results from its early-stage gene therapy research. While still years from commercialization, the news generated positive buzz among investors focused on long-term biotechnology plays.
A surprise political scandal has erupted, causing market jitters. The full impact is yet to be seen, but investor confidence has been shaken. Market volatility is expected to remain high in the coming days as more details emerge. The situation is developing rapidly.
The global economy shows signs of a slowdown. Key economic indicators suggest a cooling period after months of rapid expansion. This has led to a sell-off in cyclical stocks. Investors are shifting capital towards more defensive assets.
DroneWorks (DRON) is launching a new line of autonomous drones for agricultural use, which could revolutionize farming efficiency. The product launch is scheduled for next quarter. AgriGrow (AGRI) is a potential major customer.
A major hurricane is forming, threatening energy infrastructure along the coast. This has caused a spike in energy futures. Companies are activating their disaster preparedness plans. The storm's path will be critical.
Vertex Realty (VRTX) is expanding its portfolio by acquiring several commercial properties. The real estate market has been stable, and this move signals confidence in its continued strength.
GameSphere (GAME) faces a lawsuit over its in-game monetization practices. The legal challenge could set a precedent for the entire gaming industry. The outcome is being watched closely by competitors and regulators alike.
The initial public offering of CloudCore Inc. (CLD) was a massive success, with shares soaring 40% above the initial offering price on the first day of trading. The IPO was one of the most anticipated of the year in the tech sector, reflecting strong demand for cloud computing services.
An analyst downgrade sent shares of Software Solutions (SFTW) tumbling by 8%. The report from a prominent investment bank cited concerns over slowing user growth and increased competition from emerging rivals. The company has not yet responded to the downgrade, which wiped over $5 billion from its market capitalization.
Global markets are on edge as central banks around the world contemplate their next move on interest rates to combat persistent inflation. The uncertainty has led to increased volatility in currency and bond markets, with investors seeking safe-haven assets.
AeroDynamics (AERO) won a landmark defense contract worth an estimated $10 billion over five years. The contract involves the production of next-generation aircraft components. This is a significant victory for the company, securing a stable revenue stream and bolstering its position in the aerospace industry.
A widespread cyberattack has disrupted services for several major financial institutions, including Nexus Capital (NEXS) and Legacy Bank (LGCY). The source of the attack is unknown, but it has highlighted vulnerabilities in the sector's digital infrastructure. Services are slowly being restored.
Genomics PLC (GENE) received a "fast track" designation from the FDA for its novel cancer therapy. This designation will expedite the review process and could bring the treatment to market sooner than anticipated. The company's stock rallied on the news.
A sudden diplomatic thaw between two rival nations has eased long-standing geopolitical tensions, boosting investor confidence globally. Markets in Europe and Asia saw significant gains, with the industrial and financial sectors leading the rally. The development is expected to have positive long-term economic implications.
A severe drought in key agricultural regions is expected to lead to a global food shortage, according to a report from an international agency. The warning has caused a sharp increase in commodity prices and has put pressure on companies like AgriGrow (AGRI).
PaySphere (PAY) is under investigation for anti-competitive practices related to its digital wallet service. The probe, launched by regulators, will examine whether the company unfairly disadvantages rivals on its platform.
In a surprise move, the CEO of TechGen Inc. (TECH) has announced their resignation, effective immediately. The board has appointed an interim CEO while it conducts a search for a permanent replacement. The unexpected leadership change has created uncertainty about the company's strategic direction.
The electric vehicle market is heating up as AutoDrive Systems (AUTO) unveils its new long-range battery technology. The innovation could give it a significant edge over competitors. The company plans to integrate the new batteries into its next line of vehicles.
A merger between two major players in the health insurance industry, InsuranTech (INSR) and a competitor, has been blocked by regulators over monopoly concerns. The decision is a major blow to both companies, which had expected the deal to create significant synergies.
`;

const MARKOV_ORDER = 6; // How many characters the model looks back on. Higher order = more coherence, but needs more data.

export const createMicroLLM = (): MicroLLM => {
    const transitionTable: Record<string, Record<string, number>> = {};
    const corpus = TRAINING_CORPUS;

    for (let i = 0; i < corpus.length - MARKOV_ORDER; i++) {
        const gram = corpus.substring(i, i + MARKOV_ORDER);
        const nextChar = corpus.charAt(i + MARKOV_ORDER);
        
        if (!transitionTable[gram]) {
            transitionTable[gram] = {};
        }
        if (!transitionTable[gram][nextChar]) {
            transitionTable[gram][nextChar] = 0;
        }
        transitionTable[gram][nextChar]++;
    }
    return { transitionTable, order: MARKOV_ORDER };
};

const selectNextChar = (possibilities: Record<string, number>): string => {
    const totalWeight = Object.values(possibilities).reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const char in possibilities) {
        random -= possibilities[char];
        if (random <= 0) {
            return char;
        }
    }
    return Object.keys(possibilities)[0]; // Fallback
};

export const learnFromArticleOutcome = (llm: MicroLLM, generatedText: string, outcome: number): MicroLLM => {
    const newLLM = { ...llm }; // Shallow copy

    // Calculate performance relative to the market (outcome = 1.0 is neutral)
    const performance = outcome - 1.0;

    // Use tanh to scale the performance to a value between -1 and 1.
    // The multiplier (e.g., 5) adjusts sensitivity. Higher values mean smaller market moves have a bigger impact on learning.
    const scaledPerformance = Math.tanh(performance * 5);

    // Define the maximum learning adjustment (e.g., 5% boost or suppression)
    const maxAdjustment = 0.05;
    const boostFactor = 1.0 + scaledPerformance * maxAdjustment;

    for (let i = 0; i < generatedText.length - newLLM.order; i++) {
        const gram = generatedText.substring(i, i + newLLM.order);
        const nextChar = generatedText.charAt(i + newLLM.order);

        if (newLLM.transitionTable[gram] && newLLM.transitionTable[gram][nextChar]) {
            // Adjust the weight of the transition that was used based on the outcome
            const newWeight = newLLM.transitionTable[gram][nextChar] * boostFactor;
            // Prevent weights from becoming zero or exploding
            newLLM.transitionTable[gram][nextChar] = Math.max(0.1, newWeight);
        }
    }
    return newLLM;
};


/**
 * Simulates the LLM "training" on its own corpus during idle time to reinforce correct language structures.
 */
export const refineLLMWithCorpus = (llm: MicroLLM): MicroLLM => {
    const newLLM = { ...llm };
    const reinforcementFactor = 1.001; // A very subtle positive reinforcement
    const chunkSize = 500; // Process a small chunk of the corpus at a time to simulate continuous learning

    // Select a random starting point in the corpus to "read" from
    const start = Math.floor(Math.random() * (TRAINING_CORPUS.length - chunkSize));
    const corpusChunk = TRAINING_CORPUS.substring(start, start + chunkSize);

    for (let i = 0; i < corpusChunk.length - newLLM.order; i++) {
        const gram = corpusChunk.substring(i, i + newLLM.order);
        const nextChar = corpusChunk.charAt(i + newLLM.order);

        if (newLLM.transitionTable[gram] && newLLM.transitionTable[gram][nextChar]) {
            // Reinforce existing, valid transitions found in the training data
            newLLM.transitionTable[gram][nextChar] *= reinforcementFactor;
        }
    }
    return newLLM;
};


export const generateNewsArticle = (event: ActiveEvent, state: SimulationState): GenerationResult => {
    const { microLLM } = state;
    const { transitionTable, order } = microLLM;
    const stock = event.stockSymbol ? state.stocks.find(s => s.symbol === event.stockSymbol) : null;

    // Create a seed phrase based on the event to guide the generation
    let seed = '';
    if (stock) {
        seed += `${stock.name} (${stock.symbol}) `;
    } else {
        seed += `The global market `;
    }
    if (event.type === 'positive') seed += 'stock surged';
    if (event.type === 'negative') seed += 'is facing headwinds';
    if (event.type === 'split') seed += 'announced a stock split';
    if (event.type === 'merger') seed += 'is acquiring a rival';
    if (event.type === 'alliance') seed += 'formed a strategic alliance';

    seed = seed.padEnd(order + 1); // Ensure seed is long enough

    let currentGram = seed.substring(seed.length - order);
    let resultText = seed;
    const targetLength = 500 + Math.floor(Math.random() * 300);

    for (let i = 0; i < targetLength; i++) {
        const possibilities = transitionTable[currentGram];
        if (!possibilities) {
            // If we hit a dead end, break or find a random starting point
            const randomKeys = Object.keys(transitionTable);
            currentGram = randomKeys[Math.floor(Math.random() * randomKeys.length)];
            continue;
        }
        
        const nextChar = selectNextChar(possibilities);
        resultText += nextChar;
        currentGram = resultText.substring(resultText.length - order);
    }
    
    // Clean up the generated text a bit
    let cleanedText = resultText.trim();
    const lastSentenceEnd = cleanedText.lastIndexOf('.');
    if (lastSentenceEnd !== -1) {
        cleanedText = cleanedText.substring(0, lastSentenceEnd + 1);
    }

    // Format into paragraphs (a simple heuristic)
    const sentences = cleanedText.split('. ').map(s => s.trim());
    let fullText = '';
    let paragraph = '';
    for (let i = 0; i < sentences.length; i++) {
        paragraph += sentences[i] + '. ';
        if ((i + 1) % 3 === 0) {
            fullText += paragraph.trim() + '\n\n';
            paragraph = '';
        }
    }
    if (paragraph) fullText += paragraph.trim();

    const summary = sentences.slice(0, 2).join('. ') + '.';

    const article: Article = {
        headline: event.eventName,
        summary,
        fullText: fullText.trim(),
    };

    return { article, generatedText: cleanedText };
};
