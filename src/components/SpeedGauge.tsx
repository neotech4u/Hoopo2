import React, { useMemo } from 'react';
import {
  Gauge,
  AlertTriangle,
  ShieldCheck,
  Fuel,
  Power,
  Leaf,
  Clock,
  Crosshair,
  Satellite,
  Activity,
  Compass,
} from 'lucide-react';
import { checkSpeedSafety, calculateIdleCO2Emission, calculateStandardDrivingCO2 } from '../utils/companionLogic';

interface SpeedGaugeProps {
  currentSpeed: number;
  speedLimit: number;
  gear: 'P' | 'R' | 'N' | 'D' | 'S';
  unit: 'km/h' | 'mph';
  cruiseControlActive?: boolean;
  fuelLevel: number; // percentage
  ignitionOn: boolean;
  tripDistance: number;
  idleSeconds: number;
  isGpsLiveMode?: boolean;
  gpsAccuracy?: number | null;
  onGearChange: (newGear: 'P' | 'R' | 'N' | 'D' | 'S') => void;
  onToggleCruise?: () => void;
  onToggleUnit: () => void;
  onToggleIgnition: () => void;
}

export const SpeedGauge: React.FC<SpeedGaugeProps> = ({
  currentSpeed,
  speedLimit,
  gear,
  unit,
  cruiseControlActive = false,
  fuelLevel,
  ignitionOn,
  tripDistance,
  idleSeconds,
  isGpsLiveMode = true,
  gpsAccuracy = null,
  onGearChange,
  onToggleCruise,
  onToggleUnit,
  onToggleIgnition,
}) => {
  const maxSpeed = unit === 'km/h' ? 180 : 120;
  const effectiveSpeed = ignitionOn ? currentSpeed : 0;
  const safety = useMemo(() => checkSpeedSafety(effectiveSpeed, speedLimit), [effectiveSpeed, speedLimit]);

  // SVG Gauge calculations
  const angle = useMemo(() => {
    const fraction = Math.min(Math.max(effectiveSpeed / maxSpeed, 0), 1);
    return -135 + fraction * 270;
  }, [effectiveSpeed, maxSpeed]);

  const speedColor = useMemo(() => {
    if (!ignitionOn) return '#64748b';
    if (safety.severity === 'danger') return '#ef4444';
    if (safety.severity === 'caution') return '#f59e0b';
    return '#10b981';
  }, [safety.severity, ignitionOn]);

  const speedBgGlow = useMemo(() => {
    if (!ignitionOn) return 'rgba(100, 116, 139, 0.1)';
    if (safety.severity === 'danger') return 'rgba(239, 68, 68, 0.35)';
    if (safety.severity === 'caution') return 'rgba(245, 158, 11, 0.2)';
    return 'rgba(16, 185, 129, 0.15)';
  }, [safety.severity, ignitionOn]);

  const radius = 84;
  const strokeDash = 2 * Math.PI * radius; // ~527.8
  const arcLength = strokeDash * (270 / 360); // ~395.8
  const offset = arcLength - Math.min(effectiveSpeed / maxSpeed, 1) * arcLength;

  const idleCO2 = calculateIdleCO2Emission(idleSeconds);
  const liveDrivingCO2 = calculateStandardDrivingCO2(tripDistance, effectiveSpeed);

  return (
    <div
      className={`relative flex flex-col justify-between w-full h-full bg-slate-900/90 backdrop-blur-xl border rounded-2xl p-3.5 transition-all duration-300 ${
        safety.severity === 'danger' && ignitionOn
          ? 'border-red-500/80 shadow-2xl shadow-red-900/50'
          : !ignitionOn
          ? 'border-slate-800 opacity-90'
          : 'border-slate-800 shadow-xl'
      }`}
      aria-label="Speedometer and Automotive Instrument Cluster"
    >
      {/* Cluster Header with Ignition Status & Real GPS Telemetry */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleIgnition}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all shadow-sm ${
              ignitionOn
                ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300'
                : 'bg-red-500/20 border border-red-500/60 text-red-300'
            }`}
            aria-label={ignitionOn ? 'Turn Engine Ignition OFF' : 'Turn Engine Ignition ON'}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{ignitionOn ? 'IGNITION ON' : 'IGNITION OFF'}</span>
          </button>

          {/* Automotive GPS Speedometer Status */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold border transition-all ${
              isGpsLiveMode
                ? 'bg-sky-500/20 border-sky-500/60 text-sky-300'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
            title="Automotive Ground Speedometer via Hardware GPS"
          >
            <Satellite className={`w-3 h-3 ${isGpsLiveMode ? 'text-sky-400 animate-pulse' : 'text-slate-400'}`} />
            <span>{isGpsLiveMode ? 'GPS Linked' : 'Speedometer'}</span>
          </div>
        </div>

        {/* Speed Limit Badge */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold transition-all ${
            safety.isUnsafe && ignitionOn
              ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}
          title={`Speed limit: ${speedLimit} ${unit}`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>LIMIT {speedLimit}</span>
        </div>
      </div>

      {/* Main Circular Gauge Visual */}
      <div className="relative flex flex-col items-center justify-center my-auto py-2">
        <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="gaugeTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
            </defs>

            {/* Gauge Background Track (270 deg) */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="url(#gaugeTrackGrad)"
              strokeWidth="11"
              strokeDasharray={`${arcLength} ${strokeDash}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(135 100 100)"
            />

            {/* Gauge Value Track */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={speedColor}
              strokeWidth="11"
              strokeDasharray={`${arcLength} ${strokeDash}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(135 100 100)"
              className="transition-all duration-300 ease-out"
              style={{ filter: `drop-shadow(0 0 8px ${speedColor})` }}
            />
          </svg>

          {/* Central Digital Speed Readout */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center rounded-full pointer-events-none"
            style={{ backgroundColor: speedBgGlow }}
          >
            <div className="flex items-baseline">
              <span className="font-speed text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
                {Math.round(effectiveSpeed)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <button
                type="button"
                onClick={onToggleUnit}
                className="pointer-events-auto text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white px-2 py-0.5 bg-slate-800/80 rounded-md border border-slate-700/60 transition-colors"
                title="Switch between km/h and mph"
              >
                {unit}
              </button>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.5 rounded">
                GEAR {gear}
              </span>
            </div>

            {/* Live GPS fix accuracy */}
            {isGpsLiveMode && (
              <span className="text-[9px] text-sky-300 mt-1 flex items-center gap-0.5 font-mono">
                <Crosshair className="w-2.5 h-2.5" />
                GPS {gpsAccuracy ? `±${Math.round(gpsAccuracy)}m` : 'Locked'}
              </span>
            )}
          </div>
        </div>

        {/* Unsafe Speed Alert Pill */}
        {safety.isUnsafe && ignitionOn && (
          <div className="mt-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 text-[11px] font-bold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Over limit by {safety.excessSpeed} {unit}</span>
          </div>
        )}
      </div>

      {/* Automotive Telematics & Transmission Cluster (Manual throttle slider and brake/accel buttons removed) */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
        {/* Real-Time Eco Dynamics & Status Bar */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] text-slate-400">Driving Status:</span>
            <span className={`text-[11px] font-bold truncate ${
              !ignitionOn
                ? 'text-slate-500'
                : effectiveSpeed === 0
                ? 'text-amber-400'
                : effectiveSpeed > speedLimit
                ? 'text-red-400'
                : 'text-emerald-400'
            }`}>
              {!ignitionOn
                ? 'Engine Parked'
                : effectiveSpeed === 0
                ? `Idle (${idleSeconds}s)`
                : effectiveSpeed > speedLimit
                ? 'Over Limit'
                : 'Cruising Smooth'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0 font-mono">
            <Leaf className="w-3 h-3 text-emerald-400" />
            <span>{effectiveSpeed === 0 && idleSeconds > 0 ? `${idleCO2.gramsCO2}g idle CO2` : `${liveDrivingCO2.effectiveLPer100Km} L/100km`}</span>
          </div>
        </div>

        {/* Gear Selector Shifter */}
        <div className="flex items-center justify-between bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          {(['P', 'R', 'N', 'D', 'S'] as const).map((g) => (
            <button
              key={g}
              type="button"
              disabled={!ignitionOn}
              onClick={() => onGearChange(g)}
              className={`w-8 h-7 rounded-lg transition-all disabled:opacity-30 ${
                gear === g
                  ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              aria-label={`Select gear ${g}`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Trip Distance & Fuel Level */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Trip:</span>
            <span className="font-bold text-emerald-300 font-mono">{tripDistance.toFixed(1)} km</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-slate-200 font-mono">{fuelLevel}%</span>
            <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  fuelLevel < 25 ? 'bg-red-500' : 'bg-amber-400'
                }`}
                style={{ width: `${fuelLevel}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
