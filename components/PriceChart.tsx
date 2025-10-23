import React, { useState, useEffect } from 'react';
import { SimplePriceDataPoint } from '../types';

interface PriceChartProps {
  data: SimplePriceDataPoint[];
  color: string;
  precision?: number;
}

const CustomTooltip = ({ active, payload, label, precision }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/50 backdrop-blur-sm p-2 border border-white/10 rounded-md">
          <p className="label text-xs text-gray-400">{`Day: ${label}`}</p>
          <p className="intro text-sm font-semibold" style={{ color: payload[0].color }}>
            {`$${payload[0].value.toFixed(precision ?? 2)}`}
          </p>
        </div>
      );
    }
  
    return null;
  };
  

const PriceChart: React.FC<PriceChartProps> = ({ data, color, precision }) => {
  const [rechartsLoaded, setRechartsLoaded] = useState(false);

  useEffect(() => {
    if ((window as any).Recharts) {
      setRechartsLoaded(true);
      return;
    }

    const interval = setInterval(() => {
      if ((window as any).Recharts) {
        setRechartsLoaded(true);
        clearInterval(interval);
      }
    }, 100);

    const timeout = setTimeout(() => {
        clearInterval(interval);
    }, 5000); // Stop polling after 5 seconds

    return () => {
        clearInterval(interval);
        clearTimeout(timeout);
    };
  }, []);

  if (!rechartsLoaded) {
      return <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Loading chart...</div>;
  }
  
  const Recharts = (window as any).Recharts;
  
  const { LineChart, Line, YAxis, Tooltip, ResponsiveContainer } = Recharts;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <Tooltip content={<CustomTooltip precision={precision} />} wrapperStyle={{ outline: 'none' }}/>
        <YAxis domain={['dataMin', 'dataMax']} hide={true} />
        <Line
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PriceChart;