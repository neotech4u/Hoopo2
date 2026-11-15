/**
 * Voice Notes Utility for Hoopoe AI Car Companion
 * Allows drivers to record quick, hands-free voice notes while driving
 * (e.g. maintenance reminders, route notes, travel memories, fuel logs).
 */

export interface VoiceNote {
  id: string;
  title: string;
  transcript: string;
  audioDataUrl?: string; // Optional audio recording (base64 data URL)
  audioDurationSeconds?: number;
  timestamp: string; // ISO 8601
  createdTimeFormatted: string; // e.g. "19:15"
  dateFormatted: string; // e.g. "15 Nov 2026"
  lat?: number;
  lng?: number;
  locationName?: string;
  speedKmH?: number;
  tag: 'General' | 'Car Maintenance' | 'Trip Memory' | 'Reminder' | 'Fuel / Expense';
}

const STORAGE_KEY = 'hoopo_voice_notes';

/**
 * Retrieve saved voice notes from persistent storage
 */
export function getStoredVoiceNotes(): VoiceNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading voice notes from storage:', e);
  }

  // Initial welcome sample note for the driver
  return [
    {
      id: 'vn-sample-1',
      title: 'Tire Pressure & Coolant Check',
      transcript: 'Remember to check front left tire pressure at 33 PSI and top up windshield washer fluid at the next highway fuel station.',
      audioDurationSeconds: 6,
      timestamp: new Date().toISOString(),
      createdTimeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateFormatted: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      lat: 8.7139,
      lng: 77.7567,
      locationName: 'Tirunelveli Bypass',
      speedKmH: 72,
      tag: 'Car Maintenance',
    },
  ];
}

/**
 * Persist voice notes array to local storage
 */
export function saveStoredVoiceNotes(notes: VoiceNote[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save voice notes:', e);
  }
}

/**
 * Create and prepend a new voice note
 */
export function createVoiceNote(
  transcript: string,
  options?: {
    title?: string;
    audioDataUrl?: string;
    audioDurationSeconds?: number;
    lat?: number;
    lng?: number;
    locationName?: string;
    speedKmH?: number;
    tag?: VoiceNote['tag'];
  }
): VoiceNote {
  const now = new Date();
  const cleanTranscript = (transcript || '').trim();
  
  // Auto-generate title if not specified
  let generatedTitle = options?.title;
  if (!generatedTitle) {
    if (cleanTranscript.length > 0) {
      generatedTitle = cleanTranscript.slice(0, 36) + (cleanTranscript.length > 36 ? '...' : '');
    } else {
      generatedTitle = `Voice Note ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  }

  // Smart tag categorization based on content keywords
  let autoTag: VoiceNote['tag'] = options?.tag || 'General';
  const lower = cleanTranscript.toLowerCase();
  if (lower.includes('fuel') || lower.includes('petrol') || lower.includes('diesel') || lower.includes('toll') || lower.includes('rupee') || lower.includes('bunk') || lower.includes('liters')) {
    autoTag = 'Fuel / Expense';
  } else if (lower.includes('tire') || lower.includes('engine') || lower.includes('brake') || lower.includes('service') || lower.includes('pressure') || lower.includes('fluid') || lower.includes('oil')) {
    autoTag = 'Car Maintenance';
  } else if (lower.includes('remember') || lower.includes('call') || lower.includes('buy') || lower.includes('pick up') || lower.includes('task') || lower.includes('todo')) {
    autoTag = 'Reminder';
  } else if (lower.includes('view') || lower.includes('photo') || lower.includes('sunset') || lower.includes('trip') || lower.includes('tea') || lower.includes('hotel') || lower.includes('scenic')) {
    autoTag = 'Trip Memory';
  }

  const note: VoiceNote = {
    id: `vn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: generatedTitle,
    transcript: cleanTranscript,
    audioDataUrl: options?.audioDataUrl,
    audioDurationSeconds: options?.audioDurationSeconds,
    timestamp: now.toISOString(),
    createdTimeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    dateFormatted: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    lat: options?.lat,
    lng: options?.lng,
    locationName: options?.locationName,
    speedKmH: options?.speedKmH,
    tag: autoTag,
  };

  const existing = getStoredVoiceNotes();
  const updated = [note, ...existing];
  saveStoredVoiceNotes(updated);
  return note;
}

/**
 * Delete a voice note by id
 */
export function deleteVoiceNote(id: string): VoiceNote[] {
  const existing = getStoredVoiceNotes();
  const filtered = existing.filter((n) => n.id !== id);
  saveStoredVoiceNotes(filtered);
  return filtered;
}

/**
 * Clear all voice notes
 */
export function clearAllVoiceNotes(): void {
  saveStoredVoiceNotes([]);
}

/**
 * Detect voice note command from user spoken text
 * e.g. "Take a note check tire pressure", "Remember this call brother", "Note: pick up tea"
 */
export function parseVoiceNoteTrigger(transcript: string): {
  isVoiceNoteTrigger: boolean;
  noteContent: string;
} {
  const clean = (transcript || '').trim();
  const lower = clean.toLowerCase();

  const triggers = [
    'take a note',
    'record a note',
    'save a note',
    'quick note',
    'voice note',
    'remember this',
    'make a note',
    'create a note',
    'note:',
    'note that',
  ];

  for (const trigger of triggers) {
    if (lower.startsWith(trigger)) {
      const rest = clean.slice(trigger.length).replace(/^[:\s,-]+/, '').trim();
      return {
        isVoiceNoteTrigger: true,
        noteContent: rest,
      };
    }
  }

  if (lower.includes('take a note') || lower.includes('voice note') || lower.includes('remember this')) {
    // Extract whatever follows
    const match = clean.match(/(?:take a note|voice note|remember this)\s*(?:that|to)?\s*[:,-]?\s*(.*)/i);
    if (match && match[1]) {
      return {
        isVoiceNoteTrigger: true,
        noteContent: match[1].trim(),
      };
    }
    return {
      isVoiceNoteTrigger: true,
      noteContent: '',
    };
  }

  return {
    isVoiceNoteTrigger: false,
    noteContent: '',
  };
}
