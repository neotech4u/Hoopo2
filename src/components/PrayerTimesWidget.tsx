import React, { useState } from 'react';
import { Compass, Clock, MapPin, ChevronRight, X, Calendar } from 'lucide-react';
import { PrayerTime } from '../utils/companionLogic';

interface PrayerTimesWidgetProps {
  prayers: PrayerTime[];
  currentPrayer: PrayerTime | null;
  nextPrayer: PrayerTime;
  minutesRemaining: number;
  qiblaBearing?: number;
  onLocateNearestMosque: () => void;
}

export const PrayerTimesWidget: React.FC<PrayerTimesWidgetProps> = ({
  prayers,
  currentPrayer,
  nextPrayer,
  minutesRemaining,
  qiblaBearing = 114,
  onLocateNearestMosque,
}) => {
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  const formatCountdown = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m remaining`;
  };

  return (
    <div
      className="relative flex flex-col justify-between w-full h-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-3.5 shadow-xl text-slate-100"
      aria-label="Upcoming Islamic Prayer Time Widget"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Upcoming Prayer
            </h3>
            <span className="text-[10px] text-emerald-400 font-medium">
              Next Salah On Route
            </span>
          </div>
        </div>

        {/* Qibla Direction Pill */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[10px] font-bold text-emerald-300">
          <Compass className="w-3 h-3 text-emerald-400" />
          <span>Qibla {Math.round(qiblaBearing)}°</span>
        </div>
      </div>

      {/* Focused Single Upcoming Prayer Display */}
      <div className="my-2 p-3 bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-900 rounded-xl border border-emerald-500/30 flex items-center justify-between shadow-inner">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {nextPrayer.name}
            </span>
            <span className="text-lg font-arabic text-emerald-400">
              {nextPrayer.arabicName}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span>Enters at <strong className="text-slate-200 font-mono">{nextPrayer.time}</strong></span>
            {currentPrayer && (
              <span className="text-[10px] text-slate-500">&bull; Current: {currentPrayer.name}</span>
            )}
          </div>
        </div>

        {/* Countdown Pill */}
        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 text-xs font-extrabold animate-pulse">
            <Clock className="w-3 h-3" />
            <span>{formatCountdown(minutesRemaining)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Actions: Musalla Routing + View Full Schedule toggle */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setShowFullSchedule(true)}
          className="text-[11px] text-slate-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
        >
          <Calendar className="w-3 h-3 text-slate-500" />
          <span>Full Times</span>
        </button>

        <button
          type="button"
          onClick={onLocateNearestMosque}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/50 text-[11px] font-bold text-emerald-300 transition-colors"
          aria-label="Route to nearest prayer area"
        >
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span>Route to Musalla</span>
        </button>
      </div>

      {/* Optional Full Schedule Modal Popup (when clicked) */}
      {showFullSchedule && (
        <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md rounded-2xl p-3 flex flex-col justify-between border border-slate-700 animate-in fade-in">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Full Prayer Schedule
            </span>
            <button
              type="button"
              onClick={() => setShowFullSchedule(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 my-2 overflow-y-auto max-h-36">
            {prayers.map((p) => {
              const isNext = p.name === nextPrayer.name;
              return (
                <div
                  key={p.name}
                  className={`p-1.5 rounded-lg border text-xs flex items-center justify-between ${
                    isNext
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  <span className="font-mono text-[11px] text-slate-400">{p.time}</span>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowFullSchedule(false)}
            className="w-full py-1 text-center text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200"
          >
            Close Schedule
          </button>
        </div>
      )}
    </div>
  );
};
