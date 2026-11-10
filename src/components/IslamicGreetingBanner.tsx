import React, { useEffect } from 'react';
import { X, Sparkles, HeartHandshake } from 'lucide-react';
import { HoopoMascot } from './HoopoMascot';

interface IslamicGreetingBannerProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export const IslamicGreetingBanner: React.FC<IslamicGreetingBannerProps> = ({
  isVisible,
  onDismiss,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-xl animate-in fade-in slide-in-from-top-6 duration-300 pointer-events-auto"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/95 via-emerald-950/90 to-slate-900/95 border border-emerald-500/40 p-4 sm:p-5 shadow-2xl shadow-emerald-900/40 backdrop-blur-xl">
        {/* Glow pill */}
        <div className="absolute -left-12 -top-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <HoopoMascot size="sm" mood="greeting" isFlapping={true} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                Islamic Travel Blessing
              </span>
              <span className="text-xs text-amber-300 font-arabic font-bold">فِي أَمَانِ الله</span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5 mt-0.5">
              <span>Fi Amanillah &bull; As-salamu Alaykum!</span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 mt-0.5 leading-snug">
              May Allah keep your path protected and guide you home safely. Hoopo is onboard as your travel companion!
            </p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            aria-label="Dismiss Greeting"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress indicator bar */}
        <div className="mt-3 w-full bg-slate-800/60 rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-7000 ease-linear"
            style={{ width: '100%', animation: 'shrink 7s linear forwards' }}
          />
        </div>
      </div>
    </div>
  );
};
