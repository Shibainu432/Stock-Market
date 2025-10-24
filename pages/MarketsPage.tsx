
import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
    const [sortConfig, setSortConfig] = useState<{ key: keyof StockListData; direction: 'asc' | 'desc' } | null>(null);
    
    useEffect(() => {
        // Whenever the active tab changes, reset the column sort configuration.
        // This ensures each tab starts with its default sort order.
        setSortConfig(null);
    }, [activeTab]);

    const handleSort = useCallback((key: keyof StockListData) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    }, [sortConfig]);

    const stocksWithMetrics = useMemo(() => {
        const regionalStocks = selectedRegion === 'Global'
            ? stocks
            : stocks.filter(s => s.region === selectedRegion);

        return regionalStocks.map(stock => {
            const history = stock.history;
            if (history.length < 2) return null;

            const current = history[history.length - 1];
            const prev = history[history.length - 2];

            const price = current.close;
            const volume = current.volume;
            const change = price - prev.close;
            const changePercent = prev.close > 0 ? (change / prev.close) : 0;

            const history52w = history.slice(-252);
            const high52w = history52w.length > 0 ? Math.max(...history52w.map(h => h.high)) : current.high;
            const low52w = history52w.length > 0 ? Math.min(...history52w.map(h => h.low)) : current.low;

            // A trending stock has high price movement (absolute change) and high volume.
            // We use the logarithm of volume to temper its effect and prevent outliers from dominating.
            const trendingScore = Math.abs(changePercent) * Math.log10(volume + 1);

            return {
                ...stock,
                price,
                change,
                changePercent,
                volume,
                marketCap: stock.sharesOutstanding * price,
                peRatio: stock.eps > 0 ? price / stock.eps : 0,
                high52w,
                low52w,
                trendingScore,
            };
        }).filter(Boolean) as StockListData[];
    }, [stocks, selectedRegion]);
    
    const displayData = useMemo(() => {
        let data: StockListData[] = stocksWithMetrics;
        
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            data = data.filter(stock =>
                stock.name.toLowerCase().includes(lowercasedQuery) ||
                stock.symbol.toLowerCase().includes(lowercasedQuery)
            );
        }

        const sortedData = [...data];

        if (viewMode === 'heatmap') {
            sortedData.sort((a,b) => b.marketCap - a.marketCap);
        } else if (viewMode === 'table') {
            if (sortConfig) {
                sortedData.sort((a, b) => {
                    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                });
            } else {
                // Apply default sort for the active tab
                switch (activeTab) {
                    case 'active': sortedData.sort((a, b) => b.volume - a.volume); break;
                    case 'trending': sortedData.sort((a, b) => b.trendingScore - a.trendingScore); break;
                    case 'gainers': sortedData.sort((a, b) => b.changePercent - a.changePercent); break;
                    case 'losers': sortedData.sort((a, b) => a.changePercent - b.changePercent); break;
                    case '52w_high': sortedData.sort((a, b) => (b.price / b.high52w) - (a.price / a.high52w)); break;
                    case '52w_low': sortedData.sort((a, b) => (a.price / a.low52w) - (b.price / b.low52w)); break;
                    default: sortedData.sort((a, b) => b.marketCap - a.marketCap); break;
                }
            }
        }

        return sortedData;
    }, [stocksWithMetrics, searchQuery, sortConfig, viewMode, activeTab]);

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
                            onClick={() => setActiveTab(tab.key)}
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
                        stocks={displayData}
                        onSelectStock={onSelectStock}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                    />
                ) : (
                    <MarketHeatmap
                        stocks={displayData}
                        onSelectStock={onSelectStock}
                    />
                )}
             </div>
        </div>
    );
};

export default MarketsPage;
