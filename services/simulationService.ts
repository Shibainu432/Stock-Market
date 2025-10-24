
import { SimulationState, Stock, Investor, SimplePriceDataPoint, PortfolioItem, ShareLot, ActiveEvent, HyperComplexInvestorStrategy, TrackedCorporateAction, OHLCDataPoint, Region, TrackedGeneratedArticle, RandomInvestorStrategy, MicroLLM } from '../types';
import { STOCK_SYMBOLS, MIN_INITIAL_STOCK_PRICE, MAX_INITIAL_STOCK_PRICE, INITIAL_HISTORY_LENGTH, HUMAN_INITIAL_INVESTOR_CASH, AI_INITIAL_INVESTOR_CASH, buildInvestors, INFLATION_RATE, TAX_CONSTANTS, CORPORATE_EVENTS_BY_SECTOR, MACRO_EVENTS, WASHINGTON_B_AND_O_TAX_RATES_BY_SECTOR, MIN_CORPORATE_ACTION_INTERVAL, CORPORATE_ACTION_INTERVAL_RANGE, MIN_STOCK_SPLIT_PRICE, INDICATOR_NEURONS, CORPORATE_NEURONS } from '../constants';
import { getImageForEvent } from './imageService';
import { generateNewsArticle, createMicroLLM, learnFromArticleOutcome, refineLLMWithCorpus } from './newsGenerationService';
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

  const marketIndexHistory: SimplePriceDataPoint[] = [];
  for(let i = 0; i < INITIAL_HISTORY_LENGTH; i++) {
      const avgPrice = stocks.reduce((sum, stock) => sum + stock.history[i].close, 0) / stocks.length;
      marketIndexHistory.push({day: i + 1, price: avgPrice});
  }

  const initialTime = new Date(startDate.getTime());
  initialTime.setDate(initialTime.getDate() + day);
  
  return {
    day,
    time: initialTime.toISOString(),
    startDate: startDate.toISOString(),
    stocks,
    investors,
    activeEvent: null,
    eventHistory: [],
    marketIndexHistory,
    nextCorporateEventDay: day + 50 + Math.floor(Math.random() * 50),
    nextMacroEventDay: day + 200 + Math.floor(Math.random() * 165),
    trackedCorporateActions: [],
    microLLM: createMicroLLM(),
    trackedArticles: [],
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

    [5, 10, 20, 50].forEach(p => {
        if(prices.length > p) indicators[`momentum_${p}d`] = (currentPrice / prices[prices.length - 1 - p]) - 1;
    });
    if (prices.length > 5) {
        const avg5d = prices.slice(-5, -1).reduce((s,v) => s+v, 0) / 4;
        if(avg5d > 0) indicators['momentum_1d_vs_avg5d'] = (currentPrice / avg5d) - 1;
    }


    const smas: Record<string, number> = {};
    [10, 20, 50, 100, 200].forEach(p => {
        if (prices.length >= p) {
            const sma = prices.slice(-p).reduce((s, v) => s + v, 0) / p;
            smas[p] = sma;
            indicators[`trend_price_vs_sma_${p}`] = (currentPrice - sma) / sma;
        }
    });

    if(smas[10] && smas[20]) indicators['trend_sma_crossover_10_20'] = (smas[10] - smas[20]) / smas[20];
    if(smas[20] && smas[50]) indicators['trend_sma_crossover_20_50'] = (smas[20] - smas[50]) / smas[50];
    if(smas[50] && smas[200]) indicators['trend_sma_crossover_50_200'] = (smas[50] - smas[200]) / smas[200];
    
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
                indicators[`oscillator_rsi_${p}_contrarian`] = (50 - rsi) / 50;
            } else {
                 indicators[`oscillator_rsi_${p}_contrarian`] = 0;
            }
        }
    });
    
    const stochPeriod = 14;
    if(prices.length >= stochPeriod) {
        const slice = prices.slice(-stochPeriod);
        const L14 = Math.min(...slice);
        const H14 = Math.max(...slice);
        const K = H14 > L14 ? 100 * (currentPrice - L14) / (H14 - L14) : 50;
        indicators['oscillator_stochastic_k_14_contrarian'] = (50 - K) / 50;
    }

    const bbPeriod = 20;
    if(smas[bbPeriod]) {
        const stdDev = Math.sqrt(prices.slice(-bbPeriod).map(p => Math.pow(p - smas[bbPeriod], 2)).reduce((a, b) => a + b) / bbPeriod);
        const upper = smas[bbPeriod] + (stdDev * 2);
        const lower = smas[bbPeriod] - (stdDev * 2);
        indicators['volatility_bollinger_bandwidth_20'] = (upper - lower) / smas[bbPeriod];
        if(upper > lower) indicators['volatility_bollinger_percent_b_20'] = (currentPrice - lower) / (upper - lower);
    }
    
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    if(ema12 && ema26) {
        indicators['macd_histogram'] = (ema12 - ema26) / ema26;
    }
    
    const volPeriod = 20;
    if(volumes.length >= volPeriod) {
        const avgVol = volumes.slice(-volPeriod).reduce((s, v) => s + v, 0) / volPeriod;
        indicators['volume_avg_20d_spike'] = (volumes[volumes.length - 1] - avgVol) / avgVol;
    }

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

    const cmfPeriod = 20;
    if (prices.length >= cmfPeriod && volumes.length >= cmfPeriod) {
        let mfvs = 0;
        let volSum = 0;
        for (let i = prices.length - cmfPeriod; i < prices.length; i++) {
            const mfm = (prices[i] - prevPrice) > 0 ? 1 : -1;
            mfvs += mfm * volumes[i];
            volSum += volumes[i];
        }
        if(volSum > 0) indicators['volume_cmf_20'] = mfvs / volSum;
    }

    const atrPeriod = 14;
    if (prices.length > atrPeriod) {
        const trs = [];
        for (let i = prices.length - atrPeriod; i < prices.length; i++) {
            trs.push(Math.abs(prices[i] - prices[i-1]));
        }
        const atr = trs.reduce((s,v) => s+v, 0) / atrPeriod;
        if (currentPrice > 0) indicators['volatility_atr_14'] = atr / currentPrice;
    }

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
            effectiveReturn = actualReturn;
        } else {
            effectiveReturn = -actualReturn;
        }

        const targetScore = Math.tanh(effectiveReturn * 10);
        
        const inputValues = trade.indicatorValuesAtTrade;

        if (inputValues && inputValues.length > 0) {
            network.backpropagate(inputValues, [targetScore], learningRate);
        }
    });
};

const addEventToHistory = (state: SimulationState, eventData: Omit<ActiveEvent, 'id' | 'day' | 'imageUrl' | 'headline' | 'summary' | 'fullText'>, keywords: (string | null)[]): ActiveEvent => {
    const nextDay = state.day + 1;
    const { article, generatedText } = generateNewsArticle({ ...eventData } as ActiveEvent, state);
    
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
    
    const stock = eventData.stockSymbol ? state.stocks.find(s => s.symbol === eventData.stockSymbol) : null;
    const trackedArticle: TrackedGeneratedArticle = {
        eventId: newEvent.id,
        evaluationDay: nextDay + 10,
        generatedText,
        startingMarketIndex: state.marketIndexHistory.slice(-1)[0].price,
        stockSymbol: stock ? stock.symbol : null,
        startingStockPrice: stock ? stock.history.slice(-1)[0].close : null
    };
    state.trackedArticles.push(trackedArticle);

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
        
        const outcome = (marketReturn > 0) ? (stockReturn / marketReturn) - 1 : stockReturn - 1;
        
        const targetScore = Math.tanh(outcome * 5);
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

const evaluateArticlesAndLearn = (state: SimulationState): void => {
    const nextDay = state.day + 1;
    const currentMarketIndex = state.marketIndexHistory.slice(-1)[0].price;
    const articlesToKeep: TrackedGeneratedArticle[] = [];

    state.trackedArticles.forEach(article => {
        if (nextDay < article.evaluationDay) {
            articlesToKeep.push(article);
            return;
        }
        
        let outcome = 1.0; // Neutral outcome
        const marketReturn = currentMarketIndex / article.startingMarketIndex;

        if (article.stockSymbol && article.startingStockPrice) {
            const stock = state.stocks.find(s => s.symbol === article.stockSymbol);
            if (stock && !stock.isDelisted) {
                const stockReturn = stock.history.slice(-1)[0].close / article.startingStockPrice;
                // Stock outperformance relative to the market
                outcome = marketReturn > 0 ? stockReturn / marketReturn : stockReturn;
            }
        } else {
            // For macro events, the outcome is just the market return
            outcome = marketReturn;
        }

        state.microLLM = learnFromArticleOutcome(state.microLLM, article.generatedText, outcome);
    });

    state.trackedArticles = articlesToKeep;
};

export const isMarketOpen = (time: Date, region: Region): boolean => {
    const dayOfWeek = time.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false; // Saturday or Sunday

    const hours = time.getUTCHours() + time.getUTCMinutes() / 60;

    switch (region) {
        case 'North America':
            return hours >= 13.5 && hours < 20.0;
        case 'Europe':
            return hours >= 7.0 && hours < 15.5;
        case 'Asia':
            const isMorningSession = hours >= 0.0 && hours < 2.5;
            const isAfternoonSession = hours >= 3.5 && hours < (6 + 25/60);
            return isMorningSession || isAfternoonSession;
        default:
            return false;
    }
}

const executeTrade = (
    state: SimulationState,
    investor: Investor,
    stock: Stock,
    shares: number,
    type: 'buy' | 'sell',
    indicators: Record<string, number>,
    indicatorValues: number[]
) => {
    const currentPrice = stock.history[stock.history.length - 1].close;
    const nextDay = state.day;

    if (type === 'buy') {
        investor.cash -= shares * currentPrice;
        let item = investor.portfolio.find(p => p.symbol === stock.symbol) || { symbol: stock.symbol, lots: [] };
        if (!investor.portfolio.find(p => p.symbol === stock.symbol)) investor.portfolio.push(item);
        item.lots.push({ purchaseTime: state.time, purchasePrice: currentPrice, shares, purchaseIndicators: indicators });

        if (investor.strategy.strategyType === 'hyperComplex') {
            investor.recentTrades.push({ symbol: stock.symbol, day: nextDay, type: 'buy', shares, price: currentPrice, indicatorValuesAtTrade: indicatorValues, outcomeEvaluationDay: nextDay + 5 });
        }
    } else { // sell
        investor.cash += shares * currentPrice;

        if (investor.strategy.strategyType === 'hyperComplex') {
            investor.recentTrades.push({ symbol: stock.symbol, day: nextDay, type: 'sell', shares, price: currentPrice, indicatorValuesAtTrade: indicatorValues, outcomeEvaluationDay: nextDay + 5 });
        }
        let soldAmount = shares;
        const portfolioItem = investor.portfolio.find(p => p.symbol === stock.symbol)!;
        portfolioItem.lots.sort((a, b) => new Date(a.purchaseTime).getTime() - new Date(b.purchaseTime).getTime());
        const remainingLots = portfolioItem.lots.filter(lot => {
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
        if(remainingLots.length > 0) portfolioItem.lots = remainingLots;
        else investor.portfolio = investor.portfolio.filter(p => p.symbol !== stock.symbol);
    }
};


const runMarketTick = (state: SimulationState, durationHours: number, currentTime: Date): SimulationState => {
    const tickTradeVolumes: Record<string, number> = {};
    const tickNetBuyShares: Record<string, number> = {};
    state.stocks.forEach(stock => {
        if (!stock.isDelisted) {
            tickTradeVolumes[stock.symbol] = 0;
            tickNetBuyShares[stock.symbol] = 0;
        }
    });

    const isInitialChaosPeriod = state.day === INITIAL_HISTORY_LENGTH;

    if (!isInitialChaosPeriod) {
        state.investors.forEach(investor => {
            if (investor.isHuman) return;
            
            const marketHours = 6.5;
            
            switch (investor.strategy.strategyType) {
              case 'hyperComplex': {
                  const strategy = investor.strategy as HyperComplexInvestorStrategy;
                  const tradeChance = (1 / strategy.tradeFrequency) * (durationHours / marketHours);
                  if(Math.random() > tradeChance) return;

                  state.stocks.forEach(stock => {
                      if (stock.isDelisted || !strategy.network || !isMarketOpen(currentTime, stock.region)) return;
                      const indicators = calculateIndicators(stock, state.stocks, state.eventHistory);
                      const indicatorValues = INDICATOR_NEURONS.map(name => indicators[name] || 0);
                      const score = strategy.network.feedForward(indicatorValues)[0];
                      const currentPrice = stock.history[stock.history.length - 1].close;
                      const portfolioItem = investor.portfolio.find(p => p.symbol === stock.symbol);
                      const sharesOwned = getSharesOwned(portfolioItem);
    
                      if (score > strategy.riskAversion) {
                          const maxSpend = investor.cash * 0.2 * (durationHours/marketHours);
                          const sharesToBuy = Math.floor(maxSpend / currentPrice);
                          if (sharesToBuy > 0) {
                              executeTrade(state, investor, stock, sharesToBuy, 'buy', indicators, indicatorValues);
                              tickTradeVolumes[stock.symbol] += sharesToBuy;
                              tickNetBuyShares[stock.symbol] += sharesToBuy;
                          }
                      }
                      else if (score < -strategy.riskAversion && sharesOwned > 0) {
                          const sharesToSell = Math.floor(sharesOwned * 0.5 * (durationHours/marketHours));
                          if (sharesToSell > 0) {
                              executeTrade(state, investor, stock, sharesToSell, 'sell', indicators, indicatorValues);
                              tickTradeVolumes[stock.symbol] += sharesToSell;
                              tickNetBuyShares[stock.symbol] -= sharesToSell;
                          }
                      }
                  });
                  break;
              }
              case 'random': {
                  const strategy = investor.strategy as RandomInvestorStrategy;
                  state.stocks.forEach(stock => {
                      if (stock.isDelisted || !isMarketOpen(currentTime, stock.region)) return;
                      if (Math.random() < strategy.tradeChance * (durationHours / marketHours)) {
                          const currentPrice = stock.history[stock.history.length - 1].close;
                          const portfolioItem = investor.portfolio.find(p => p.symbol === stock.symbol);
                          const sharesOwned = getSharesOwned(portfolioItem);
                          const shouldBuy = Math.random() < 0.5;
    
                          if (shouldBuy && investor.cash > 10) {
                              const spendAmount = investor.cash * (Math.random() * 0.50);
                              const sharesToBuy = Math.floor(spendAmount / currentPrice);
                              if (sharesToBuy > 0) {
                                  executeTrade(state, investor, stock, sharesToBuy, 'buy', {}, []);
                                  tickTradeVolumes[stock.symbol] += sharesToBuy;
                                  tickNetBuyShares[stock.symbol] += sharesToBuy;
                              }
                          } else if (!shouldBuy && sharesOwned > 0) {
                              const sharesToSell = Math.min(sharesOwned, Math.max(1, Math.floor(sharesOwned * (Math.random() * 0.5))));
                              if (sharesToSell > 0) {
                                  executeTrade(state, investor, stock, sharesToSell, 'sell', {}, []);
                                  tickTradeVolumes[stock.symbol] += sharesToSell;
                                  tickNetBuyShares[stock.symbol] -= sharesToSell;
                              }
                          }
                      }
                  });
                  break;
              }
            }
        });
    }

    state.stocks.forEach(stock => {
        if(stock.isDelisted) return;
        
        const currentDayEntry = stock.history[stock.history.length - 1];
        let currentPrice = currentDayEntry.close;
        const boDrag = ((WASHINGTON_B_AND_O_TAX_RATES_BY_SECTOR[stock.sector] || 0) / 365) * (durationHours / 24);
        currentPrice *= (1 - boDrag + (INFLATION_RATE * (durationHours / 24)));
    
        if(isMarketOpen(currentTime, stock.region)) {
            if (isInitialChaosPeriod) {
                const volatility = 0.15 * (durationHours / 6.5);
                const randomChangePercent = (Math.random() - 0.5) * 2 * volatility;
                currentPrice *= (1 + randomChangePercent);
            } else {
                const netBuyVolume = tickNetBuyShares[stock.symbol] || 0;
                const priceImpactFactor = 0.1;
                const volumePressure = (netBuyVolume / stock.sharesOutstanding) * priceImpactFactor;
                const clampedPressure = Math.max(-0.1, Math.min(0.1, volumePressure));
                currentPrice *= (1 + clampedPressure);
            }
        }
    
        const finalPrice = Math.max(0.01, currentPrice);
        
        currentDayEntry.close = finalPrice;
        currentDayEntry.high = Math.max(currentDayEntry.high, finalPrice);
        currentDayEntry.low = Math.min(currentDayEntry.low, finalPrice);
        currentDayEntry.volume += Math.round((tickTradeVolumes[stock.symbol] || 0));
    });
    
    return state;
}

const runDailyTransition = (state: SimulationState): SimulationState => {
    const nextDay = state.day + 1;

    evaluateCorporateActionsAndLearn(state);
    evaluateArticlesAndLearn(state);
    state.investors.forEach(investor => {
        if (!investor.isHuman && investor.strategy.strategyType === 'hyperComplex') {
            evaluateTradesAndLearn(investor, state.stocks);
        }
    });

    state.investors.forEach(investor => {
        const portfolioValue = investor.portfolio.reduce((sum, item) => {
            const stock = state.stocks.find(s => s.symbol === item.symbol);
            const price = stock ? stock.history[stock.history.length - 1].close : 0;
            return sum + getSharesOwned(item) * price;
        }, 0);
        const totalValue = investor.cash + portfolioValue;
        investor.portfolioHistory.push({ day: state.day, value: totalValue });
        if (investor.portfolioHistory.length > 200) investor.portfolioHistory.shift();
    });

    const activeStocks = state.stocks.filter(s => !s.isDelisted);
    const avgPrice = activeStocks.length > 0 ? activeStocks.reduce((sum, s) => sum + s.history[s.history.length - 1].close, 0) / activeStocks.length : 0;
    state.marketIndexHistory.push({day: state.day, price: avgPrice});
    if(state.marketIndexHistory.length > INITIAL_HISTORY_LENGTH + 50) state.marketIndexHistory.shift();

    if (state.day % 365 === 0) {
        state.investors.forEach(investor => {
            const taxDue = calculateWashingtonTax(investor);
            if (taxDue > 0) {
                investor.totalTaxesPaid += taxDue;
                investor.cash -= taxDue;
            }
            investor.waAnnualNetLTCG = 0;
        });
    }

    state.stocks.forEach(stock => {
        if (stock.isDelisted) return;
        const lastHistory = stock.history.length > 0 ? stock.history[stock.history.length - 1] : null;
        const prevClose = lastHistory ? lastHistory.close : 10;
        stock.history.push({ day: nextDay, open: prevClose, high: prevClose, low: prevClose, close: prevClose, volume: 0 });
        if (stock.history.length > INITIAL_HISTORY_LENGTH + 50) stock.history.shift();
    });

    // An active event from the previous day is cleared if it was a macro event or neutral corporate event.
    // Specific corporate events (like splits/mergers) might have lasting effects handled elsewhere,
    // but the main news item is cleared here.
    if (state.activeEvent && (state.activeEvent.stockSymbol === null || state.activeEvent.type === 'neutral')) {
        state.activeEvent = null;
    }

    // This object will accumulate all price-changing effects for the day.
    const dailyImpacts: Record<string, number> = {};
    state.stocks.forEach(s => dailyImpacts[s.symbol] = 1.0);
  
    // Check if it's time for a new macroeconomic event.
    if (nextDay >= state.nextMacroEventDay) {
        const marketMomentum = state.marketIndexHistory.length > 50 
            ? (state.marketIndexHistory.slice(-1)[0].price / state.marketIndexHistory.slice(-51)[0].price) - 1
            : 0;
        
        const isBullish = marketMomentum > 0.05;
        const isBearish = marketMomentum < -0.05;
        
        let possibleEvents = MACRO_EVENTS;
        // Bias event selection based on market conditions.
        if (isBullish && Math.random() < 0.7) {
            possibleEvents = MACRO_EVENTS.filter(e => e.type === 'positive' || e.type === 'political');
        } else if (isBearish && Math.random() < 0.7) {
            possibleEvents = MACRO_EVENTS.filter(e => e.type === 'negative' || e.type === 'disaster' || e.type === 'political');
        }
        
        const eventConfig = possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
  
        const newMacroEvent = addEventToHistory(state, { stockSymbol: null, stockName: null, eventName: eventConfig.name, description: eventConfig.description, type: eventConfig.type as any, impact: eventConfig.impact, region: eventConfig.region }, ['macro', eventConfig.type, eventConfig.region || 'Global']);
        state.activeEvent = newMacroEvent;
        
        state.nextMacroEventDay = nextDay + 15 + Math.floor(Math.random() * 20);
    }
    
    // Iterate through each stock to check for corporate-level events.
    for (const stock of state.stocks) {
        if (stock.isDelisted) continue;
        
        let actionTaken = false;
        // Check if a corporate AI-driven action is scheduled.
        if (nextDay >= stock.corporateAI.nextCorporateActionDay) {
            const indicators = calculateCorporateIndicators(stock, state.stocks, state.marketIndexHistory, state.eventHistory);
            const indicatorValues = CORPORATE_NEURONS.map(name => indicators[name] || 0);
            const currentPrice = stock.history.slice(-1)[0].open;
            const currentMarketIndex = state.marketIndexHistory.slice(-1)[0].price;
  
            // The corporate AI evaluates splitting the stock.
            const splitScore = stock.corporateAI.splitNN.feedForward(indicatorValues)[0];
            if (splitScore > 1.5 && currentPrice > MIN_STOCK_SPLIT_PRICE) {
                actionTaken = true;
                const ratio = Math.floor(currentPrice / 100) || 2;
                addEventToHistory(state, { stockSymbol: stock.symbol, stockName: stock.name, eventName: `Announces ${ratio}-for-1 Stock Split`, description: `The board has approved a ${ratio}-for-1 stock split.`, type: 'split', splitDetails: { symbol: stock.symbol, ratio } }, [stock.sector, stock.name, 'split']);
                // The split directly affects stock properties.
                stock.sharesOutstanding *= ratio;
                stock.history.forEach(h => { h.open /= ratio; h.high /= ratio; h.low /= ratio; h.close /= ratio; });
                stock.eps /= ratio;
                state.trackedCorporateActions.push({ startDay: nextDay, evaluationDay: nextDay + 60, stockSymbol: stock.symbol, actionType: 'split', indicatorValuesAtAction: indicatorValues, startingStockPrice: currentPrice / ratio, startingMarketIndex: currentMarketIndex });
            } else {
                // The corporate AI evaluates forming an alliance.
                const allianceScore = stock.corporateAI.allianceNN.feedForward(indicatorValues)[0];
                if (allianceScore > 2.0) {
                    // Find a suitable partner.
                    let partners = state.stocks.filter(s => s.region === stock.region && s.sector === stock.sector && s.symbol !== stock.symbol && !s.isDelisted);
                    if(partners.length === 0 || Math.random() > 0.9) partners = state.stocks.filter(s => s.sector === stock.sector && s.symbol !== stock.symbol && !s.isDelisted);
                    
                    if (partners.length > 0) {
                        actionTaken = true;
                        const partner = partners[Math.floor(Math.random() * partners.length)];
                        addEventToHistory(state, { stockSymbol: stock.symbol, stockName: stock.name, eventName: `Forms Alliance with ${partner.name}`, description: `A strategic alliance to collaborate on new technologies.`, type: 'alliance', allianceDetails: { partners: [stock.symbol, partner.symbol] } }, [stock.sector, 'alliance', partner.name]);
                        dailyImpacts[stock.symbol] *= 1.03;
                        dailyImpacts[partner.symbol] *= 1.03;
                        state.trackedCorporateActions.push({ startDay: nextDay, evaluationDay: nextDay + 90, stockSymbol: stock.symbol, actionType: 'alliance', indicatorValuesAtAction: indicatorValues, startingStockPrice: currentPrice, startingMarketIndex: currentMarketIndex });
                    }
                } else {
                    // The corporate AI evaluates acquiring another company.
                    const acquisitionScore = stock.corporateAI.acquisitionNN.feedForward(indicatorValues)[0];
                    if (acquisitionScore > 2.5) {
                        const stockMarketCap = currentPrice * stock.sharesOutstanding;
                        // Find a suitable, smaller target company.
                        let targets = state.stocks.filter(s => s.region === stock.region && s.sector === stock.sector && s.symbol !== stock.symbol && !s.isDelisted && (s.history.slice(-1)[0].open * s.sharesOutstanding < stockMarketCap * 0.5));
                        if (targets.length === 0 || Math.random() > 0.9) targets = state.stocks.filter(s => s.sector === stock.sector && s.symbol !== stock.symbol && !s.isDelisted && (s.history.slice(-1)[0].open * s.sharesOutstanding < stockMarketCap * 0.5));
                       
                        if (targets.length > 0) {
                            actionTaken = true;
                            const target = targets[Math.floor(Math.random() * targets.length)];
                            addEventToHistory(state, { stockSymbol: stock.symbol, stockName: stock.name, eventName: `Acquires ${target.name}`, description: `An acquisition to consolidate market share.`, type: 'merger', mergerDetails: { acquiring: stock.symbol, acquired: target.symbol } }, [stock.sector, 'acquisition', target.name]);
                            dailyImpacts[stock.symbol] *= 1.05;
                            dailyImpacts[target.symbol] *= 1.15; // Target company stock pops before delisting.
                            state.trackedCorporateActions.push({ startDay: nextDay, evaluationDay: nextDay + 180, stockSymbol: stock.symbol, actionType: 'acquisition', indicatorValuesAtAction: indicatorValues, startingStockPrice: currentPrice, startingMarketIndex: currentMarketIndex });
                            const targetStock = state.stocks.find(s => s.symbol === target.symbol);
                            if (targetStock) targetStock.isDelisted = true;
                        }
                    }
                }
            }
            // Schedule the next potential AI action.
            if(actionTaken) stock.corporateAI.nextCorporateActionDay = nextDay + MIN_CORPORATE_ACTION_INTERVAL + Math.floor(Math.random() * CORPORATE_ACTION_INTERVAL_RANGE);
        }
        
        // If no major AI action was taken, there's a chance for a smaller, random corporate event.
        if (!actionTaken && Math.random() < 0.15) {
            const events = CORPORATE_EVENTS_BY_SECTOR[stock.sector];
            const eventType = Math.random() < 0.8 ? 'neutral' : (['positive', 'negative'] as const)[Math.floor(Math.random() * 2)];
            const eventConfig = events[eventType][Math.floor(Math.random() * events[eventType].length)];
            addEventToHistory(state, { stockSymbol: stock.symbol, stockName: stock.name, eventName: eventConfig.name, description: eventConfig.description, type: eventConfig.type, impact: eventConfig.impact }, [stock.sector, stock.name, eventConfig.type]);
            if (eventConfig.impact && typeof eventConfig.impact === 'number') {
                dailyImpacts[stock.symbol] *= eventConfig.impact;
            }
        }
    }

    // After all events for the day have been determined, apply the impact of the main active event.
    if (state.activeEvent) {
        // Helper function to parse complex, multi-layered event impacts.
        const applyMacroImpact = (stock: Stock, event: ActiveEvent): number => {
            if (typeof event.impact === 'number') {
                return event.impact; // Simple global impact.
            }
            if (typeof event.impact === 'object' && event.impact) {
                const impacts = event.impact as Record<string, number>;

                // Priority of impact: Sector > Region > Default
                if (impacts[stock.sector] !== undefined) return impacts[stock.sector];
                if (impacts[stock.region] !== undefined) return impacts[stock.region];
                if (impacts['default'] !== undefined) return impacts['default'];

                // If it's a regional event, apply a dampened effect to other regions.
                const eventRegion = event.region;
                if (eventRegion && eventRegion !== 'Global' && impacts[eventRegion]) {
                    const mainImpact = impacts[eventRegion];
                    return 1 + (mainImpact - 1) * 0.25; // 25% of the impact spills over.
                }
            }
            return 1.0; // No impact.
        };
        
        // Apply the calculated impact to each stock's daily impact multiplier.
        state.stocks.forEach(stock => {
            if (!stock.isDelisted) {
                dailyImpacts[stock.symbol] *= applyMacroImpact(stock, state.activeEvent!);
            }
        });
    }

    // Finally, apply all accumulated daily impacts (from macro and corporate events) to the stock prices.
    state.stocks.forEach(stock => {
        if (!stock.isDelisted && dailyImpacts[stock.symbol] !== 1.0) {
            const currentDayEntry = stock.history[stock.history.length - 1];
            currentDayEntry.close = Math.max(0.01, currentDayEntry.close * dailyImpacts[stock.symbol]);
        }
    });

    return state;
}

const processTimeChunk = (state: SimulationState, chunkStartTime: Date, durationMs: number): SimulationState => {
    const durationHours = durationMs / (1000 * 60 * 60);
    return runMarketTick(state, durationHours, chunkStartTime);
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
  // The new MicroLLM is pure data, no need to re-instantiate classes.

  const startTime = new Date(state.time);
  const targetTime = new Date(startTime.getTime() + secondsToAdvance * 1000);
  let currentTime = startTime;

  const TIME_CHUNK_MS = 10 * 60 * 1000; // 10 minutes
  const MAX_REAL_TIME_PROCESS_MS = 100;
  const realProcStartTime = Date.now();

  while(currentTime < targetTime && (Date.now() - realProcStartTime < MAX_REAL_TIME_PROCESS_MS)) {
    const chunkEndTime = new Date(Math.min(targetTime.getTime(), currentTime.getTime() + TIME_CHUNK_MS));
    
    const startDayIndex = Math.floor(currentTime.getTime() / 86400000);
    const endDayIndex = Math.floor(chunkEndTime.getTime() / 86400000);

    if (endDayIndex > startDayIndex) {
        const midnight = new Date(startDayIndex * 86400000 + 86400000);
        
        const durationTillMidnightMs = midnight.getTime() - currentTime.getTime();
        if (durationTillMidnightMs > 0) {
            state = processTimeChunk(state, currentTime, durationTillMidnightMs);
        }
        
        state.day = startDayIndex + 1 - Math.floor(new Date(state.startDate).getTime() / 86400000);
        state = runDailyTransition(state);
        
        const durationAfterMidnightMs = chunkEndTime.getTime() - midnight.getTime();
        if (durationAfterMidnightMs > 0) {
            state = processTimeChunk(state, midnight, durationAfterMidnightMs);
        }
    } else {
        const durationMs = chunkEndTime.getTime() - currentTime.getTime();
        state = processTimeChunk(state, currentTime, durationMs);
    }

    currentTime = chunkEndTime;
  }
  
  state.time = currentTime.toISOString();
  
  const startDate = new Date(state.startDate);
  const msSinceStart = new Date(state.time).getTime() - startDate.getTime();
  state.day = Math.floor(msSinceStart / (24 * 60 * 60 * 1000));

  // Simulate continuous "idle-time" training for the MicroLLM
  state.microLLM = refineLLMWithCorpus(state.microLLM);
  
  return state;
};

export const playerBuyStock = (prevState: SimulationState, playerId: string, symbol: string, shares: number): SimulationState => {
  const state = {
    ...prevState,
    investors: prevState.investors.map(inv => ({...inv})),
    stocks: prevState.stocks.map(st => ({...st}))
  };
  const investor = state.investors.find(i => i.id === playerId);
  const stock = state.stocks.find(s => s.symbol === symbol);

  if (!investor || !stock || stock.isDelisted) return prevState;

  const currentPrice = stock.history[stock.history.length - 1].close;
  const cost = shares * currentPrice;

  if (investor.cash >= cost && shares > 0) {
    investor.cash -= cost;
    let item = investor.portfolio.find(p => p.symbol === symbol);
    if (!item) {
      item = { symbol, lots: [] };
      investor.portfolio.push(item);
    }
    item.lots.push({
      purchaseTime: state.time,
      purchasePrice: currentPrice,
      shares,
      purchaseIndicators: {} // Not needed for human
    });
  }

  return state;
};

export const playerSellStock = (prevState: SimulationState, playerId: string, symbol: string, shares: number): SimulationState => {
    const state = {
        ...prevState,
        investors: prevState.investors.map(inv => ({
            ...inv,
            portfolio: inv.portfolio.map(p => ({
                ...p,
                lots: p.lots.map(l => ({...l}))
            }))
        })),
        stocks: prevState.stocks.map(st => ({...st}))
    };
    const investor = state.investors.find(i => i.id === playerId);
    const stock = state.stocks.find(s => s.symbol === symbol);

    if (!investor || !stock) return prevState;

    const portfolioItem = investor.portfolio.find(p => p.symbol === symbol);
    const sharesOwned = getSharesOwned(portfolioItem);

    if (!portfolioItem || sharesOwned < shares || shares <= 0) return prevState;

    const currentPrice = stock.history[stock.history.length - 1].close;
    investor.cash += shares * currentPrice;

    let sharesToSell = shares;
    portfolioItem.lots.sort((a, b) => new Date(a.purchaseTime).getTime() - new Date(b.purchaseTime).getTime());
    
    const remainingLots: ShareLot[] = [];
    for (const lot of portfolioItem.lots) {
        if (sharesToSell <= 0) {
            remainingLots.push(lot);
            continue;
        }

        const gainOrLoss = (currentPrice - lot.purchasePrice) * Math.min(lot.shares, sharesToSell);
        const holdingPeriod = (new Date(state.time).getTime() - new Date(lot.purchaseTime).getTime()) / (1000 * 3600 * 24);
        
        if (holdingPeriod > TAX_CONSTANTS.LONG_TERM_HOLDING_PERIOD) {
            investor.waAnnualNetLTCG += gainOrLoss;
        }

        if (lot.shares <= sharesToSell) {
            sharesToSell -= lot.shares;
        } else {
            remainingLots.push({ ...lot, shares: lot.shares - sharesToSell });
            sharesToSell = 0;
        }
    }
    
    if(remainingLots.length > 0) {
        portfolioItem.lots = remainingLots;
    } else {
        investor.portfolio = investor.portfolio.filter(p => p.symbol !== symbol);
    }

    return state;
};
