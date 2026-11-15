import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Play,
  Pause,
  Trash2,
  Volume2,
  Sparkles,
  MapPin,
  Clock,
  Gauge,
  Tag,
  Check,
  FileAudio,
  Plus,
  Copy,
  ChevronRight,
} from 'lucide-react';
import {
  VoiceNote,
  createVoiceNote,
  deleteVoiceNote,
  clearAllVoiceNotes,
} from '../utils/voiceNotes';
import { speakHoopoMessage, soundEngine } from '../utils/audioSynthesizer';

interface QuickVoiceNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceNotes: VoiceNote[];
  onNotesChange: (notes: VoiceNote[]) => void;
  currentSpeed?: number;
  currentCoords?: [number, number] | null;
  userName?: string;
  initialOpenRecord?: boolean;
}

export const QuickVoiceNotesModal: React.FC<QuickVoiceNotesModalProps> = ({
  isOpen,
  onClose,
  voiceNotes,
  onNotesChange,
  currentSpeed = 0,
  currentCoords,
  userName = 'Friend',
  initialOpenRecord = false,
}) => {
  const [activeTab, setActiveTab] = useState<'record' | 'list'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [selectedTag, setSelectedTag] = useState<VoiceNote['tag']>('Reminder');
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Available tags
  const tags: VoiceNote['tag'][] = [
    'Reminder',
    'Car Maintenance',
    'Fuel / Expense',
    'Trip Memory',
    'General',
  ];

  useEffect(() => {
    if (isOpen) {
      if (initialOpenRecord || voiceNotes.length === 0) {
        setActiveTab('record');
      } else {
        setActiveTab('list');
      }
    } else {
      stopRecordingSession();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingNoteId(null);
    }
  }, [isOpen, initialOpenRecord]);

  // Clean up timer and media on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  if (!isOpen) return null;

  const startRecordingSession = async () => {
    setTranscript('');
    setRecordingSeconds(0);
    audioChunksRef.current = [];
    soundEngine.playGreetingChime();

    // 1. Setup Web Speech Recognition for Live Transcription
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTrans = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTrans += event.results[i][0].transcript + ' ';
          }
          setTranscript(currentTrans.trim());
        };

        recognition.onerror = (e: any) => {
          console.warn('SpeechRecognition error:', e);
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
      } catch (err) {
        console.warn('Could not start speech recognition:', err);
      }
    }

    // 2. Setup MediaRecorder for native Audio Clip
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(250);
      } catch (err) {
        console.warn('Microphone permission or MediaRecorder not available:', err);
      }
    }

    setIsRecording(true);

    // 3. Start Timer
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopRecordingSession = async () => {
    setIsRecording(false);
    clearInterval(timerIntervalRef.current);

    // Stop speech recognition
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      } catch {}
    }
  };

  const handleSaveRecordedNote = async () => {
    await stopRecordingSession();

    let audioDataUrl: string | undefined = undefined;
    if (audioChunksRef.current.length > 0) {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Convert small blob to base64 Data URL
        audioDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(audioBlob);
        });
      } catch (e) {
        console.warn('Could not encode audio blob:', e);
      }
    }

    const noteText = transcript.trim() || `Voice Note (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;

    const newNote = createVoiceNote(noteText, {
      audioDataUrl,
      audioDurationSeconds: recordingSeconds,
      lat: currentCoords ? currentCoords[0] : undefined,
      lng: currentCoords ? currentCoords[1] : undefined,
      speedKmH: Math.round(currentSpeed),
      tag: selectedTag,
    });

    onNotesChange([newNote, ...voiceNotes.filter((n) => n.id !== newNote.id)]);
    soundEngine.playGreetingChime();
    speakHoopoMessage(`Voice note saved for ${userName}.`);

    // Reset and switch to list tab
    setTranscript('');
    setRecordingSeconds(0);
    setActiveTab('list');
  };

  const handleDeleteNote = (id: string) => {
    const updated = deleteVoiceNote(id);
    onNotesChange(updated);
    if (playingNoteId === id) {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      setPlayingNoteId(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Delete all recorded voice notes?')) {
      clearAllVoiceNotes();
      onNotesChange([]);
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      setPlayingNoteId(null);
    }
  };

  const handlePlayAudioNote = (note: VoiceNote) => {
    if (playingNoteId === note.id) {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      setPlayingNoteId(null);
      return;
    }

    if (note.audioDataUrl) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(note.audioDataUrl);
      audioPlayerRef.current = audio;
      setPlayingNoteId(note.id);

      audio.onended = () => {
        setPlayingNoteId(null);
      };
      audio.onerror = () => {
        setPlayingNoteId(null);
        // Fallback to text-to-speech
        speakHoopoMessage(note.transcript);
      };
      audio.play().catch(() => {
        setPlayingNoteId(null);
        speakHoopoMessage(note.transcript);
      });
    } else {
      // Read aloud via TTS
      speakHoopoMessage(note.transcript);
    }
  };

  const handleCopyNote = (note: VoiceNote) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(note.transcript);
      setCopiedId(note.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredNotes = voiceNotes.filter((n) => {
    if (filterTag === 'all') return true;
    return n.tag === filterTag;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-notes-modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FileAudio className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="voice-notes-modal-title"
                className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2"
              >
                <span>Voice-Activated Quick Notes</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono">
                  Hands-Free
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Record roadside thoughts, maintenance reminders, and fuel logs without distraction
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              aria-label="Close voice notes modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950/60 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('record')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'record'
                  ? 'bg-cyan-500/20 border border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Note</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'list'
                  ? 'bg-cyan-500/20 border border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileAudio className="w-3.5 h-3.5" />
              <span>Saved Notes ({voiceNotes.length})</span>
            </button>
          </div>

          {activeTab === 'list' && voiceNotes.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-950/40"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'record' ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              {/* Hands-Free Voice Activated Banner */}
              <div className="w-full p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-800/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-slate-300">
                    <strong className="text-cyan-300">Hands-Free Command:</strong> Say{' '}
                    <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-200 font-mono text-[11px]">
                      &quot;Hoopoe, take a note...&quot;
                    </code>{' '}
                    anytime to record automatically!
                  </span>
                </div>
              </div>

              {/* Big Record Button */}
              <div className="relative flex flex-col items-center my-2">
                <button
                  type="button"
                  onClick={isRecording ? stopRecordingSession : startRecordingSession}
                  className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-xl cursor-pointer ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-500 shadow-red-600/50 scale-105 animate-pulse'
                      : 'bg-gradient-to-tr from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 shadow-cyan-600/40 hover:scale-105'
                  }`}
                  aria-label={isRecording ? 'Stop recording voice note' : 'Start recording voice note'}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-8 h-8 text-white mb-1" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                        Stop
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-8 h-8 text-white mb-1" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                        Record
                      </span>
                    </>
                  )}
                </button>

                {/* Live timer display */}
                {isRecording && (
                  <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-mono font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>
                      Recording: {Math.floor(recordingSeconds / 60)}:
                      {(recordingSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>

              {/* Live Transcript & Input Box */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="text-slate-400">Live Voice Transcription:</span>
                  <span className="text-[11px] text-cyan-400">
                    {isRecording ? 'Listening...' : 'Type or edit transcript below'}
                  </span>
                </div>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={
                    isRecording
                      ? 'Speak now... Your voice note will appear here in real-time.'
                      : 'Tap Record to speak, or type your roadside reminder here...'
                  }
                  rows={3}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                />
              </div>

              {/* Tag Selector */}
              <div className="w-full flex flex-col gap-1.5">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Category Tag:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedTag === tag
                          ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300'
                          : 'bg-slate-800/70 border border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telematics Snapshot Preview */}
              <div className="w-full p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Speed: {Math.round(currentSpeed)} km/h</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    GPS: {currentCoords ? `${currentCoords[0].toFixed(3)}, ${currentCoords[1].toFixed(3)}` : 'Logged'}
                  </span>
                </div>
              </div>

              {/* Save / Cancel Action */}
              <div className="w-full flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopRecordingSession();
                    setTranscript('');
                    setActiveTab('list');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRecordedNote}
                  disabled={!transcript.trim() && !isRecording}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Voice Note</span>
                </button>
              </div>
            </div>
          ) : (
            /* Saved Notes List Tab */
            <div className="flex flex-col space-y-3">
              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <button
                  type="button"
                  onClick={() => setFilterTag('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filterTag === 'all'
                      ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300'
                      : 'bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({voiceNotes.length})
                </button>
                {tags.map((t) => {
                  const count = voiceNotes.filter((n) => n.tag === t).length;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFilterTag(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        filterTag === t
                          ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300'
                          : 'bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Notes List */}
              {filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                  <FileAudio className="w-12 h-12 text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No voice notes saved yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Tap &quot;Record New Note&quot; or say &quot;Hoopoe, take a note...&quot; while driving to capture roadside thoughts.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('record')}
                    className="mt-4 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Voice Note</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2.5">
                  {filteredNotes.map((note) => {
                    const isPlaying = playingNoteId === note.id;
                    return (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                note.tag === 'Car Maintenance'
                                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                  : note.tag === 'Fuel / Expense'
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                  : note.tag === 'Reminder'
                                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                                  : note.tag === 'Trip Memory'
                                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                                  : 'bg-slate-700/40 border-slate-600 text-slate-300'
                              }`}
                            >
                              {note.tag}
                            </span>
                            <span className="text-xs font-bold text-white">{note.title}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Copy transcript */}
                            <button
                              type="button"
                              onClick={() => handleCopyNote(note)}
                              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                              title="Copy transcript"
                            >
                              {copiedId === note.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Delete note */}
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                              title="Delete voice note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Transcript Content */}
                        <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                          &quot;{note.transcript}&quot;
                        </p>

                        {/* Note Metadata and Playback Bar */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[11px] text-slate-400 flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>
                                {note.dateFormatted} &bull; {note.createdTimeFormatted}
                              </span>
                            </span>
                            {note.speedKmH !== undefined && (
                              <span className="flex items-center gap-1">
                                <Gauge className="w-3 h-3 text-cyan-500" />
                                <span>{note.speedKmH} km/h</span>
                              </span>
                            )}
                            {note.lat && note.lng && (
                              <span className="flex items-center gap-1 text-[10px]">
                                <MapPin className="w-3 h-3 text-amber-500" />
                                <span>
                                  {note.lat.toFixed(2)}, {note.lng.toFixed(2)}
                                </span>
                              </span>
                            )}
                          </div>

                          {/* Play Audio / Speak Aloud Button */}
                          <button
                            type="button"
                            onClick={() => handlePlayAudioNote(note)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                              isPlaying
                                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                                : 'bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700'
                            }`}
                          >
                            {isPlaying ? (
                              <>
                                <Pause className="w-3.5 h-3.5" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                {note.audioDataUrl ? (
                                  <Play className="w-3.5 h-3.5" />
                                ) : (
                                  <Volume2 className="w-3.5 h-3.5" />
                                )}
                                <span>{note.audioDataUrl ? 'Play Audio' : 'Speak Note'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">
            Logged safely inside Hoopoe Automotive Storage
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
