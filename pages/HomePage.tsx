import React from 'react';
import { ActiveEvent, Stock } from '../types';
import NewsCard from '../components/NewsCard';
import MarketMovers from '../components/MarketMovers';

interface HomePageProps {
    eventHistory: ActiveEvent[];
    stocks: Stock[];
    onSelectStock: (symbol: string) => void;
    onSelectEvent: (id: string) => void;
    day: number;
    startDate: string;
}

const HomePage: React.FC<HomePageProps> = ({ eventHistory, stocks, onSelectStock, onSelectEvent, startDate }) => {
    const gridItems = eventHistory.slice(0, 9); // Limit to 9 for a clean grid

    const getGridClasses = (index: number): string => {
        switch (index) {
            case 0: return 'md:col-span-2 md:row-span-2'; // Featured item
            case 3: return 'md:col-span-2'; // Wide item
            default: return ''; // Standard item
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <main className="col-span-1 lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-200 mb-4">Market News</h2>
                {gridItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{gridAutoRows: 'minmax(200px, auto)'}}>
                        {gridItems.map((event, index) => (
                           <div key={event.id} className={getGridClasses(index)}>
                                <NewsCard 
                                    event={event} 
                                    startDate={startDate} 
                                    onSelect={onSelectEvent} 
                                    featured={index === 0}
                                />
                           </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-800 rounded-md border border-gray-700">
                        <p className="text-gray-400">No news yet. Let the simulation run to generate events.</p>
                    </div>
                )}
            </main>
            <aside className="col-span-1">
                <h2 className="text-2xl font-bold text-gray-200 mb-4">Daily Movers</h2>
                <MarketMovers stocks={stocks} onSelectStock={onSelectStock} />
            </aside>
        </div>
    );
};

export default HomePage;