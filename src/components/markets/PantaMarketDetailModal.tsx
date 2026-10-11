import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { ValticsPredictionMarket } from '../../types/panta';
import { PantaMarketDetailView } from './PantaMarketDetailView';

interface PantaMarketDetailModalProps {
  market: ValticsPredictionMarket | null;
  onClose: () => void;
}

export const PantaMarketDetailModal: React.FC<PantaMarketDetailModalProps> = ({
  market,
  onClose,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!market) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#05051a] border border-[rgba(138,32,255,0.35)] rounded-2xl p-4 sm:p-8 shadow-2xl text-[#F5F5F7]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-20">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-[#080821] hover:bg-[#100126] border border-[rgba(138,32,255,0.25)] text-[#A7A7B8] hover:text-[#F5F5F7] transition-colors cursor-pointer"
            title="Close details modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <PantaMarketDetailView
          market={market}
          onBack={onClose}
        />
      </div>
    </div>
  );
};
