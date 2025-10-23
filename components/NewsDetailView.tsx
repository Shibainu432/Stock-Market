import React from 'react';
import { ActiveEvent } from '../types';

const NewsDetailView: React.FC<{
  event: ActiveEvent;
  onClose: () => void;
}> = ({ event, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 w-full max-w-3xl rounded-lg border border-gray-700 shadow-2xl my-auto animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 md:p-6 border-b border-gray-700 flex justify-between items-start">
            <div>
                <h2 className="text-xl font-bold text-accent">NeuralNet News Desk</h2>
                <p className="text-sm text-gray-400">AI-Generated Market Report</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-3xl font-light">&times;</button>
        </div>
        
        <div className="p-4 md:p-6 max-h-[70vh] overflow-y-auto">
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-200 mb-4 leading-tight">{event.headline}</h3>
            
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap font-serif text-base">
                {event.fullText}
            </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetailView;