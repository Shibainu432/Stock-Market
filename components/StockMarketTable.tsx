import React from 'react';
import { StockListData } from '../types';
import PriceChart from './PriceChart';

type SortableHeaderProps = {
    label: string;
    sortKey: keyof StockListData;
    onSort: (key: keyof StockListData) => void;
    sortConfig: { key: keyof StockListData; direction: 'asc' | 'desc' } | null;
    className?: string;
};

const SortableHeader: React.FC<SortableHeaderProps> = ({ label, sortKey, onSort, sortConfig, className }) => {
    const isSorted = sortConfig?.key === sortKey;
    const directionIcon = sortConfig?.direction === 'asc' ? '▲' : '▼';

    return (
        <th scope="col" className={`px-4 py-3 cursor-pointer ${className}`} onClick={() => onSort(sortKey)}>
            <div className="flex items-center justify-end">
                {label}
                <span className="text-gray-500 ml-1.5 w-3">
                    {isSorted && directionIcon}
                </span>
            </div>
        </th>
    );
};

interface StockMarketTableProps {
    stocks: StockListData[];
    onSelectStock: (symbol: string) => void;
    sortConfig: { key: keyof StockListData; direction: 'asc' | 'desc' } | null;
    onSort: (key: keyof StockListData) => void;
}

const formatLargeNumber = (num: number): string => {
    if (num >= 1_000_000_000_000) return `${(num / 1_000_000_000_000).toFixed(2)}T`;
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
};

const StockMarketTable: React.FC<StockMarketTableProps> = ({ stocks, onSelectStock, sortConfig, onSort }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs text-gray-400 uppercase bg-gray-900/50">
                    <tr>
                        <th scope="col" className="px-4 py-3 cursor-pointer" onClick={() => onSort('symbol')}>Symbol</th>
                        <th scope="col" className="px-4 py-3">Name</th>
                        <th scope="col" className="px-4 py-3 text-center">Chart (30d)</th>
                        <SortableHeader label="Price" sortKey="price" sortConfig={sortConfig} onSort={onSort} />
                        <SortableHeader label="Change" sortKey="change" sortConfig={sortConfig} onSort={onSort} />
                        <SortableHeader label="% Change" sortKey="changePercent" sortConfig={sortConfig} onSort={onSort} />
                        <SortableHeader label="Volume" sortKey="volume" sortConfig={sortConfig} onSort={onSort} />
                        <SortableHeader label="Market Cap" sortKey="marketCap" sortConfig={sortConfig} onSort={onSort} />
                        <SortableHeader label="P/E Ratio" sortKey="peRatio" sortConfig={sortConfig} onSort={onSort} />
                    </tr>
                </thead>
                <tbody>
                    {stocks.length > 0 ? (
                        stocks.map(stock => {
                            const isUp = stock.change >= 0;
                            const changeColor = isUp ? 'text-gain' : 'text-loss';
                            const chartColor = isUp ? '#22c55e' : '#ef4444';
                            const chartData = stock.history.slice(-30).map(h => ({ day: h.day, price: h.close }));

                            return (
                                <tr 
                                    key={stock.symbol} 
                                    onClick={() => onSelectStock(stock.symbol)} 
                                    className="bg-gray-800 border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer"
                                >
                                    <td className="px-4 py-2 font-bold text-accent hover:underline">{stock.symbol}</td>
                                    <td className="px-4 py-2 text-gray-300 truncate max-w-xs">{stock.name}</td>
                                    <td className="px-4 py-2">
                                        <div className="h-8 w-24 mx-auto">
                                            <PriceChart data={chartData} color={chartColor} />
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 font-mono text-right text-gray-200">{stock.price.toFixed(2)}</td>
                                    <td className={`px-4 py-2 font-mono text-right ${changeColor}`}>{isUp ? '+' : ''}{stock.change.toFixed(2)}</td>
                                    <td className={`px-4 py-2 font-mono text-right font-semibold ${changeColor}`}>{isUp ? '+' : ''}{(stock.changePercent * 100).toFixed(2)}%</td>
                                    <td className="px-4 py-2 font-mono text-right text-gray-300">{formatLargeNumber(stock.volume)}</td>
                                    <td className="px-4 py-2 font-mono text-right text-gray-300">{formatLargeNumber(stock.marketCap)}</td>
                                    <td className="px-4 py-2 font-mono text-right text-gray-300">{stock.peRatio > 0 ? stock.peRatio.toFixed(2) : 'N/A'}</td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={9} className="text-center p-10 text-gray-500">
                                No stocks to display for the current selection.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default StockMarketTable;