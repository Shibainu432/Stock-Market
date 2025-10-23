
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SimulationState, Stock, Investor, Page } from './types';
import { initializeState, advanceTime, playerBuyStock, playerSellStock } from './services/simulationService';
import { SIMULATION_SPEEDS } from './constants';
import DetailedStockView from './components/DetailedStockView';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import PortfolioPage from './pages/PortfolioPage';
import MarketsPage from './pages/MarketsPage';
import AIPage from './pages/AIPage';
import NewsDetailView from './components/NewsDetailView';

const App: React.FC = () => {
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(SIMULATION_SPEEDS[6].steps);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<Page>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const intervalRef = useRef<number | null>(null);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    const initialState = initializeState();
    setSimulationState(initialState);
  }, []);

  useEffect(() => {
    handleReset();
  }, [handleReset]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        try {
          setSimulationState(prevState => {
            if (!prevState) return null;
            return advanceTime(prevState, speed);
          });
        } catch (error) {
          console.error("Error advancing simulation time:", error);
          // The simulation will attempt to run again on the next interval
          // and won't crash the entire application due to a single error.
        }
      }, 1000); // Run the simulation loop every 1 second.
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, speed]);

  const handlePlayPause = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);
  
  const handleSelectStock = useCallback((symbol: string) => {
    setSelectedStockSymbol(symbol);
  }, []);

  const handleCloseDetailView = useCallback(() => {
      setSelectedStockSymbol(null);
  }, []);

  const handleSelectEvent = useCallback((id: string) => {
    setSelectedEventId(id);
  }, []);

  const handleCloseNewsDetailView = useCallback(() => {
    setSelectedEventId(null);
  }, []);

  const handleNavigate = useCallback((page: Page) => {
      setActivePage(page);
  }, []);

  const handlePlayerBuy = useCallback((symbol: string, shares: number) => {
    if (!simulationState) return;
    const newState = playerBuyStock(simulationState, 'human-player', symbol, shares);
    setSimulationState(newState);
  }, [simulationState]);
  
  const handlePlayerSell = useCallback((symbol: string, shares: number) => {
      if (!simulationState) return;
      const newState = playerSellStock(simulationState, 'human-player', symbol, shares);
      setSimulationState(newState);
  }, [simulationState]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);


  const activeStocks = useMemo(() => simulationState?.stocks.filter(s => !s.isDelisted) || [], [simulationState?.stocks]);

  const filteredStocks = useMemo(() => {
    if (!searchQuery) return activeStocks;
    const lowercasedQuery = searchQuery.toLowerCase();
    return activeStocks.filter(stock => 
      stock.name.toLowerCase().includes(lowercasedQuery) ||
      stock.symbol.toLowerCase().includes(lowercasedQuery)
    );
  }, [activeStocks, searchQuery]);

  const filteredInvestors = useMemo(() => {
    if (!searchQuery || !simulationState) return simulationState?.investors.filter(i => !i.isHuman) || [];
    const lowercasedQuery = searchQuery.toLowerCase();
    return simulationState.investors.filter(investor =>
      !investor.isHuman && investor.name.toLowerCase().includes(lowercasedQuery)
    );
  }, [simulationState, searchQuery]);
  
  const selectedStock = useMemo(() => 
      selectedStockSymbol 
          ? activeStocks.find(s => s.symbol === selectedStockSymbol) 
          : null,
      [selectedStockSymbol, activeStocks]
  );
  
  const selectedEvent = useMemo(() => 
      selectedEventId 
          ? simulationState?.eventHistory.find(e => e.id === selectedEventId) 
          : null,
      [selectedEventId, simulationState?.eventHistory]
  );

  const humanPlayer = useMemo(() =>
      simulationState?.investors.find(inv => inv.isHuman),
      [simulationState?.investors]
  );

  const renderActivePage = () => {
    if (!simulationState) return null;

    switch(activePage) {
        case 'home':
            return <HomePage 
                eventHistory={simulationState.eventHistory}
                stocks={activeStocks}
                onSelectStock={handleSelectStock}
                onSelectEvent={handleSelectEvent}
                day={simulationState.day}
                startDate={simulationState.startDate}
            />
        case 'portfolio':
            return <PortfolioPage 
                player={humanPlayer!}
                stocks={activeStocks}
                onSelectStock={handleSelectStock}
            />
        case 'markets':
            // FIX: Removed unsupported `marketHistory` prop. The MarketsPage component
            // does not accept this prop, which was causing a type error.
            return <MarketsPage 
                stocks={filteredStocks}
                onSelectStock={handleSelectStock}
                searchQuery={searchQuery}
            />;
        case 'aii':
            return <AIPage
                investors={filteredInvestors}
                stocks={simulationState.stocks}
                searchQuery={searchQuery}
            />
        default:
            return <HomePage 
                eventHistory={simulationState.eventHistory}
                stocks={activeStocks}
                onSelectStock={handleSelectStock}
                onSelectEvent={handleSelectEvent}
                day={simulationState.day}
                startDate={simulationState.startDate}
            />
    }
  }


  if (!simulationState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-gray-200">
        Loading Simulation...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-gray-200 font-sans">
       <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
      <Header
        activePage={activePage}
        onNavigate={handleNavigate}
        simulationState={simulationState}
        isRunning={isRunning}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        speed={speed}
        onSpeedChange={handleSpeedChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />
      
      <main className="max-w-screen-2xl mx-auto p-2 md:p-4">
        {renderActivePage()}
      </main>

      {selectedStock && <DetailedStockView 
        stock={selectedStock} 
        onClose={handleCloseDetailView}
        player={humanPlayer}
        onPlayerBuy={handlePlayerBuy}
        onPlayerSell={handlePlayerSell}
      />}

      {selectedEvent && <NewsDetailView
        event={selectedEvent}
        onClose={handleCloseNewsDetailView}
      />}

       <footer className="text-center mt-8 pb-4 text-xs text-gray-600">
          <p>Disclaimer: This is a fictional simulation and does not represent real financial advice.</p>
      </footer>
    </div>
  );
};

export default App;
