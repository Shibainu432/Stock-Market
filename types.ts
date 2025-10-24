import React from 'react';
import { NeuralNetwork } from './services/neuralNetwork';

export interface MicroLLM {
    // e.g. { 'He': { 'l': 1, 'y': 2 }, 'el': { 'l': 1 } }
    transitionTable: Record<string, Record<string, number>>;
    order: number; // The number of preceding characters the model considers (e.g., 5)
}

export interface TrackedGeneratedArticle {
    eventId: string;
    evaluationDay: number;
    generatedText: string; // Storing the full text for the new learning model
    startingMarketIndex: number;
    stockSymbol: string | null;
    startingStockPrice: number | null;
}

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

export type Region = 'North America' | 'Europe' | 'Asia';

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  region: Region;
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

// A new, simple AI that trades randomly to create market noise
export interface RandomInvestorStrategy {
    strategyType: 'random';
    tradeChance: number; // e.g., 0.1 for 10% chance per stock per day
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

export interface ActiveEvent {
    id: string;
    day: number;
    stockSymbol: string | null;
    stockName: string | null;
    eventName: string;
    description: string;
    type: 'positive' | 'negative' | 'neutral' | 'split' | 'merger' | 'alliance' | 'political' | 'disaster';
    impact?: number | Record<string, number>;
    splitDetails?: { symbol: string, ratio: number };
    mergerDetails?: { acquiring: string, acquired: string };
    allianceDetails?: { partners: string[] };
    imageUrl: string;
    headline: string;
    summary: string;
    fullText: string;
    region?: Region | 'Global';
}

export interface Investor {
  id: string;
  name: string;
  isHuman?: boolean;
  strategyName?: string;
  strategy: InvestorStrategy | ComplexInvestorStrategy | HyperComplexInvestorStrategy | RandomInvestorStrategy;
  cash: number;
  portfolio: PortfolioItem[];
  portfolioHistory: PortfolioValueHistoryPoint[];
  taxLossCarryforward: number;
  totalTaxesPaid: number;
  waAnnualNetLTCG: number;
  recentTrades: RecentTrade[];
}

export interface TrackedCorporateAction {
    startDay: number;
    evaluationDay: number;
    stockSymbol: string;
    actionType: 'split' | 'alliance' | 'acquisition';
    indicatorValuesAtAction: number[];
    startingStockPrice: number;
    startingMarketIndex: number;
}

export interface SimulationState {
  day: number;
  time: string;
  startDate: string;
  stocks: Stock[];
  investors: Investor[];
  activeEvent: ActiveEvent | null;
  eventHistory: ActiveEvent[];
  marketIndexHistory: SimplePriceDataPoint[];
  nextCorporateEventDay: number;
  nextMacroEventDay: number;
  trackedCorporateActions: TrackedCorporateAction[];
  microLLM: MicroLLM;
  trackedArticles: TrackedGeneratedArticle[];
}

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

export type Page = 'home' | 'portfolio' | 'markets' | 'aii';