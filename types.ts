import React from 'react';
import { NeuralNetwork } from './services/neuralNetwork';

// A simple data point for charts that only need a single value over time (e.g., market index, portfolio value).
export interface SimplePriceDataPoint {
  day: number;
  price: number;
}

// A comprehensive data point for stock history, including Open, High, Low, Close, and Volume.
export interface OHLCDataPoint {
    day: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface CorporateAI {
    nextCorporateActionDay: number;
    splitNN: NeuralNetwork;
    allianceNN: NeuralNetwork;
    acquisitionNN: NeuralNetwork;
    learningRate: number;
}

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  history: OHLCDataPoint[];
  corporateAI: CorporateAI;
  isDelisted?: boolean;
  sharesOutstanding: number;
  eps: number; // Earnings Per Share
}

export interface ShareLot {
  purchaseTime: string; // Changed from purchaseDay to be more precise
  purchasePrice: number;
  shares: number;
  purchaseIndicators: Record<string, number>;
}

export interface PortfolioItem {
  symbol: string;
  lots: ShareLot[];
}

// Tier 1 AI: Simple, reactive model
export interface InvestorStrategy {
  strategyType: 'simple';
  priceMomentumWeight: number;
  volatilityWeight: number;
  riskAversion: number;
}

// Tier 2 AI: More complex, uses technical indicators
export interface ComplexInvestorStrategy {
    strategyType: 'complex';
    weights: {
        growth: number; // Short-term momentum
        value: number;  // RSI-based, contrarian
        trend: number;  // Moving average crossovers
        safety: number; // Low volatility preference
    };
    riskAversion: number;
    tradeFrequency: number;
}

// Tier 3 AI: Hyper-complex, uses a real neural network
export interface HyperComplexInvestorStrategy {
    strategyType: 'hyperComplex';
    network: NeuralNetwork;
    riskAversion: number;
    tradeFrequency: number;
    learningRate: number;
}


export interface PortfolioValueHistoryPoint {
    day: number;
    value: number;
}

export interface RecentTrade {
    symbol: string;
    day: number;
    type: 'buy' | 'sell';
    shares: number;
    price: number;
    indicatorValuesAtTrade: number[]; // Stored as an ordered array for backpropagation
    outcomeEvaluationDay: number;
}

export interface Investor {
  id: string;
  name: string;
  cash: number;
  portfolio: PortfolioItem[];
  strategy: InvestorStrategy | ComplexInvestorStrategy | HyperComplexInvestorStrategy;
  strategyName?: string;
  portfolioHistory: PortfolioValueHistoryPoint[];
  taxLossCarryforward: number;
  totalTaxesPaid: number;
  waAnnualNetLTCG: number;
  isHuman?: boolean;
  recentTrades: RecentTrade[];
}

export interface ActiveEvent {
    id: string; // Unique ID for each event
    day: number;
    stockSymbol: string | null;
    stockName: string | null;
    eventName: string; // The raw event name, e.g., "FDA Approval"
    description: string; // The raw event description
    headline: string; // The generated, catchy headline
    summary: string; // A short, generated summary for cards
    fullText: string; // The full, generated article text
    // Fix: Expanded type to include 'political' and 'disaster' to match usage in services, resolving comparison errors.
    type: 'positive' | 'negative' | 'neutral' | 'split' | 'alliance' | 'merger' | 'political' | 'disaster';
    impact?: number | Record<string, number>; // Made optional for neutral/descriptive events
    imageUrl?: string;
    splitDetails?: { symbol: string; ratio: number; };
    allianceDetails?: { partners: [string, string]; };
    mergerDetails?: { acquiring: string; acquired: string; };
}

export interface TrackedCorporateAction {
    startDay: number;
    evaluationDay: number;
    stockSymbol: string;
    actionType: 'alliance' | 'acquisition' | 'split';
    indicatorValuesAtAction: number[]; // Stored as an ordered array for backpropagation
    startingStockPrice: number;
    startingMarketIndex: number;
}

export interface SimulationState {
  day: number;
  time: string; // Authoritative clock for the simulation
  startDate: string; // ISO string for the start date of the simulation
  stocks: Stock[];
  investors: Investor[];
  activeEvent: ActiveEvent | null; // This will hold the "featured" or most significant event
  eventHistory: ActiveEvent[]; // This will hold all recent events, including minor ones
  marketIndexHistory: SimplePriceDataPoint[];
  nextCorporateEventDay: number;
  nextMacroEventDay: number;
  trackedCorporateActions: TrackedCorporateAction[];
}

export type Page = 'home' | 'portfolio' | 'markets' | 'aii';

// Data structure for the enhanced markets page table
export interface StockListData extends Stock {
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap: number;
    peRatio: number;
    high52w: number;
    low52w: number;
    trendingScore: number;
}