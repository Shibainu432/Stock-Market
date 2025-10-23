import React from 'react';
import { ActiveEvent } from '../types';
import { getDateFromDay, formatDate } from '../utils/dateUtils';

interface NewsCardProps {
    event: ActiveEvent;
    startDate: string;
    onSelect: (id: string) => void;
    featured?: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({ event, startDate, onSelect, featured }) => {
    const source = event.stockName ? `${event.stockName} (${event.stockSymbol})` : 'Macroeconomic';
    const eventDate = getDateFromDay(event.day, startDate);

    if (featured) {
        return (
            <div 
                onClick={() => onSelect(event.id)}
                className="relative h-full w-full rounded-md overflow-hidden group cursor-pointer"
            >
                <img 
                    src={event.imageUrl} 
                    alt={event.headline} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4 md:p-6 text-white">
                    <p className="text-xs uppercase font-semibold tracking-wider text-accent mb-1">{source}</p>
                    <h3 className="font-bold text-xl md:text-2xl text-gray-100 leading-tight group-hover:underline">
                        {event.headline}
                    </h3>
                </div>
            </div>
        );
    }
    
    return (
        <div 
            onClick={() => onSelect(event.id)}
            className="flex flex-col h-full bg-gray-800 rounded-md overflow-hidden group cursor-pointer border border-gray-700 hover:border-accent/50 transition-colors"
        >
             {event.imageUrl && (
                <div className="w-full h-32 flex-shrink-0">
                    <img 
                        src={event.imageUrl} 
                        alt={event.headline} 
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <div className="flex-grow flex flex-col p-4">
                <p className="text-xs text-gray-500 mb-1">{source}</p>
                <h3 className="font-semibold text-base text-gray-100 mb-2 leading-tight flex-grow group-hover:underline">
                    {event.headline}
                </h3>
                <p className="text-xs text-gray-400 mt-auto">{formatDate(eventDate)}</p>
            </div>
        </div>
    );
};

export default NewsCard;