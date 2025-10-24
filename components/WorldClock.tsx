
import React from 'react';
import { Region } from '../types';
import { isMarketOpen } from '../services/simulationService';
import { formatTime } from '../utils/dateUtils';

interface WorldClockProps {
    label: string;
    region?: Region;
    timeZone: string;
    date: Date;
}

const WorldClock: React.FC<WorldClockProps> = ({ label, region, timeZone, date }) => {
    const isOpen = region ? isMarketOpen(date, region) : false;
    const timeString = formatTime(date, timeZone);

    return (
        <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
                <p className="font-semibold text-gray-200">{label}</p>
                <p className="font-mono text-gray-400">{timeString}</p>
            </div>
            {region && (
                <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-gain animate-pulse' : 'bg-loss'}`} title={isOpen ? 'Market Open' : 'Market Closed'}></div>
            )}
        </div>
    );
};

export default WorldClock;
