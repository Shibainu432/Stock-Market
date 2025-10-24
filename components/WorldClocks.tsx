
import React from 'react';
import { Region } from '../types';
import WorldClock from './WorldClock';

interface WorldClocksProps {
    count: number;
    time: Date;
}

interface ClockConfig {
    label: string;
    region?: Region;
    timeZone: string;
}

const ALL_CLOCKS: ClockConfig[] = [
    { label: 'New York', region: 'North America', timeZone: 'America/New_York' },
    { label: 'London', region: 'Europe', timeZone: 'Europe/London' },
    { label: 'Tokyo', region: 'Asia', timeZone: 'Asia/Tokyo' },
    { label: 'UTC', timeZone: 'UTC' },
];

const WorldClocks: React.FC<WorldClocksProps> = ({ count, time }) => {
    const clocksToShow = ALL_CLOCKS.slice(0, count);

    return (
        <div className="flex items-center gap-4">
            {clocksToShow.map(clock => (
                <WorldClock
                    key={clock.label}
                    label={clock.label}
                    region={clock.region}
                    timeZone={clock.timeZone}
                    date={time}
                />
            ))}
        </div>
    );
};

export default WorldClocks;
