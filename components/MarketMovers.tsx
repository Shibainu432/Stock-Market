import React, { useMemo } from 'react';
import { Stock } from '../types';

interface MoverStock extends Stock {
  changePercent: number;
}

const MarketMoverItem: React.FC<{stock: MoverStock, onSelect: (symbol: string) => void}> = ({ stock, onSelect }) => (
    <div onClick={() => onSelect(stock.symbol)} className="flex justify-between items-center text-sm py-1 cursor-pointer hover:bg-gray-700/50 px-2 rounded">
        <span className="font-bold">{stock.symbol}</span>
        <span className="font-mono">{stock.history[stock.history.length - 1].close.toFixed(2)}</span>
        <span className={`font-mono font-semibold ${stock.changePercent >= 0 ? 'text-gain' : 'text-loss'}`}>{stock.changePercent.toFixed(2)}%</span>
    </div>
);

interface MarketMoversProps {
    stocks: Stock[];
    onSelectStock: (symbol: string) => void;
}

const MarketMovers: React.FC<MarketMoversProps> = ({ stocks, onSelectStock }) => {
    const { gainers, losers } = useMemo(() => {
        if (!stocks) return { gainers: [], losers: [] };

        const stocksWithChange = stocks.map(stock => {
            const currentPrice = stock.history[stock.history.length - 1]?.close || 0;
            const prevPrice = stock.history[stock.history.length - 2]?.close || 0;
            const changePercent = prevPrice !== 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;
            return { ...stock, changePercent };
        }).sort((a, b) => b.changePercent - a.changePercent);

        return {
            gainers: stocksWithChange.slice(0, 5),
            losers: stocksWithChange.slice(-5).reverse(),
        };
    }, [stocks]);

    return (
        <div className="bg-gray-800 rounded-md p-3 border border-gray-700">
            <h3 className="font-bold text-white mb-2 text-base">Top Gainers</h3>
            <div className="space-y-1 mb-4">
                {gainers.map(stock => <MarketMoverItem key={stock.symbol} stock={stock} onSelect={onSelectStock} />)}
            </div>
            <h3 className="font-bold text-white mb-2 text-base">Top Losers</h3>
            <div className="space-y-1">
                {losers.map(stock => <MarketMoverItem key={stock.symbol} stock={stock} onSelect={onSelectStock} />)}
            </div>
        </div>
    );
};

export default MarketMovers;