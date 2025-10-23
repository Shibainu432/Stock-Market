import React from 'react';
import { Stock } from '../types';
import PriceChart from './PriceChart';

interface StockListItemProps {
  stock: Stock;
  onSelect: (symbol: string) => void;
}

const formatVolume = (volume: number): string => {
    if (volume > 1_000_000) return `${(volume / 1_000_000).toFixed(2)}M`;
    if (volume > 1_000) return `${(volume / 1_000).toFixed(1)}K`;
    return volume.toString();
}

const StockListItem: React.FC<StockListItemProps> = ({ stock, onSelect }) => {
  const currentHistory = stock.history[stock.history.length - 1];
  const prevHistory = stock.history[stock.history.length - 2];

  if (!currentHistory || !prevHistory) return null; // Should not happen with initialized data

  const currentPrice = currentHistory.close;
  const prevPrice = prevHistory.close;
  const currentVolume = currentHistory.volume;
  const change = currentPrice - prevPrice;
  const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;

  const isUp = change >= 0;
  const changeColorClass = isUp ? 'text-gain' : 'text-loss';
  const chartColor = isUp ? '#22c55e' : '#ef4444';

  const chartData = stock.history.slice(-30).map(h => ({ day: h.day, price: h.close }));
  
  return (
    <div 
      onClick={() => onSelect(stock.symbol)}
      className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-b border-gray-700 last:border-b-0 hover:bg-gray-900/75 cursor-pointer transition-colors duration-150 text-sm"
    >
      <div className="col-span-3 truncate">
        <p className="font-bold text-gray-200">{stock.symbol}</p>
        <p className="text-xs text-gray-400 truncate">{stock.name}</p>
      </div>
      <div className="col-span-3 h-8">
         <PriceChart data={chartData} color={chartColor} />
      </div>
      <div className="col-span-2 text-right">
        <p className="font-mono text-gray-200">{currentPrice.toFixed(2)}</p>
      </div>
       <div className="col-span-2 text-right">
        <p className={`font-mono font-semibold ${changeColorClass}`}>
          {isUp ? '+' : ''}{changePercent.toFixed(2)}%
        </p>
      </div>
      <div className="col-span-2 text-right">
         <p className="font-mono text-gray-300">{formatVolume(currentVolume)}</p>
      </div>
    </div>
  );
};

export default StockListItem;