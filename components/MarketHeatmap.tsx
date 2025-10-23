import React, { useMemo } from 'react';
import { StockListData } from '../types';

interface HeatmapCellProps {
  stock: StockListData;
  x: number;
  y: number;
  width: number;
  height: number;
  onSelectStock: (symbol: string) => void;
}

const getColorForChange = (changePercent: number): string => {
  const percentage = Math.max(-0.05, Math.min(0.05, changePercent)) / 0.05;
  if (percentage >= 0) {
    const lightness = 40 - (percentage * 15);
    const saturation = 80 + (percentage * 20);
    return `hsl(145, ${saturation}%, ${lightness}%)`;
  } else {
    const lightness = 40 - (Math.abs(percentage) * 15);
    const saturation = 85 + (Math.abs(percentage) * 15);
    return `hsl(0, ${saturation}%, ${lightness}%)`;
  }
};

const HeatmapCell: React.FC<HeatmapCellProps> = ({ stock, x, y, width, height, onSelectStock }) => {
  const bgColor = getColorForChange(stock.changePercent);
  const area = width * height;
  const fontSize = Math.max(8, Math.min(16, Math.sqrt(area) / 12));

  return (
    <div
      style={{
        position: 'absolute',
        top: `${y}%`,
        left: `${x}%`,
        width: `${width}%`,
        height: `${height}%`,
        fontSize: `${fontSize}px`,
      }}
      className="p-1 overflow-hidden border-2 border-gray-800 cursor-pointer group transition-transform hover:scale-[1.02] hover:z-10"
      onClick={() => onSelectStock(stock.symbol)}
    >
      <div style={{ backgroundColor: bgColor }} className="w-full h-full flex flex-col justify-center items-center text-white p-1 rounded-sm text-center">
        <p className="font-bold truncate">{stock.symbol}</p>
        {fontSize > 11 && <p className="text-xs opacity-80 truncate">{stock.name}</p>}
        <p className="font-mono mt-1">
          {stock.changePercent >= 0 ? '+' : ''}{(stock.changePercent * 100).toFixed(2)}%
        </p>
      </div>
    </div>
  );
};

const generateTreemapLayout = (stocks: StockListData[], x: number, y: number, width: number, height: number): any[] => {
  if (stocks.length === 0) return [];
  if (stocks.length === 1) return [{ ...stocks[0], x, y, width, height }];

  const totalValue = stocks.reduce((sum, s) => sum + s.marketCap, 0);
  let sum = 0;
  let splitIndex = 0;
  for (let i = 0; i < stocks.length; i++) {
    sum += stocks[i].marketCap;
    if (sum >= totalValue / 2) {
      splitIndex = i + 1;
      break;
    }
  }

  const groupA = stocks.slice(0, splitIndex);
  const groupB = stocks.slice(splitIndex);
  const groupAValue = groupA.reduce((s, item) => s + item.marketCap, 0);
  const ratio = groupAValue / totalValue;

  if (width > height) {
    const widthA = width * ratio;
    const widthB = width - widthA;
    return [
      ...generateTreemapLayout(groupA, x, y, widthA, height),
      ...generateTreemapLayout(groupB, x + widthA, y, widthB, height)
    ];
  } else {
    const heightA = height * ratio;
    const heightB = height - heightA;
    return [
      ...generateTreemapLayout(groupA, x, y, width, heightA),
      ...generateTreemapLayout(groupB, x, y + heightA, width, heightB)
    ];
  }
};

const MarketHeatmap: React.FC<{
  stocks: StockListData[];
  onSelectStock: (symbol: string) => void;
}> = ({ stocks, onSelectStock }) => {
  const treemapLayout = useMemo(() => {
    const validStocks = stocks.filter(s => s.marketCap > 0).sort((a,b) => b.marketCap - a.marketCap);
    return generateTreemapLayout(validStocks, 0, 0, 100, 100);
  }, [stocks]);

  if (stocks.length === 0) {
    return (
        <div className="text-center p-10 text-gray-500">
            No stocks to display for the current selection.
        </div>
    );
  }

  return (
    <div className="w-full relative" style={{ paddingTop: '60%' }}>
      <div className="absolute inset-0 p-1">
        {treemapLayout.map((node) => (
          <HeatmapCell
            key={node.symbol}
            stock={node}
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            onSelectStock={onSelectStock}
          />
        ))}
      </div>
    </div>
  );
};

export default MarketHeatmap;