import React, { useEffect, useRef, useState } from 'react';
import { FastForward, Volume2, VolumeX } from 'lucide-react';

interface BootAnimationProps {
  onComplete: () => void;
  videoSrc?: string;
}

export const BootAnimation: React.FC<BootAnimationProps> = ({
  onComplete,
  videoSrc = '/assets/boot/hoopoe_boot.mp4',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFading, setIsFading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const handleFinish = () => {
    if (isFading) return;
    setIsFading(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Attempt playback with audio first; gracefully fall back to muted if policy blocks
    const startPlay = async () => {
      try {
        video.muted = false;
        await video.play();
        setHasStarted(true);
      } catch {
        // Fallback to muted autoplay
        video.muted = true;
        setIsMuted(true);
        try {
          await video.play();
          setHasStarted(true);
        } catch (e) {
          console.warn('Boot video autoplay failed, skipping to HUD:', e);
          handleFinish();
        }
      }
    };

    startPlay();

    // Fallback safety timeout (18 seconds maximum)
    const timeout = setTimeout(() => {
      handleFinish();
    }, 18000);

    return () => clearTimeout(timeout);
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const next = !videoRef.current.muted;
    videoRef.current.muted = next;
    setIsMuted(next);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-500 select-none ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      onClick={handleFinish}
      role="dialog"
      aria-label="Hoopoe Cockpit Boot Sequence"
    >
      {/* Background Video */}
      <video
        ref={videoRef}
        src={videoSrc}
        playsInline
        onEnded={handleFinish}
        onError={() => {
          console.warn('Boot video error, proceeding to HUD');
          handleFinish();
        }}
        className="w-full h-full object-contain sm:object-cover pointer-events-none"
      />

      {/* Top Left Cockpit Status Pill */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/70 border border-emerald-500/30 backdrop-blur-md text-[11px] font-mono text-emerald-400">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="font-bold tracking-wider">HOOPOE AVIONICS &bull; BOOT SEQUENCE</span>
      </div>

      {/* Top Right Controls: Mute Toggle + Skip Button */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {hasStarted && (
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-slate-700/80 backdrop-blur-md text-slate-300 hover:text-white transition-all"
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleFinish();
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/60 backdrop-blur-md text-xs font-bold text-emerald-300 hover:text-white shadow-lg transition-all active:scale-95 cursor-pointer"
          aria-label="Skip Boot Sequence"
          title="Skip straight to cockpit HUD"
        >
          <span>SKIP</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Telemetry HUD Line */}
      <div className="absolute bottom-5 inset-x-0 z-10 flex flex-col items-center justify-center pointer-events-none px-4">
        <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-slate-400">
          <span className="text-emerald-400 font-bold">SYSTEM READY</span>
          <span>&bull;</span>
          <span>INITIALIZING COCKPIT HUD</span>
        </div>
        <div className="w-48 sm:w-64 h-0.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};
