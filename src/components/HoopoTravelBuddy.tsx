import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  X,
  AlertTriangle,
  CloudRain,
  Compass,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Leaf,
  Power,
  Award,
  Radio,
  Flame,
} from 'lucide-react';
import { HoopoMascot, HoopoMood } from './HoopoMascot';
import { soundEngine, speakHoopoMessage } from '../utils/audioSynthesizer';
import {
  WeatherCondition,
  PrayerTime,
  calculateIdleCO2Emission,
  formatSpeedAlert,
  formatRainAlert,
  formatIdleCO2Alert,
  formatPrayerAlert,
  generateFriendlyCompanionComment,
} from '../utils/companionLogic';

export interface HoopoNotification {
  id: string;
  type: 'speed' | 'rain' | 'prayer' | 'co2' | 'companion' | 'info';
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  timestamp: Date;
}

interface HoopoTravelBuddyProps {
  userName: string;
  currentSpeed: number;
  speedLimit: number;
  ignitionOn: boolean;
  idleSeconds: number;
  upcomingRain: WeatherCondition | null;
  nextPrayer: PrayerTime;
  prayerMinutesLeft: number;
  isPrayerApproaching: boolean;
  voiceEnabled: boolean;
  nowPlayingTrack?: string;
  tripMinutes?: number;
  onSlowDown: () => void;
  onTurnOffIgnition: () => void;
  onLocateMosque: () => void;
  onToggleVoice: () => void;
  onFinishRide?: () => void;
  onRequestAIComment?: (category: 'weather' | 'music' | 'break' | 'spontaneous') => Promise<string | void>;
}

export const HoopoTravelBuddy: React.FC<HoopoTravelBuddyProps> = ({
  userName,
  currentSpeed,
  speedLimit,
  ignitionOn,
  idleSeconds,
  upcomingRain,
  nextPrayer,
  prayerMinutesLeft,
  isPrayerApproaching,
  voiceEnabled,
  nowPlayingTrack = 'Peaceful Travel Audio',
  tripMinutes = 15,
  onSlowDown,
  onTurnOffIgnition,
  onLocateMosque,
  onToggleVoice,
  onFinishRide,
  onRequestAIComment,
}) => {
  const [activeAlert, setActiveAlert] = useState<HoopoNotification | null>(null);
  const [mood, setMood] = useState<HoopoMood>('normal');
  const [isFlapping, setIsFlapping] = useState(false);
  const [lastSpeedAlertTime, setLastSpeedAlertTime] = useState(0);
  const [lastRainAlertTime, setLastRainAlertTime] = useState(0);
  const [lastPrayerAlertTime, setLastPrayerAlertTime] = useState(0);
  const [lastCO2AlertTime, setLastCO2AlertTime] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [lastSpontaneousSpokeTime, setLastSpontaneousSpokeTime] = useState(0);

  // 1. Unsafe Speed Monitor with User Name
  useEffect(() => {
    const isOverSpeed = currentSpeed > speedLimit;
    const now = Date.now();

    if (isOverSpeed && now - lastSpeedAlertTime > 8000) {
      setLastSpeedAlertTime(now);
      setMood('alert_speed');
      setIsFlapping(true);
      soundEngine.playSpeedWarning();

      const speedAlertMsg = formatSpeedAlert(userName, currentSpeed, speedLimit);

      if (voiceEnabled) {
        speakHoopoMessage(speedAlertMsg);
      }

      setActiveAlert({
        id: `speed-${now}`,
        type: 'speed',
        title: `Redwing Alert for ${userName}`,
        message: speedAlertMsg,
        actionText: 'Slow Down to Limit',
        onAction: onSlowDown,
        timestamp: new Date(),
      });

      const resetTimer = setTimeout(() => {
        setIsFlapping(false);
      }, 3000);
      return () => clearTimeout(resetTimer);
    } else if (!isOverSpeed && mood === 'alert_speed' && idleSeconds < 40) {
      setMood('normal');
      setIsFlapping(false);
    }
  }, [currentSpeed, speedLimit, voiceEnabled, lastSpeedAlertTime, mood, onSlowDown, idleSeconds, userName]);

  // 2. Standard Idle CO2 Emission Monitor (> 40s) with User Name
  useEffect(() => {
    if (ignitionOn && currentSpeed === 0 && idleSeconds >= 40) {
      const now = Date.now();
      if (now - lastCO2AlertTime > 25000) {
        setLastCO2AlertTime(now);
        setMood('alert_speed');
        setIsFlapping(true);

        const co2Data = calculateIdleCO2Emission(idleSeconds, userName);
        const co2Speech = formatIdleCO2Alert(userName, idleSeconds, co2Data.gramsCO2);

        if (voiceEnabled) {
          speakHoopoMessage(co2Speech);
        }

        setActiveAlert({
          id: `co2-${now}`,
          type: 'co2',
          title: `EPA Idle Alert: ${userName}`,
          message: `${co2Speech} (${co2Data.fuelWastedLiters}L fuel wasted).`,
          actionText: 'Turn Off Ignition',
          onAction: onTurnOffIgnition,
          timestamp: new Date(),
        });

        setTimeout(() => setIsFlapping(false), 2500);
      }
    }
  }, [ignitionOn, currentSpeed, idleSeconds, voiceEnabled, lastCO2AlertTime, onTurnOffIgnition, userName]);

  // 3. Upcoming Rain Monitor with User Name
  useEffect(() => {
    if (upcomingRain && mood !== 'alert_speed') {
      const now = Date.now();
      if (now - lastRainAlertTime > 30000) {
        setLastRainAlertTime(now);
        setMood('alert_rain');

        const rainMsg = formatRainAlert(userName, upcomingRain);

        if (voiceEnabled) {
          speakHoopoMessage(rainMsg);
        }

        setActiveAlert({
          id: `rain-${now}`,
          type: 'rain',
          title: `Radar Alert for ${userName}`,
          message: rainMsg,
          actionText: 'Check Rain Zone',
          onAction: () => {},
          timestamp: new Date(),
        });
      }
    }
  }, [upcomingRain, voiceEnabled, lastRainAlertTime, mood, userName]);

  // 4. Upcoming Prayer Time Monitor with User Name
  useEffect(() => {
    if (isPrayerApproaching && mood !== 'alert_speed' && mood !== 'alert_rain') {
      const now = Date.now();
      if (now - lastPrayerAlertTime > 45000) {
        setLastPrayerAlertTime(now);
        setMood('alert_prayer');
        soundEngine.playPrayerChime();

        const prayerMsg = formatPrayerAlert(userName, nextPrayer.name, prayerMinutesLeft);

        if (voiceEnabled) {
          speakHoopoMessage(prayerMsg);
        }

        setActiveAlert({
          id: `prayer-${now}`,
          type: 'prayer',
          title: `Prayer Reminder: ${userName}`,
          message: prayerMsg,
          actionText: 'Locate Musalla',
          onAction: onLocateMosque,
          timestamp: new Date(),
        });
      }
    }
  }, [isPrayerApproaching, nextPrayer, prayerMinutesLeft, voiceEnabled, lastPrayerAlertTime, mood, onLocateMosque, userName]);

  // 5. Casual Spontaneous Banter Trigger (Randomly drops friendly remarks while driving, replacing chips)
  useEffect(() => {
    let spontaneousInterval: any = null;
    if (ignitionOn && currentSpeed > 15 && voiceEnabled) {
      spontaneousInterval = setInterval(() => {
        const now = Date.now();
        // Spontaneous talk interval ~90 to 140 seconds
        if (now - lastSpontaneousSpokeTime > 90000 && !activeAlert) {
          setLastSpontaneousSpokeTime(now);
          const categories: Array<'weather' | 'music' | 'break' | 'spontaneous'> = [
            'weather',
            'music',
            'break',
            'spontaneous',
          ];
          const chosenCategory = categories[Math.floor(Math.random() * categories.length)];
          triggerCasualCompanionBanter(chosenCategory, false);
        }
      }, 30000);
    }
    return () => clearInterval(spontaneousInterval);
  }, [ignitionOn, currentSpeed, voiceEnabled, lastSpontaneousSpokeTime, activeAlert, userName]);

  const handleDismissAlert = () => {
    setActiveAlert(null);
    if (currentSpeed <= speedLimit && idleSeconds < 40) {
      setMood('normal');
    }
  };

  // Trigger Friendly Companion Talk (Weather, Music, Short Break, or Dhikr) casually
  const triggerCasualCompanionBanter = async (
    category: 'weather' | 'music' | 'break' | 'spontaneous',
    manualTap: boolean = false
  ) => {
    setIsAiLoading(true);
    setMood('greeting');
    setIsFlapping(true);
    if (manualTap) {
      soundEngine.playGreetingChime();
    }

    let companionText = '';
    if (onRequestAIComment) {
      try {
        const aiResult = await onRequestAIComment(category);
        if (typeof aiResult === 'string' && aiResult.length > 5) {
          companionText = aiResult;
        }
      } catch (e) {
        console.warn('AI comment error:', e);
      }
    }

    if (!companionText) {
      companionText = generateFriendlyCompanionComment(userName, category, {
        speed: currentSpeed,
        weatherCondition: upcomingRain ? upcomingRain.condition : 'Clear',
        musicTrack: nowPlayingTrack,
        tripMinutes,
      });
    }

    setIsAiLoading(false);
    setTimeout(() => {
      setIsFlapping(false);
      setMood('normal');
    }, 2000);

    if (voiceEnabled) {
      speakHoopoMessage(companionText);
    }

    setActiveAlert({
      id: `chat-${Date.now()}`,
      type: 'companion',
      title: `Redwing &bull; ${userName}`,
      message: companionText,
      actionText: 'Got It!',
      onAction: () => setActiveAlert(null),
      timestamp: new Date(),
    });
  };

  return (
    <div
      className="relative flex flex-col justify-between w-full h-full bg-slate-900/90 backdrop-blur-xl border border-red-950/60 rounded-2xl p-3.5 shadow-xl text-slate-100"
      aria-label="Redwing Autonomous Companion Drone Widget"
    >
      {/* Module Header with User Tag & Voice Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <span>Redwing Co-Pilot</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-red-950/80 text-red-300 border border-red-800/60 font-mono">
                EXO-7
              </span>
            </h3>
            <span className="text-[10px] text-red-400 font-medium">
              Flying escort with {userName}
            </span>
          </div>
        </div>

        {/* Voice Toggle */}
        <button
          type="button"
          onClick={onToggleVoice}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-semibold transition-all ${
            voiceEnabled
              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
          aria-label={voiceEnabled ? 'Mute Drone Voice' : 'Enable Drone Voice'}
        >
          {voiceEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Voice ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              <span>Muted</span>
            </>
          )}
        </button>
      </div>

      {/* Tiny Animated Redwing Drone & Interactive Speech Bubble */}
      <div className="flex items-center gap-2.5 my-2 p-2.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-red-900/40 hover:border-red-500/40 transition-colors">
        <button
          type="button"
          onClick={() => triggerCasualCompanionBanter('spontaneous', true)}
          className="shrink-0 group focus:outline-none focus:ring-2 focus:ring-red-500 rounded-xl p-1 relative cursor-pointer"
          title={`Tap Redwing to chat casually with ${userName}`}
          aria-label="Tap Redwing combat drone for casual banter"
        >
          <HoopoMascot
            size="md"
            mood={mood}
            isFlapping={isFlapping}
            className="group-hover:scale-110 transition-transform"
          />
          <div className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[8px] font-bold px-1 rounded-full uppercase shadow">
            TAP
          </div>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-red-400">Redwing</span>
            {mood === 'alert_speed' && currentSpeed > speedLimit && (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                Slow Down!
              </span>
            )}
            {idleSeconds >= 40 && ignitionOn && currentSpeed === 0 && (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                EPA Idle Alert
              </span>
            )}
            {mood === 'alert_rain' && (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                Rain Ahead
              </span>
            )}
            {mood === 'alert_prayer' && (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Salah Approaching
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-3 leading-snug">
            {isAiLoading
              ? 'Redwing is analyzing road conditions...'
              : activeAlert
              ? activeAlert.message
              : `Cruising along with you, ${userName}! Tap my wings anytime for casual road thoughts, or I'll drop notes when something comes up.`}
          </p>
        </div>
      </div>

      {/* Dynamic Key Notification Card */}
      {activeAlert && (
        <div
          role="alert"
          className={`p-2 rounded-xl border transition-all ${
            activeAlert.type === 'speed'
              ? 'bg-red-950/70 border-red-500/80 shadow-md shadow-red-950/50'
              : activeAlert.type === 'co2'
              ? 'bg-amber-950/70 border-amber-500/80 shadow-md shadow-amber-950/50'
              : activeAlert.type === 'rain'
              ? 'bg-sky-950/70 border-sky-500/70'
              : activeAlert.type === 'prayer'
              ? 'bg-emerald-950/70 border-emerald-500/70'
              : 'bg-slate-850 border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {activeAlert.type === 'speed' && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
              {activeAlert.type === 'co2' && <Leaf className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              {activeAlert.type === 'rain' && <CloudRain className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
              {activeAlert.type === 'prayer' && <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              {activeAlert.type === 'companion' && <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              <span className="text-[11px] font-bold text-white truncate">{activeAlert.title}</span>
            </div>
            <button
              type="button"
              onClick={handleDismissAlert}
              className="p-0.5 text-slate-400 hover:text-white"
              aria-label="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeAlert.actionText && (
            <button
              type="button"
              onClick={() => {
                if (activeAlert.onAction) activeAlert.onAction();
                handleDismissAlert();
              }}
              className={`mt-1.5 w-full py-1 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                activeAlert.type === 'speed'
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : activeAlert.type === 'co2'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : activeAlert.type === 'companion'
                  ? 'bg-red-700 hover:bg-red-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <span>{activeAlert.actionText}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Status Indicators & Finish Ride Action */}
      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800 text-[10px]">
        <div className="flex items-center gap-1 text-slate-400">
          <Leaf className="w-3 h-3 text-emerald-400" />
          <span>Idle:</span>
          <span className={`font-bold ${idleSeconds >= 40 ? 'text-amber-400 animate-pulse' : 'text-slate-200'}`}>
            {idleSeconds}s {idleSeconds >= 40 ? '(EPA Alert)' : ''}
          </span>
        </div>

        {onFinishRide && (
          <button
            type="button"
            onClick={onFinishRide}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-bold transition-all"
            title="Finish ride and view driving performance rating"
          >
            <Award className="w-3 h-3 text-amber-400" />
            <span>Finish Ride</span>
          </button>
        )}
      </div>
    </div>
  );
};
