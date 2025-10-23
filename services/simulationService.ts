import { SimulationState, Stock, Investor, SimplePriceDataPoint, PortfolioItem, ShareLot, ActiveEvent, HyperComplexInvestorStrategy, TrackedCorporateAction, OHLCDataPoint, Region, TrackedNewsEvent, NewsPickerAI, TrackedGeneratedArticle } from '../types';
import { STOCK_SYMBOLS, MIN_INITIAL_STOCK_PRICE, MAX_INITIAL_STOCK_PRICE, INITIAL_HISTORY_LENGTH, HUMAN_INITIAL_INVESTOR_CASH, AI_INITIAL_INVESTOR_CASH, buildInvestors, INFLATION_RATE, TAX_CONSTANTS, CORPORATE_EVENTS_BY_SECTOR, MACRO_EVENTS, WASHINGTON_B_AND_O_TAX_RATES_BY_SECTOR, MIN_CORPORATE_ACTION_INTERVAL, CORPORATE_ACTION_INTERVAL_RANGE, MIN_STOCK_SPLIT_PRICE, INDICATOR_NEURONS, CORPORATE_NEURONS, NEWS_PICKER_NEURONS, NEWS_EVENT_CATEGORIES } from '../constants';
import { getImageForEvent } from './imageService';
import { generateNewsArticle, newsGeneratorAI } from './newsGenerationService';
import { NeuralNetwork } from './neuralNetwork';

// Helper to generate a random price/volume walk with OHLC data
const generateInitialHistory = (length: number, initialPrice: number): OHLCDataPoint[] => {
  const history: OHLCDataPoint[] = [];
  let lastClose = initialPrice;

  for (let i = 0; i < length; i++) {
    const open = lastClose;
    const volume = 200000 + Math.random() * 800000; // Increased base volume
    
    const priceChangePercent = (Math.random() - 0.49) * 0.05;
    const close = Math.max(0.01, open * (1 + priceChangePercent));
    
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    
    history.push({ day: i + 1, open, high, low, close, volume: Math.round(volume) });
    lastClose = close;
  }
  return history;
};

const createCorporateNNs = (): { splitNN: NeuralNetwork, allianceNN: NeuralNetwork, acquisitionNN: NeuralNetwork } => {
    const inputSize = CORPORATE_NEURONS.length;
    const nnConfig = [inputSize, 5, 1]; // Simple 1-hidden-layer network for corporate decisions
    return {
        splitNN: new NeuralNetwork(nnConfig, CORPORATE_NEURONS),
        allianceNN: new NeuralNetwork(nnConfig, CORPORATE_NEURONS),
        acquisitionNN: new NeuralNetwork(nnConfig, CORPORATE_NEURONS),
    };
};

export const initializeState = (): SimulationState => {
  const startDate = new Date('2024-01-01T09:30:00Z');
  const stocks: Stock[] = STOCK_SYMBOLS.map(s => {
    const initialPrice = MIN_INITIAL_STOCK_PRICE + Math.random() * (MAX_INITIAL_STOCK_PRICE - MIN_INITIAL_STOCK_PRICE);
    const history = generateInitialHistory(INITIAL_HISTORY_LENGTH, initialPrice);
    const { splitNN, allianceNN, acquisitionNN } = createCorporateNNs();
    return {
      ...s,
      history,
      corporateAI: {
          nextCorporateActionDay: INITIAL_HISTORY_LENGTH + MIN_CORPORATE_ACTION_INTERVAL + Math.floor(Math.random() * CORPORATE_ACTION_INTERVAL_RANGE),
          splitNN,
          allianceNN,
          acquisitionNN,
          learningRate: 0.01 + Math.random() * 0.04, // Corporate learning rate
      },
      isDelisted: false,
      sharesOutstanding: 50_000_000 + Math.random() * 150_000_000,
      eps: 1.0 + Math.random() * 4.0,
    };
  });
  
  const INVESTORS_CONFIG = buildInvestors();
  const investors: Investor[] = INVESTORS_CONFIG.map(config => {
    const initialCash = config.isHuman ? HUMAN_INITIAL_INVESTOR_CASH : AI_INITIAL_INVESTOR_CASH;
    return {
        ...config,
        cash: initialCash,
        portfolio: [],
        portfolioHistory: [{day: INITIAL_HISTORY_LENGTH, value: initialCash}],
        taxLossCarryforward: 0,
        totalTaxesPaid: 0,
        waAnnualNetLTCG: 0,
        recentTrades: [],
    };
  });
  
  const day = INITIAL_HISTORY_LENGTH;

  // Initialize market index history
  const marketIndexHistory: SimplePriceDataPoint[] = [];
  for(let i = 0; i < INITIAL_HISTORY_LENGTH; i++) {
      const avgPrice = stocks.reduce((sum, stock) => sum + stock.history[i].close, 0) / stocks.length;
      marketIndexHistory.push({day: i + 1, price: avgPrice});
  }

  const initialTime = new Date(startDate.getTime());
  initialTime.setDate(initialTime.getDate() + day);
  
  const newsPickerNN = new NeuralNetwork(
      [NEWS_PICKER_NEURONS.length, 10, NEWS_EVENT_CATEGORIES.length], 
      NEWS_PICKER_NEURONS
  );

  return {
    day,
    time: initialTime.toISOString(),
    startDate: startDate.toISOString(),
    stocks,
    investors,
    activeEvent: null, // Initialized as null, will be set for significant events
    eventHistory: [],
    marketIndexHistory,
    nextCorporateEventDay: day + 50 + Math.floor(Math.random() * 50),
    nextMacroEventDay: day + 200 + Math.floor(Math.random() * 165),
    trackedCorporateActions: [],
    newsPickerAI: {
        network: newsPickerNN,
        learningRate: 0.01,
    },
    trackedNewsEvents: [],
    trackedGeneratedArticles: [],
  };
};

// --- Technical Indicator Calculations ---

const calculateIndicators = (stock: Stock, allStocks: Stock[], eventHistory: ActiveEvent[]): Record<string, number> => {
    const indicators: Record<string, number> = {};
    const prices = stock.history.map(p => p.close);
    const volumes = stock.history.map(v => v.volume);
    if (prices.length < 2) return {};

    const currentPrice = prices[prices.length - 1];
    const prevPrice = prices[prices.length - 2];

    // Momentum
    [5, 10, 20, 50].forEach(p => {
        if(prices.length > p) indicators[`momentum_${p}d`] = (currentPrice / prices[prices.length - 1 - p]) - 1;
    });
    // New 1-day vs avg 5-day momentum
    if (prices.length > 5) {
        const avg5d = prices.slice(-5, -1).reduce((s,v) => s+v, 0) / 4; // Exclude current day
        if(avg5d > 0) indicators['momentum_1d_vs_avg5d'] = (currentPrice / avg5d) - 1;
    }


    // SMA
    const smas: Record<string, number> = {};
    [10, 20, 50, 100, 200].forEach(p => {
        if (prices.length >= p) {
            const sma = prices.slice(-p).reduce((s, v) => s + v, 0) / p;
            smas[p] = sma;
            indicators[`trend_price_vs_sma_${p}`] = (currentPrice - sma) / sma;
        }
    });

    // SMA Crossovers
    if(smas[10] && smas[20]) indicators['trend_sma_crossover_10_20'] = (smas[10] - smas[20]) / smas[20];
    if(smas[20] && smas[50]) indicators['trend_sma_crossover_20_50'] = (smas[20] - smas[50]) / smas[50];
    if(smas[50] && smas[200]) indicators['trend_sma_crossover_50_200'] = (smas[50] - smas[200]) / smas[200];
    
    // EMA & Crossovers
    const calculateEMA = (data: number[], period: number) => {
        if(data.length < period) return null;
        const k = 2 / (period + 1);
        let ema = data.slice(0, period).reduce((s, v) => s + v, 0) / period;
        for (let i = period; i < data.length; i++) {
            ema = data[i] * k + ema * (1 - k);
        }
        return ema;
    };
    const emas: Record<string, number> = {};
    [10, 20, 50].forEach(p => {
        const ema = calculateEMA(prices, p);
        if(ema) {
            emas[p] = ema;
            indicators[`trend_price_vs_ema_${p}`] = (currentPrice - ema) / ema;
        }
    });
    if(emas[10] && emas[20]) indicators['trend_ema_crossover_10_20'] = (emas[10] - emas[20]) / emas[20];
    if(emas[20] && emas[50]) indicators['trend_ema_crossover_20_50'] = (emas[20] - emas[50]) / emas[50];

    // RSI
    [7, 14, 21].forEach(p => {
        if(prices.length > p) {
            const slice = prices.slice(-p-1);
            let gains = 0, losses = 0;
            for(let i = 1; i < slice.length; i++) {
                const change = slice[i] - slice[i-1];
                if(change > 0) gains += change;
                else losses += Math.abs(change);
            }
            const avgGain = gains / p;
            const avgLoss = losses / p;
            if (avgLoss > 0) {
                const rs = avgGain / avgLoss;
                const rsi = 100 - (100 / (1 + rs));
                indicators[`oscillator_rsi_${p}_contrarian`] = (50 - rsi) / 50; // Normalize to -1 to 1 range
            } else {
                 indicators[`oscillator_rsi_${p}_contrarian`] = 0;
            }
        }
    });
    
    // Stochastic Oscillator
    const stochPeriod = 14;
    if(prices.length >= stochPeriod) {
        const slice = prices.slice(-stochPeriod);
        const L14 = Math.min(...slice);
        const H14 = Math.max(...slice);
        const K = H14 > L14 ? 100 * (currentPrice - L14) / (H14 - L14) : 50;
        indicators['oscillator_stochastic_k_14_contrarian'] = (50 - K) / 50;
    }

    // Bollinger Bands
    const bbPeriod = 20;
    if(smas[bbPeriod]) {
        const stdDev = Math.sqrt(prices.slice(-bbPeriod).map(p => Math.pow(p - smas[bbPeriod], 2)).reduce((a, b) => a + b) / bbPeriod);
        const upper = smas[bbPeriod] + (stdDev * 2);
        const lower = smas[bbPeriod] - (stdDev * 2);
        indicators['volatility_bollinger_bandwidth_20'] = (upper - lower) / smas[bbPeriod];
        if(upper > lower) indicators['volatility_bollinger_percent_b_20'] = (currentPrice - lower) / (upper - lower);
    }
    
    // MACD
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    if(ema12 && ema26) {
        indicators['macd_histogram'] = (ema12 - ema26) / ema26;
    }
    
    // Volume
    const volPeriod = 20;
    if(volumes.length >= volPeriod) {
        const avgVol = volumes.slice(-volPeriod).reduce((s, v) => s + v, 0) / volPeriod;
        indicators['volume_avg_20d_spike'] = (volumes[volumes.length - 1] - avgVol) / avgVol;
    }

    // OBV (On-Balance Volume) trend
    const obvPeriod = 20;
    if (prices.length >= obvPeriod && volumes.length >= obvPeriod) {
        let obv = 0;
        const obvValues = [];
        for(let i = prices.length - obvPeriod; i < prices.length; i++) {
            if(prices[i] > prices[i-1]) obv += volumes[i];
            else if(prices[i] < prices[i-1]) obv -= volumes[i];
            obvValues.push(obv);
        }
        const obvSma = obvValues.reduce((s,v) => s+v, 0) / obvPeriod;
        if(obvSma !== 0) indicators['volume_obv_trend_20d'] = (obv - obvSma) / Math.abs(obvSma);
    }

    // CMF (Chaikin Money Flow)
    const cmfPeriod = 20;
    if (prices.length >= cmfPeriod && volumes.length >= cmfPeriod) {
        let mfvs = 0;
        let volSum = 0;
        for (let i = prices.length - cmfPeriod; i < prices.length; i++) {
            const mfm = (prices[i] - prevPrice) > 0 ? 1 : -1; // Simplified MFM for OHLC
            mfvs += mfm * volumes[i];
            volSum += volumes[i];
        }
        if(volSum > 0) indicators['volume_cmf_20'] = mfvs / volSum;
    }

    // ATR (Average True Range) approximation
    const atrPeriod = 14;
    if (prices.length > atrPeriod) {
        const trs = [];
        for (let i = prices.length - atrPeriod; i < prices.length; i++) {
            trs.push(Math.abs(prices[i] - prices[i-1])); // Simplified TR
        }
        const atr = trs.reduce((s,v) => s+v, 0) / atrPeriod;
        if (currentPrice > 0) indicators['volatility_atr_14'] = atr / currentPrice; // Normalized
    }

    // Sector & Region Momentum
    const calcGroupMomentum = (group: Stock[]) => {
        if (group.length > 0 && group[0].history.length > 50) {
            const currentGroupIndex = group.reduce((sum, s) => sum + s.history.slice(-1)[0].close, 0) / group.length;
            const pastGroupIndex = group.reduce((sum, s) => sum + s.history.slice(-51)[0].close, 0) / group.length;
            return pastGroupIndex > 0 ? (currentGroupIndex / pastGroupIndex) - 1 : 0;
        }
        return 0;
    };
    
    indicators['sector_momentum_50d'] = calcGroupMomentum(allStocks.filter(s => s.sector === stock.sector));
    indicators['region_momentum_50d'] = calcGroupMomentum(allStocks.filter(s => s.region === stock.region));

    // Event-based indicators
    const lastEvent = eventHistory[0];
    if (lastEvent) {
        switch(lastEvent.type) {
            case 'positive': indicators['event_sentiment_recent'] = 1.0; break;
            case 'negative': indicators['event_sentiment_recent'] = -1.0; break;
            case 'split':
            case 'merger':
            case 'alliance': indicators['event_sentiment_recent'] = 0.5; break;
            default: indicators['event_sentiment_recent'] = 0.0;
        }

        let totalImpact = 0;
        if (typeof lastEvent.impact === 'number') {
            totalImpact = lastEvent.impact;
        } else if (typeof lastEvent.impact === 'object' && lastEvent.impact) {
            totalImpact = Object.values(lastEvent.impact).reduce((s, v) => s + v, 0) / Object.values(lastEvent.impact).length;
        }
        indicators['event_impact_magnitude'] = Math.abs(totalImpact - 1) * 10;

        indicators['event_type_is_macro'] = lastEvent.stockSymbol === null ? 1 : 0;
        indicators['event_type_is_corporate'] = lastEvent.stockSymbol !== null ? 1 : 0;
    } else {
        indicators['event_sentiment_recent'] = 0;
        indicators['event_impact_magnitude'] = 0;
        indicators['event_type_is_macro'] = 0;
        indicators['event_type_is_corporate'] = 0;
    }

    return indicators;
};

// --- Main Simulation Logic ---
const getSharesOwned = (item: PortfolioItem | undefined): number => {
    if (!item) return 0;
    return item.lots.reduce((sum, lot) => sum + lot.shares, 0);
};

const calculateWashingtonTax = (investor: Investor): number => {
    if (investor.waAnnualNetLTCG <= TAX_CONSTANTS.WASHINGTON_CG_EXEMPTION) {
        return 0;
    }
    const taxableGain = investor.waAnnualNetLTCG - TAX_CONSTANTS.WASHINGTON_CG_EXEMPTION;
    return taxableGain * TAX_CONSTANTS.WASHINGTON_LTCG_RATE;
};

// --- Real Backpropagation for AI Learning ---
const evaluateTradesAndLearn = (investor: Investor, stocks: Stock[]) => {
    const strategy = investor.strategy as HyperComplexInvestorStrategy;
    if (!strategy.network) return;

    const learningRate = strategy.learningRate;
    const network = strategy.network;
    
    const tradesToEvaluate = investor.recentTrades.filter(t => t.outcomeEvaluationDay <= stocks[0].history.slice(-1)[0].day);
    investor.recentTrades = investor.recentTrades.filter(t => t.outcomeEvaluationDay > stocks[0].history.slice(-1)[0].day);

    if (tradesToEvaluate.length === 0) return;

    tradesToEvaluate.forEach(trade => {
        const stock = stocks.find(s => s.symbol === trade.symbol);
        if (!stock) return;

        const currentPrice = stock.history.slice(-1)[0].close;
        const actualReturn = (currentPrice / trade.price) - 1;
        
        let effectiveReturn = 0;
        if (trade.type === 'buy') {
            effectiveReturn = actualReturn; // Positive return is good
        } else { // 'sell'
            effectiveReturn = -actualReturn; // Good sell means stock went down, so positive effective return
        }

        // The target is a value between -1 and 1, representing the "ideal" score for the decision.
        // We use tanh to squash the return into this range. The multiplier enhances sensitivity to returns.
        const targetScore = Math.tanh(effectiveReturn * 10);
        
        const inputValues = trade.indicatorValuesAtTrade;

        if (inputValues && inputValues.length > 0) {
            network.backpropagate(inputValues, [targetScore], learningRate);
        }
    });
};

const addEventToHistory = (state: SimulationState, eventData: Omit<ActiveEvent, 'id' | 'day' | 'imageUrl' | 'headline' | 'summary' | 'fullText'>, keywords: (string | null)[]): ActiveEvent => {
    const nextDay = state.day + 1;
    const tempEventForGen = { ...eventData, day: nextDay, id: 'temp' } as ActiveEvent;
    const { article, tokens } = generateNewsArticle(tempEventForGen, state);
    
    const imageUrl = getImageForEvent(
        article.headline,
        ...keywords.filter(k => k !== null) as string[]
    );
    
    const newEvent: ActiveEvent = {
        ...eventData,
        ...article,
        id: `${nextDay}-${Math.random()}`,
        day: nextDay,
        imageUrl,
    };
    state.eventHistory.unshift(newEvent);
    if (state.eventHistory.length > 100) { 
        state.eventHistory.pop();
    }

    // Track the article for LLM learning
    state.trackedGeneratedArticles.push({
        startDay: nextDay,
        evaluationDay: nextDay + 5, // Evaluate market reaction over 5 days
        startingMarketIndex: state.marketIndexHistory.slice(-1)[0].price,
        generatedTokens: tokens,
    });

    return newEvent;
};

const calculateCorporateIndicators = (stock: Stock, allStocks: Stock[], marketHistory: SimplePriceDataPoint[], eventHistory: ActiveEvent[]): Record<string, number> => {
    const indicators: Record<string, number> = {};
    const generalIndicators = calculateIndicators(stock, allStocks, eventHistory); 

    indicators['self_momentum_50d'] = generalIndicators['momentum_50d'] || 0;
    indicators['self_volatility_atr_14'] = generalIndicators['volatility_atr_14'] || 0;

    const allTimeHigh = stock.history.reduce((max, p) => Math.max(max, p.high), 0);
    const currentPrice = stock.history.slice(-1)[0].close;
    indicators['price_vs_ath'] = allTimeHigh > 0 ? (currentPrice / allTimeHigh) - 1 : 0;

    if (marketHistory.length > 50) {
        const currentMarketIndex = marketHistory.slice(-1)[0].price;
        const pastMarketIndex = marketHistory.slice(-51)[0].price;
        indicators['market_momentum_50d'] = pastMarketIndex > 0 ? (currentMarketIndex / pastMarketIndex) - 1 : 0;
    }

    indicators['sector_momentum_50d'] = generalIndicators['sector_momentum_50d'] || 0;
    indicators['region_momentum_50d'] = generalIndicators['region_momentum_50d'] || 0;
    
    const history52w = stock.history.slice(-252);
    const high52w = Math.max(...history52w.map(h => h.high));
    const low52w = Math.min(...history52w.map(h => h.low));
    const valuation = (high52w > low52w) ? (currentPrice - low52w) / (high52w - low52w) : 0.5;
    indicators['opportunity_score'] = (1 - valuation) - (indicators['self_volatility_atr_14'] * 2);

    // Add event-based indicators
    indicators['event_sentiment_recent'] = generalIndicators['event_sentiment_recent'] || 0;
    indicators['event_impact_magnitude'] = generalIndicators['event_impact_magnitude'] || 0;
    indicators['event_type_is_macro'] = generalIndicators['event_type_is_macro'] || 0;
    indicators['event_type_is_corporate'] = generalIndicators['event_type_is_corporate'] || 0;

    return indicators;
};

const evaluateCorporateActionsAndLearn = (state: SimulationState): void => {
    const nextDay = state.day + 1;
    const currentMarketIndex = state.marketIndexHistory.slice(-1)[0].price;
    const actionsToKeep: TrackedCorporateAction[] = [];

    state.trackedCorporateActions.forEach(action => {
        if (nextDay < action.evaluationDay) {
            actionsToKeep.push(action);
            return;
        }

        const stock = state.stocks.find(s => s.symbol === action.stockSymbol);
        if (!stock || stock.isDelisted) return;

        const currentStockPrice = stock.history.slice(-1)[0].close;
        const stockReturn = currentStockPrice / action.startingStockPrice;
        const marketReturn = currentMarketIndex / action.startingMarketIndex;
        
        // Positive outcome means the stock outperformed the market after the action
        const outcome = (marketReturn > 0) ? (stockReturn / marketReturn) - 1 : stockReturn - 1;
        
        const targetScore = Math.tanh(outcome * 5); // Squash outcome to a -1 to 1 target
        const learningRate = stock.corporateAI.learningRate;
        const inputValues = action.indicatorValuesAtAction;

        let nnToUpdate: NeuralNetwork | undefined;
        if (action.actionType === 'alliance') nnToUpdate = stock.corporateAI.allianceNN;
        else if (action.actionType === 'acquisition') nnToUpdate = stock.corporateAI.acquisitionNN;
        else if (action.actionType === 'split') nnToUpdate = stock.corporateAI.splitNN;

        if (nnToUpdate && inputValues && inputValues.length > 0) {
            nnToUpdate.backpropagate(inputValues, [targetScore], learningRate);
        }
    });

    state.trackedCorporateActions = actionsToKeep;
};

const calculateMarketIndicators = (state: SimulationState): Record<string, number> => {
    const indicators: Record<string, number> = {};
    const { marketIndexHistory, stocks, eventHistory, day } = state;

    // Market Momentum
    if (marketIndexHistory.length > 50) {
        indicators['market_momentum_50d'] = (marketIndexHistory.slice(-1)[0].price / marketIndexHistory.slice(-51)[0].price) - 1;
    }
    if (marketIndexHistory.length > 200) {
        indicators['market_momentum_200d'] = (marketIndexHistory.slice(-1)[0].price / marketIndexHistory.slice(-201)[0].price) - 1;
    }

    // Market Volatility (Average ATR)
    const activeStocks = stocks.filter(s => !s.isDelisted);
    let totalAtr = 0;
    let atrCount = 0;
    activeStocks.forEach(stock => {
        const stockIndicators = calculateIndicators(stock, stocks, eventHistory);
        if (stockIndicators['volatility_atr_14']) {
            totalAtr += stockIndicators['volatility_atr_14'];
            atrCount++;
        }
    });
    indicators['market_volatility_atr_20d'] = atrCount > 0 ? totalAtr / atrCount : 0;

    // Market P/E Ratio
    let totalPe = 0;
    let peCount = 0;
    activeStocks.forEach(stock => {
        const price = stock.history.slice(-1)[0].close;
        if (stock.eps > 0) {
            totalPe += price / stock.eps;
            peCount++;
        }
    });
    indicators['market_avg_pe_ratio'] = peCount > 0 ? totalPe / peCount : 0;

    // Positive Event Ratio
    const recentEvents = eventHistory.filter(e => day - e.day <= 30);
    if (recentEvents.length > 0) {
        const positiveEvents = recentEvents.filter(e => e.type === 'positive' || (typeof e.impact === 'number' && e.impact > 1.0)).length;
        indicators['positive_event_ratio_30d'] = positiveEvents / recentEvents.length;
    } else {
        indicators['positive_event_ratio_30d'] = 0.5; // Neutral if no recent events
    }

    return indicators;
}

const evaluateNewsAndLearn = (state: SimulationState): void => {
    const nextDay = state.day + 1;
    const currentMarketIndex = state.marketIndexHistory.slice(-1)[0].price;
    const newsToKeep: TrackedNewsEvent[] = [];

    state.trackedNewsEvents.forEach(event => {
        if (nextDay < event.evaluationDay) {
            newsToKeep.push(event);
            return;
        }

        const marketReturn = (currentMarketIndex / event.startingMarketIndex) - 1;
        const targetScore = Math.tanh(marketReturn * 20); // Amplify signal and squash to [-1, 1]

        const targetArray = new Array(NEWS_EVENT_CATEGORIES.length).fill(0);
        targetArray[event.chosenCategoryIndex] = targetScore;

        state.newsPickerAI.network.backpropagate(
            event.inputIndicators,
            targetArray,
            state.newsPickerAI.learningRate
        );
    });

    state.trackedNewsEvents = newsToKeep;
};

const evaluateArticlesAndLearn = (state: SimulationState): void => {
    const nextDay = state.day + 1;
    const currentMarketIndex = state.marketIndexHistory.slice(-1)[0].price;
    const articlesToKeep: TrackedGeneratedArticle[] = [];

    state.trackedGeneratedArticles.forEach(article => {
        if (nextDay < article.evaluationDay) {
            articlesToKeep.push(article);
            return; // Not time to evaluate yet
        }

        const marketReturn = (currentMarketIndex / article.startingMarketIndex) - 1;
        // Outcome is a simple reinforcement signal: -1 for bad, 1 for good
        const outcome = Math.tanh(marketReturn * 10);

        // Tell the LLM to learn from this outcome
        newsGeneratorAI.learn(article.generatedTokens, outcome);
    });

    state.trackedGeneratedArticles = articlesToKeep;
};

const runEndOfDayLogic = (state: SimulationState): SimulationState => {
  const nextDay = state.day + 1;
  if (state.activeEvent && (state.activeEvent.stockSymbol === null || state.activeEvent.type === 'neutral')) { 
      state.activeEvent = null;
  }
  
  // --- AI Learning Phase ---
  evaluateCorporateActionsAndLearn(state);
  evaluateNewsAndLearn(state);
  evaluateArticlesAndLearn(state); // LLM learning
  state.investors.forEach(investor => {
      if (!investor.isHuman) evaluateTradesAndLearn(investor, state.stocks);
  });

  // --- Event Generation Phase ---
  // 1. Major Macro Event (chosen by News Picker AI)
  if (nextDay >= state.nextMacroEventDay) {
      const marketIndicators = calculateMarketIndicators(state);
      const indicatorValues = NEWS_PICKER_NEURONS.map(name => marketIndicators[name] || 0);
      const categoryScores = state.newsPickerAI.network.feedForward(indicatorValues);
      
      const bestCategoryIndex = categoryScores.indexOf(Math.max(...categoryScores));
      const chosenCategory = NEWS_EVENT_CATEGORIES[bestCategoryIndex];
      
      const possibleEvents = MACRO_EVENTS.filter(e => e.category === chosenCategory);
      const eventConfig = possibleEvents.length > 0 
          ? possibleEvents[Math.floor(Math.random() * possibleEvents.length)]
          : MACRO_EVENTS[Math.floor(Math.random() * MACRO_EVENTS.length)]; // Fallback

      const newMacroEvent = addEventToHistory(state, {
          stockSymbol: null, stockName: null, eventName: eventConfig.name,
          description: eventConfig.description, type: eventConfig.type as any, impact: eventConfig.impact,
          region: eventConfig.region,
      }, ['macro', eventConfig.type, eventConfig.region || 'Global']);
      state.activeEvent = newMacroEvent;
      
      // Track this event for future learning
      state.trackedNewsEvents.push({
          startDay: nextDay,
          evaluationDay: nextDay + 5,
          inputIndicators: indicatorValues,
          chosenCategoryIndex: bestCategoryIndex,
          startingMarketIndex: state.marketIndexHistory.slice(-1)[0].price
      });

      state.nextMacroEventDay = nextDay + 15 + Math.floor(Math.random() * 20);
  }
  
  // 2. Corporate AI Actions and Random Events
  const dailyImpacts: Record<string, number> = {};
  state.stocks.forEach(s => dailyImpacts[s.symbol] = 1.0);

  state.stocks.forEach(stock => {
      if (stock.isDelisted) return;
      
      let actionTaken = false;
      if (nextDay >= stock.corporateAI.nextCorporateActionDay) {
          const indicators = calculateCorporateIndicators(stock, state.stocks, state.marketIndexHistory, state.eventHistory);
          const indicatorValues = CORPORATE_NEURONS.map(name => indicators[name] || 0);
          const currentPrice = stock.history.slice(-1)[0].close;
          const currentMarketIndex = state.marketIndexHistory.slice(-1)[0].price;

          const splitScore = stock.corporateAI.splitNN.feedForward(indicatorValues)[0];
          if (splitScore > 1.5 && currentPrice > MIN_STOCK_SPLIT_PRICE) {
              actionTaken = true;
              const ratio = Math.floor(currentPrice / 100) || 2;
              const newEvent = addEventToHistory(state, { stockSymbol: stock.symbol, stockName: stock.name, eventName: `Announces ${ratio}-for-1 Stock Split`, description: `The board has approved a ${ratio}-for-1 stock split.`, type: 'split', splitDetails: { symbol: stock.symbol, ratio } }, [stock.sector, stock.name, 'split']);
              if (Math.abs(1.0 - 1) > 0.05) state.activeEvent = newEvent;
              stock.sharesOutstanding *= ratio;
              stock.history.forEach(h => { h.open /= ratio; h.high /= ratio; h.low /= ratio; h.close /= ratio; });
              stock.eps /= ratio;
              state.trackedCorporateActions.push({ startDay: nextDay, evaluationDay: nextDay + 60, stockSymbol: stock.symbol, actionType: 'split', indicatorValuesAtAction: indicatorValues, startingStockPrice: currentPrice, startingMarketIndex: currentMarketIndex });
          } else {
              const allianceScore = stock.corporateAI.allianceNN.feedForward(indicatorValues)[0];
              if (allianceScore > 2.0) {
                  // Prefer partners from the same region
                  let partners = state.stocks.filter(s => s.region === stock.region && s.sector === stock.sector && s.symbol !== stock.symbol && !s.isDelisted);
                  if(partners.length === 0 || Math.random() > 0.9) { // 10% chance to look outside region
                    partners = state.stocks.filter(s => s.sector === stock.sector && s.symbol !== stock.symbol && !s.isDelisted);
                  }
                  
                  if (partners.length > 0) {
                      actionTaken = true;
                      const partner = partners[Math.floor(Math.random() * partners.length)];
                      const newEvent = addEventToHistory(state, { stockSymbol: stock.symbol, stockName: stock.name, eventName: `Forms Alliance with ${partner.name}`, description: `A strategic alliance to collaborate on new technologies.`, type: 'alliance', allianceDetails: { partners: [stock.symbol, partner.symbol] } }, [stock.sector, 'alliance', partner.name]);
                      dailyImpacts[stock.symbol] *= 1.03;
                      dailyImpacts[partner.symbol] *= 1.03;
                      if (Math.abs(1.03 - 1) > 0.05) state.activeEvent = newEvent;
                      state.trackedCorporateActions.push({ startDay: nextDay, evaluationDay: nextDay + 90, stockSymbol: stock.symbol, actionType: 'alliance', indicatorValuesAtAction: indicatorValues, startingStockPrice: currentPrice, startingMarketIndex: currentMarketIndex });
                  }
              } else {
                  const acquisitionScore = stock.corporateAI.acquisitionNN.feedForward(indicatorValues)[0];
                  if (acquisitionScore > 2.5) {
                      const stockMarketCap = currentPrice * stock.sharesOutstanding;
                       // Prefer targets from the same region
                      let targets = state.stocks.filter(s => s.region === stock.region && s.sector === stock.sector && s.symbol !== stock.symbol && !s.isDelisted && (s.history.slice(-1)[0].close * s.sharesOutstanding < stockMarketCap * 0.5));
                      if (targets.length === 0 || Math.random() > 0.9) { // 10% chance to look outside region
                        targets = state.stocks.filter(s => s.sector === stock.sector && s.symbol !== stock.symbol && !s.isDelisted && (s.history.slice(-1)[0].close * s.sharesOutstanding < stockMarketCap * 0.5));
                      }
                     
                      if (targets.length > 0) {
                          actionTaken = true;
                          const target = targets[Math.floor(Math.random() * targets.length)];
                          const newEvent = addEventToHistory(state, { stockSymbol: stock.symbol, stockName: stock.name, eventName: `Acquires ${target.name}`, description: `An acquisition to consolidate market share.`, type: 'merger', mergerDetails: { acquiring: stock.symbol, acquired: target.symbol } }, [stock.sector, 'acquisition', target.name]);
                          dailyImpacts[stock.symbol] *= 1.05;
                          dailyImpacts[target.symbol] *= 1.15;
                          if (Math.abs(1.05 - 1) > 0.05) state.activeEvent = newEvent;
                          state.trackedCorporateActions.push({ startDay: nextDay, evaluationDay: nextDay + 180, stockSymbol: stock.symbol, actionType: 'acquisition', indicatorValuesAtAction: indicatorValues, startingStockPrice: currentPrice, startingMarketIndex: currentMarketIndex });
                          const targetStock = state.stocks.find(s => s.symbol === target.symbol);
                          if (targetStock) targetStock.isDelisted = true;
                      }
                  }
              }
          }
          if(actionTaken) stock.corporateAI.nextCorporateActionDay = nextDay + MIN_CORPORATE_ACTION_INTERVAL + Math.floor(Math.random() * CORPORATE_ACTION_INTERVAL_RANGE);
      }
      
      if (!actionTaken && Math.random() < 0.15) { // Lower chance for random events
          const events = CORPORATE_EVENTS_BY_SECTOR[stock.sector];
          const eventType = Math.random() < 0.8 ? 'neutral' : (['positive', 'negative'] as const)[Math.floor(Math.random() * 2)];
          const eventConfig = events[eventType][Math.floor(Math.random() * events[eventType].length)];
          const newEvent = addEventToHistory(state, { stockSymbol: stock.symbol, stockName: stock.name, eventName: eventConfig.name, description: eventConfig.description, type: eventConfig.type, impact: eventConfig.impact }, [stock.sector, stock.name, eventConfig.type]);
          if (eventConfig.impact && typeof eventConfig.impact === 'number') {
              dailyImpacts[stock.symbol] *= eventConfig.impact;
              if (Math.abs(eventConfig.impact - 1) > 0.05) state.activeEvent = newEvent;
          }
      }
  });


  // 3. Apply Price Changes
  const dailyTradeVolumes: Record<string, number> = {};
  state.stocks.forEach(stock => {
    if(stock.isDelisted) return;
    dailyTradeVolumes[stock.symbol] = 0;
    
    let currentPrice = stock.history[stock.history.length - 1].close;
    const boDrag = (WASHINGTON_B_AND_O_TAX_RATES_BY_SECTOR[stock.sector] || 0) / 365;
    currentPrice *= (1 - boDrag + INFLATION_RATE);

    // Apply impact from the *featured* active event
    if (state.activeEvent) {
        if (typeof state.activeEvent.impact === 'number') {
            currentPrice *= state.activeEvent.impact;
        } else if (typeof state.activeEvent.impact === 'object' && state.activeEvent.impact) {
            const regionalImpact = state.activeEvent.impact[stock.region];
            if(regionalImpact !== undefined) {
                currentPrice *= regionalImpact;
            } else { // Apply spillover effect
                const eventRegion = state.activeEvent.region;
                if(eventRegion && eventRegion !== 'Global' && state.activeEvent.impact[eventRegion]) {
                    const mainImpact = state.activeEvent.impact[eventRegion]!;
                    const spillover = 1 + (mainImpact - 1) * 0.25; // 25% spillover
                    currentPrice *= spillover;
                }
            }
        }
    }

    // Apply impacts from daily corporate events
    currentPrice *= (dailyImpacts[stock.symbol] || 1.0);

    stock.history[stock.history.length - 1].close = Math.max(0.01, currentPrice);
  });

  // 4. Investor Actions
  state.investors.forEach(investor => {
      if (investor.isHuman) return;
      const strategy = investor.strategy as HyperComplexInvestorStrategy;
      
      state.stocks.forEach(stock => {
          if (stock.isDelisted || !strategy.network) return;
          const indicators = calculateIndicators(stock, state.stocks, state.eventHistory);
          const indicatorValues = INDICATOR_NEURONS.map(name => indicators[name] || 0);
          const score = strategy.network.feedForward(indicatorValues)[0];

          const currentPrice = stock.history[stock.history.length - 1].close;
          const portfolioItem = investor.portfolio.find(p => p.symbol === stock.symbol);
          const sharesOwned = getSharesOwned(portfolioItem);

          if (score > strategy.riskAversion) {
              const maxSpend = investor.cash * 0.2;
              const sharesToBuy = Math.floor(maxSpend / currentPrice);
              if (sharesToBuy > 0) {
                  investor.cash -= sharesToBuy * currentPrice;
                  let item = portfolioItem || { symbol: stock.symbol, lots: [] };
                  if (!portfolioItem) investor.portfolio.push(item);
                  item.lots.push({ purchaseTime: state.time, purchasePrice: currentPrice, shares: sharesToBuy, purchaseIndicators: indicators });
                  dailyTradeVolumes[stock.symbol] = (dailyTradeVolumes[stock.symbol] || 0) + sharesToBuy;
                  investor.recentTrades.push({ symbol: stock.symbol, day: nextDay, type: 'buy', shares: sharesToBuy, price: currentPrice, indicatorValuesAtTrade: indicatorValues, outcomeEvaluationDay: nextDay + 5 });
              }
          }
          else if (score < -strategy.riskAversion && sharesOwned > 0) {
              const sharesToSell = Math.floor(sharesOwned * 0.5);
              if (sharesToSell > 0) {
                  investor.cash += sharesToSell * currentPrice;
                  dailyTradeVolumes[stock.symbol] = (dailyTradeVolumes[stock.symbol] || 0) + sharesToSell;
                  investor.recentTrades.push({ symbol: stock.symbol, day: nextDay, type: 'sell', shares: sharesToSell, price: currentPrice, indicatorValuesAtTrade: indicatorValues, outcomeEvaluationDay: nextDay + 5 });

                  let soldAmount = sharesToSell;
                  portfolioItem!.lots.sort((a, b) => new Date(a.purchaseTime).getTime() - new Date(b.purchaseTime).getTime());
                  const remainingLots = portfolioItem!.lots.filter(lot => {
                      if (soldAmount <= 0) return true;
                      const gainOrLoss = (currentPrice - lot.purchasePrice) * Math.min(lot.shares, soldAmount);
                      if ((new Date(state.time).getTime() - new Date(lot.purchaseTime).getTime()) / (1000 * 3600 * 24) > TAX_CONSTANTS.LONG_TERM_HOLDING_PERIOD) {
                          investor.waAnnualNetLTCG += gainOrLoss;
                      }
                      if (lot.shares <= soldAmount) {
                          soldAmount -= lot.shares; return false;
                      } else {
                          lot.shares -= soldAmount; soldAmount = 0; return true;
                      }
                  });
                  if(remainingLots.length > 0) portfolioItem!.lots = remainingLots;
                  else investor.portfolio = investor.portfolio.filter(p => p.symbol !== stock.symbol);
              }
          }
      });
  });

  // 5. Daily Wrap-up
  state.stocks.forEach(stock => {
    if(stock.history.length > 0 && !stock.isDelisted) {
        stock.history[stock.history.length - 1].volume = Math.round((dailyTradeVolumes[stock.symbol] || 0) + (Math.random() * 50000));
    }
  });

  state.investors.forEach(investor => {
      const portfolioValue = investor.portfolio.reduce((sum, item) => {
          const stock = state.stocks.find(s => s.symbol === item.symbol);
          const price = stock ? stock.history[stock.history.length - 1].close : 0;
          return sum + getSharesOwned(item) * price;
      }, 0);
      const totalValue = investor.cash + portfolioValue;
      investor.portfolioHistory.push({ day: nextDay, value: totalValue });
      if (investor.portfolioHistory.length > 200) investor.portfolioHistory.shift();
  });

  const activeStocks = state.stocks.filter(s => !s.isDelisted);
  const avgPrice = activeStocks.length > 0 ? activeStocks.reduce((sum, s) => sum + s.history[s.history.length - 1].close, 0) / activeStocks.length : 0;
  state.marketIndexHistory.push({day: nextDay, price: avgPrice});
  if(state.marketIndexHistory.length > INITIAL_HISTORY_LENGTH + 50) state.marketIndexHistory.shift();

  if (nextDay % 365 === 0) {
      state.investors.forEach(investor => {
          if (investor.isHuman) return;
          const taxDue = calculateWashingtonTax(investor);
          if (taxDue > 0) {
              investor.totalTaxesPaid += taxDue;
              investor.cash -= taxDue;
          }
          investor.waAnnualNetLTCG = 0;
      });
  }

  // Set up for next day
   state.stocks.forEach(stock => {
    if (stock.isDelisted) return;
    const lastHistory = stock.history[stock.history.length - 1];
    stock.history.push({ day: nextDay, open: lastHistory.close, high: lastHistory.close, low: lastHistory.close, close: lastHistory.close, volume: 0 });
    if (stock.history.length > INITIAL_HISTORY_LENGTH + 50) stock.history.shift();
  });

  return state;
}

export const advanceTime = (prevState: SimulationState, secondsToAdvance: number): SimulationState => {
  let state = structuredClone(prevState);
  // Re-instantiate class instances after cloning
  state.investors.forEach(investor => {
      if (investor.strategy.strategyType === 'hyperComplex') {
          const originalNetwork = (prevState.investors.find(i => i.id === investor.id)!.strategy as HyperComplexInvestorStrategy).network;
          investor.strategy.network = Object.assign(new NeuralNetwork([]), originalNetwork);
      }
  });
  state.stocks.forEach(stock => {
      const originalAI = prevState.stocks.find(s => s.symbol === stock.symbol)!.corporateAI;
      stock.corporateAI.splitNN = Object.assign(new NeuralNetwork([]), originalAI.splitNN);
      stock.corporateAI.allianceNN = Object.assign(new NeuralNetwork([]), originalAI.allianceNN);
      stock.corporateAI.acquisitionNN = Object.assign(new NeuralNetwork([]), originalAI.acquisitionNN);
  });
  const originalNewsAI = prevState.newsPickerAI;
  if (state.newsPickerAI && originalNewsAI) {
      state.newsPickerAI.network = Object.assign(new NeuralNetwork([]), originalNewsAI.network);
  }


  let currentTime = new Date(state.time);

  const endDate = new Date(currentTime.getTime() + secondsToAdvance * 1000);
  let nextDayBoundary = new Date(currentTime);
  nextDayBoundary.setUTCHours(0, 0, 0, 0);
  nextDayBoundary.setUTCDate(nextDayBoundary.getUTCDate() + 1);

  while (currentTime < endDate) {
      const remainingTime = (endDate.getTime() - currentTime.getTime()) / 1000;
      const timeToNextDay = (nextDayBoundary.getTime() - currentTime.getTime()) / 1000;
      
      const stepSeconds = Math.min(remainingTime, timeToNextDay);

      currentTime = new Date(currentTime.getTime() + stepSeconds * 1000);

      const secondsInDay = 86400;
      const volatility = (Math.sqrt(stepSeconds) * 0.03) / Math.sqrt(secondsInDay);

      state.stocks.forEach(stock => {
          if(stock.isDelisted) return;
          const lastHistory = stock.history[stock.history.length - 1];
          let newPrice = lastHistory.close * (1 + (Math.random() - 0.5) * volatility);
          newPrice = Math.max(0.01, newPrice);
          lastHistory.close = newPrice;
          lastHistory.high = Math.max(lastHistory.high, newPrice);
          lastHistory.low = Math.min(lastHistory.low, newPrice);
      });

      if (currentTime >= nextDayBoundary) {
          state = runEndOfDayLogic(state);
          state.day++;
          nextDayBoundary.setUTCDate(nextDayBoundary.getUTCDate() + 1);
      }
  }

  state.time = currentTime.toISOString();
  return state;
};

export const playerBuyStock = (prevState: SimulationState, playerId: string, symbol: string, shares: number): SimulationState => {
  const player = prevState.investors.find((inv) => inv.id === playerId);
  const stock = prevState.stocks.find((s) => s.symbol === symbol);

  if (!player || !stock || shares <= 0) {
    return prevState;
  }

  const currentPrice = stock.history[stock.history.length - 1].close;
  const totalCost = currentPrice * shares;

  if (player.cash < totalCost) {
    return prevState;
  }
  
  const newInvestors = prevState.investors.map((inv) => {
    if (inv.id !== playerId) {
      return inv;
    }

    const portfolioItemIndex = inv.portfolio.findIndex((item) => item.symbol === symbol);
    
    const newLot: ShareLot = {
      purchaseTime: prevState.time,
      purchasePrice: currentPrice,
      shares: shares,
      purchaseIndicators: {},
    };

    let newPortfolio: PortfolioItem[];

    if (portfolioItemIndex > -1) {
      // Player already owns this stock. Create a new portfolio array.
      newPortfolio = inv.portfolio.map((item, index) => {
        if (index !== portfolioItemIndex) return item;
        // Create a new portfolio item with a new lots array
        return {
          ...item,
          lots: [...item.lots, newLot],
        };
      });
    } else {
      // Player is buying this stock for the first time. Create a new portfolio array.
      const newPortfolioItem: PortfolioItem = { symbol, lots: [newLot] };
      newPortfolio = [...inv.portfolio, newPortfolioItem];
    }

    return {
      ...inv,
      cash: inv.cash - totalCost,
      portfolio: newPortfolio,
    };
  });

  return {
    ...prevState,
    investors: newInvestors,
  };
};

export const playerSellStock = (prevState: SimulationState, playerId: string, symbol: string, sharesToSell: number): SimulationState => {
  const player = prevState.investors.find((inv) => inv.id === playerId);
  const stock = prevState.stocks.find((s) => s.symbol === symbol);

  if (!player || !stock || sharesToSell <= 0) {
    return prevState;
  }

  const portfolioItem = player.portfolio.find((item) => item.symbol === symbol);
  if (!portfolioItem) {
    return prevState;
  }

  const totalSharesOwned = portfolioItem.lots.reduce((sum, lot) => sum + lot.shares, 0);
  if (totalSharesOwned < sharesToSell) {
    return prevState;
  }

  const newInvestors = prevState.investors.map(inv => {
    if (inv.id !== playerId) {
      return inv;
    }

    const currentPrice = stock.history[stock.history.length - 1].close;
    let sharesLeftToSell = sharesToSell;
    
    // FIFO: sort by purchase time
    const sortedLots = [...portfolioItem.lots].sort((a, b) => new Date(a.purchaseTime).getTime() - new Date(b.purchaseTime).getTime());
    
    const newLots: ShareLot[] = [];
    for (const lot of sortedLots) {
      if (sharesLeftToSell <= 0) {
        newLots.push(lot); // Keep the lot as is
        continue;
      }

      const gainOrLoss = (currentPrice - lot.purchasePrice) * Math.min(lot.shares, sharesLeftToSell);
      if ((new Date(prevState.time).getTime() - new Date(lot.purchaseTime).getTime()) / (1000 * 3600 * 24) > TAX_CONSTANTS.LONG_TERM_HOLDING_PERIOD) {
          // This mutation is safe within our immutable update pattern
          inv.waAnnualNetLTCG += gainOrLoss;
      }

      if (lot.shares > sharesLeftToSell) {
        // Partially sell from this lot
        newLots.push({ ...lot, shares: lot.shares - sharesLeftToSell });
        sharesLeftToSell = 0;
      } else {
        // Fully sell this lot
        sharesLeftToSell -= lot.shares;
        // Do not push the lot to newLots
      }
    }

    const newPortfolio = player.portfolio.map(item => {
      if (item.symbol !== symbol) {
        return item;
      }
      return { ...item, lots: newLots };
    }).filter(item => item.lots.length > 0); // Remove if all shares sold

    return {
      ...inv,
      cash: inv.cash + (sharesToSell * currentPrice),
      portfolio: newPortfolio,
    };
  });

  return {
    ...prevState,
    investors: newInvestors,
  };
};