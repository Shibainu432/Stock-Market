
import React from 'react';
import { ICONS, SIMULATION_SPEEDS } from '../constants';

interface SimulationControlsProps {
  isRunning: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onResetWithRealData: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({ isRunning, onPlayPause, onReset, onResetWithRealData, speed, onSpeedChange }) => {
  const baseButtonClass = "p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-accent/50";
  const iconButtonClass = "text-gray-200 hover:bg-gray-700";
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <button onClick={onPlayPause} className={`${baseButtonClass} ${iconButtonClass}`} title="Play/Pause">
          {isRunning ? ICONS.pause : ICONS.play}
        </button>
        <button onClick={onReset} className={`${baseButtonClass} ${iconButtonClass}`} title="Reset to Random Simulation">
          {ICONS.reset}
        </button>
        <button onClick={onResetWithRealData} className={`${baseButtonClass} ${iconButtonClass}`} title="Reset with Real Market Data">
          {ICONS.resetReal}
        </button>
      </div>
      <div className="h-6 w-px bg-gray-700"></div>
      <div className="flex items-center gap-1 flex-wrap">
      {SIMULATION_SPEEDS.map(({ label, steps }) => (
        <button
          key={label}
          onClick={() => onSpeedChange(steps)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-accent/50 ${
            speed === steps 
            ? 'bg-accent text-white' 
            : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
      </div>
    </div>
  );
};

export default SimulationControls;
