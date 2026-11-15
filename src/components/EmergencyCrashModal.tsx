import React, { useState, useEffect, useRef } from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  PhoneCall,
  Send,
  X,
  MapPin,
  Clock,
  Volume2,
  Copy,
  Check,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { soundEngine } from '../utils/audioSynthesizer';
import {
  EmergencyContact,
  formatEmergencySosMessage,
  dispatchEmergencySms,
} from '../utils/emergencySos';

interface EmergencyCrashModalProps {
  isOpen: boolean;
  userName: string;
  realUserLocation: [number, number] | null;
  detectedGForce?: number;
  contact: EmergencyContact;
  onCancel: () => void;
  onSosDispatched?: () => void;
}

export const EmergencyCrashModal: React.FC<EmergencyCrashModalProps> = ({
  isOpen,
  userName,
  realUserLocation,
  detectedGForce = 2.9,
  contact,
  onCancel,
  onSosDispatched,
}) => {
  const [countdown, setCountdown] = useState<number>(contact.countdownSeconds || 10);
  const [hasDispatched, setHasDispatched] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const alarmIntervalRef = useRef<any>(null);

  const lat = realUserLocation ? realUserLocation[0] : 8.7139;
  const lng = realUserLocation ? realUserLocation[1] : 77.7567;
  const sosMessage = formatEmergencySosMessage(userName, lat, lng, detectedGForce);
  const mapsLink = `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;

  // Reset countdown and start siren when opened
  useEffect(() => {
    if (!isOpen) {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
      return;
    }

    setCountdown(contact.countdownSeconds || 10);
    setHasDispatched(false);

    // Initial siren chime
    soundEngine.playEmergencyAlarm();

    // Repeat alarm chime every 1.5 seconds during countdown
    alarmIntervalRef.current = setInterval(() => {
      soundEngine.playEmergencyAlarm();
    }, 1500);

    // Countdown timer tick
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerSendSos();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    };
  }, [isOpen, contact.countdownSeconds]);

  const triggerSendSos = () => {
    if (hasDispatched) return;
    setHasDispatched(true);
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);

    dispatchEmergencySms(contact.phone, sosMessage);
    if (onSosDispatched) onSosDispatched();
  };

  const handleCopyMapLink = () => {
    try {
      navigator.clipboard.writeText(mapsLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-red-950/85 backdrop-blur-xl animate-in fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="emergency-sos-title"
    >
      <div className="relative w-full max-w-lg bg-slate-950/95 border-2 border-red-500 rounded-3xl p-5 shadow-2xl shadow-red-950/80 text-white flex flex-col gap-4 overflow-hidden">
        {/* Flashing Top Emergency Header */}
        <div className="flex items-center justify-between pb-3 border-b border-red-500/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500 flex items-center justify-center text-red-400 animate-pulse">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h2
                id="emergency-sos-title"
                className="text-base sm:text-lg font-black tracking-wider uppercase text-red-400 font-speed flex items-center gap-1.5"
              >
                <span>CRASH DETECTED</span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              </h2>
              <span className="text-xs text-slate-300">
                Extreme deceleration spike detected ({detectedGForce}G)
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Auto Dispatch In
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-red-400 animate-pulse">
              {countdown}s
            </span>
          </div>
        </div>

        {/* Dynamic Countdown Circle Bar */}
        <div className="relative flex items-center justify-center py-2">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#334155"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#ef4444"
                strokeWidth="7"
                strokeDasharray="264"
                strokeDashoffset={264 - (countdown / (contact.countdownSeconds || 10)) * 264}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black font-speed text-white drop-shadow">
                {countdown}
              </span>
              <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest -mt-1">
                SEC
              </span>
            </div>
          </div>
        </div>

        {/* Live Telematics & Location Box */}
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-red-400" />
              <span>Driver: <strong className="text-white">{userName}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-amber-300">
              <Activity className="w-4 h-4" />
              <span>G-Force: {detectedGForce}G</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block">GPS Coordinates:</span>
                <span className="font-mono text-xs text-white truncate block">
                  {lat.toFixed(5)}°N, {lng.toFixed(5)}°E
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyMapLink}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] shrink-0"
              title="Copy Google Maps Coordinates Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            Sending SOS alert SMS to:{' '}
            <strong className="text-slate-200">
              {contact.name || 'Emergency Contact'} ({contact.phone || 'System Default'})
            </strong>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {/* Cancel Button (Big Green) */}
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Check className="w-5 h-5 text-white" />
            <span>I AM SAFE &bull; CANCEL SOS</span>
          </button>

          {/* Instant Dispatch Button (Red) */}
          <button
            type="button"
            onClick={triggerSendSos}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-900/50 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>SEND SOS SMS NOW</span>
          </button>
        </div>

        {/* Emergency Services Speed Dial (112) */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
          <a
            href="tel:112"
            className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-bold transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>Call 112 National Emergency</span>
          </a>

          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
