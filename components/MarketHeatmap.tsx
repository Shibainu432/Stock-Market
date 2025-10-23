import React, { useMemo, useState, useEffect } from 'react';
import { StockListData } from '../types';

interface HeatmapCellProps {
  node: any; // D3 node
  onSelectStock: (symbol: string) => void;
}

const getColorForChange = (changePercent: number): string => {
  // Use a non-linear scale to make smaller changes more visually distinct.
  // Full color intensity is reached at +/- 5% change.
  const maxChange = 0.05;
  const clamped = Math.max(-maxChange, Math.min(maxChange, changePercent));
  
  // Apply a square root scale to the normalized value to make color changes
  // more apparent for smaller percentage shifts.
  const signedMagnitude = Math.sign(clamped) * Math.sqrt(Math.abs(clamped / maxChange));

  // If the change is negligible, use a neutral dark grey.
  if (Math.abs(signedMagnitude) < 0.1) {
    return 'hsl(0, 0%, 20%)';
  }

  if (signedMagnitude > 0) { // Green scale for positive changes
    const lightness = 30 + signedMagnitude * 20; // Lightness: 30% -> 50%
    const saturation = 60 + signedMagnitude * 40; // Saturation: 60% -> 100%
    return `hsl(135, ${saturation}%, ${lightness}%)`;
  } else { // Red scale for negative changes
    const absMagnitude = Math.abs(signedMagnitude);
    const lightness = 30 + absMagnitude * 20; // Lightness: 30% -> 50%
    const saturation = 75 + absMagnitude * 25; // Saturation: 75% -> 100%
    return `hsl(0, ${saturation}%, ${lightness}%)`;
  }
};


const HeatmapCell: React.FC<HeatmapCellProps> = ({ node, onSelectStock }) => {
  const stock = node.data as StockListData;
  const { x0, y0, x1, y1 } = node;

  const width = x1 - x0;
  const height = y1 - y0;
  const area = width * height;
  const smallerDim = Math.min(width, height);

  const bgColor = getColorForChange(stock.changePercent);
  
  // Dynamically calculate font sizes based on cell dimensions for better fit.
  // Use 'px' for precise control.
  const symbolFontSize = Math.max(10, Math.min(28, smallerDim * 0.3));
  const changeFontSize = Math.max(9, symbolFontSize * 0.8);

  // Show more information in larger cells.
  const showName = width > 100 && height > 50;
  const showPrice = area > 3000 && width > 50;
  const showChange = area > 200;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${y0}px`,
        left: `${x0}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      className="p-0.5 box-border cursor-pointer group"
      onClick={() => onSelectStock(stock.symbol)}
    >
      <div
        style={{ backgroundColor: bgColor }}
        className="w-full h-full flex flex-col justify-center items-center text-white p-1 rounded-sm text-center overflow-hidden transition-all duration-200 ease-in-out group-hover:scale-[1.03] group-hover:z-10 group-hover:shadow-2xl group-hover:shadow-black/50"
      >
        <p className="font-bold" style={{ fontSize: `${symbolFontSize}px`, lineHeight: 1.1 }}>{stock.symbol}</p>
        {showName && <p className="opacity-80 truncate px-1" style={{ fontSize: `${symbolFontSize * 0.6}px`, lineHeight: 1.2 }}>{stock.name}</p>}
        {showChange && (
            <p className="font-mono mt-1" style={{ fontSize: `${changeFontSize}px`, lineHeight: 1.1 }}>
                {stock.changePercent >= 0 ? '+' : ''}{(stock.changePercent * 100).toFixed(2)}%
            </p>
        )}
        {showPrice && <p className="opacity-70 font-mono" style={{ fontSize: `${changeFontSize * 0.9}px`, lineHeight: 1.2 }}>${stock.price.toFixed(2)}</p>}
      </div>
    </div>
  );
};


const MarketHeatmap: React.FC<{
  stocks: StockListData[];
  onSelectStock: (symbol: string) => void;
}> = ({ stocks, onSelectStock }) => {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const treemapLayout = useMemo(() => {
    if (containerSize.width === 0 || !(window as any).d3) return [];
    
    const d3 = (window as any).d3;

    const root = d3.hierarchy({ children: stocks })
      .sum((d: any) => d.marketCap)
      .sort((a: any, b: any) => b.value - a.value);

    const treemap = d3.treemap()
      .size([containerSize.width, containerSize.height])
      .padding(2); 

    return treemap(root).leaves();
  }, [stocks, containerSize]);

  if (stocks.length === 0) {
    return (
        <div className="text-center p-10 text-gray-500">
            No stocks to display for the current selection.
        </div>
    );
  }

  return (
    <div className="w-full relative" style={{ paddingTop: '60%' }}>
      <div className="absolute inset-0" ref={containerRef}>
        {treemapLayout.map((node: any) => (
          <HeatmapCell
            key={node.data.symbol}
            node={node}
            onSelectStock={onSelectStock}
          />
        ))}
      </div>
    </div>
  );
};

export default MarketHeatmap;