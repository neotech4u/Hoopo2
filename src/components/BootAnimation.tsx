import React, { useEffect, useState } from 'react';
import { soundEngine } from '../utils/audioSynthesizer';

interface BootAnimationProps {
  onComplete: () => void;
}

export const BootAnimation: React.FC<BootAnimationProps> = ({ onComplete }) => {
  const [bootStep, setBootStep] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [telemetryPercent, setTelemetryPercent] = useState(0);

  const handleFinish = () => {
    if (isFading) return;
    setIsFading(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  useEffect(() => {
    // Play futuristic ECU power-on sweep chime with zero latency
    try {
      soundEngine.playGreetingChime();
    } catch {}

    // Rapid hardware telemetry progress (0 to 100% in 2.8s)
    const progressInterval = setInterval(() => {
      setTelemetryPercent((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 4;
      });
    }, 90);

    // Staggered ECU diagnostic boot sequence
    const t1 = setTimeout(() => setBootStep(1), 400);   // Radar engaged
    const t2 = setTimeout(() => setBootStep(2), 1000);  // Corridor loaded
    const t3 = setTimeout(() => setBootStep(3), 1600);  // Telemetry online
    const t4 = setTimeout(() => setBootStep(4), 2200);  // Cockpit ready
    const t5 = setTimeout(() => handleFinish(), 3200);  // Transition to HUD

    return () => {
      clearInterval(progressInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] w-screen h-screen bg-[#030712] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 select-none ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      onClick={handleFinish}
      role="presentation"
    >
      {/* Background Animated Holographic Radar & Grid */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
        <div className="w-[500px] h-[500px] rounded-full border border-sky-500/20 animate-ping" />
        <div className="absolute w-[360px] h-[360px] rounded-full border border-emerald-500/30 animate-pulse" />
        <div className="absolute w-[220px] h-[220px] rounded-full border border-blue-500/40" />
      </div>

      {/* Center Automotive Emblem: Hoopoe Avionics Bird Drone */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Glowing Aura Rings */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/20 via-sky-500/30 to-amber-500/20 blur-xl animate-pulse" />

          {/* High-Tech Vector Hoopoe Bird Drone Emblem */}
          <svg
            className="w-24 h-24 drop-shadow-[0_0_20px_rgba(56,189,248,0.8)] animate-in zoom-in-75 duration-700"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Crown Crest Feathers */}
            <path
              d="M50 12 L52 26 L48 26 Z"
              fill="#f59e0b"
              className="animate-pulse"
            />
            <path d="M44 16 L48 27 L43 28 Z" fill="#f97316" />
            <path d="M56 16 L52 27 L57 28 Z" fill="#f97316" />

            {/* Aerodynamic Stealth Body */}
            <path
              d="M50 24 C44 24 38 30 38 42 C38 60 48 76 50 82 C52 76 62 60 62 42 C62 30 56 24 50 24 Z"
              fill="url(#bodyGrad)"
              stroke="#38bdf8"
              strokeWidth="1.8"
            />

            {/* Swept Wings Left & Right */}
            <path
              d="M38 42 C24 38 12 48 6 62 C16 60 28 58 38 52 Z"
              fill="url(#wingGradLeft)"
              stroke="#10b981"
              strokeWidth="1.5"
            />
            <path
              d="M62 42 C76 38 88 48 94 62 C84 60 72 58 62 52 Z"
              fill="url(#wingGradRight)"
              stroke="#10b981"
              strokeWidth="1.5"
            />

            {/* Glowing HUD Scanner Core */}
            <circle cx="50" cy="38" r="4.5" fill="#38bdf8" className="animate-ping" />
            <circle cx="50" cy="38" r="3" fill="#ffffff" />

            {/* Twin Ion Micro-Thrusters */}
            <ellipse cx="44" cy="74" rx="2.5" ry="4" fill="#38bdf8" className="animate-pulse" />
            <ellipse cx="56" cy="74" rx="2.5" ry="4" fill="#38bdf8" className="animate-pulse" />

            <defs>
              <linearGradient id="bodyGrad" x1="50" y1="24" x2="50" y2="82" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0f172a" />
                <stop offset="0.6" stopColor="#0284c7" />
                <stop offset="1" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="wingGradLeft" x1="6" y1="42" x2="38" y2="62" gradientUnits="userSpaceOnUse">
                <stop stopColor="#059669" />
                <stop offset="1" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="wingGradRight" x1="94" y1="42" x2="62" y2="62" gradientUnits="userSpaceOnUse">
                <stop stopColor="#059669" />
                <stop offset="1" stopColor="#0f172a" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Brand & System Title */}
        <h1 className="mt-4 text-xl sm:text-2xl font-black tracking-widest text-white uppercase font-speed">
          HOOPOE <span className="text-emerald-400">COCKPIT</span>
        </h1>
        <p className="text-[11px] font-mono tracking-widest text-sky-400 uppercase mt-0.5">
          AUTOMOTIVE AVIONICS &bull; NELLAI v1.0.3
        </p>

        {/* Staggered ECU Boot Status Readout */}
        <div className="mt-4 h-6 text-center font-mono text-xs flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-300">
            {bootStep === 0 && 'INITIALIZING VEHICLE ECU CORE...'}
            {bootStep === 1 && 'ENGAGING GNSS SATELLITE RADAR...'}
            {bootStep === 2 && 'SYNCING TAMIL NADU NH 44 / SH 39 CORRIDORS...'}
            {bootStep === 3 && 'ASTRONOMICAL MEEUS PRAYER ALGORITHM READY...'}
            {bootStep >= 4 && 'ALL SYSTEMS NOMINAL &bull; WELCOME ABOARD'}
          </span>
        </div>

        {/* Fast Loading Telemetry Gauge Bar */}
        <div className="mt-4 w-64 sm:w-80 h-1.5 bg-slate-900 border border-slate-700/80 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-100 shadow-[0_0_10px_#38bdf8]"
            style={{ width: `${telemetryPercent}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-slate-500 mt-1">
          {telemetryPercent}% SYSTEM INITIALIZATION
        </span>
      </div>

      {/* Subtle Skip Indicator (Bottom Right) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleFinish();
        }}
        className="absolute bottom-6 right-6 z-20 px-3 py-1 rounded-full bg-slate-900/60 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-xs font-mono tracking-wider uppercase transition-all backdrop-blur-sm"
      >
        Skip &rarr;
      </button>
    </div>
  );
};
