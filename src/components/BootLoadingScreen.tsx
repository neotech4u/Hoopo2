import React, { useState, useEffect } from 'react';

interface BootLoadingScreenProps {
  onComplete: () => void;
}

export const BootLoadingScreen: React.FC<BootLoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('INITIALIZING HOOPOE AVIONICS v1.1.1...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1900; // ~1.9s smooth boot sequence

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 35) {
        setStatusText('INITIALIZING HOOPOE AVIONICS v1.1.1...');
      } else if (pct < 75) {
        setStatusText('CALIBRATING GPS & NAVIGATION TELEMETRY...');
      } else if (pct < 100) {
        setStatusText('STARTING AUTOMOTIVE COCKPIT...');
      } else {
        setStatusText('ALL SYSTEMS ONLINE • WELCOME ABOARD');
        clearInterval(interval);
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(onComplete, 600);
        }, 250);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(onComplete, 200);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-black text-white select-none transition-opacity duration-700 cursor-pointer overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Hoopoe Boot Loading Screen"
      role="dialog"
      aria-modal="true"
    >
      {/* Background Glow Accents */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vh] bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Cockpit Header Bar */}
      <div className="w-full flex items-center justify-between px-6 pt-5 z-20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-orange-400 font-speed">
            SYSTEM BOOTLOADER
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono tracking-wider">
          CORE: ARM64-v8a • AUTOMOTIVE HUD
        </span>
      </div>

      {/* Centerpiece Boot Image */}
      <div className="relative flex-1 flex flex-col items-center justify-center max-w-4xl w-full px-4 z-20">
        <div className="relative w-full max-w-2xl aspect-[16/9] flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl shadow-orange-950/40">
          <img
            src="/assets/boot/hoopoe_boot_loading.jpg"
            alt="Hoopoe Bootloading"
            className="w-full h-full object-contain filter drop-shadow-[0_0_35px_rgba(249,115,22,0.35)] animate-in fade-in zoom-in-95 duration-700"
          />
        </div>
      </div>

      {/* Bottom Loading Progress & Telemetry */}
      <div className="w-full max-w-xl px-6 pb-6 z-20 flex flex-col items-center gap-2">
        <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="text-[11px] text-orange-300 font-bold tracking-wider truncate">
            {statusText}
          </span>
          <span className="font-speed font-extrabold text-white text-xs shrink-0 ml-2">
            {progress}%
          </span>
        </div>

        {/* Futuristic Glowing Progress Bar */}
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-orange-600 via-amber-500 to-orange-400 rounded-full transition-all duration-75 shadow-[0_0_12px_#f97316]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="w-full flex items-center justify-between text-[10px] text-slate-600 pt-1">
          <span>HOOPOE CAR COMPANION</span>
          <span className="hover:text-slate-400 transition-colors">TAP TO SKIP &rarr;</span>
        </div>
      </div>
    </div>
  );
};
