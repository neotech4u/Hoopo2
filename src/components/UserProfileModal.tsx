import React, { useState, useEffect } from 'react';
import {
  User,
  Sparkles,
  Check,
  X,
  Volume2,
  Sliders,
  Play,
  RotateCcw,
  Globe,
  Radio,
  HeartHandshake,
  Shield,
  Leaf,
} from 'lucide-react';
import {
  VoiceSettings,
  DEFAULT_VOICE_SETTINGS,
  getStoredVoiceSettings,
  saveStoredVoiceSettings,
  getSystemSpeechVoices,
  speakHoopoMessage,
} from '../utils/audioSynthesizer';

interface UserProfileModalProps {
  isOpen: boolean;
  currentUserName: string;
  onClose: () => void;
  onSaveUserName: (newName: string) => void;
}

const POPULAR_SUGGESTED_NAMES = [
  'Mustafa',
  'Fatima',
  'Zaid',
  'Amina',
  'Abdullah',
  'Aisha',
  'Hamza',
  'Maryam',
  'Bilal',
  'Ibrahim',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  currentUserName,
  onClose,
  onSaveUserName,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'voice'>('profile');
  const [nameInput, setNameInput] = useState(currentUserName);

  // Voice Settings State
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(getStoredVoiceSettings);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState(false);

  // Load available speech synthesis voices
  useEffect(() => {
    if (!isOpen) return;

    const loadVoices = () => {
      const voices = getSystemSpeechVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [isOpen]);

  useEffect(() => {
    setNameInput(currentUserName);
  }, [currentUserName]);

  if (!isOpen) return null;

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = nameInput.trim() || 'Friend';
    onSaveUserName(trimmed);
    saveStoredVoiceSettings(voiceSettings);
    onClose();
  };

  const handleTestVoice = () => {
    setIsPlayingTestAudio(true);
    const testText = `Assalamu Alaikum ${nameInput.trim() || 'Friend'}! Redwing tactical avionics are online. Weather is clear and all systems are nominal. Fi Amanillah!`;
    speakHoopoMessage(testText, voiceSettings);
    setTimeout(() => setIsPlayingTestAudio(false), 3000);
  };

  const handleResetVoiceDefaults = () => {
    setVoiceSettings(DEFAULT_VOICE_SETTINGS);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
    >
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700 rounded-3xl p-5 shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                Cockpit Settings &bull; Audio &amp; Identity
              </span>
              <h2 id="profile-modal-title" className="text-base font-extrabold text-white">
                Driver Profile &amp; Voice Settings
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 my-3 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Driver Name</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'voice'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice &amp; Arabic Audio</span>
          </button>
        </div>

        {/* TAB 1: Driver Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-4 my-2">
            <div>
              <label htmlFor="driver-name-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
                What should Redwing &amp; Hoopo call you?
              </label>
              <div className="relative">
                <input
                  id="driver-name-input"
                  type="text"
                  maxLength={30}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Mustafa, Fatima, Captain..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick suggestions */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">Quick picks:</span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SUGGESTED_NAMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setNameInput(name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      nameInput.toLowerCase() === name.toLowerCase()
                        ? 'bg-red-600/20 border-red-500 text-red-300'
                        : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Companion Audio Preview Card */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1 mb-1">
                <HeartHandshake className="w-3.5 h-3.5" />
                Personalized Callout Sample
              </span>
              <p className="text-slate-300 italic leading-relaxed">
                "{nameInput.trim() || 'Friend'}, rain radar detects light showers 12 km ahead at Valley Pass. Let's keep our distance and cruise safe!"
              </p>
            </div>

            {/* EPA Model Note */}
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
              <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Standard EPA factors: 2,392 g CO2 per liter petrol; Argonne ANL idle rate: 0.698 g CO2/sec.
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: Voice & Audio Settings */}
        {activeTab === 'voice' && (
          <div className="space-y-4 my-2">
            {/* Voice Engine Selector */}
            <div>
              <label htmlFor="voice-select" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select TTS Voice Engine
              </label>
              <select
                id="voice-select"
                value={voiceSettings.voiceURI}
                onChange={(e) => setVoiceSettings({ ...voiceSettings, voiceURI: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="">Default System Natural Voice</option>
                {availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 block mt-1">
                {availableVoices.length > 0
                  ? `${availableVoices.length} speech synthesis voices detected.`
                  : 'System voices initializing...'}
              </span>
            </div>

            {/* Voice Pitch Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Voice Pitch</span>
                <span className="font-mono text-red-400">{voiceSettings.pitch.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                value={voiceSettings.pitch}
                onChange={(e) =>
                  setVoiceSettings({ ...voiceSettings, pitch: parseFloat(e.target.value) })
                }
                className="w-full accent-red-500 bg-slate-950 cursor-pointer h-1.5 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>Deeper</span>
                <span>Normal</span>
                <span>Higher</span>
              </div>
            </div>

            {/* Voice Speed Rate Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Speech Speed Rate</span>
                <span className="font-mono text-red-400">{voiceSettings.rate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={voiceSettings.rate}
                onChange={(e) =>
                  setVoiceSettings({ ...voiceSettings, rate: parseFloat(e.target.value) })
                }
                className="w-full accent-red-500 bg-slate-950 cursor-pointer h-1.5 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>Calm (0.8x)</span>
                <span>Normal (1.0x)</span>
                <span>Brisk (1.3x)</span>
              </div>
            </div>

            {/* Volume Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Voice Volume</span>
                <span className="font-mono text-red-400">{Math.round(voiceSettings.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={voiceSettings.volume}
                onChange={(e) =>
                  setVoiceSettings({ ...voiceSettings, volume: parseFloat(e.target.value) })
                }
                className="w-full accent-red-500 bg-slate-950 cursor-pointer h-1.5 rounded-lg"
              />
            </div>

            {/* Authentic Arabic Pronunciation Toggle */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-white">
                    Authentic Arabic Pronunciation
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Tunes sacred words like <em>Fi Amanillah</em>, <em>Assalamu Alaikum</em>, and <em>Alhamdulillah</em> with authentic phonetics and proper vowels.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setVoiceSettings({ ...voiceSettings, enhanceArabic: !voiceSettings.enhanceArabic })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  voiceSettings.enhanceArabic ? 'bg-emerald-600' : 'bg-slate-800'
                }`}
                aria-label="Toggle Arabic Phonetic Optimization"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    voiceSettings.enhanceArabic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Audio Test & Reset Controls */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestVoice}
                disabled={isPlayingTestAudio}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all"
              >
                <Play className={`w-3.5 h-3.5 text-red-400 ${isPlayingTestAudio ? 'animate-spin' : ''}`} />
                <span>{isPlayingTestAudio ? 'Speaking...' : 'Test Voice Preview'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetVoiceDefaults}
                className="py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1"
                title="Reset to default voice settings"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-800 mt-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSaveAll()}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-xs font-bold text-white shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Settings &amp; Apply</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
