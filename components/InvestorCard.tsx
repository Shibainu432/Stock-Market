import React, { useMemo } from 'react';
import { Investor, PortfolioItem, Stock, HyperComplexInvestorStrategy } from '../types';
import PortfolioDonutChart from './PortfolioDonutChart';
import PriceChart from './PriceChart';
import NeuralNetworkVisualizer from './NeuralNetworkVisualizer';

interface InvestorCardProps {
  investor: Investor;
  stocks: Stock[];
  isHuman?: boolean;
}

const getSharesOwned = (item: PortfolioItem | undefined): number => {
    if (!item) return 0;
    return item.lots.reduce((sum, lot) => sum + lot.shares, 0);
};

const InvestorCard: React.FC<InvestorCardProps> = ({ investor, stocks, isHuman }) => {
  const portfolioValue = investor.portfolio.reduce((total, item) => {
    const stock = stocks.find(s => s.symbol === item.symbol);
    const price = stock ? stock.history[stock.history.length - 1].close : 0;
    return total + getSharesOwned(item) * price;
  }, 0);
  
  const totalValue = investor.cash + portfolioValue;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  const portfolioForChart = [
      { name: 'Cash', value: investor.cash },
      ...investor.portfolio.map(item => {
        const stock = stocks.find(s => s.symbol === item.symbol);
        const price = stock ? stock.history[stock.history.length - 1].close : 0;
        return {
          name: item.symbol,
          value: getSharesOwned(item) * price,
        };
      })
  ];

  const strategy = investor.strategy as HyperComplexInvestorStrategy;
  
  const deepNetworkVisuals = useMemo(() => {
    if (strategy.strategyType === 'hyperComplex' && strategy.network) {
        // The network class provides visualization-friendly data directly
        const inputToH1Weights = strategy.network.getInputLayerWeights ? strategy.network.getInputLayerWeights() : {};
        const lastHiddenToOutputWeights = strategy.network.getOutputLayerWeights ? strategy.network.getOutputLayerWeights() : {};
        
        return { inputToH1Weights, lastHiddenToOutputWeights };
    }
    return null;
  }, [strategy]);


  return (
    <div className="bg-gray-800 border border-gray-700 p-3 rounded-md flex flex-col text-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-gray-200 truncate text-base flex items-center gap-2">
              {investor.name}
              {isHuman && <span className="text-xs bg-accent text-white font-bold py-0.5 px-2 rounded-full">YOU</span>}
          </h3>
          {!isHuman && investor.strategyName && (
              <p className="text-xs text-accent">{investor.strategyName}</p>
          )}
        </div>
        <p className="font-mono font-semibold text-gray-200 text-right">{formatCurrency(totalValue)}</p>
      </div>
      
      <div className="h-16 mb-2">
        <PriceChart data={investor.portfolioHistory.map(p => ({ day: p.day, price: p.value }))} color="#3B82F6" />
      </div>

      <div className="grid grid-cols-2 gap-2 items-center text-xs">
        <div className="h-20">
          <PortfolioDonutChart data={portfolioForChart} />
        </div>
        <div>
            <div className="space-y-0.5 max-h-20 overflow-y-auto pr-1">
                <div className="flex justify-between">
                    <span className="font-mono text-gain">CASH</span>
                    <span className="font-mono">{formatCurrency(investor.cash)}</span>
                </div>
                {investor.portfolio.map(item => ({
                    symbol: item.symbol,
                    shares: getSharesOwned(item)
                })).sort((a,b) => b.shares - a.shares).slice(0, 5).map(item => (
                    <div key={item.symbol} className="flex justify-between">
                        <span className="font-mono text-accent/80">{item.symbol}</span>
                        <span className="font-mono">{item.shares.toFixed(2)}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {!isHuman && strategy.strategyType === 'hyperComplex' && strategy.network && deepNetworkVisuals && (
        <div className="mt-2 pt-2 border-t border-gray-700 space-y-2">
             <p className="text-xs text-center font-bold text-accent/80 -mb-1">Deep Network ({strategy.network.layerSizes.length - 2} Hidden Layers)</p>
             <NeuralNetworkVisualizer title="Input ➔ H1 (Avg. Strength)" weights={deepNetworkVisuals.inputToH1Weights} />
             {Object.keys(deepNetworkVisuals.lastHiddenToOutputWeights).length > 0 && 
                <NeuralNetworkVisualizer title={`H${strategy.network.layerSizes.length - 2} ➔ Output`} weights={deepNetworkVisuals.lastHiddenToOutputWeights} />
             }
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-gray-700 text-xs space-y-0.5">
        <div className="flex justify-between items-center text-gray-400">
            <span>Taxes Paid:</span>
            <span className="font-mono text-gray-200/80">{formatCurrency(investor.totalTaxesPaid)}</span>
        </div>
        <div className="flex justify-between items-center text-gray-400">
            <span>Loss Carryforward:</span>
            <span className="font-mono text-gray-200/80">{formatCurrency(investor.taxLossCarryforward)}</span>
        </div>
      </div>

    </div>
  );
};

export default InvestorCard;