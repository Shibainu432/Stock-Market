import React, { useState, useEffect } from 'react';
import { OHLCDataPoint } from '../types';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isUp = data.close >= data.open;
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm p-2 border border-gray-600 rounded-md text-xs">
        <p className="label text-gray-400 mb-1">{`Day: ${label}`}</p>
        <div className="grid grid-cols-2 gap-x-2">
            <span className="font-semibold">Open:</span> <span className="font-mono text-right">{data.open.toFixed(2)}</span>
            <span className="font-semibold">High:</span> <span className="font-mono text-right">{data.high.toFixed(2)}</span>
            <span className="font-semibold">Low:</span> <span className="font-mono text-right">{data.low.toFixed(2)}</span>
            <span className="font-semibold">Close:</span> <span className="font-mono text-right">{data.close.toFixed(2)}</span>
            <span className="font-semibold">Volume:</span> <span className="font-mono text-right">{data.volume.toLocaleString()}</span>
        </div>
        <div className={`mt-1 pt-1 border-t border-gray-600 ${isUp ? 'text-gain' : 'text-loss'}`}>
            <div className="flex justify-between font-semibold">
                <span>Change:</span>
                <span className="font-mono">{isUp ? '+' : ''}{(data.close - data.open).toFixed(2)}</span>
            </div>
        </div>
      </div>
    );
  }
  return null;
};

const CandlestickChart: React.FC<{ data: OHLCDataPoint[] }> = ({ data }) => {
    const [rechartsLoaded, setRechartsLoaded] = useState(false);

    useEffect(() => {
        const checkRecharts = () => {
            if ((window as any).Recharts) {
                setRechartsLoaded(true);
                return true;
            }
            return false;
        };

        if (checkRecharts()) return;

        const interval = setInterval(() => {
            if (checkRecharts()) {
                clearInterval(interval);
            }
        }, 100);

        const timeout = setTimeout(() => clearInterval(interval), 5000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, []);

    if (!rechartsLoaded) {
        return <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Loading chart...</div>;
    }

    if (data.length < 2) {
        return <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Not enough data for this time range.</div>;
    }
  
    const { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = (window as any).Recharts;

    const dataMin = Math.min(...data.map(d => d.low));
    const dataMax = Math.max(...data.map(d => d.high));
  
    const theme = {
        gain: '#22c55e',
        loss: '#ef4444',
        accent: '#3B82F6',
        'gray-600': '#4B5563',
        'gray-800': '#1F2937',
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
                data={data}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
                <defs>
                    <linearGradient id="colorGain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.gain} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={theme.gain} stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke={theme['gray-600']} tick={{ fontSize: 12 }} />
                <YAxis 
                    stroke={theme['gray-600']} 
                    domain={[dataMin * 0.95, dataMax * 1.05]} 
                    orientation="right" 
                    tickFormatter={(val) => `$${Number(val).toFixed(2)}`}
                    tick={{ fontSize: 12 }}
                />
                <CartesianGrid strokeDasharray="3 3" stroke={theme['gray-800']} />
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }}/>

                <Bar dataKey={['low', 'high']} shape={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    const { open, close, high, low } = payload;
                    
                    if (typeof open !== 'number' || typeof close !== 'number' || typeof high !== 'number' || typeof low !== 'number') {
                        return null;
                    }

                    const isUp = close >= open;
                    const fill = isUp ? theme.gain : theme.loss;
                    const stroke = isUp ? theme.gain : theme.loss;
                    
                    const range = high - low;

                    const y_open = y + (range > 0 ? ((high - open) / range) * height : 0);
                    const y_close = y + (range > 0 ? ((high - close) / range) * height : 0);

                    const body_y = Math.min(y_open, y_close);
                    const body_height = Math.max(1, Math.abs(y_open - y_close));

                    return (
                        <g>
                            {/* Wick */}
                            <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + height} stroke={stroke} strokeWidth={1} />
                            {/* Body */}
                            <rect x={x} y={body_y} width={width} height={body_height} fill={fill} />
                        </g>
                    );
                }}/>
                <Area type="monotone" dataKey="close" stroke={theme.accent} fill="url(#colorGain)" fillOpacity={0.1} strokeWidth={2} dot={false} isAnimationActive={false} />
            </ComposedChart>
        </ResponsiveContainer>
    );
};

export default CandlestickChart;