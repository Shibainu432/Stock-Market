import React from 'react';
import { Page, SimulationState, SimplePriceDataPoint } from '../types';
import SimulationControls from './SimulationControls';
import { formatDateTime } from '../utils/dateUtils';
import LanguageSelector from './LanguageSelector';

interface HeaderProps {
    activePage: Page;
    onNavigate: (page: Page) => void;
    simulationState: SimulationState;
    isRunning: boolean;
    onPlayPause: () => void;
    onReset: () => void;
    speed: number;
    onSpeedChange: (speed: number) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

const NavItem: React.FC<{ label: string, page: Page, activePage: Page, onNavigate: (page: Page) => void }> = ({ label, page, activePage, onNavigate }) => {
    const isActive = activePage === page;
    return (
        <button 
            onClick={() => onNavigate(page)}
            className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors relative ${
                isActive ? 'text-gray-200' : 'text-gray-400 hover:text-gray-200'
            }`}
        >
            {label}
            {isActive && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full"></div>}
        </button>
    );
};

const MarketTicker: React.FC<{label: string, history: SimplePriceDataPoint[]}> = ({ label, history }) => {
    if (history.length < 2) return null;
    const last = history[history.length - 1].price;
    const prev = history[history.length - 2].price;
    const change = last - prev;
    const changePercent = prev > 0 ? (change / prev) * 100 : 0;
    const isUp = change >= 0;

    return (
        <div className="text-xs border-l border-gray-700 pl-4">
            <span className="font-semibold text-gray-400">{label}</span>
            <div className="flex items-center gap-2">
                <span className="font-mono text-gray-200 text-sm">{last.toFixed(2)}</span>
                <span className={`font-mono text-sm ${isUp ? 'text-gain' : 'text-loss'}`}>
                    {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{changePercent.toFixed(2)}%)
                </span>
            </div>
        </div>
    )
}

const Header: React.FC<HeaderProps> = (props) => {
    const { activePage, onNavigate, simulationState, searchQuery, onSearchChange } = props;
    const currentDate = new Date(simulationState.time);

    return (
        <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-40">
            <div className="max-w-screen-2xl mx-auto p-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-gray-200">NeuralNet Finance</h1>
                        <div className="hidden lg:block">
                            <MarketTicker label="Market Index" history={simulationState.marketIndexHistory} />
                        </div>
                    </div>

                    <div className="flex-1 px-8 hidden md:block">
                         <input 
                            type="text" 
                            placeholder="Search stocks or AI investors..." 
                            className="bg-gray-800 border border-gray-700 rounded-md w-full max-w-lg mx-auto block px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                         />
                    </div>

                    <div className="flex items-center gap-4">
                         <div className="text-xs text-gray-400 text-right hidden lg:block font-mono">
                            <div>{formatDateTime(currentDate)}</div>
                            <div className="text-gray-500">NeuralNet Market Time</div>
                        </div>
                        <SimulationControls
                            isRunning={props.isRunning}
                            onPlayPause={props.onPlayPause}
                            onReset={props.onReset}
                            speed={props.speed}
                            onSpeedChange={props.onSpeedChange}
                        />
                        <div className="h-6 w-px bg-gray-700"></div>
                        <LanguageSelector />
                    </div>
                </div>
            </div>
             <div className="max-w-screen-2xl mx-auto border-t border-gray-700">
                <nav className="flex items-center gap-2 px-2">
                    <NavItem label="Home" page="home" activePage={activePage} onNavigate={onNavigate} />
                    <NavItem label="My Portfolio" page="portfolio" activePage={activePage} onNavigate={onNavigate} />
                    <NavItem label="Markets" page="markets" activePage={activePage} onNavigate={onNavigate} />
                    <NavItem label="AI Investors" page="aii" activePage={activePage} onNavigate={onNavigate} />
                </nav>
             </div>
        </header>
    );
};

export default Header;
