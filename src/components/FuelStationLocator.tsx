import React, { useState } from 'react';
import { Fuel, X, MapPin, Coffee, Sparkles, Plus, Check } from 'lucide-react';
import { FuelStation } from '../utils/companionLogic';

interface FuelStationLocatorProps {
  isOpen: boolean;
  stations: FuelStation[];
  selectedStationId: string | null;
  onClose: () => void;
  onSelectStation: (station: FuelStation) => void;
}

export const FuelStationLocator: React.FC<FuelStationLocatorProps> = ({
  isOpen,
  stations,
  selectedStationId,
  onClose,
  onSelectStation,
}) => {
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterAmenity, setFilterAmenity] = useState<string>('all');

  if (!isOpen) return null;

  const filteredStations = stations.filter((s) => {
    if (filterBrand !== 'all' && s.brand !== filterBrand) return false;
    if (filterAmenity !== 'all' && !s.amenities.some((a) => a.toLowerCase().includes(filterAmenity.toLowerCase()))) {
      return false;
    }
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fuel-locator-title"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                Integrated Fuel Station Locator
              </span>
              <h2 id="fuel-locator-title" className="text-lg font-bold text-white">
                Highway Fuel &amp; Service Plazas
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors"
            aria-label="Close Fuel Station Locator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 py-3 border-b border-slate-800/80">
          <span className="text-xs text-slate-400 font-semibold">Brand:</span>
          {['all', 'Aramco', 'Shell', 'Petronas', 'Adnoc'].map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => setFilterBrand(brand)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterBrand === brand
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              {brand}
            </button>
          ))}

          <span className="text-xs text-slate-400 font-semibold ml-2">Amenity:</span>
          {['all', 'Musalla', 'EV Charger', 'Car Wash'].map((amenity) => (
            <button
              key={amenity}
              type="button"
              onClick={() => setFilterAmenity(amenity)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterAmenity === amenity
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              {amenity}
            </button>
          ))}
        </div>

        {/* Stations List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {filteredStations.map((station) => {
            const isSelected = selectedStationId === station.id;

            return (
              <div
                key={station.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/80 shadow-md shadow-amber-500/20'
                    : 'bg-slate-850/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {station.brand}
                    </span>
                    <h3 className="text-base font-bold text-white">{station.name}</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      {station.distanceKm} km along route
                    </span>
                    <span className="font-bold text-emerald-400">
                      ₹{station.fuelPrice.toFixed(2)} / L
                    </span>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {station.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          amenity.includes('Musalla')
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectStation(station);
                    onClose();
                  }}
                  className={`shrink-0 inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl font-bold text-xs transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  }`}
                  aria-label={`Select ${station.name} as waypoint`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Waypoint Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add Waypoint</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
