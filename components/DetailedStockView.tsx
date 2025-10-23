import React, { useState, useMemo } from 'react';
import { Stock, Investor } from '../types';
import PlayerTradeControls from './PlayerTradeControls';
import NeuralNetworkVisualizer from './NeuralNetworkVisualizer';
import CandlestickChart from './CandlestickChart';

const formatVolume = (volume: number): string => {
    if (volume > 1_000_000) return `${(volume / 1_000_000).toFixed(2)}M`;
    if (volume > 1_000) return `${(volume / 1_000).toFixed(1)}K`;
    return new Intl.NumberFormat().format(volume);
}

const StatItem: React.FC<{label: string, value: string | number}> = ({label, value}) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-700 text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="font-mono text-gray-200 font-semibold">{value}</span>
    </div>
)

type TimeRange = '1D' | '1W' | '1M' | '1Y' | '5Y' | 'MAX';

const TimeRangeButton: React.FC<{label: TimeRange, activeRange: TimeRange, onClick: (range: TimeRange) => void}> = ({ label, activeRange, onClick }) => (
    <button 
        onClick={() => onClick(label)}
        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
            activeRange === label ? 'bg-accent text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        }`}
    >
        {label}
    </button>
);

const DetailedStockView: React.FC<{
  stock: Stock;
  onClose: () => void;
  player?: Investor | null;
  onPlayerBuy?: (symbol: string, shares: number) => void;
  onPlayerSell?: (symbol: string, shares: number) => void;
}> = ({ stock, onClose, player, onPlayerBuy, onPlayerSell }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  
  if (!stock) return null;

  const currentHistory = stock.history[stock.history.length - 1];
  const prevHistory = stock.history[stock.history.length - 2];
  if (!currentHistory || !prevHistory) return null;

  const currentPrice = currentHistory.close;
  const prevPrice = prevHistory.close;
  const volume = currentHistory.volume;

  const change = currentPrice - prevPrice;
  const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;
  const isUp = change >= 0;
  const changeColorClass = isUp ? 'text-gain' : 'text-loss';

  const high52w = stock.history.slice(-252).reduce((max, p) => Math.max(max, p.high), 0);
  const low52w = stock.history.slice(-252).reduce((min, p) => Math.min(min, p.low), Infinity);

  const chartData = useMemo(() => {
    const history = stock.history;
    switch (timeRange) {
        case '1D': return history.slice(-2); // Show last 2 days to get a single line/candle of change
        case '1W': return history.slice(-7);
        case '1M': return history.slice(-30);
        case '1Y': return history.slice(-252);
        case '5Y': return history.slice(-252 * 5);
        case 'MAX': return history;
        default: return history.slice(-252);
    }
  }, [stock.history, timeRange]);

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 w-full max-w-5xl rounded-lg border border-gray-700 shadow-2xl my-auto animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 md:p-6 border-b border-gray-700 flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-gray-200 flex items-center gap-3">
                    {stock.name} <span className="text-xl text-gray-400">({stock.symbol})</span>
                </h2>
                <p className="text-sm text-gray-400">{stock.sector} Sector</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-3xl font-light">&times;</button>
        </div>
        
        <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="mb-2">
                    <p className="text-4xl font-bold text-gray-200 font-mono">{currentPrice.toFixed(2)}</p>
                    <div className={`text-xl font-semibold ${changeColorClass} flex items-center gap-3 font-mono`}>
                        <span>{isUp ? '+' : ''}{change.toFixed(2)}</span>
                        <span>({isUp ? '+' : ''}{changePercent.toFixed(2)}%)</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                    {(['1D', '1W', '1M', '1Y', '5Y', 'MAX'] as TimeRange[]).map(range => (
                        <TimeRangeButton key={range} label={range} activeRange={timeRange} onClick={setTimeRange} />
                    ))}
                </div>

                <div className="h-96 w-full">
                    <CandlestickChart data={chartData} />
                </div>
              </div>

              <div className="lg:col-span-1 space-y-6">
                {player && onPlayerBuy && onPlayerSell && (
                  <PlayerTradeControls 
                      stock={stock} 
                      player={player} 
                      onBuy={onPlayerBuy}
                      onSell={onPlayerSell}
                  />
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-200 mb-2">Statistics</h3>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <StatItem label="Volume" value={formatVolume(volume)} />
                    <StatItem label="Open" value={currentHistory.open.toFixed(2)} />
                    <StatItem label="High" value={currentHistory.high.toFixed(2)} />
                    <StatItem label="Low" value={currentHistory.low.toFixed(2)} />
                    <StatItem label="52-Week High" value={high52w.toFixed(2)} />
                    <StatItem label="52-Week Low" value={low52w.toFixed(2)} />
                  </div>
                </div>
              </div>
            </div>
             <div className="mt-6">
                <h3 className="text-lg font-bold text-gray-200 mb-2">Corporate AI Neural Network</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <NeuralNetworkVisualizer title="Split Logic (Input Avg. Strength)" weights={stock.corporateAI.splitNN.getInputLayerWeights()} />
                    <NeuralNetworkVisualizer title="Alliance Logic (Input Avg. Strength)" weights={stock.corporateAI.allianceNN.getInputLayerWeights()} />
                    <NeuralNetworkVisualizer title="Acquisition Logic (Input Avg. Strength)" weights={stock.corporateAI.acquisitionNN.getInputLayerWeights()} />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedStockView;