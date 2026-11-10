import React, { useState } from 'react';
import { Fuel, X, Plus, Calendar, DollarSign, Gauge, Trash2, CheckCircle2 } from 'lucide-react';
import { PetrolLog, calculatePetrolSummary } from '../utils/companionLogic';

interface PetrolExpenseModalProps {
  isOpen: boolean;
  logs: PetrolLog[];
  currentOdometer: number;
  onClose: () => void;
  onAddLog: (newLog: Omit<PetrolLog, 'id'>) => void;
  onDeleteLog: (id: string) => void;
}

export const PetrolExpenseModal: React.FC<PetrolExpenseModalProps> = ({
  isOpen,
  logs,
  currentOdometer,
  onClose,
  onAddLog,
  onDeleteLog,
}) => {
  const [liters, setLiters] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [stationName, setStationName] = useState<string>('');
  const [odometer, setOdometer] = useState<string>(String(Math.round(currentOdometer)));
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const summary = calculatePetrolSummary(logs);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const l = parseFloat(liters);
    const a = parseFloat(amount);
    const o = parseFloat(odometer);

    if (isNaN(l) || l <= 0) {
      setErrorMsg('Please enter valid fuel liters.');
      return;
    }
    if (isNaN(a) || a <= 0) {
      setErrorMsg('Please enter valid total amount.');
      return;
    }

    onAddLog({
      liters: Math.round(l * 100) / 100,
      amount: Math.round(a * 100) / 100,
      stationName: stationName.trim() || 'Highway Station',
      odometerKm: !isNaN(o) ? o : currentOdometer,
      timestamp: new Date().toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      notes: notes.trim(),
    });

    // Reset inputs
    setLiters('');
    setAmount('');
    setStationName('');
    setNotes('');
    setErrorMsg('');
  };

  const calculatedUnitPrice =
    parseFloat(liters) > 0 && parseFloat(amount) > 0
      ? (parseFloat(amount) / parseFloat(liters)).toFixed(2)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="petrol-log-title"
    >
      <div className="relative w-full max-w-2xl my-auto bg-slate-900 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                Vehicle Expense &amp; Refill Manager
              </span>
              <h2 id="petrol-log-title" className="text-base sm:text-lg font-bold text-white">
                Manual Petrol &amp; Amount Log
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors"
            aria-label="Close Petrol Log"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-800/80 shrink-0">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Spent</span>
            <div className="text-base sm:text-lg font-speed font-extrabold text-amber-400 mt-0.5">
              ${summary.totalSpent.toFixed(2)}
            </div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Fuel</span>
            <div className="text-base sm:text-lg font-speed font-extrabold text-emerald-400 mt-0.5">
              {summary.totalLiters.toFixed(1)} L
            </div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Avg Price</span>
            <div className="text-base sm:text-lg font-speed font-extrabold text-sky-400 mt-0.5">
              ${summary.avgPricePerLiter.toFixed(2)}/L
            </div>
          </div>
        </div>

        {/* Form to Add New Log */}
        <form onSubmit={handleSubmit} className="p-3 bg-slate-850/70 rounded-2xl border border-slate-750 mt-3 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-amber-400" />
              Add Petrol Entry
            </span>
            {calculatedUnitPrice && (
              <span className="text-xs font-semibold text-emerald-400">
                Rate: ${calculatedUnitPrice} / Liter
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Fuel (Liters) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 40.5"
                value={liters}
                onChange={(e) => setLiters(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 52.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Station Name</label>
              <input
                type="text"
                placeholder="e.g. Shell Express"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Odometer (km)</label>
              <input
                type="number"
                placeholder="e.g. 14250"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {errorMsg && <p className="text-xs text-red-400 font-semibold">{errorMsg}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Refill Log</span>
            </button>
          </div>
        </form>

        {/* Previous Petrol Logs List */}
        <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 min-h-[140px]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Previous Refill History ({logs.length})
          </span>

          {logs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 italic bg-slate-950/40 rounded-xl border border-slate-800">
              No petrol entries logged yet. Fill out the form above to track fuel and costs!
            </div>
          ) : (
            logs.map((log) => {
              const unitPrice = log.liters > 0 ? (log.amount / log.liters).toFixed(2) : '0.00';
              return (
                <div
                  key={log.id}
                  className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        ${log.amount.toFixed(2)}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                        {log.liters.toFixed(1)} L (${unitPrice}/L)
                      </span>
                      <span className="text-slate-400">{log.stationName}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                      <span>{log.timestamp}</span>
                      <span>&bull;</span>
                      <span>Odometer: {Math.round(log.odometerKm)} km</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteLog(log.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    title="Delete log"
                    aria-label={`Delete log for ${log.stationName}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
