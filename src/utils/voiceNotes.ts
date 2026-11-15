/**
 * Voice Notes Utility for Hoopoe AI Car Companion
 * Allows drivers to record quick, hands-free voice notes while driving
 * (e.g. maintenance reminders, route notes, travel memories, fuel logs).
 * Audio blobs are stored safely in IndexedDB while metadata is stored in localStorage.
 */

export interface VoiceNote {
  id: string;
  title: string;
  transcript: string;
  hasAudio?: boolean;
  audioDurationSeconds?: number;
  audioMimeType?: string;
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
const IDB_NAME = 'hoopo_voice_notes_db';
const IDB_VERSION = 1;
const IDB_STORE_AUDIO = 'audio_blobs';

/**
 * Open or initialize the IndexedDB for audio blob persistence
 */
function openVoiceNotesDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE_AUDIO)) {
        db.createObjectStore(IDB_STORE_AUDIO);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Save audio blob into IndexedDB
 */
export async function saveAudioBlob(noteId: string, blob: Blob): Promise<boolean> {
  try {
    const db = await openVoiceNotesDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_AUDIO, 'readwrite');
      const store = tx.objectStore(IDB_STORE_AUDIO);
      const req = store.put(blob, noteId);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error || new Error('Failed to put blob'));
    });
  } catch (err) {
    console.error('Failed to save audio blob to IndexedDB:', err);
    return false;
  }
}

/**
 * Retrieve audio blob from IndexedDB
 */
export async function getAudioBlob(noteId: string): Promise<Blob | null> {
  try {
    const db = await openVoiceNotesDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_AUDIO, 'readonly');
      const store = tx.objectStore(IDB_STORE_AUDIO);
      const req = store.get(noteId);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error || new Error('Failed to get blob'));
    });
  } catch (err) {
    console.warn('Failed to read audio blob from IndexedDB:', err);
    return null;
  }
}

/**
 * Delete audio blob from IndexedDB
 */
export async function deleteAudioBlob(noteId: string): Promise<void> {
  try {
    const db = await openVoiceNotesDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_AUDIO, 'readwrite');
      const store = tx.objectStore(IDB_STORE_AUDIO);
      const req = store.delete(noteId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to delete audio blob from IndexedDB:', err);
  }
}

/**
 * Clear all audio blobs from IndexedDB
 */
export async function clearAllAudioBlobs(): Promise<void> {
  try {
    const db = await openVoiceNotesDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_AUDIO, 'readwrite');
      const store = tx.objectStore(IDB_STORE_AUDIO);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to clear audio blobs from IndexedDB:', err);
  }
}

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
      hasAudio: false,
    },
  ];
}

/**
 * Persist voice notes array to local storage with explicit error surfacing
 */
export function saveStoredVoiceNotes(notes: VoiceNote[]): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: true };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return { success: true };
  } catch (e: any) {
    console.error('Failed to save voice notes to localStorage:', e);
    return {
      success: false,
      error: e?.name === 'QuotaExceededError'
        ? 'Storage quota exceeded. Please delete some old voice notes or trips.'
        : 'Failed to save voice notes due to a storage error.',
    };
  }
}

/**
 * Create and prepend a new voice note
 */
export function createVoiceNote(
  transcript: string,
  options?: {
    id?: string;
    title?: string;
    hasAudio?: boolean;
    audioDurationSeconds?: number;
    audioMimeType?: string;
    lat?: number;
    lng?: number;
    locationName?: string;
    speedKmH?: number;
    tag?: VoiceNote['tag'];
  }
): { note: VoiceNote; storageResult: { success: boolean; error?: string } } {
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

  const noteId = options?.id || `vn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const note: VoiceNote = {
    id: noteId,
    title: generatedTitle,
    transcript: cleanTranscript,
    hasAudio: options?.hasAudio || false,
    audioDurationSeconds: options?.audioDurationSeconds,
    audioMimeType: options?.audioMimeType,
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
  const storageResult = saveStoredVoiceNotes(updated);
  return { note, storageResult };
}

/**
 * Delete a voice note by id and remove its audio blob
 */
export function deleteVoiceNote(id: string): { updatedNotes: VoiceNote[]; storageResult: { success: boolean; error?: string } } {
  deleteAudioBlob(id);
  const existing = getStoredVoiceNotes();
  const filtered = existing.filter((n) => n.id !== id);
  const storageResult = saveStoredVoiceNotes(filtered);
  return { updatedNotes: filtered, storageResult };
}

/**
 * Clear all voice notes and all audio blobs
 */
export function clearAllVoiceNotes(): { success: boolean; error?: string } {
  clearAllAudioBlobs();
  return saveStoredVoiceNotes([]);
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
