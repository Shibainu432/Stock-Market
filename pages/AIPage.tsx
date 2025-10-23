import React from 'react';
import { Investor, Stock } from '../types';
import InvestorCard from '../components/InvestorCard';

interface AIPageProps {
    investors: Investor[];
    stocks: Stock[];
    searchQuery: string;
}

const AIPage: React.FC<AIPageProps> = ({ investors, stocks, searchQuery }) => {
    const pageTitle = searchQuery ? `Search Results for "${searchQuery}"` : "AI Investors";
    const pageDescription = searchQuery
        ? `Showing AI investors matching your search.`
        : "Track the performance and portfolios of all AI investors in the simulation.";

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-200">{pageTitle}</h1>
                <p className="text-gray-400">{pageDescription}</p>
            </div>
            {investors.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {investors.map(investor => (
                        <InvestorCard 
                            key={investor.id} 
                            investor={investor} 
                            stocks={stocks} 
                            isHuman={false} 
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-800 rounded-md border border-gray-700">
                    <p className="text-gray-400">No AI investors found matching your search.</p>
                </div>
            )}
        </div>
    );
};

export default AIPage;