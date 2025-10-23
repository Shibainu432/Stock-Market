import React from 'react';

interface NeuronBarProps {
    name: string;
    weight: number;
    maxWeight: number;
}

const NeuronBar: React.FC<NeuronBarProps> = ({ name, weight, maxWeight }) => {
    const isPositive = weight > 0;
    const widthPercent = (Math.abs(weight) / maxWeight) * 100;

    const barClass = isPositive ? 'bg-gain' : 'bg-loss';
    const nameParts = name.split('_');
    const category = nameParts[0];
    const detail = nameParts.slice(1).join('_').replace('_contrarian', ' (C)');

    return (
        <div className="text-xs mb-1.5" title={`Weight: ${weight.toFixed(3)}`}>
            <div className="flex justify-between items-center mb-0.5">
                <div className="truncate font-mono text-gray-400">
                    <span className="font-semibold text-gray-200 capitalize">{category}</span>:{detail}
                </div>
                <div className={`font-mono font-semibold ${isPositive ? 'text-gain' : 'text-loss'}`}>
                    {weight.toFixed(2)}
                </div>
            </div>
            <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                <div className={barClass} style={{ width: `${widthPercent}%` }}></div>
            </div>
        </div>
    );
};


interface NeuralNetworkVisualizerProps {
    title: string;
    weights: Record<string, number>;
}

const NeuralNetworkVisualizer: React.FC<NeuralNetworkVisualizerProps> = ({ title, weights }) => {
    // Fix: Cast the result of Object.entries to resolve a TypeScript type inference
    // issue where values were inferred as 'unknown'. This ensures proper typing
    // for all subsequent chained methods.
    const sortedWeights = (Object.entries(weights) as [string, number][])
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

    const maxWeight = Math.max(...sortedWeights.map(([, weight]) => Math.abs(weight)), 1);

    return (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
             <h4 className="text-sm font-bold text-gray-200 mb-2">{title}</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {sortedWeights.length > 0 ? sortedWeights.map(([name, weight]) => (
                    <NeuronBar key={name} name={name} weight={weight} maxWeight={maxWeight} />
                )) : <p className="text-xs text-gray-500">No active neurons.</p>}
            </div>
        </div>
    );
};

export default NeuralNetworkVisualizer;