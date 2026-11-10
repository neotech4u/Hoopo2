/**
 * In-browser Web Audio Synthesizer and Advanced Speech Engine for Hoopo Car Companion.
 * Includes authentic Arabic phonetic pronunciation optimization, custom voice selection,
 * FM radio synthesis, and in-car music player tracks.
 */

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  category: 'Quran' | 'Nasheed' | 'Lo-fi' | 'Adhkar';
  durationSeconds: number;
}

export const PLAYLIST_TRACKS: MusicTrack[] = [
  {
    id: 'track-1',
    title: 'Surah Al-Mulk (The Protector)',
    artist: 'Mishary Rashid Alafasy',
    category: 'Quran',
    durationSeconds: 275,
  },
  {
    id: 'track-2',
    title: 'Morning & Evening Adhkar',
    artist: 'Hisn al-Muslim Companion',
    category: 'Adhkar',
    durationSeconds: 310,
  },
  {
    id: 'track-3',
    title: 'Mawlaya (Spiritual Harmony)',
    artist: 'Acoustic Travel Nasheed',
    category: 'Nasheed',
    durationSeconds: 240,
  },
  {
    id: 'track-4',
    title: 'Desert Dunes at Dusk',
    artist: 'Highway Lo-Fi Beats',
    category: 'Lo-fi',
    durationSeconds: 195,
  },
  {
    id: 'track-5',
    title: 'Rain on Windshield Meditation',
    artist: 'Cabin Chill Waves',
    category: 'Lo-fi',
    durationSeconds: 220,
  },
];

/* =======================================================================
 * ARABIC PHONETIC PRONUNCIATION PROCESSOR FOR TTS ENGINES
 * ======================================================================= */

/**
 * Phonetically tunes Arabic sacred phrases, greetings, and Islamic terminology
 * so standard English/browser speech synthesizers pronounce them with authentic
 * Arabic phonetics, correct vowel length, and accurate articulation.
 */
export function phoneticizeArabicPhrases(text: string): string {
  if (!text) return text;

  let processed = text;

  // Dictionary of sacred phrases with authentic phonetic equivalents for standard English TTS engines
  const phoneticMap: Array<{ pattern: RegExp; replacement: string }> = [
    // Greetings & Farewells (with various transliteration spellings: alikum, alaikkum, alaikum, alaykum)
    { pattern: /\bFi\s*Amaan?il+a+h\b/gi, replacement: "Fee Ah-maan-ill-laah" },
    { pattern: /\bFi\s*Amaan?\s*Al+a+h\b/gi, replacement: "Fee Ah-maan-ill-laah" },
    { pattern: /\bFee\s*Amaan?il+a+h\b/gi, replacement: "Fee Ah-maan-ill-laah" },
    { pattern: /\bAss?al+a+mu\s*(Alaik+um|Alik+um|Alayk+um|Alaikum)(\s*wa\s*Rah?matul+a+h)?\b/gi, replacement: "As-Salaamu 'Alaykum wa Rahmat-ul-laah" },
    { pattern: /\bAss?al+a+mu\s*(Alaik+um|Alik+um|Alayk+um|Alikum)\b/gi, replacement: "As-Salaamu 'Alaykum" },
    { pattern: /\bSal+a+m\s*(Alaik+um|Alik+um|Alayk+um|Alikum)\b/gi, replacement: "Salaam 'Alaykum" },
    { pattern: /\bWa\s*(Alaik+um|Alik+um|Alayk+um)\s*Ass?al+a+m\b/gi, replacement: "Wa 'Alaykum As-Salaam" },

    // Core Remembrances (Dhikr) & Duas
    { pattern: /\bAl[- ]?hamdu\s*lil+a+h\b/gi, replacement: "Al-hum-doo-lillaah" },
    { pattern: /\bSubh?an\s*Al+a+h\b/gi, replacement: "Soob-haan-Allaah" },
    { pattern: /\bBismillah(\s*ir[- ]Rahman\s*ir[- ]Rahim)?\b/gi, replacement: "Bismil-laahir-Rahmaanir-Raheem" },
    { pattern: /\bAllahu?\s*Akbar\b/gi, replacement: "Allaahu Akbar" },
    { pattern: /\bLa\s*ilaha\s*ill[- ]?allah\b/gi, replacement: "Laa ilaaha ill-Allaah" },
    { pattern: /\bAstaghfir[- ]?ullah\b/gi, replacement: "As-tagh-fir-ul-laah" },
    { pattern: /\bJazak[- ]?Allahu?(\s*Khay?ran?)?\b/gi, replacement: "Jazaak-Allaahu Khayr" },
    { pattern: /\bBarak[- ]?Allahu?(\s*Feek)?\b/gi, replacement: "Baarak-Allaahu Feek" },
    { pattern: /\bInsha[- ]?Allah\b/gi, replacement: "In-sha-Allaah" },
    { pattern: /\bMasha[- ]?Allah\b/gi, replacement: "Maa-sha-Allaah" },
    { pattern: /\bTawakkaltu\s*alal[- ]?lah\b/gi, replacement: "Ta-wak-kal-too 'Alal-laah" },

    // Prayer & Travel terminology
    { pattern: /\bDua\s*(as[- ])?Safar\b/gi, replacement: "Doo'aa as-Safar" },
    { pattern: /\bMusalla\b/gi, replacement: "Moo-sal-laa" },
    { pattern: /\bQibla\b/gi, replacement: "Qib-lah" },
    { pattern: /\bAdhan\b/gi, replacement: "Adhaan" },
    { pattern: /\bAzan\b/gi, replacement: "Adhaan" },
    { pattern: /\bSalah\b/gi, replacement: "Sa-laah" },
    { pattern: /\bFajr\b/gi, replacement: "Fajr" },
    { pattern: /\bDhuhr\b/gi, replacement: "Dhu-hur" },
    { pattern: /\bZuhr\b/gi, replacement: "Dhu-hur" },
    { pattern: /\bAsr\b/gi, replacement: "'Asr" },
    { pattern: /\bMaghrib\b/gi, replacement: "Mugh-rib" },
    { pattern: /\bIsha\b/gi, replacement: "‘Ishaa" },
    { pattern: /\bSurah\s*Al-Mulk\b/gi, replacement: "Soorah Al-Moolk" },
    { pattern: /\bHudhud\b/gi, replacement: "Hood-hood" },
  ];

  for (const item of phoneticMap) {
    processed = processed.replace(item.pattern, item.replacement);
  }

  return processed;
}

/* =======================================================================
 * CUSTOM VOICE SETTINGS
 * ======================================================================= */

export interface VoiceSettings {
  voiceURI: string;
  pitch: number; // 0.8 to 1.4
  rate: number; // 0.8 to 1.3
  volume: number; // 0.0 to 1.0
  enhanceArabic: boolean;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  voiceURI: '',
  pitch: 1.1,
  rate: 1.0,
  volume: 0.9,
  enhanceArabic: true,
};

export function getStoredVoiceSettings(): VoiceSettings {
  if (typeof window === 'undefined') return DEFAULT_VOICE_SETTINGS;
  try {
    const raw = localStorage.getItem('hoopo_voice_settings');
    if (raw) return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return DEFAULT_VOICE_SETTINGS;
}

export function saveStoredVoiceSettings(settings: VoiceSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('hoopo_voice_settings', JSON.stringify(settings));
  } catch {
    // ignore
  }
}

/**
 * Returns available system speech synthesis voices.
 */
export function getSystemSpeechVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices() || [];
}

/* =======================================================================
 * WEB AUDIO SYNTHESIZER
 * ======================================================================= */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private currentRadioOscillators: (OscillatorNode | AudioNode)[] = [];
  private radioGainNode: GainNode | null = null;
  private isRadioPlaying = false;
  private radioTimer: any = null;

  private isMusicPlaying = false;
  private currentMusicOscillators: (OscillatorNode | AudioNode)[] = [];
  private musicGainNode: GainNode | null = null;
  private musicTimer: any = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a welcoming Islamic greeting / chime
  playGreetingChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.65);
      });
    } catch (e) {
      console.warn('Audio not allowed yet:', e);
    }
  }

  // Tactical Redwing speed warning alert
  playSpeedWarning() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now + i * 0.18);
        osc.frequency.setValueAtTime(659.25, now + i * 0.18 + 0.09);
        gain.gain.setValueAtTime(0.22, now + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.18 + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 0.17);
      }
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Prayer adhan reminder chime
  playPrayerChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.22);
        gain.gain.setValueAtTime(0.18, now + idx * 0.22);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.22 + 1.2);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.22);
        osc.stop(now + idx * 0.22 + 1.3);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Start continuous radio audio synthesis based on station genre
  startRadioStation(frequency: number, genre: string, volume: number = 0.5) {
    this.stopRadio();
    this.stopMusic();
    try {
      this.initCtx();
      if (!this.ctx) return;
      this.isRadioPlaying = true;

      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.15, this.ctx.currentTime);
      masterGain.connect(this.ctx.destination);
      this.radioGainNode = masterGain;

      this.playTuningStatic(0.18);

      let step = 0;
      const chordProgression = this.getProgressionForGenre(genre);

      const playNextChord = () => {
        if (!this.isRadioPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;
        const freqs = chordProgression[step % chordProgression.length];
        step++;

        freqs.forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          const noteGain = this.ctx!.createGain();
          osc.type = genre.includes('quran') || genre.includes('nasheed') ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, now);

          noteGain.gain.setValueAtTime(0, now);
          noteGain.gain.linearRampToValueAtTime(0.12, now + 0.15);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

          osc.connect(noteGain);
          noteGain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 1.9);
          this.currentRadioOscillators.push(osc);
        });

        this.radioTimer = setTimeout(playNextChord, 1200);
      };

      playNextChord();
    } catch (e) {
      console.warn('Radio audio error:', e);
    }
  }

  // Start Music Player track synthesis
  startMusicTrack(track: MusicTrack, volume: number = 0.6) {
    this.stopRadio();
    this.stopMusic();
    try {
      this.initCtx();
      if (!this.ctx) return;
      this.isMusicPlaying = true;

      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.18, this.ctx.currentTime);
      masterGain.connect(this.ctx.destination);
      this.musicGainNode = masterGain;

      let step = 0;
      const progression = this.getProgressionForCategory(track.category);

      const playNextMelody = () => {
        if (!this.isMusicPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;
        const chord = progression[step % progression.length];
        step++;

        chord.forEach((freq, i) => {
          const osc = this.ctx!.createOscillator();
          const noteGain = this.ctx!.createGain();
          osc.type = track.category === 'Quran' || track.category === 'Adhkar' ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);

          noteGain.gain.setValueAtTime(0, now + i * 0.08);
          noteGain.gain.linearRampToValueAtTime(0.14, now + i * 0.08 + 0.12);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 2.0);

          osc.connect(noteGain);
          noteGain.connect(masterGain);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 2.1);
          this.currentMusicOscillators.push(osc);
        });

        this.musicTimer = setTimeout(playNextMelody, 1400);
      };

      playNextMelody();
    } catch (e) {
      console.warn('Music track audio error:', e);
    }
  }

  private getProgressionForCategory(category: string): number[][] {
    switch (category) {
      case 'Quran':
        return [
          [293.66, 349.23, 440.0],
          [261.63, 329.63, 392.0],
          [246.94, 293.66, 370.0],
          [293.66, 349.23, 440.0],
        ];
      case 'Adhkar':
        return [
          [220.0, 329.63, 440.0],
          [261.63, 392.0, 523.25],
          [196.0, 293.66, 392.0],
          [220.0, 329.63, 440.0],
        ];
      case 'Nasheed':
        return [
          [261.63, 329.63, 392.0],
          [220.0, 261.63, 329.63],
          [174.61, 220.0, 261.63],
          [196.0, 246.94, 293.66],
        ];
      default:
        return [
          [261.63, 329.63, 392.0, 493.88],
          [220.0, 261.63, 329.63, 392.0],
          [174.61, 220.0, 261.63, 329.63],
          [196.0, 246.94, 293.66, 349.23],
        ];
    }
  }

  private getProgressionForGenre(genre: string): number[][] {
    const g = genre.toLowerCase();
    if (g.includes('quran')) {
      return [
        [220.0, 329.63, 440.0],
        [246.94, 370.0, 493.88],
        [261.63, 392.0, 523.25],
        [220.0, 329.63, 440.0],
      ];
    }
    if (g.includes('nasheed')) {
      return [
        [261.63, 329.63, 392.0],
        [220.0, 261.63, 329.63],
        [174.61, 220.0, 261.63],
        [196.0, 246.94, 293.66],
      ];
    }
    return [
      [220.0, 277.18, 329.63],
      [196.0, 246.94, 293.66],
      [164.81, 207.65, 246.94],
      [174.61, 220.0, 261.63],
    ];
  }

  setRadioVolume(volume: number) {
    if (this.radioGainNode && this.ctx) {
      this.radioGainNode.gain.setValueAtTime(volume * 0.15, this.ctx.currentTime);
    }
    if (this.musicGainNode && this.ctx) {
      this.musicGainNode.gain.setValueAtTime(volume * 0.18, this.ctx.currentTime);
    }
  }

  playTuningStatic(durationSec: number = 0.15) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const bufferSize = Math.floor(this.ctx.sampleRate * durationSec);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + durationSec);
      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      whiteNoise.start();
    } catch (e) {
      console.warn('Static audio error:', e);
    }
  }

  stopRadio() {
    this.isRadioPlaying = false;
    if (this.radioTimer) {
      clearTimeout(this.radioTimer);
      this.radioTimer = null;
    }
    this.currentRadioOscillators.forEach((osc) => {
      try {
        (osc as OscillatorNode).stop();
      } catch {
        // ignore
      }
    });
    this.currentRadioOscillators = [];
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    this.currentMusicOscillators.forEach((osc) => {
      try {
        (osc as OscillatorNode).stop();
      } catch {
        // ignore
      }
    });
    this.currentMusicOscillators = [];
  }
}

export const soundEngine = new SoundEngine();

/**
 * Text-to-Speech vocal assistance for Hoopo with authentic Arabic phonetic optimization
 * and custom voice settings.
 */
export function speakHoopoMessage(text: string, overrideSettings?: Partial<VoiceSettings>) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();

    const settings = { ...getStoredVoiceSettings(), ...overrideSettings };
    // Apply Arabic phonetic pronunciation pre-processing if enabled
    const vocalText = settings.enhanceArabic ? phoneticizeArabicPhrases(text) : text;

    const utterance = new SpeechSynthesisUtterance(vocalText);
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    // Pick selected voice or fallback to natural English/Arabic voice
    const voices = window.speechSynthesis.getVoices();
    if (settings.voiceURI && voices.length > 0) {
      const match = voices.find((v) => v.voiceURI === settings.voiceURI);
      if (match) utterance.voice = match;
    } else if (voices.length > 0) {
      // Prefer natural Google, Microsoft, or Apple English voice
      const preferred = voices.find(
        (v) =>
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Enhanced')) &&
          v.lang.startsWith('en')
      );
      if (preferred) utterance.voice = preferred;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis unavailable:', e);
  }
}
