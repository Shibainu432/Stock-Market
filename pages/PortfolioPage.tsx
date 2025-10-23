import React from 'react';
import { Investor, Stock } from '../types';
import InvestorCard from '../components/InvestorCard';
import StockListItem from '../components/StockCard';

interface PortfolioPageProps {
    player: Investor;
    stocks: Stock[];
    onSelectStock: (symbol:string) => void;
}

const PortfolioPage: React.FC<PortfolioPageProps> = ({ player, stocks, onSelectStock }) => {
    const ownedSymbols = player.portfolio.map(p => p.symbol);
    const ownedStocks = stocks.filter(s => ownedSymbols.includes(s.symbol));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <aside className="col-span-1">
                <div className="sticky top-20">
                    <h2 className="text-2xl font-bold text-gray-200 mb-4">Your Portfolio</h2>
                    <InvestorCard investor={player} stocks={stocks} isHuman={true} />
                </div>
            </aside>
            <section className="col-span-1 lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-200 mb-4">My Holdings</h2>
                 <div className="bg-gray-800 rounded-md border border-gray-700">
                    <div className="grid grid-cols-12 gap-4 items-center px-4 py-2 border-b border-gray-700 text-xs text-gray-400 font-bold uppercase tracking-wider">
                        <div className="col-span-3">Name</div>
                        <div className="col-span-3">Chart (30d)</div>
                        <div className="col-span-2 text-right">Price</div>
                        <div className="col-span-2 text-right">% Change</div>
                        <div className="col-span-2 text-right">Volume</div>
                    </div>
                    <div>
                        {ownedStocks.length > 0 ? (
                            ownedStocks.map(stock => (
                                <StockListItem key={stock.symbol} stock={stock} onSelect={onSelectStock} />
                            ))
                        ) : (
                            <div className="text-center p-10 text-gray-500">
                                You do not own any stocks. Go to the Markets page to buy some.
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PortfolioPage;