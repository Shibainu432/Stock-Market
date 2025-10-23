import React, { useState, useEffect } from 'react';

interface PortfolioDonutChartProps {
  data: { name: string; value: number }[];
}

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#F59E0B'];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const value = data.value;
      return (
        <div className="bg-black/50 backdrop-blur-sm p-2 border border-white/10 rounded-md">
          <p className="label text-sm font-semibold" style={{color: payload[0].fill}}>{`${data.name}`}</p>
          <p className="text-xs text-gray-200/80">{`Value: $${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</p>
        </div>
      );
    }
  
    return null;
  };
  

const PortfolioDonutChart: React.FC<PortfolioDonutChartProps> = ({ data }) => {
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
    
    const validData = data.filter(item => item.value > 0.01);

    if (!rechartsLoaded) {
        return <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Loading chart...</div>;
    }

    const Recharts = (window as any).Recharts;

    if (validData.length === 0) {
      return <div className="flex items-center justify-center h-full text-xs text-gray-500">No holdings</div>;
    }

    const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = Recharts;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
                <Pie
                    data={validData}
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="85%"
                    fill="#8884d8"
                    paddingAngle={validData.length > 1 ? 5 : 0}
                    dataKey="value"
                    isAnimationActive={false}
                    stroke="none"
                >
                    {validData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );
};

export default PortfolioDonutChart;