import React, { useState, useEffect } from 'react';
import {
  Radio,
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Signal,
  Headphones,
  Disc3,
  Sliders,
  ListMusic,
} from 'lucide-react';
import { soundEngine, PLAYLIST_TRACKS, MusicTrack } from '../utils/audioSynthesizer';

export interface RadioStation {
  freq: number;
  name: string;
  genre: 'quran' | 'nasheed' | 'knowledge' | 'lofi' | 'news' | 'synth';
  description: string;
  currentTrack: string;
}

export const PRESET_STATIONS: RadioStation[] = [
  {
    freq: 89.2,
    name: 'Quran Noor FM',
    genre: 'quran',
    description: 'Holy Quran Recitation & Reflections',
    currentTrack: 'Surah Ar-Rahman • Meditative Recitation',
  },
  {
    freq: 93.5,
    name: 'Peace Nasheed FM',
    genre: 'nasheed',
    description: 'Spiritual Acoustic & Vocal Harmony',
    currentTrack: 'Tala’al Badru Alayna • Acoustic Duff',
  },
  {
    freq: 97.1,
    name: 'Hidayah Travel Talk',
    genre: 'knowledge',
    description: 'Islamic Wisdom & Travel Reflections',
    currentTrack: 'Prophetic Guidance on Journey & Patience',
  },
  {
    freq: 101.4,
    name: 'Highway Lo-Fi Beats',
    genre: 'lofi',
    description: 'Smooth Ambient Driving Grooves',
    currentTrack: 'Desert Dunes at Dusk • Chill Wave',
  },
  {
    freq: 104.8,
    name: 'Road & Weather Pulse',
    genre: 'news',
    description: 'Traffic Reports & Regional News',
    currentTrack: 'Live Express Route Traffic Bulletin',
  },
  {
    freq: 107.9,
    name: 'Sunset Cruiser Radio',
    genre: 'synth',
    description: 'Deep Synthwave & Horizon Drive',
    currentTrack: 'Oasis Night Highway • Melodic Drive',
  },
];

interface RadioFMModuleProps {
  isPlaying: boolean;
  frequency: number;
  volume: number;
  onTogglePlay: () => void;
  onFrequencyChange: (freq: number) => void;
  onVolumeChange: (vol: number) => void;
}

export const RadioFMModule: React.FC<RadioFMModuleProps> = ({
  isPlaying,
  frequency,
  volume,
  onTogglePlay,
  onFrequencyChange,
  onVolumeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'radio' | 'music'>('radio');
  const [activeStation, setActiveStation] = useState<RadioStation>(PRESET_STATIONS[0]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [trackProgress, setTrackProgress] = useState(38); // seconds
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);

  const activeTrack: MusicTrack = PLAYLIST_TRACKS[currentTrackIndex] || PLAYLIST_TRACKS[0];

  // Track progress ticker while playing in music mode
  useEffect(() => {
    let ticker: any = null;
    if (isPlaying && activeTab === 'music') {
      ticker = setInterval(() => {
        setTrackProgress((prev) => (prev + 1 >= activeTrack.durationSeconds ? 0 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(ticker);
  }, [isPlaying, activeTab, activeTrack.durationSeconds]);

  // Sync Audio playback based on mode
  useEffect(() => {
    if (!isPlaying) {
      soundEngine.stopRadio();
      soundEngine.stopMusic();
      return;
    }

    if (activeTab === 'radio') {
      const match = PRESET_STATIONS.find((s) => Math.abs(s.freq - frequency) < 0.2);
      if (match) {
        setActiveStation(match);
        soundEngine.startRadioStation(match.freq, match.genre, isMuted ? 0 : volume);
      } else {
        setActiveStation({
          freq: frequency,
          name: `Custom Radio ${frequency.toFixed(1)} FM`,
          genre: 'lofi',
          description: 'Manual Tuner Frequency',
          currentTrack: 'Clear Broadcast Transmission',
        });
        soundEngine.startRadioStation(frequency, 'lofi', isMuted ? 0 : volume);
      }
    } else {
      soundEngine.startMusicTrack(activeTrack, isMuted ? 0 : volume);
    }
  }, [isPlaying, activeTab, frequency, currentTrackIndex, isMuted]);

  // Volume adjustment
  useEffect(() => {
    soundEngine.setRadioVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  const handleTune = (delta: number) => {
    soundEngine.playTuningStatic(0.12);
    const newFreq = Math.round((frequency + delta) * 10) / 10;
    if (newFreq >= 87.5 && newFreq <= 108.0) {
      onFrequencyChange(newFreq);
    }
  };

  const handleNextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST_TRACKS.length);
    setTrackProgress(0);
  };

  const handlePrevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST_TRACKS.length) % PLAYLIST_TRACKS.length);
    setTrackProgress(0);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(prevVolume > 0 ? prevVolume : 0.6);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      onVolumeChange(0);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className="relative flex flex-col justify-between w-full h-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-3.5 shadow-xl text-slate-100"
      aria-label="In-car Radio and Music Infotainment Module"
    >
      {/* Module Header & Mode Switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 p-0.5 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('radio')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'radio'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>FM Radio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('music')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'music'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Music Player</span>
          </button>
        </div>

        {/* Live Audio Equalizer Bars */}
        <div className="flex items-end gap-0.5 h-4 px-1.5 bg-slate-950/70 rounded-md border border-slate-800">
          {[45, 80, 100, 65, 85].map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-t transition-all ${
                isPlaying
                  ? activeTab === 'radio'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                  : 'bg-slate-700'
              }`}
              style={{
                height: isPlaying ? `${Math.max(25, height + (i % 2) * 15)}%` : '20%',
                animation: isPlaying
                  ? `pulse 0.75s ease-in-out infinite alternate ${i * 0.12}s`
                  : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Screen Content: FM Radio vs Music Player */}
      {activeTab === 'radio' ? (
        <div className="my-1.5 space-y-2">
          {/* Radio Display Screen */}
          <div className="p-2.5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl relative overflow-hidden shadow-inner">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-speed text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">
                    {frequency.toFixed(1)}
                  </span>
                  <span className="text-xs font-bold text-slate-400">MHz FM</span>
                </div>
                <h4 className="text-xs font-bold text-white truncate max-w-[190px]">
                  {activeStation.name}
                </h4>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {activeStation.description}
                </p>
              </div>

              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-amber-300">
                {activeStation.genre}
              </span>
            </div>

            <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center gap-1 text-[11px] text-emerald-300 font-medium truncate">
              <Headphones className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">{activeStation.currentTrack}</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-1">
            {PRESET_STATIONS.slice(0, 3).map((station) => {
              const isSelected = Math.abs(station.freq - frequency) < 0.2;
              return (
                <button
                  key={station.freq}
                  type="button"
                  onClick={() => {
                    soundEngine.playTuningStatic(0.12);
                    onFrequencyChange(station.freq);
                    if (!isPlaying) onTogglePlay();
                  }}
                  className={`py-1 px-1.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 font-bold'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/50 text-slate-300'
                  }`}
                >
                  <div className="text-[9px] font-mono leading-none">{station.freq} FM</div>
                  <div className="text-[10px] truncate mt-0.5">{station.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Music Player Screen */
        <div className="my-1.5 space-y-2">
          <div className="p-2.5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl relative overflow-hidden shadow-inner flex items-center gap-2.5">
            {/* Spinning Album Disc Art with Hoopoe Emblem */}
            <div
              className={`w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500/60 bg-slate-900 shrink-0 shadow-md ${
                isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''
              }`}
            >
              <img
                src="/assets/aistudio/hoopoe_logo_bedb9b31.png"
                alt="Hoopoe Music Track"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                {activeTrack.category}
              </span>
              <h4 className="text-xs font-bold text-white truncate">{activeTrack.title}</h4>
              <p className="text-[11px] text-slate-400 truncate">{activeTrack.artist}</p>
            </div>
          </div>

          {/* Track Progress Scrubber */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono px-0.5">
              <span>{formatTime(trackProgress)}</span>
              <span>{formatTime(activeTrack.durationSeconds)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={activeTrack.durationSeconds}
              value={trackProgress}
              onChange={(e) => setTrackProgress(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              aria-label="Track Progress Scrubber"
            />
          </div>
        </div>
      )}

      {/* Shared Playback & Volume Controls */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={activeTab === 'radio' ? () => handleTune(-0.1) : handlePrevTrack}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors"
            aria-label={activeTab === 'radio' ? 'Tune Down 0.1 MHz' : 'Previous Track'}
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className={`p-2 rounded-xl font-bold transition-all shadow-md ${
              isPlaying
                ? activeTab === 'radio'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-750 text-white'
            }`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={activeTab === 'radio' ? () => handleTune(0.1) : handleNextTrack}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors"
            aria-label={activeTab === 'radio' ? 'Tune Up 0.1 MHz' : 'Next Track'}
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-1.5 flex-1 max-w-[120px]">
          <button
            type="button"
            onClick={handleToggleMute}
            className="p-1 rounded text-slate-400 hover:text-slate-200"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-slate-300" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setIsMuted(false);
              onVolumeChange(Number(e.target.value));
            }}
            className={`w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer ${
              activeTab === 'radio' ? 'accent-amber-400' : 'accent-emerald-400'
            }`}
            aria-label="Volume Slider"
          />
        </div>
      </div>
    </div>
  );
};
