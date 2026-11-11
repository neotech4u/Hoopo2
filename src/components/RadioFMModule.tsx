import React, { useState, useEffect, useRef } from 'react';
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
  Sliders,
  ListMusic,
  FolderPlus,
  Repeat,
  Shuffle,
  Trash2,
  X,
  ExternalLink,
} from 'lucide-react';
import { soundEngine } from '../utils/audioSynthesizer';
import { realAudioPlayer, AudioTrack, RepeatMode } from '../utils/realAudioPlayer';

export interface RadioStation {
  freq: number;
  name: string;
  genre: 'quran' | 'nasheed' | 'knowledge' | 'lofi' | 'news' | 'synth';
  description: string;
  currentTrack: string;
  streamUrl?: string;
}

export const PRESET_STATIONS: RadioStation[] = [
  {
    freq: 89.2,
    name: 'Quran Noor FM',
    genre: 'quran',
    description: 'Holy Quran Recitation & Reflections',
    currentTrack: 'Surah Ar-Rahman • Meditative Recitation',
    streamUrl: 'https://server8.mp3quran.net/afs/055.mp3',
  },
  {
    freq: 93.5,
    name: 'Peace Nasheed FM',
    genre: 'nasheed',
    description: 'Spiritual Acoustic & Vocal Harmony',
    currentTrack: 'Tala’al Badru Alayna • Acoustic Duff',
    streamUrl: 'https://server8.mp3quran.net/afs/001.mp3',
  },
  {
    freq: 97.1,
    name: 'Hidayah Travel Talk',
    genre: 'knowledge',
    description: 'Islamic Wisdom & Travel Reflections',
    currentTrack: 'Prophetic Guidance on Journey & Patience',
    streamUrl: 'https://server8.mp3quran.net/afs/067.mp3',
  },
  {
    freq: 101.4,
    name: 'Highway Lo-Fi Beats',
    genre: 'lofi',
    description: 'Smooth Ambient Driving Grooves',
    currentTrack: 'Desert Dunes at Dusk • Chill Wave',
    streamUrl: 'https://actions.google.com/sounds/v1/weather/light_rain.ogg',
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
  const [activeTab, setActiveTab] = useState<'radio' | 'music'>('music');
  const [activeStation, setActiveStation] = useState<RadioStation>(PRESET_STATIONS[0]);
  const [trackProgress, setTrackProgress] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [playlist, setPlaylist] = useState<AudioTrack[]>(() => realAudioPlayer.getPlaylist());
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(() => realAudioPlayer.getCurrentTrack());
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(() => realAudioPlayer.getRepeatMode());
  const [isShuffle, setIsShuffle] = useState<boolean>(() => realAudioPlayer.getIsShuffle());
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real audio player events
  useEffect(() => {
    const unsubTrack = realAudioPlayer.subscribeTrackChange((track) => {
      setCurrentTrack(track);
      setTrackDuration(track.durationSeconds || 0);
    });

    const unsubTime = realAudioPlayer.subscribeTimeUpdate((cur, dur) => {
      setTrackProgress(Math.floor(cur));
      if (dur && !isNaN(dur) && dur > 0) {
        setTrackDuration(Math.floor(dur));
      }
    });

    const unsubList = realAudioPlayer.subscribePlaylistChange((tracks) => {
      setPlaylist(tracks);
      setCurrentTrack(realAudioPlayer.getCurrentTrack());
    });

    const unsubError = realAudioPlayer.subscribeError((msg) => {
      setStatusNotice(msg);
      setTimeout(() => setStatusNotice(null), 4000);
    });

    return () => {
      unsubTrack();
      unsubTime();
      unsubList();
      unsubError();
    };
  }, []);

  // Sync playback state with realAudioPlayer or radio
  useEffect(() => {
    if (activeTab === 'music') {
      soundEngine.stopRadio();
      realAudioPlayer.setVolume(isMuted ? 0 : volume);
      if (isPlaying) {
        realAudioPlayer.play();
      } else {
        realAudioPlayer.pause();
      }
    } else {
      realAudioPlayer.pause();
      if (!isPlaying) {
        soundEngine.stopRadio();
        return;
      }
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
          currentTrack: 'Analog Tuner Frequency',
        });
        soundEngine.startRadioStation(frequency, 'lofi', isMuted ? 0 : volume);
      }
    }
  }, [isPlaying, activeTab, frequency, isMuted, volume]);

  const handleTune = (delta: number) => {
    soundEngine.playTuningStatic(0.12);
    const newFreq = Math.round((frequency + delta) * 10) / 10;
    if (newFreq >= 87.5 && newFreq <= 108.0) {
      onFrequencyChange(newFreq);
    }
  };

  const handleNextTrack = () => {
    if (activeTab === 'music') {
      realAudioPlayer.next();
    } else {
      handleTune(0.1);
    }
  };

  const handlePrevTrack = () => {
    if (activeTab === 'music') {
      realAudioPlayer.prev();
    } else {
      handleTune(-0.1);
    }
  };

  const handleSeek = (newSeconds: number) => {
    setTrackProgress(newSeconds);
    if (activeTab === 'music') {
      realAudioPlayer.seek(newSeconds);
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(prevVolume > 0 ? prevVolume : 0.6);
      realAudioPlayer.setMute(false);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      onVolumeChange(0);
      realAudioPlayer.setMute(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const added = realAudioPlayer.addLocalFiles(e.target.files);
      setStatusNotice(`Loaded ${added.length} USB / device song(s) successfully!`);
      setTimeout(() => setStatusNotice(null), 3500);
      if (!isPlaying) {
        onTogglePlay();
      }
    }
    // Reset file input value to allow re-uploading same file if desired
    e.target.value = '';
  };

  const handleToggleRepeat = () => {
    const next = realAudioPlayer.toggleRepeat();
    setRepeatMode(next);
  };

  const handleToggleShuffle = () => {
    const next = realAudioPlayer.toggleShuffle();
    setIsShuffle(next);
  };

  const handleLaunchCarHardwareRadio = () => {
    // Attempt standard Android head unit broadcast intents or app launcher
    const intentUrls = [
      'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_MUSIC;end',
      'intent:#Intent;action=com.syu.radio;end',
      'intent:#Intent;action=com.microntek.radio;end',
    ];

    try {
      window.location.href = intentUrls[0];
      setStatusNotice('Switching audio to car hardware radio antenna...');
    } catch {
      setStatusNotice('Car hardware radio intent sent to head unit MCU.');
    }
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
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
            onClick={() => setActiveTab('music')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'music'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>MP3 Player</span>
            {playlist.some((t) => t.isLocalFile) && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

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

      {/* Screen Content: FM Radio vs MP3 Music Player */}
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

            <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1 text-emerald-300 font-medium truncate max-w-[180px]">
                <Headphones className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{activeStation.currentTrack}</span>
              </div>
              <button
                type="button"
                onClick={handleLaunchCarHardwareRadio}
                className="text-[10px] text-amber-300 hover:text-amber-200 underline font-semibold flex items-center gap-0.5"
                title="Launch factory car radio tuner via antenna"
              >
                <span>Antenna Tuner</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
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
        /* Real MP3 Music Player Screen */
        <div className="my-1.5 space-y-2">
          <div className="p-2.5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl relative overflow-hidden shadow-inner flex items-center gap-2.5">
            {/* Spinning Album Disc Art */}
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
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  {currentTrack?.category || 'Music'}
                </span>
                {currentTrack?.isLocalFile && (
                  <span className="px-1 py-0.2 bg-emerald-950 border border-emerald-500/40 text-[9px] font-bold text-emerald-300 rounded">
                    USB
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-white truncate">
                {currentTrack?.title || 'No Song Selected'}
              </h4>
              <p className="text-[11px] text-slate-400 truncate">
                {currentTrack?.artist || 'Tap Load to Add USB Songs'}
              </p>
            </div>

            {/* USB & Playlist Quick Actions */}
            <div className="flex flex-col gap-1 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 transition-colors"
                title="Load MP3 songs from USB drive or device storage"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowPlaylistModal(true)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 transition-colors"
                title="View full playlist"
              >
                <ListMusic className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hidden native file input for USB/Device MP3s */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac,.aac"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Track Progress Scrubber */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono px-0.5">
              <span>{formatTime(trackProgress)}</span>
              <span>{formatTime(trackDuration || currentTrack?.durationSeconds || 0)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={trackDuration || currentTrack?.durationSeconds || 100}
              value={trackProgress}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              aria-label="Track Progress Scrubber"
            />
          </div>

          {/* Sub-bar with Repeat & Shuffle Controls */}
          <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
            <span className="truncate max-w-[150px]">
              {playlist.length} track{playlist.length === 1 ? '' : 's'} available
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleShuffle}
                className={`p-1 rounded transition-colors ${
                  isShuffle ? 'text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={handleToggleRepeat}
                className={`p-1 rounded transition-colors flex items-center gap-0.5 ${
                  repeatMode !== 'off' ? 'text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                <Repeat className="w-3 h-3" />
                {repeatMode === 'one' && <span className="text-[8px] font-bold">1</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Playback & Volume Controls */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevTrack}
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
            onClick={handleNextTrack}
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

      {/* Floating Status Notice */}
      {statusNotice && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-slate-950 border border-emerald-500/80 rounded-full text-[11px] font-bold text-emerald-300 shadow-xl animate-in fade-in">
          {statusNotice}
        </div>
      )}

      {/* Playlist Drawer Modal */}
      {showPlaylistModal && (
        <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-md rounded-2xl p-3 flex flex-col justify-between border border-slate-700 animate-in fade-in">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ListMusic className="w-3.5 h-3.5 text-emerald-400" />
              Music Playlist ({playlist.length})
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 rounded font-semibold"
              >
                + Add Songs
              </button>
              <button
                type="button"
                onClick={() => setShowPlaylistModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Track List */}
          <div className="flex-1 overflow-y-auto my-2 space-y-1 pr-1 max-h-44">
            {playlist.map((track, idx) => {
              const isSelected = track.id === currentTrack?.id;
              return (
                <div
                  key={track.id}
                  className={`p-2 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-bold'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      realAudioPlayer.selectTrack(idx);
                      if (!isPlaying) onTogglePlay();
                    }}
                    className="flex-1 text-left min-w-0 pr-2"
                  >
                    <div className="truncate text-xs font-medium text-white">{track.title}</div>
                    <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                      <span>{track.artist}</span>
                      {track.isLocalFile && (
                        <span className="px-1 py-0.2 bg-slate-800 text-[8px] text-emerald-400 rounded">
                          USB
                        </span>
                      )}
                    </div>
                  </button>
                  {track.isLocalFile && (
                    <button
                      type="button"
                      onClick={() => realAudioPlayer.removeTrack(idx)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      title="Remove from playlist"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={() => realAudioPlayer.clearLocalTracks()}
              className="text-[10px] text-slate-400 hover:text-red-400"
            >
              Reset to Defaults
            </button>
            <button
              type="button"
              onClick={() => setShowPlaylistModal(false)}
              className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
