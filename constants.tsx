
import React from 'react';
import { InvestorStrategy, ComplexInvestorStrategy, HyperComplexInvestorStrategy, Region, Investor, RandomInvestorStrategy, TaxJurisdiction } from './types';
import { NeuralNetwork } from './services/neuralNetwork';

export interface StockConfig {
    symbol: string;
    name: string;
    sector: string;
    region: Region;
    basePrice: number;
    isETF?: boolean;
}

// Defines the categories for macro events, which correspond to the output neurons of the News Picker AI.
export const NEWS_EVENT_CATEGORIES = [
    'PositiveNA', 'NegativeNA',
    'PositiveEU', 'NegativeEU',
    'PositiveAsia', 'NegativeAsia',
    'PositiveGlobal', 'NegativeGlobal',
    'PoliticalGlobal', 'DisasterGlobal'
] as const;

export type NewsEventCategory = typeof NEWS_EVENT_CATEGORIES[number];


// Fix: Add a specific type for corporate event configurations to improve type safety.
interface CorporateEventConfig {
  name: string;
  description: string;
  impact?: number | Record<string, number>; // Made optional for neutral events
  type: 'positive' | 'negative' | 'neutral' | 'political' | 'disaster';
  region?: Region | 'Global';
  category?: NewsEventCategory;
}

type InvestorConfig = {
  id: string;
  name: string;
  isHuman?: boolean;
  strategyName?: string;
  strategy: InvestorStrategy | ComplexInvestorStrategy | HyperComplexInvestorStrategy | RandomInvestorStrategy;
  initialCash: number;
  jurisdiction: TaxJurisdiction;
};

// Shuffle array in place
// Fix: Add a trailing comma to the generic type parameter list to disambiguate from a JSX tag for the TSX parser.
const shuffle = <T,>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- Fictional Name Generation for Random Simulation ---
const RANDOM_NAME_PREFIXES = ['Apex', 'Stellar', 'Quantum', 'Orion', 'Cyber', 'Bio', 'Geo', 'Fusion', 'Nova', 'Vertex', 'Axiom', 'Pinnacle', 'Zenith', 'Elysian', 'Momentum', 'Helios', 'Vanguard', 'Titan', 'Seraph', 'Echo'];
const RANDOM_NAME_SUFFIXES = ['Dynamics', 'Solutions', 'Labs', 'Systems', 'Corp', 'Industries', 'Tech', 'Ventures', 'Holdings', 'Group', 'Analytics', 'Innovations', 'Enterprises', 'Robotics', 'Pharmaceuticals', 'Energy', 'Financial', 'Logistics'];

const generateSymbolFromName = (name: string): string => {
    const words = name.replace(/[^a-zA-Z\s]/g, '').split(' ');
    let symbol = '';
    if (words.length > 1) {
        symbol = (words[0].substring(0, 2) + words[1].substring(0, 2));
    } else if (words.length === 1 && words[0].length >= 4) {
        symbol = words[0].substring(0, 4);
    } else {
        symbol = (words[0] + 'CORP').substring(0, 4);
    }
    return symbol.toUpperCase();
};

export const generateRandomStock = (usedSymbols: Set<string>): { randomName: string, randomSymbol: string } => {
    let randomName = '';
    let randomSymbol = '';
    let attempts = 0;

    do {
        const prefix = RANDOM_NAME_PREFIXES[Math.floor(Math.random() * RANDOM_NAME_PREFIXES.length)];
        const suffix = RANDOM_NAME_SUFFIXES[Math.floor(Math.random() * RANDOM_NAME_SUFFIXES.length)];
        randomName = `${prefix} ${suffix}`;
        randomSymbol = generateSymbolFromName(randomName);
        attempts++;
    } while (usedSymbols.has(randomSymbol) && attempts < 100);

    if (usedSymbols.has(randomSymbol)) {
        let suffixNum = 1;
        let originalSymbol = randomSymbol.substring(0,3);
        do {
            randomSymbol = originalSymbol + suffixNum;
            suffixNum++;
        } while (usedSymbols.has(randomSymbol))
    }
    
    return { randomName, randomSymbol };
};


export const STOCK_CONFIG: StockConfig[] = [
  // Technology
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', region: 'North America', basePrice: 214 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', region: 'North America', basePrice: 442 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', region: 'North America', basePrice: 179 },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', sector: 'Technology', region: 'North America', basePrice: 185 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', region: 'North America', basePrice: 131 },
  { symbol: 'META', name: 'Meta Platforms, Inc.', sector: 'Technology', region: 'North America', basePrice: 501 },
  { symbol: 'TSM', name: 'Taiwan Semiconductor', sector: 'Technology', region: 'Asia', basePrice: 173 },
  { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology', region: 'North America', basePrice: 1735 },
  { symbol: 'ORCL', name: 'Oracle Corp.', sector: 'Technology', region: 'North America', basePrice: 141 },
  { symbol: 'CRM', name: 'Salesforce, Inc.', sector: 'Technology', region: 'North America', basePrice: 242 },
  { symbol: 'SAP', name: 'SAP SE', sector: 'Technology', region: 'Europe', basePrice: 194 },

  // Health
  { symbol: 'LLY', name: 'Eli Lilly and Co.', sector: 'Health', region: 'North America', basePrice: 886 },
  { symbol: 'NVO', name: 'Novo Nordisk A/S', sector: 'Health', region: 'Europe', basePrice: 142 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Health', region: 'North America', basePrice: 147 },
  { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Health', region: 'North America', basePrice: 490 },
  { symbol: 'MRK', name: 'Merck & Co., Inc.', sector: 'Health', region: 'North America', basePrice: 130 },
  { symbol: 'AZN', name: 'AstraZeneca PLC', sector: 'Health', region: 'Europe', basePrice: 79 },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Health', region: 'North America', basePrice: 28 },

  // Energy
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', sector: 'Energy', region: 'North America', basePrice: 114 },
  { symbol: 'CVX', name: 'Chevron Corp.', sector: 'Energy', region: 'North America', basePrice: 157 },
  { symbol: 'SHEL', name: 'Shell plc', sector: 'Energy', region: 'Europe', basePrice: 68 },
  { symbol: 'TTE', name: 'TotalEnergies SE', sector: 'Energy', region: 'Europe', basePrice: 67 },
  { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy', region: 'North America', basePrice: 111 },

  // Finance
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Finance', region: 'North America', basePrice: 196 },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Finance', region: 'North America', basePrice: 275 },
  { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Finance', region: 'North America', basePrice: 455 },
  { symbol: 'BAC', name: 'Bank of America Corp.', sector: 'Finance', region: 'North America', basePrice: 39 },
  { symbol: 'WFC', name: 'Wells Fargo & Co.', sector: 'Finance', region: 'North America', basePrice: 58 },
  { symbol: 'HSBC', name: 'HSBC Holdings plc', sector: 'Finance', region: 'Europe', basePrice: 43 },
  { symbol: 'MUFG', name: 'Mitsubishi UFJ Financial', sector: 'Finance', region: 'Asia', basePrice: 10 },

  // Industrials
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials', region: 'North America', basePrice: 328 },
  { symbol: 'BA', name: 'The Boeing Company', sector: 'Industrials', region: 'North America', basePrice: 177 },
  { symbol: 'TM', name: 'Toyota Motor Corp.', sector: 'Industrials', region: 'Asia', basePrice: 205 },
  { symbol: 'SIEGY', name: 'Siemens AG', sector: 'Industrials', region: 'Europe', basePrice: 181 },
  { symbol: 'UPS', name: 'United Parcel Service', sector: 'Industrials', region: 'North America', basePrice: 137 },
  { symbol: 'LMT', name: 'Lockheed Martin Corp.', sector: 'Industrials', region: 'North America', basePrice: 468 },
  { symbol: 'RTX', name: 'RTX Corporation', sector: 'Industrials', region: 'North America', basePrice: 104 },

  // --- Sector ETFs ---
  { symbol: 'XTC', name: 'Global Tech ETF', sector: 'Technology', isETF: true, basePrice: 100, region: 'Global' },
  { symbol: 'XHV', name: 'Global Health ETF', sector: 'Health', isETF: true, basePrice: 100, region: 'Global' },
  { symbol: 'XLE', name: 'Global Energy ETF', sector: 'Energy', isETF: true, basePrice: 100, region: 'Global' },
  { symbol: 'XLF', name: 'Global Finance ETF', sector: 'Finance', isETF: true, basePrice: 100, region: 'Global' },
  { symbol: 'XLI', name: 'Global Industrials ETF', sector: 'Industrials', isETF: true, basePrice: 100, region: 'Global' },
];

export const ICONS = {
    play: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>,
    pause: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H8zm3 0a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z" clipRule="evenodd" /></svg>,
    reset: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm12 14a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 111.885-.666A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v3a1 1 0 01-1 1z" clipRule="evenodd" /></svg>,
    resetReal: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11h3v7H2v-7zm4 0h3v7H6v-7zm4-4h3v11h-3V7zm4 4h3v7h-3v-7z" /></svg>
};
  
export const SIMULATION_SPEEDS = [
    { label: '1m/s', steps: 60 },
    { label: '15m/s', steps: 900 },
    { label: '30m/s', steps: 1800 },
    { label: '1h/s', steps: 3600 },
    { label: '3h/s', steps: 10800 },
    { label: '12h/s', steps: 43200 },
    { label: '1d/s', steps: 86400 },
    { label: '3d/s', steps: 259200 },
    { label: '1w/s', steps: 604800 },
];

export const MIN_INITIAL_STOCK_PRICE = 8;
export const MAX_INITIAL_STOCK_PRICE = 12;
export const INITIAL_HISTORY_LENGTH = 252; // Approx 1 year
export const HUMAN_INITIAL_INVESTOR_CASH = 1_000_000;
export const AI_INITIAL_INVESTOR_CASH = 100;
export const INFLATION_RATE = 0.02 / 365; // Daily inflation rate

export const TAX_CONSTANTS = {
  LONG_TERM_HOLDING_PERIOD: 365, // days
};

export interface TaxRegime {
    ltcgRate: number;
    ltcgExemption?: number;
    stcgRate: number;
    stcgExemption?: number;
    description: string;
}

export const TAX_REGIMES: Record<TaxJurisdiction, TaxRegime> = {
    USA_WA: {
        ltcgRate: 0.07, // State LTCG
        ltcgExemption: 250000,
        stcgRate: 0, // No state STCG tax
        description: 'USA (Federal) + Washington (State). 7% LTCG tax on gains over $250k.'
    },
    USA_CA: {
        ltcgRate: 0.093, // State income tax applies
        stcgRate: 0.093, // State income tax applies
        description: 'USA (Federal) + California (State). 9.3% income tax on all capital gains.'
    },
    USA_TX: {
        ltcgRate: 0,
        stcgRate: 0,
        description: 'USA (Federal) + Texas (State). No state income tax on capital gains.'
    },
    DE: {
        ltcgRate: 0.264, // Abgeltungsteuer + Soli
        stcgRate: 0.264,
        ltcgExemption: 1000,
        description: 'Germany. Flat 26.4% tax on all capital gains, with a small exemption.'
    },
    JP: {
        ltcgRate: 0.203,
        stcgRate: 0.203,
        description: 'Japan. Flat 20.3% tax on all capital gains.'
    },
    GLOBAL: {
        ltcgRate: 0.15,
        stcgRate: 0.25,
        description: 'Global Average. Simplified progressive-like tax model.'
    }
};


export const CORPORATE_TAX_RATES_BY_REGION: Record<Region, number> = {
  'North America': 0.00471,
  'Europe': 0.0055,
  'Asia': 0.0052,
  'Global': 0.0050,
};

export const MIN_CORPORATE_ACTION_INTERVAL = 20;
export const CORPORATE_ACTION_INTERVAL_RANGE = 30;
export const MIN_STOCK_SPLIT_PRICE = 250;
export const MAX_STOCK_SPLIT_PRICE = 1000;

export const CORPORATE_EVENTS_BY_SECTOR: Record<string, Record<'positive' | 'negative' | 'neutral', CorporateEventConfig[]>> = {
  Technology: {
    positive: [
      { name: "New Patent Approved", description: "A key patent for a new technology has been approved.", impact: 1.05, type: 'positive' },
      { name: "Successful AI Launch", description: "A new AI product launch exceeds all sales expectations.", impact: 1.08, type: 'positive' },
    ],
    negative: [
      { name: "Major Data Breach", description: "A significant data breach has compromised user data.", impact: 0.92, type: 'negative' },
      { name: "Antitrust Lawsuit", description: "Government files an antitrust lawsuit against the company.", impact: 0.90, type: 'negative' },
    ],
    neutral: [
      { name: "Routine Software Update", description: "A routine software update is released.", type: 'neutral' },
    ],
  },
  Health: {
    positive: [
      { name: "FDA Approval", description: "A new drug receives full FDA approval.", impact: 1.15, type: 'positive' },
    ],
    negative: [
      { name: "Failed Clinical Trial", description: "A promising drug fails its Phase III clinical trials.", impact: 0.80, type: 'negative' },
    ],
    neutral: [
        { name: "Medical Conference Presentation", description: "Company presents research at a major medical conference.", type: 'neutral' },
    ]
  },
  Energy: {
      positive: [
          { name: "New Oil Field Discovery", description: "A massive new oil field is discovered.", impact: 1.10, type: 'positive' },
      ],
      negative: [
          { name: "Oil Spill Incident", description: "An oil spill has caused significant environmental damage.", impact: 0.88, type: 'negative' },
      ],
      neutral: [
          { name: "Routine Maintenance Shutdown", description: "A refinery undergoes scheduled maintenance.", type: 'neutral' },
      ]
  },
  Finance: {
      positive: [
          { name: "Positive Earnings Surprise", description: "Quarterly earnings significantly beat analyst expectations.", impact: 1.07, type: 'positive' },
      ],
      negative: [
          { name: "SEC Investigation", description: "The SEC has opened an investigation into the company's accounting practices.", impact: 0.91, type: 'negative' },
      ],
      neutral: [
          { name: "New Branch Opening", description: "A new branch is opened in a major city.", type: 'neutral' },
      ]
  },
  Industrials: {
      positive: [
          { name: "Major Government Contract", description: "The company wins a large, multi-year government contract.", impact: 1.09, type: 'positive' },
      ],
      negative: [
          { name: "Factory Worker Strike", description: "Workers at a major factory have gone on strike.", impact: 0.94, type: 'negative' },
      ],
      neutral: [
          { name: "Supply Chain Optimization", description: "Company announces a new supply chain optimization plan.", type: 'neutral' },
      ]
  }
};

export const MACRO_EVENTS: CorporateEventConfig[] = [
    { name: "Interest Rate Hike", description: "The Federal Reserve unexpectedly raises interest rates, cooling the economy.", impact: { 'North America': 0.98, 'Europe': 0.99, 'Asia': 0.99 }, type: 'negative', region: 'North America', category: 'NegativeNA' },
    { name: "Interest Rate Cut", description: "The European Central Bank (ECB) cuts rates to stimulate growth.", impact: { 'Europe': 1.02, 'North America': 1.005, 'Asia': 1.005 }, type: 'positive', region: 'Europe', category: 'PositiveEU' },
    { name: "Positive Jobs Report", description: "The North American jobs report is much stronger than expected.", impact: { 'North America': 1.01, 'Europe': 1.002, 'Asia': 1.002 }, type: 'positive', region: 'North America', category: 'PositiveNA' },
    { name: "Geopolitical Tensions Flare", description: "New geopolitical tensions flare up overseas, affecting global markets.", impact: 0.99, type: 'political', region: 'Global', category: 'PoliticalGlobal' },
    { name: "Asian Manufacturing Boom", description: "Asian manufacturing data shows a massive boom, exceeding all forecasts.", impact: { 'Asia': 1.025, 'North America': 1.005, 'Europe': 1.005 }, type: 'positive', region: 'Asia', category: 'PositiveAsia' },
    { name: "Major Hurricane Forms", description: "A category 5 hurricane is threatening major coastal industrial zones, disrupting shipping and energy production.", impact: 0.985, type: 'disaster', region: 'North America', category: 'DisasterGlobal' },
    { name: "Key Global Trade Deal Signed", description: "A new international trade agreement is signed between major economic blocs, expected to boost exports and reduce tariffs.", impact: 1.015, type: 'political', region: 'Global', category: 'PoliticalGlobal' },
    { name: "Snap Election Called", description: "A surprise election in a key European market introduces significant political uncertainty.", impact: { 'Europe': 0.99, 'North America': 0.998, 'Asia': 0.998 }, type: 'political', region: 'Europe', category: 'NegativeEU' },
    { name: "Massive Earthquake Strikes", description: "A powerful 7.8 magnitude earthquake has disrupted supply chains in a critical Asian microchip manufacturing region.", impact: { 'Asia': 0.97, 'North America': 0.99, 'Europe': 0.99 }, type: 'disaster', region: 'Asia', category: 'DisasterGlobal' },
    { name: "Global Infrastructure Bill", description: "A massive global infrastructure spending bill is passed, promising to boost the Industrials and Energy sectors worldwide.", impact: 1.02, type: 'political', region: 'Global', category: 'PositiveGlobal' },
    { name: "Widespread Flooding", description: "Unprecedented flooding across key agricultural regions is expected to impact food prices and related industries.", impact: 0.99, type: 'disaster', region: 'Global', category: 'DisasterGlobal' },
    { name: "New Tech Sector Regulations", description: "Governments announce sweeping new regulations for the tech sector, impacting data privacy and competition.", impact: { 'Technology': 0.95 }, type: 'political', region: 'Global', category: 'PoliticalGlobal'},
    { name: "Global Trade War Escalates", description: "A trade war between major economic blocs escalates, with new tariffs announced on a wide range of goods.", impact: 0.97, type: 'political', region: 'Global', category: 'PoliticalGlobal' },
    { name: "Major Cyber Attack", description: "A sophisticated cyber attack disrupts financial networks across Europe, causing temporary market chaos.", impact: { 'Europe': 0.98, 'Finance': 0.96 }, type: 'disaster', region: 'Europe', category: 'DisasterGlobal' },
    { name: "Widespread Wildfires", description: "Severe wildfires in key industrial and residential zones are causing massive economic disruption and supply chain issues.", impact: 0.98, type: 'disaster', region: 'North America', category: 'DisasterGlobal' },
    { name: "Sudden Diplomatic Thaw", description: "A surprising diplomatic breakthrough between rival nations eases long-standing tensions, boosting investor confidence.", impact: 1.01, type: 'political', region: 'Global', category: 'PoliticalGlobal' },
    { name: "Global Famine Warning", description: "International agencies issue a severe famine warning for several regions due to drought and conflict, impacting agricultural commodities.", impact: { 'Industrials': 1.02, default: 0.99 }, type: 'disaster', region: 'Global', category: 'DisasterGlobal' },
    { name: "Energy Sanctions Imposed", description: "Major energy-producing nations face new international sanctions, causing a spike in global energy prices.", impact: { 'Energy': 1.10, default: 0.98 }, type: 'political', region: 'Global', category: 'PoliticalGlobal' },
    { name: "Unexpected Political Scandal", description: "A major political scandal in an Asian economic power leads to leadership uncertainty and market jitters.", impact: { 'Asia': 0.98 }, type: 'political', region: 'Asia', category: 'NegativeAsia'},
];

export const INDICATOR_NEURONS = [
    'momentum_5d', 'momentum_10d', 'momentum_20d', 'momentum_50d', 'momentum_1d_vs_avg5d',
    'trend_price_vs_sma_10', 'trend_price_vs_sma_20', 'trend_price_vs_sma_50', 'trend_price_vs_sma_100', 'trend_price_vs_sma_200',
    'trend_sma_crossover_10_20', 'trend_sma_crossover_20_50', 'trend_sma_crossover_50_200',
    'trend_price_vs_ema_10', 'trend_price_vs_ema_20', 'trend_price_vs_ema_50',
    'trend_ema_crossover_10_20', 'trend_ema_crossover_20_50',
    'oscillator_rsi_7_contrarian', 'oscillator_rsi_14_contrarian', 'oscillator_rsi_21_contrarian',
    'oscillator_stochastic_k_14_contrarian',
    'volatility_bollinger_bandwidth_20', 'volatility_bollinger_percent_b_20',
    'macd_histogram',
    'volume_avg_20d_spike', 'volume_obv_trend_20d', 'volume_cmf_20',
    'volatility_atr_14',
    'sector_momentum_50d', 'region_momentum_50d',
    'event_sentiment_recent', 'event_impact_magnitude', 'event_type_is_macro', 'event_type_is_corporate'
];

export const CORPORATE_NEURONS = [
    'self_momentum_50d', 'self_volatility_atr_14', 'price_vs_ath',
    'market_momentum_50d', 'sector_momentum_50d', 'region_momentum_50d', 'opportunity_score',
    'event_sentiment_recent', 'event_impact_magnitude', 'event_type_is_macro', 'event_type_is_corporate'
];

export const NEWS_PICKER_NEURONS = [
    'market_momentum_50d',
    'market_momentum_200d',
    'market_volatility_atr_20d',
    'market_avg_pe_ratio',
    'positive_event_ratio_30d', // Ratio of positive to total events in the last 30 days
];

const createNeuralNetwork = (layerSizes: number[], inputNeuronNames: string[]): NeuralNetwork => {
    // The layer sizes array should start with the number of inputs.
    return new NeuralNetwork(layerSizes, inputNeuronNames);
};

const STRATEGY_NAMES = ["Momentum Bot", "Value Seeker", "Quant Algo", "Risk Manager", "Trend Follower", "Contrarian", "Growth Chaser", "Index Follower", "Volatility Trader", "Sector Rotator", "Alpha Hunter"];
const CHAOS_AGENT_NAMES = ["Noise Trader", "Random Walk Inc.", "Volatility Catalyst", "Chaos Agent", "Momentum Gambler", "Arbitrageur Prime", "The Contrarian", "Market Agitator", "Event Horizon Capital", "Stochastic Dynamics"];

export const buildInvestors = (options: { realisticDemographics?: boolean } = {}): InvestorConfig[] => {
    const { realisticDemographics = false } = options;
    const aiInvestors: InvestorConfig[] = [];
    const inputLayerSize = INDICATOR_NEURONS.length;
    const totalInvestors = 999;
    const JURISDICTIONS: TaxJurisdiction[] = ['USA_WA', 'USA_CA', 'USA_TX', 'DE', 'JP', 'GLOBAL'];

    if (!realisticDemographics) {
        // --- Original Simulation Mode ---
        for (let i = 0; i < totalInvestors; i++) {
            aiInvestors.push({
                id: `ai-${i + 1}`,
                name: `AI Trader #${i + 1}`,
                strategyName: STRATEGY_NAMES[i % STRATEGY_NAMES.length],
                initialCash: AI_INITIAL_INVESTOR_CASH,
                jurisdiction: JURISDICTIONS[i % JURISDICTIONS.length],
                strategy: {
                    strategyType: 'hyperComplex',
                    network: createNeuralNetwork([inputLayerSize, 10, 5, 1], INDICATOR_NEURONS),
                    riskAversion: 0.3 + Math.random() * 0.5,
                    tradeFrequency: Math.floor(1 + Math.random() * 14),
                    learningRate: 0.005 + Math.random() * 0.045
                }
            });
        }

        shuffle(aiInvestors);

        // Create Chaos Agents (10)
        for (let i = 0; i < 10; i++) {
            const investor = aiInvestors[totalInvestors - 1 - i];
            investor.name = `${CHAOS_AGENT_NAMES[i % CHAOS_AGENT_NAMES.length]}`;
            investor.strategyName = "Randomized Algorithm";
            investor.strategy = { strategyType: 'random', tradeChance: 0.05 };
        }

        // Tier Upgrades
        for (let i = 0; i < 10; i++) { // Advanced
            aiInvestors[i].name = `Advanced Trader #${i + 1}`;
            (aiInvestors[i].strategy as HyperComplexInvestorStrategy).network = createNeuralNetwork([inputLayerSize, 15, 10, 5, 1], INDICATOR_NEURONS);
        }
        for (let i = 0; i < 5; i++) { // Elite
            aiInvestors[i].name = `Elite Trader #${i + 1}`;
            (aiInvestors[i].strategy as HyperComplexInvestorStrategy).network = createNeuralNetwork([inputLayerSize, 20, 15, 10, 5, 1], INDICATOR_NEURONS);
        }
        for (let i = 0; i < 3; i++) { // Master
            aiInvestors[i].name = `Master Trader #${i + 1}`;
            (aiInvestors[i].strategy as HyperComplexInvestorStrategy).network = createNeuralNetwork([inputLayerSize, 30, 25, 20, 15, 10, 1], INDICATOR_NEURONS);
        }
        const oracle = aiInvestors[0]; // Oracle
        oracle.name = "The Oracle";
        (oracle.strategy as HyperComplexInvestorStrategy).network = createNeuralNetwork([inputLayerSize, 50, 50, 50, 50, 50, 1], INDICATOR_NEURONS);

    } else {
        // --- Realistic Demographics Mode ---
        // 1. Generate base retail investors
        for (let i = 0; i < totalInvestors; i++) {
            aiInvestors.push({
                id: `ai-${i + 1}`,
                name: `Retail Investor #${i + 1}`,
                strategyName: "Standard Model",
                initialCash: 10000 + Math.random() * 90000, // $10k - $100k
                jurisdiction: JURISDICTIONS[i % JURISDICTIONS.length],
                strategy: {
                    strategyType: 'hyperComplex',
                    network: createNeuralNetwork([inputLayerSize, 10, 5, 1], INDICATOR_NEURONS),
                    riskAversion: 0.5 + Math.random() * 0.4, // Cautious: 0.5 to 0.9
                    tradeFrequency: Math.floor(5 + Math.random() * 25), // Trades every 5-30 days
                    learningRate: 0.001 + Math.random() * 0.01 // Slower learners
                }
            });
        }

        shuffle(aiInvestors);
        let currentIndex = 0;

        // 2. Assign Institutional Roles (Top 5% -> 50 investors)
        const apexNames = ["Singularity Capital", "Orion Quant Labs", "Titan Global Macro", "Helios Analytics", "Vanguard Prime"];
        for(let i=0; i<5; i++) { // Apex Predators (0.5%)
            const investor = aiInvestors[currentIndex++];
            investor.name = apexNames[i % apexNames.length];
            investor.strategyName = "Apex Predator Fund";
            investor.initialCash = 50_000_000 + Math.random() * 150_000_000;
            const strategy = investor.strategy as HyperComplexInvestorStrategy;
            strategy.network = createNeuralNetwork([inputLayerSize, 50, 50, 50, 1], INDICATOR_NEURONS);
            strategy.learningRate = 0.05 + Math.random() * 0.03;
            strategy.riskAversion = 0.1 + Math.random() * 0.2;
        }
        
        const quantNames = ["Momentum Machines", "Arbitrage Dynamics", "Vector Capital", "Cipher Trading", "Quantum Edge"];
        for(let i=0; i<15; i++) { // Quant Funds (1.5%)
             const investor = aiInvestors[currentIndex++];
            investor.name = `${quantNames[i % quantNames.length]} #${Math.floor(i/quantNames.length)+1}`;
            investor.strategyName = "Quantitative Hedge Fund";
            investor.initialCash = 5_000_000 + Math.random() * 20_000_000;
            const strategy = investor.strategy as HyperComplexInvestorStrategy;
            strategy.network = createNeuralNetwork([inputLayerSize, 30, 20, 10, 1], INDICATOR_NEURONS);
            strategy.learningRate = 0.03 + Math.random() * 0.02;
            strategy.riskAversion = 0.2 + Math.random() * 0.2;
        }
        
        for(let i=0; i<30; i++) { // Boutique Funds (3%)
             const investor = aiInvestors[currentIndex++];
            investor.name = `Boutique Fund #${i+1}`;
            investor.strategyName = "Sector Specialist";
            investor.initialCash = 500_000 + Math.random() * 4_500_000;
            const strategy = investor.strategy as HyperComplexInvestorStrategy;
            strategy.network = createNeuralNetwork([inputLayerSize, 20, 10, 1], INDICATOR_NEURONS);
            strategy.learningRate = 0.01 + Math.random() * 0.02;
            strategy.riskAversion = 0.3 + Math.random() * 0.2;
        }

        // 3. Assign Noise Trader Role (10% -> 99 investors)
        for(let i=0; i<99; i++) {
             const investor = aiInvestors[currentIndex++];
             investor.name = `${CHAOS_AGENT_NAMES[i % CHAOS_AGENT_NAMES.length]}`;
             investor.strategyName = "Randomized Algorithm";
             investor.initialCash = 5000 + Math.random() * 20000;
             investor.strategy = {
                strategyType: 'random',
                tradeChance: 0.10
             };
        }
        
        // 4. The remaining ~850 investors are the default retail traders.
        const retailNames = ["Trend Follower", "Value Seeker", "Growth Chaser", "Retirement Fund", "Day Trader"];
        while(currentIndex < totalInvestors) {
            const investor = aiInvestors[currentIndex++];
            investor.strategyName = retailNames[currentIndex % retailNames.length];
        }
    }

    aiInvestors.sort((a,b) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]));
    
    const humanPlayer: InvestorConfig = {
        id: 'human-player',
        name: 'Human Player',
        isHuman: true,
        initialCash: HUMAN_INITIAL_INVESTOR_CASH,
        jurisdiction: 'USA_WA',
        strategy: {
            strategyType: 'random',
            tradeChance: 0
        }
    };
    
    return [humanPlayer, ...aiInvestors];
};
