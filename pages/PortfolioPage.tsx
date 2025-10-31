
import React from 'react';
import { Investor, Stock, TaxJurisdiction } from '../types';
import InvestorCard from '../components/InvestorCard';
import StockListItem from '../components/StockCard';
import { TAX_REGIMES } from '../constants';

interface PortfolioPageProps {
    player: Investor;
    stocks: Stock[];
    onSelectStock: (symbol:string) => void;
    onJurisdictionChange: (jurisdiction: TaxJurisdiction) => void;
}

const PortfolioPage: React.FC<PortfolioPageProps> = ({ player, stocks, onSelectStock, onJurisdictionChange }) => {
    const ownedSymbols = player.portfolio.map(p => p.symbol);
    const ownedStocks = stocks.filter(s => ownedSymbols.includes(s.symbol));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <aside className="col-span-1">
                <div className="sticky top-20 space-y-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-200 mb-4">Your Portfolio</h2>
                        <InvestorCard investor={player} stocks={stocks} isHuman={true} />
                    </div>
                    <div className="bg-gray-800 rounded-md p-4 border border-gray-700">
                        <h3 className="text-lg font-bold text-gray-200 mb-3">Tax Jurisdiction</h3>
                        <p className="text-xs text-gray-400 mb-2">
                            Select your tax jurisdiction. This will be applied at the end of each simulated year.
                        </p>
                        <select
                            value={player.jurisdiction}
                            onChange={(e) => onJurisdictionChange(e.target.value as TaxJurisdiction)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                            {Object.keys(TAX_REGIMES).map(key => (
                                <option key={key} value={key}>
                                    {TAX_REGIMES[key as TaxJurisdiction].description.split('.')[0]} ({key})
                                </option>
                            ))}
                        </select>
                         <p className="text-xs text-gray-500 mt-2">
                            Current Rules: {TAX_REGIMES[player.jurisdiction].description}
                        </p>
                    </div>
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
