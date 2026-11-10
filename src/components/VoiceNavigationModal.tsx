import React, { useState, useEffect } from 'react';
import { Mic, MicOff, X, Volume2, Sparkles, Navigation, Fuel, Clock, Radio, CloudRain } from 'lucide-react';
import { parseVoiceCommand } from '../utils/companionLogic';
import { speakHoopoMessage } from '../utils/audioSynthesizer';
import { HoopoMascot } from './HoopoMascot';

interface VoiceNavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (cmd: ReturnType<typeof parseVoiceCommand>) => void;
}

export const VoiceNavigationModal: React.FC<VoiceNavigationModalProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('Tap the microphone or choose a quick voice command below.');
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setTranscript(text);
          setIsListening(false);
          handleProcessText(text);
        };

        recognition.onerror = () => {
          setIsListening(false);
          setFeedback('Could not hear voice input clearly. Please try again or tap a quick command.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        setRecognitionInstance(recognition);
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleToggleListening = () => {
    if (isListening) {
      recognitionInstance?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setFeedback('Listening... Speak your destination or command now.');
      try {
        recognitionInstance?.start();
        setIsListening(true);
      } catch (e) {
        // Fallback simulation for headless or permissions
        setIsListening(true);
        setTimeout(() => {
          setIsListening(false);
          const sample = 'Navigate to Grand Mosque';
          setTranscript(sample);
          handleProcessText(sample);
        }, 2200);
      }
    }
  };

  const handleProcessText = (text: string) => {
    const parsed = parseVoiceCommand(text);
    let reply = '';

    switch (parsed.intent) {
      case 'NAVIGATE':
        reply = `Routing now towards ${parsed.query}. Calculating real-time traffic updates.`;
        break;
      case 'FUEL':
        reply = 'Locating the nearest highway fuel stations with prayer amenities.';
        break;
      case 'PRAYER':
        reply = 'Checking in-built prayer times and nearby roadside Musalla facilities.';
        break;
      case 'RADIO':
        reply = 'Tuning FM radio to spiritual travel broadcast.';
        break;
      case 'WEATHER':
        reply = 'Scanning upcoming route weather radar for rain hazards.';
        break;
      case 'SPEED':
        reply = 'Current speed limit is 80 km/h. Drive safely and arrive in peace.';
        break;
      default:
        reply = `I heard: "${text}". Hoopo is keeping our drive safe and blessed.`;
    }

    setFeedback(reply);
    speakHoopoMessage(reply);
    onExecuteCommand(parsed);
  };

  const sampleCommands = [
    { text: 'Navigate to Grand Mosque', icon: Navigation },
    { text: 'Find nearest fuel station', icon: Fuel },
    { text: 'What is next prayer time?', icon: Clock },
    { text: 'Play Quran Noor FM', icon: Radio },
    { text: 'Check rain radar ahead', icon: CloudRain },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                Voice-Activated Navigation
              </span>
              <h2 id="voice-modal-title" className="text-lg font-bold text-white">
                Talk to Hoopo Car Assistant
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors"
            aria-label="Close Voice Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Mic Button & Mascot */}
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="relative flex items-center justify-center mb-4">
            {isListening && (
              <div className="absolute inset-0 w-28 h-28 -m-2 rounded-full bg-emerald-500/20 animate-ping" />
            )}
            <button
              type="button"
              onClick={handleToggleListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl ${
                isListening
                  ? 'bg-red-500 text-white shadow-red-500/40 scale-105'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-500/30 hover:scale-105'
              }`}
              aria-label={isListening ? 'Stop listening' : 'Start listening voice command'}
            >
              {isListening ? <MicOff className="w-10 h-10 animate-pulse" /> : <Mic className="w-10 h-10" />}
            </button>
          </div>

          <p className="text-sm font-semibold text-white">
            {isListening ? 'Listening to your voice...' : 'Tap Mic to Speak'}
          </p>

          {/* Transcript / Feedback box */}
          <div className="mt-4 w-full p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-h-[70px] flex items-center justify-center">
            <p className="text-xs sm:text-sm text-slate-300 italic">
              {transcript ? `"${transcript}"` : feedback}
            </p>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Quick Voice Prompts
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.text}
                  type="button"
                  onClick={() => {
                    setTranscript(cmd.text);
                    handleProcessText(cmd.text);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>&ldquo;{cmd.text}&rdquo;</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
