import React, { useState, useMemo, useCallback } from 'react';
import { Stock, StockListData } from '../types';
import StockMarketTable from '../components/StockMarketTable';

type MarketListType = 'active' | 'trending' | 'gainers' | 'losers' | '52w_high' | '52w_low';

const MarketTab: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2
            ${active 
                ? 'text-accent border-accent' 
                : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-500'
            }`}
    >
        {label}
    </button>
);

const MarketsPage: React.FC<{
    stocks: Stock[];
    onSelectStock: (symbol: string) => void;
    searchQuery: string;
}> = ({ stocks, onSelectStock, searchQuery }) => {
    const [activeTab, setActiveTab] = useState<MarketListType>('active');
    const [sortConfig, setSortConfig] = useState<{ key: keyof StockListData; direction: 'asc' | 'desc' } | null>({ key: 'marketCap', direction: 'desc'});
    
    const handleSort = useCallback((key: keyof StockListData) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    }, [sortConfig]);

    const marketData = useMemo(() => {
        const stocksWithMetrics = stocks.map(stock => {
            const history = stock.history;
            const current = history[history.length - 1];
            const prev = history[history.length - 2];
            if (!current || !prev) return null;

            const change = current.close - prev.close;
            const changePercent = (change) / prev.close;
            
            const history52w = history.slice(-252);
            const high52w = Math.max(...history52w.map(h => h.high));
            const low52w = Math.min(...history52w.map(h => h.low));

            const history5d = history.slice(-5);
            const prices5d = history5d.map(h => h.close);
            const avgPrice5d = prices5d.reduce((a, b) => a + b, 0) / prices5d.length;
            const volatility5d = Math.sqrt(prices5d.map(p => Math.pow(p - avgPrice5d, 2)).reduce((a,b)=>a+b,0) / prices5d.length) / avgPrice5d;
            
            const volumes5d = history5d.map(h => h.volume);
            const avgVolume5d = volumes5d.reduce((a, b) => a + b, 0) / volumes5d.length;
            const volumeSpike = avgVolume5d > 0 ? current.volume / avgVolume5d : 1;

            const trendingScore = volatility5d * volumeSpike;

            return {
                ...stock,
                price: current.close,
                change,
                changePercent,
                volume: current.volume,
                marketCap: stock.sharesOutstanding * current.close,
                peRatio: stock.eps > 0 ? current.close / stock.eps : 0,
                high52w,
                low52w,
                trendingScore,
            };
        }).filter(Boolean) as StockListData[];

        const data: Record<MarketListType, StockListData[]> = {
            active: [...stocksWithMetrics].sort((a, b) => b.volume - a.volume),
            trending: [...stocksWithMetrics].sort((a, b) => b.trendingScore - a.trendingScore),
            gainers: [...stocksWithMetrics].sort((a, b) => b.changePercent - a.changePercent).slice(0, 50),
            losers: [...stocksWithMetrics].sort((a, b) => a.changePercent - b.changePercent).slice(0, 50),
            '52w_high': [...stocksWithMetrics].sort((a, b) => (b.price / b.high52w) - (a.price / a.high52w)),
            '52w_low': [...stocksWithMetrics].sort((a, b) => (a.price / a.low52w) - (b.price / b.low52w)),
        };

        return data;
    }, [stocks]);
    
    const sortedAndFilteredData = useMemo(() => {
        let data = marketData[activeTab] || [];
        
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            data = data.filter(stock =>
                stock.name.toLowerCase().includes(lowercasedQuery) ||
                stock.symbol.toLowerCase().includes(lowercasedQuery)
            );
        }

        if (sortConfig !== null) {
            data.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return data;
    }, [marketData, activeTab, searchQuery, sortConfig]);

    const TABS: { key: MarketListType; label: string }[] = [
        { key: 'active', label: 'Most Active' },
        { key: 'trending', label: 'Trending' },
        { key: 'gainers', label: 'Top Gainers' },
        { key: 'losers', label: 'Top Losers' },
        { key: '52w_high', label: 'Near 52-Wk High' },
        { key: '52w_low', label: 'Near 52-Wk Low' },
    ];
    
    const pageTitle = TABS.find(t => t.key === activeTab)?.label || "Markets";
    
    return (
        <div>
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-200">{pageTitle}</h1>
                <p className="text-gray-400">Explore market data from different perspectives.</p>
            </div>

            <div className="border-b border-gray-700 mb-4">
                <nav className="-mb-px flex space-x-2" aria-label="Tabs">
                    {TABS.map(tab => (
                        <MarketTab
                            key={tab.key}
                            label={tab.label}
                            active={activeTab === tab.key}
                            onClick={() => {
                                setActiveTab(tab.key);
                                // Reset sort when changing tabs for clarity
                                setSortConfig(null);
                            }}
                        />
                    ))}
                </nav>
            </div>
            
             <div className="bg-gray-800 rounded-md border border-gray-700">
                <StockMarketTable
                    stocks={sortedAndFilteredData}
                    onSelectStock={onSelectStock}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                />
             </div>
        </div>
    );
};

export default MarketsPage;