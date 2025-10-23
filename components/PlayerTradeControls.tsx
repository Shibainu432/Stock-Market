import React, { useState, useMemo } from 'react';
import { Stock, Investor, PortfolioItem } from '../types';

interface PlayerTradeControlsProps {
    stock: Stock;
    player: Investor;
    onBuy: (symbol: string, shares: number) => void;
    onSell: (symbol: string, shares: number) => void;
}

const getSharesOwned = (player: Investor, symbol: string): number => {
    const item = player.portfolio.find(p => p.symbol === symbol);
    if (!item) return 0;
    return item.lots.reduce((sum, lot) => sum + lot.shares, 0);
};

const PlayerTradeControls: React.FC<PlayerTradeControlsProps> = ({ stock, player, onBuy, onSell }) => {
    const [shares, setShares] = useState('');

    const sharesOwned = useMemo(() => getSharesOwned(player, stock.symbol), [player, stock.symbol]);
    const currentPrice = stock.history[stock.history.length - 1]?.close || 0;
    
    const numShares = parseFloat(shares) || 0;
    const totalCost = numShares * currentPrice;

    const canBuy = player.cash >= totalCost && totalCost > 0;
    const canSell = sharesOwned >= numShares && numShares > 0;

    const handleBuy = () => {
        if (!canBuy) return;
        onBuy(stock.symbol, numShares);
        setShares('');
    };

    const handleSell = () => {
        if (!canSell) return;
        onSell(stock.symbol, numShares);
        setShares('');
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-200 mb-4">Trade {stock.symbol}</h3>
            
            <div className="text-xs text-gray-400 space-y-1 mb-4">
                <div className="flex justify-between">
                    <span>Your Cash:</span>
                    <span className="font-mono text-gray-200">{formatCurrency(player.cash)}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Shares Owned:</span>
                    <span className="font-mono text-gray-200">{sharesOwned.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Market Price:</span>
                    <span className="font-mono text-gray-200">{formatCurrency(currentPrice)}</span>
                </div>
            </div>
            
            <div className="space-y-4 mt-auto">
                <div>
                    <label htmlFor="shares" className="block text-sm font-medium text-gray-300 mb-1">Shares</label>
                    <input
                        type="number"
                        id="shares"
                        value={shares}
                        onChange={(e) => setShares(e.target.value)}
                        placeholder="0.00"
                        className="bg-gray-900 border border-gray-600 rounded-md w-full px-3 py-2 text-white font-mono text-right focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                </div>

                <div className="text-center text-sm text-gray-400">
                    <span>Total: </span>
                    <span className="font-mono font-semibold text-gray-200">{formatCurrency(totalCost)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleBuy}
                        disabled={!canBuy}
                        className="w-full px-4 py-2 rounded-md font-semibold text-white bg-gain/90 hover:bg-gain disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                        Buy
                    </button>
                    <button
                        onClick={handleSell}
                        disabled={!canSell}
                        className="w-full px-4 py-2 rounded-md font-semibold text-white bg-loss/90 hover:bg-loss disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                        Sell
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlayerTradeControls;