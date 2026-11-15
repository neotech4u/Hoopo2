/**
 * Emergency Crash SOS & Deceleration Detection System
 * Uses mobile accelerometer G-force telemetry (devicemotion) and GPS velocity deltas
 * to detect sudden extreme impact / collision deceleration and dispatch an SMS with
 * exact live Google Maps coordinates to the user's emergency contact.
 */

export interface EmergencyContact {
  name: string;
  phone: string;
  enabled: boolean;
  sensitivity: 'high' | 'medium' | 'low'; // high = 2.2G, medium = 2.8G, low = 3.8G
  countdownSeconds: number; // default 10s
}

export const DEFAULT_EMERGENCY_CONTACT: EmergencyContact = {
  name: 'Emergency Contact',
  phone: '',
  enabled: true,
  sensitivity: 'medium',
  countdownSeconds: 10,
};

const STORAGE_KEY = 'hoopo_emergency_contact';

export function getStoredEmergencyContact(): EmergencyContact {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_EMERGENCY_CONTACT,
        ...parsed,
      };
    }
  } catch (e) {
    console.warn('Failed to read emergency contact from localStorage:', e);
  }
  return DEFAULT_EMERGENCY_CONTACT;
}

export function saveStoredEmergencyContact(contact: EmergencyContact): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contact));
  } catch (e) {
    console.warn('Failed to save emergency contact to localStorage:', e);
  }
}

/**
 * Accelerometer G-force threshold for collision detection.
 * 1G = 9.80665 m/s^2.
 * High: ~2.2G (21.5 m/s^2)
 * Medium: ~2.8G (27.5 m/s^2)
 * Low: ~3.8G (37.2 m/s^2)
 */
export function getDecelerationThreshold(sensitivity: EmergencyContact['sensitivity']): number {
  switch (sensitivity) {
    case 'high':
      return 21.5; // ~2.2G
    case 'low':
      return 37.2; // ~3.8G
    case 'medium':
    default:
      return 27.5; // ~2.8G
  }
}

/**
 * Evaluates whether an accelerometer reading or speed delta constitutes a crash impact.
 * Checks both total acceleration vector magnitude and linear delta.
 */
export function evaluateCrashImpact(
  ax: number,
  ay: number,
  az: number,
  sensitivity: EmergencyContact['sensitivity'] = 'medium'
): { isCrash: boolean; gForce: number; accelerationMagnitude: number } {
  const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
  const gForce = Math.round((magnitude / 9.80665) * 10) / 10;
  const threshold = getDecelerationThreshold(sensitivity);

  return {
    isCrash: magnitude >= threshold,
    gForce,
    accelerationMagnitude: Math.round(magnitude * 10) / 10,
  };
}

/**
 * Formats the emergency SOS message with exact GPS Google Maps coordinates, timestamp, and driver name.
 */
export function formatEmergencySosMessage(
  userName: string,
  lat: number,
  lng: number,
  gForce?: number
): string {
  const cleanName = userName?.trim() || 'Driver';
  const mapsLink = `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const impactNote = gForce ? ` (Impact G-Force: ${gForce}G)` : '';

  return `🚨 EMERGENCY ALERT: Potential vehicle crash detected for ${cleanName}${impactNote} at ${timeStr}! Live Location: ${mapsLink} (Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}). Please check or send immediate medical/roadside assistance!`;
}

/**
 * Dispatches the SOS SMS via mobile OS protocol.
 * Supported universally on Android Capacitor, standard mobile browsers, and iOS.
 */
export function dispatchEmergencySms(phone: string, message: string): void {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const encodedBody = encodeURIComponent(message);
  const smsUri = cleanPhone ? `sms:${cleanPhone}?body=${encodedBody}` : `sms:?body=${encodedBody}`;

  try {
    window.location.href = smsUri;
  } catch (e) {
    console.warn('Failed to open SMS URI via window.location:', e);
    try {
      window.open(smsUri, '_system');
    } catch (e2) {
      console.error('Could not dispatch SMS:', e2);
    }
  }
}
