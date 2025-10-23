import React, { useState, useMemo, useCallback } from 'react';
import { Stock, StockListData, Region } from '../types';
import StockMarketTable from '../components/StockMarketTable';
import MarketHeatmap from '../components/MarketHeatmap';

type MarketListType = 'active' | 'trending' | 'gainers' | 'losers' | '52w_high' | '52w_low';
type ViewMode = 'table' | 'heatmap';

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

const ViewModeToggle: React.FC<{ viewMode: ViewMode; setViewMode: (mode: ViewMode) => void }> = ({ viewMode, setViewMode }) => (
    <div className="flex items-center bg-gray-900 rounded-md p-0.5">
        <button 
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewMode === 'table' ? 'bg-accent text-white' : 'text-gray-400 hover:bg-gray-700'}`}
        >
            Table
        </button>
        <button
            onClick={() => setViewMode('heatmap')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewMode === 'heatmap' ? 'bg-accent text-white' : 'text-gray-400 hover:bg-gray-700'}`}
        >
            Heatmap
        </button>
    </div>
);

const RegionFilter: React.FC<{ selectedRegion: Region | 'Global'; onSelectRegion: (region: Region | 'Global') => void }> = ({ selectedRegion, onSelectRegion }) => {
    const regions: (Region | 'Global')[] = ['Global', 'North America', 'Europe', 'Asia'];
    return (
        <div className="flex items-center bg-gray-900 rounded-md p-0.5">
            {regions.map(region => (
                <button
                    key={region}
                    onClick={() => onSelectRegion(region)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${selectedRegion === region ? 'bg-accent text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                >
                    {region}
                </button>
            ))}
        </div>
    );
};


const MarketsPage: React.FC<{
    stocks: Stock[];
    onSelectStock: (symbol: string) => void;
    searchQuery: string;
}> = ({ stocks, onSelectStock, searchQuery }) => {
    const [activeTab, setActiveTab] = useState<MarketListType>('active');
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [selectedRegion, setSelectedRegion] = useState<Region | 'Global'>('Global');
    const [sortConfig, setSortConfig] = useState<{ key: keyof StockListData; direction: 'asc' | 'desc' } | null>({ key: 'marketCap', direction: 'desc'});
    
    const handleSort = useCallback((key: keyof StockListData) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    }, [sortConfig]);

    const marketData = useMemo(() => {
        const regionalStocks = selectedRegion === 'Global' 
            ? stocks
            : stocks.filter(s => s.region === selectedRegion);

        const stocksWithMetrics = regionalStocks.map(stock => {
            const history = stock.history;
            const current = history[history.length - 1];
            const prev = history[history.length - 2];
            if (!current || !prev) return null;

            const change = current.close - prev.close;
            const changePercent = prev.close > 0 ? (change) / prev.close : 0;
            
            const history52w = history.slice(-252);
            const high52w = Math.max(...history52w.map(h => h.high));
            const low52w = Math.min(...history52w.map(h => h.low));

            const history5d = history.slice(-5);
            const prices5d = history5d.map(h => h.close);
            const avgPrice5d = prices5d.length > 0 ? prices5d.reduce((a, b) => a + b, 0) / prices5d.length : 0;
            const volatility5d = prices5d.length > 0 && avgPrice5d > 0 ? Math.sqrt(prices5d.map(p => Math.pow(p - avgPrice5d, 2)).reduce((a,b)=>a+b,0) / prices5d.length) / avgPrice5d : 0;
            
            const volumes5d = history5d.map(h => h.volume);
            const avgVolume5d = volumes5d.length > 0 ? volumes5d.reduce((a, b) => a + b, 0) / volumes5d.length : 0;
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
            '52w_high': [...stocksWithMetrics].sort((a, b) => (b.price / b.high52w) - (a.price / a.low52w)),
            '52w_low': [...stocksWithMetrics].sort((a, b) => (a.price / a.low52w) - (b.price / b.low52w)),
        };

        return data;
    }, [stocks, selectedRegion]);
    
    const sortedAndFilteredData = useMemo(() => {
        let data = marketData[activeTab] || [];
        
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            data = data.filter(stock =>
                stock.name.toLowerCase().includes(lowercasedQuery) ||
                stock.symbol.toLowerCase().includes(lowercasedQuery)
            );
        }

        if (viewMode === 'table' && sortConfig !== null) {
            data.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        } else if (viewMode === 'heatmap') {
            data.sort((a,b) => b.marketCap - a.marketCap);
        }

        return data;
    }, [marketData, activeTab, searchQuery, sortConfig, viewMode]);

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
                <h1 className="text-2xl font-bold text-gray-200">{`${selectedRegion} ${pageTitle}`}</h1>
                <p className="text-gray-400">Explore market data from different perspectives.</p>
            </div>

            <div className="border-b border-gray-700 mb-4 flex justify-between items-center flex-wrap gap-2">
                <nav className="-mb-px flex space-x-2" aria-label="Tabs">
                    {TABS.map(tab => (
                        <MarketTab
                            key={tab.key}
                            label={tab.label}
                            active={activeTab === tab.key}
                            onClick={() => {
                                setActiveTab(tab.key);
                                setSortConfig(viewMode === 'table' ? { key: 'marketCap', direction: 'desc'} : null);
                            }}
                        />
                    ))}
                </nav>
                <div className="flex items-center gap-2">
                     <RegionFilter selectedRegion={selectedRegion} onSelectRegion={setSelectedRegion} />
                     <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
                </div>
            </div>
            
             <div className="bg-gray-800 rounded-md border border-gray-700">
                {viewMode === 'table' ? (
                    <StockMarketTable
                        stocks={sortedAndFilteredData}
                        onSelectStock={onSelectStock}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                    />
                ) : (
                    <MarketHeatmap
                        stocks={sortedAndFilteredData}
                        onSelectStock={onSelectStock}
                    />
                )}
             </div>
        </div>
    );
};

export default MarketsPage;