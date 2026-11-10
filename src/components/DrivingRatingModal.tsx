import React from 'react';
import {
  Award,
  Star,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Gauge,
  Clock,
  Route as RouteIcon,
  X,
  Share2,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { DrivingRating, TripLog } from '../utils/companionLogic';

interface DrivingRatingModalProps {
  isOpen: boolean;
  rating: DrivingRating;
  tripDistance: number;
  tripDurationSeconds: number;
  maxSpeedKmH: number;
  avgSpeedKmH: number;
  totalCO2Grams: number;
  idleSeconds: number;
  onClose: () => void;
  onStartNewRide: () => void;
}

export const DrivingRatingModal: React.FC<DrivingRatingModalProps> = ({
  isOpen,
  rating,
  tripDistance,
  tripDurationSeconds,
  maxSpeedKmH,
  avgSpeedKmH,
  totalCO2Grams,
  idleSeconds,
  onClose,
  onStartNewRide,
}) => {
  if (!isOpen) return null;

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    if (mins === 0) return `${remainder}s`;
    return `${mins}m ${remainder}s`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
    >
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-5 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header with Hoopoe Logo */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/40 bg-slate-900 shadow-md shadow-amber-500/20 shrink-0">
              <img
                src="/assets/aistudio/hoopoe_logo_bedb9b31.png"
                alt="Hoopoe Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Ride Completed &bull; الحمد لله
              </span>
              <h2 id="rating-title" className="text-base sm:text-lg font-extrabold text-white">
                Driving Performance Rating
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            aria-label="Close rating modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big Overall Score & Stars Banner */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
          <div className="flex items-center gap-4">
            {/* Circular Score Badge */}
            <div className="relative w-20 h-20 rounded-full border-4 border-emerald-500/80 bg-slate-950 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <span className="font-speed text-2xl font-black text-white leading-none">
                {rating.overallScore}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight">
                / 100
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-extrabold text-xs">
                  Grade {rating.grade}
                </span>
                <span className="text-xs font-bold text-slate-300">
                  {rating.overallScore >= 90 ? 'Master Pilot' : 'Good Driver'}
                </span>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1 mt-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= rating.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <span className="text-[11px] text-slate-400 block">CO2 Saved</span>
            <span className="font-speed text-lg font-bold text-emerald-400">
              +{rating.savedCO2Grams} g
            </span>
          </div>
        </div>

        {/* Feedback Message */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{rating.feedback}</p>
        </div>

        {/* Breakdown Metric Progress Bars */}
        <div className="my-3 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Performance Breakdown
          </h4>

          {/* Speed Compliance */}
          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-blue-400" />
                Speed Limit Adherence
              </span>
              <span className="font-bold text-white font-mono">{rating.speedScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${rating.speedScore}%` }}
              />
            </div>
          </div>

          {/* Eco & Idle Emission */}
          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                Eco Idling &amp; Emission
              </span>
              <span className="font-bold text-white font-mono">{rating.idleScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${rating.idleScore}%` }}
              />
            </div>
          </div>

          {/* Smoothness */}
          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Smooth Throttle &amp; Braking
              </span>
              <span className="font-bold text-white font-mono">{rating.smoothnessScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${rating.smoothnessScore}%` }}
              />
            </div>
          </div>

          {/* Standard Emission Model Citation */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
            <Leaf className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Standard EPA / Argonne National Lab ANL-GREET Factor: 2,392g CO2/L</span>
          </div>
        </div>

        {/* Trip Stats Grid */}
        <div className="grid grid-cols-3 gap-2 my-2 text-center">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Distance</span>
            <span className="text-xs font-bold text-white font-mono">{tripDistance} km</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Duration</span>
            <span className="text-xs font-bold text-white font-mono">
              {formatDuration(tripDurationSeconds)}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Top Speed</span>
            <span className="text-xs font-bold text-amber-400 font-mono">{maxSpeedKmH} km/h</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Avg Speed</span>
            <span className="text-xs font-bold text-white font-mono">{avgSpeedKmH} km/h</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Idle Time</span>
            <span
              className={`text-xs font-bold font-mono ${
                idleSeconds > 40 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {idleSeconds}s
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Total CO2</span>
            <span className="text-xs font-bold text-white font-mono">{totalCO2Grams} g</span>
          </div>
        </div>

        {/* Earned Badges */}
        <div className="my-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Badges Earned
          </span>
          <div className="flex flex-wrap gap-1.5">
            {rating.badges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{badge}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-800 mt-2">
          <button
            type="button"
            onClick={onStartNewRide}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Start Next Ride</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
          >
            Close &amp; Keep Logs
          </button>
        </div>
      </div>
    </div>
  );
};
