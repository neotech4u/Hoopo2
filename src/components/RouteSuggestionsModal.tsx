import React from 'react';
import { Route, X, Zap, Leaf, Sparkles, Check, Clock, CloudRain, Fuel, ArrowRight } from 'lucide-react';
import { RouteOption } from '../utils/companionLogic';

interface RouteSuggestionsModalProps {
  isOpen: boolean;
  routes: RouteOption[];
  activeRouteId: string;
  onClose: () => void;
  onSelectRoute: (route: RouteOption) => void;
}

export const RouteSuggestionsModal: React.FC<RouteSuggestionsModalProps> = ({
  isOpen,
  routes,
  activeRouteId,
  onClose,
  onSelectRoute,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="route-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-blue-500/30 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
                Personalized Route Suggestions
              </span>
              <h2 id="route-modal-title" className="text-lg font-bold text-white">
                Optimized Travel Itineraries
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors"
            aria-label="Close Route Suggestions"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Route Cards */}
        <div className="py-4 space-y-3">
          {routes.map((route) => {
            const isSelected = route.id === activeRouteId;

            return (
              <div
                key={route.id}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'bg-slate-850/60 border-slate-800 hover:border-slate-700'
                }`}
                onClick={() => {
                  onSelectRoute(route);
                  onClose();
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        route.tag === 'Fastest'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : route.tag === 'Eco-Friendly'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      }`}
                    >
                      {route.tag}
                    </span>
                    <h3 className="text-base font-bold text-white">{route.name}</h3>
                  </div>

                  {isSelected && (
                    <span className="flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30">
                      <Check className="w-3.5 h-3.5" />
                      Active
                    </span>
                  )}
                </div>

                {/* Route Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>{route.durationMins} mins</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Route className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{route.distanceKm} km</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Fuel className="w-3.5 h-3.5 text-amber-400" />
                    <span>{route.fuelStopsCount} Fuel Stops</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <CloudRain
                      className={`w-3.5 h-3.5 ${
                        route.rainRisk ? 'text-sky-400' : 'text-emerald-400'
                      }`}
                    />
                    <span className={route.rainRisk ? 'text-sky-300' : 'text-emerald-300'}>
                      {route.rainRisk ? 'Rain Alert Ahead' : 'Clear Skies'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
