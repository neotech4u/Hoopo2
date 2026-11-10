import React from 'react';
import { Route, X, Power, Clock, Gauge, Leaf, Trash2, Calendar } from 'lucide-react';
import { TripLog } from '../utils/companionLogic';

interface TripLogModalProps {
  isOpen: boolean;
  ignitionOn: boolean;
  currentTripDistance: number;
  currentTripSeconds: number;
  tripLogs: TripLog[];
  onClose: () => void;
  onToggleIgnition: () => void;
  onClearTrips: () => void;
}

export const TripLogModal: React.FC<TripLogModalProps> = ({
  isOpen,
  ignitionOn,
  currentTripDistance,
  currentTripSeconds,
  tripLogs,
  onClose,
  onToggleIgnition,
  onClearTrips,
}) => {
  if (!isOpen) return null;

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const totalLoggedKm = tripLogs.reduce((acc, t) => acc + t.distanceKm, 0);
  const totalLoggedCO2Kg = tripLogs.reduce((acc, t) => acc + t.estimatedCO2Grams, 0) / 1000;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trip-log-title"
    >
      <div className="relative w-full max-w-2xl my-auto bg-slate-900 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                Ignition-Based Telematics
              </span>
              <h2 id="trip-log-title" className="text-base sm:text-lg font-bold text-white">
                Trip Distance &amp; Drive Logs
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors"
            aria-label="Close Trip Log"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Ignition Status Card */}
        <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 my-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    ignitionOn ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Engine Ignition Status:
                </span>
                <span
                  className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded ${
                    ignitionOn
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}
                >
                  {ignitionOn ? 'IGNITION ON (Recording Trip)' : 'IGNITION OFF (Engine Stopped)'}
                </span>
              </div>

              {ignitionOn ? (
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="text-slate-400">
                    Live Distance:{' '}
                    <strong className="text-emerald-400 font-speed text-sm">
                      {currentTripDistance.toFixed(2)} km
                    </strong>
                  </span>
                  <span className="text-slate-400">
                    Trip Time:{' '}
                    <strong className="text-white font-mono">
                      {formatSecs(currentTripSeconds)}
                    </strong>
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-1">
                  Turn ignition ON to start recording trip distance and driving statistics.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onToggleIgnition}
              className={`shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                ignitionOn
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{ignitionOn ? 'Turn Ignition OFF (Save Trip)' : 'Start Engine (Ignition ON)'}</span>
            </button>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-800 shrink-0">
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Logged</span>
            <div className="text-base font-speed font-extrabold text-white mt-0.5">
              {totalLoggedKm.toFixed(1)} km
            </div>
          </div>
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Trips Recorded</span>
            <div className="text-base font-speed font-extrabold text-emerald-400 mt-0.5">
              {tripLogs.length}
            </div>
          </div>
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Est. CO2 Total</span>
            <div className="text-base font-speed font-extrabold text-amber-400 mt-0.5">
              {totalLoggedCO2Kg.toFixed(2)} kg
            </div>
          </div>
        </div>

        {/* Trips History List */}
        <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 min-h-[160px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Completed Ignition Trips ({tripLogs.length})
            </span>
            {tripLogs.length > 0 && (
              <button
                type="button"
                onClick={onClearTrips}
                className="text-[11px] text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear History</span>
              </button>
            )}
          </div>

          {tripLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 italic bg-slate-950/40 rounded-xl border border-slate-800">
              No completed trips recorded yet. Turn ignition ON, drive, and turn ignition OFF to log each trip!
            </div>
          ) : (
            tripLogs.map((trip) => (
              <div
                key={trip.id}
                className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-speed font-bold text-white text-sm">
                      {trip.distanceKm.toFixed(1)} km
                    </span>
                    <span className="text-slate-400">
                      ({trip.startTime} &rarr; {trip.endTime})
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                      {formatSecs(trip.durationSeconds)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                    <span>Avg: {trip.avgSpeedKmH} km/h</span>
                    <span>&bull;</span>
                    <span>Max: {trip.maxSpeedKmH} km/h</span>
                    <span>&bull;</span>
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <Leaf className="w-3 h-3" />
                      CO2: {trip.estimatedCO2Grams}g
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
