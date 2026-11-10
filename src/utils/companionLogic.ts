/**
 * Automotive telematics, standard CO2 emission models (EPA / EEA / ANL-GREET),
 * GPS velocity tracking, prayer schedules, and AI companion dialog logic.
 */

export interface PrayerTime {
  name: string;
  arabicName: string;
  time: string; // HH:mm
}

export interface WeatherCondition {
  location: string;
  kmMark: number;
  condition: 'Clear' | 'Rain' | 'Heavy Rain' | 'Cloudy';
  riskLevel: 'low' | 'moderate' | 'high';
  advisory: string;
}

export interface FuelStation {
  id: string;
  name: string;
  brand: 'Shell' | 'Aramco' | 'Petronas' | 'BP' | 'Chevron' | 'Adnoc';
  distanceKm: number;
  fuelPrice: number; // e.g. $1.35/L
  amenities: string[];
  lat: number;
  lng: number;
}

export interface RouteOption {
  id: string;
  name: string;
  tag: 'Fastest' | 'Eco-Friendly' | 'Scenic' | 'Highway';
  distanceKm: number;
  durationMins: number;
  trafficLevel: 'smooth' | 'moderate' | 'congested';
  rainRisk: boolean;
  fuelStopsCount: number;
  waypoints: [number, number][];
}

/* =======================================================================
 * 1. AUTOMOTIVE CO2 EMISSION STANDARDS (EPA, EEA & ANL-GREET MODELS)
 * ======================================================================= */

/**
 * EPA (US Environmental Protection Agency) & EEA (European Environment Agency)
 * Standard emission factor for passenger vehicle motor gasoline (petrol):
 * 1 Liter of gasoline produces 2,392 grams of CO2 (8.887 kg CO2 / gallon).
 */
export const EPA_EEA_GASOLINE_CO2_PER_LITER = 2392; // g CO2 / Liter

/**
 * Argonne National Laboratory (ANL-GREET) & U.S. Department of Energy standard:
 * Typical passenger internal combustion engine (1.6L - 2.0L displacement) idles at
 * 1.05 Liters/hour (0.277 gal/hr) with cabin air conditioning and alternator load.
 */
export const ANL_IDLE_FUEL_RATE_LITERS_PER_HOUR = 1.05; // L/hour

/**
 * Idling emission rate: (1.05 L/hr * 2392 g/L) / 3600 sec/hr = 0.6977 g CO2 / sec.
 */
export const ANL_IDLE_CO2_GRAMS_PER_SECOND = (ANL_IDLE_FUEL_RATE_LITERS_PER_HOUR * EPA_EEA_GASOLINE_CO2_PER_LITER) / 3600;

export interface IdleCO2Emission {
  gramsCO2: number;
  fuelWastedLiters: number;
  isOverThreshold: boolean;
  standardModel: string;
  message: string;
}

/**
 * Calculates CO2 emission while vehicle speed is 0 with ignition ON.
 * Evaluates against the 40-second idling threshold.
 */
export function calculateIdleCO2Emission(idleSeconds: number, userName: string = 'Friend'): IdleCO2Emission {
  const gramsCO2 = Math.round(idleSeconds * ANL_IDLE_CO2_GRAMS_PER_SECOND * 10) / 10;
  const fuelWastedLiters = Math.round(((idleSeconds * ANL_IDLE_FUEL_RATE_LITERS_PER_HOUR) / 3600) * 1000) / 1000;
  const isOverThreshold = idleSeconds >= 40;

  return {
    gramsCO2,
    fuelWastedLiters,
    isOverThreshold,
    standardModel: 'EPA / Argonne National Lab ANL-GREET Standard (2,392g CO2/L)',
    message: `${userName}, vehicle has been stationary for ${idleSeconds}s with engine running. Standard EPA models calculate ~${gramsCO2}g of CO2 emitted (${fuelWastedLiters}L fuel wasted). Please turn off ignition to prevent idle emissions!`,
  };
}

/**
 * Calculates vehicle driving CO2 emissions based on real speed and distance
 * using EPA baseline (6.8 L/100km) modulated by aerodynamic drag (F_drag proportional to v^2)
 * and low-speed thermal efficiency losses.
 */
export function calculateStandardDrivingCO2(distanceKm: number, avgSpeedKmH: number): {
  gramsCO2: number;
  fuelLiters: number;
  effectiveLPer100Km: number;
} {
  const baseLPer100Km = 6.8; // Standard efficient sedan cruising consumption
  let speedFactor = 1.0;

  if (avgSpeedKmH > 0 && avgSpeedKmH < 25) {
    // City congestion penalty (+25% fuel due to low gear thermal efficiency)
    speedFactor = 1 + 0.25 * (1 - avgSpeedKmH / 25);
  } else if (avgSpeedKmH > 85) {
    // Aerodynamic quadratic drag penalty (Fd ~ v^2)
    speedFactor = 1 + 0.000075 * Math.pow(avgSpeedKmH - 85, 2);
  }

  const effectiveLPer100Km = Math.round(baseLPer100Km * speedFactor * 10) / 10;
  const fuelLiters = Math.round((distanceKm * (effectiveLPer100Km / 100)) * 100) / 100;
  const gramsCO2 = Math.round(fuelLiters * EPA_EEA_GASOLINE_CO2_PER_LITER);

  return {
    gramsCO2,
    fuelLiters,
    effectiveLPer100Km,
  };
}

/* =======================================================================
 * 2. REAL GPS VELOCITY & HAVERSINE TELEMETRY
 * ======================================================================= */

/**
 * Calculates geodesic distance between two GPS coordinates using the Haversine formula (in meters).
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Computes exact ground speed in km/h from two timestamped GPS positions.
 */
export function calculateGpsVelocity(
  lat1: number,
  lon1: number,
  time1Ms: number,
  lat2: number,
  lon2: number,
  time2Ms: number
): number {
  const deltaSeconds = Math.max(0.1, (time2Ms - time1Ms) / 1000);
  const distanceMeters = calculateHaversineDistance(lat1, lon1, lat2, lon2);
  if (distanceMeters < 1) return 0; // Filter micro-jitter when stationary

  const speedMps = distanceMeters / deltaSeconds;
  return Math.round(speedMps * 3.6 * 10) / 10; // km/h
}

/**
 * Resolves vehicle velocity prioritizing real hardware GPS speed,
 * falling back to Haversine coordinate delta or cockpit simulation.
 */
export function resolveVehicleSpeed(
  rawGpsSpeedMps: number | null | undefined,
  calculatedGpsSpeedKmH: number,
  simulatedSpeed: number,
  isGpsLiveMode: boolean
): number {
  if (isGpsLiveMode) {
    if (rawGpsSpeedMps !== null && rawGpsSpeedMps !== undefined && rawGpsSpeedMps >= 0) {
      return Math.round(rawGpsSpeedMps * 3.6 * 10) / 10;
    }
    return Math.round(calculatedGpsSpeedKmH * 10) / 10;
  }
  return simulatedSpeed;
}

/* =======================================================================
 * 3. SAFETY, PRAYER & WEATHER TELEMETRY
 * ======================================================================= */

/**
 * Checks vehicle speed against speed limit and returns safety status.
 */
export function checkSpeedSafety(currentSpeed: number, speedLimit: number): {
  isUnsafe: boolean;
  severity: 'safe' | 'caution' | 'danger';
  excessSpeed: number;
  alertMessage: string;
} {
  const excess = Math.max(0, currentSpeed - speedLimit);
  if (currentSpeed <= speedLimit) {
    return {
      isUnsafe: false,
      severity: 'safe',
      excessSpeed: 0,
      alertMessage: 'Cruising smoothly at safe speed.',
    };
  }
  if (excess <= 10) {
    return {
      isUnsafe: true,
      severity: 'caution',
      excessSpeed: excess,
      alertMessage: `Notice: Speed is ${excess} km/h over the ${speedLimit} km/h limit.`,
    };
  }
  return {
    isUnsafe: true,
    severity: 'danger',
    excessSpeed: excess,
    alertMessage: `Caution! Exceeding speed limit by ${excess} km/h! Slow down for safety.`,
  };
}

/**
 * Calculates time remaining until the next prayer time.
 */
export function getNextPrayer(prayers: PrayerTime[], currentHour: number, currentMinute: number): {
  currentPrayer: PrayerTime | null;
  nextPrayer: PrayerTime;
  minutesRemaining: number;
  isApproaching: boolean;
} {
  const nowInMinutes = currentHour * 60 + currentMinute;

  const prayerMinutes = prayers.map((p) => {
    const [h, m] = p.time.split(':').map(Number);
    return { prayer: p, totalMinutes: h * 60 + m };
  });

  let next = prayerMinutes.find((p) => p.totalMinutes > nowInMinutes);
  let minutesRemaining = 0;

  if (!next) {
    const tomorrowFajr = prayerMinutes[0];
    minutesRemaining = 24 * 60 - nowInMinutes + tomorrowFajr.totalMinutes;
    return {
      currentPrayer: prayerMinutes[prayerMinutes.length - 1].prayer,
      nextPrayer: tomorrowFajr.prayer,
      minutesRemaining,
      isApproaching: minutesRemaining <= 15,
    };
  }

  minutesRemaining = next.totalMinutes - nowInMinutes;
  const currentIndex = prayerMinutes.indexOf(next) - 1;
  const currentPrayer = currentIndex >= 0 ? prayerMinutes[currentIndex].prayer : null;

  return {
    currentPrayer,
    nextPrayer: next.prayer,
    minutesRemaining,
    isApproaching: minutesRemaining <= 20,
  };
}

/**
 * Checks if any segment en route has rain risk within lookahead window.
 */
export function detectUpcomingRain(
  weatherForecasts: WeatherCondition[],
  currentKm: number,
  lookaheadKm: number = 30
): WeatherCondition | null {
  return (
    weatherForecasts.find(
      (w) =>
        w.kmMark >= currentKm &&
        w.kmMark <= currentKm + lookaheadKm &&
        (w.condition === 'Rain' || w.condition === 'Heavy Rain')
    ) || null
  );
}

/* =======================================================================
 * 4. COMPANION CONVERSATIONAL SPEECH FORMATTERS (WITH USER NAME)
 * ======================================================================= */

export function formatSpeedAlert(userName: string, speed: number, limit: number): string {
  const rounded = Math.round(speed);
  return `${userName}, ease up on the pedal! We're traveling at ${rounded} km/h, which is above the ${limit} km/h limit. Let's keep our ride peaceful and safe.`;
}

export function formatRainAlert(userName: string, weather: WeatherCondition): string {
  return `${userName}, heads up friend! Rain radar detects ${weather.condition.toLowerCase()} ahead at ${weather.location}. Road surfaces may be slick—please activate wipers and keep extra distance.`;
}

export function formatIdleCO2Alert(userName: string, idleSeconds: number, gramsCO2: number): string {
  return `${userName}, quick friendly check: we've been parked with the engine running for ${idleSeconds} seconds. Under EPA emission models, we've produced about ${gramsCO2} grams of CO2. Let's turn off the ignition to save fuel!`;
}

export function formatPrayerAlert(userName: string, prayerName: string, minsRemaining: number): string {
  return `${userName}, ${prayerName} prayer time enters in ${minsRemaining} minutes. May Allah bless our travels. Let me know if you would like to pause at a roadside musalla.`;
}

/**
 * Generates natural, friendly companion comments spoken by Hoopo during the trip
 * like a friend traveling along in the passenger seat.
 */
export function generateFriendlyCompanionComment(
  userName: string,
  category: 'weather' | 'music' | 'break' | 'smooth_driving' | 'dhikr' | 'random' | 'spontaneous',
  context?: {
    speed?: number;
    weatherCondition?: string;
    musicTrack?: string;
    tripMinutes?: number;
  }
): string {
  const cleanName = userName || 'Friend';

  switch (category) {
    case 'weather':
      if (context?.weatherCondition?.toLowerCase().includes('rain')) {
        return `${cleanName}, looks like skies are getting cloudy. Don't worry, Hoopo's radar is keeping an eye on the path for us.`;
      }
      return `${cleanName}, the skies are wonderfully clear today. Perfect cruising weather for our road trip, Alhamdulillah!`;

    case 'music':
      if (context?.musicTrack?.toLowerCase().includes('quran') || context?.musicTrack?.toLowerCase().includes('mulk')) {
        return `${cleanName}, listening to Surah Al-Mulk brings so much peace to the cabin. What a beautiful companion for the road.`;
      }
      if (context?.musicTrack?.toLowerCase().includes('nasheed')) {
        return `${cleanName}, this acoustic nasheed has such an uplifting harmony. Really enjoy traveling with you!`;
      }
      return `${cleanName}, this track sets such a relaxing tone for the drive. Good music makes the kilometers fly by!`;

    case 'break':
      const mins = context?.tripMinutes || 45;
      return `${cleanName}, we've been on the road for about ${mins} minutes. Remember to stay hydrated, stretch your shoulders, and take a quick rest whenever you see a nice plaza!`;

    case 'smooth_driving':
      return `${cleanName}, you're steering so smoothly today! That steady pace is fantastic for our fuel economy and keeps our CO2 footprint green.`;

    case 'dhikr':
      return `${cleanName}, SubhanAllah, look at the expanse ahead. The Prophet taught us that traveling is lighter with remembrance and patience.`;

    default:
      const generalComments = [
        `${cleanName}, having a great time co-piloting with you today! Where should we head next after this stretch?`,
        `${cleanName}, road is looking good. Just relaxing and enjoying the journey together with you!`,
        `${cleanName}, friendly tip: keeping a steady foot on the throttle saves up to 15% on fuel. You're doing awesome!`,
        `${cleanName}, Alhamdulillah for safe passage. Remember to take a deep breath and enjoy the scenery.`,
      ];
      return generalComments[Math.floor(Math.random() * generalComments.length)];
  }
}

/* =======================================================================
 * 5. TRIP & PETROL LOGGING
 * ======================================================================= */

export interface PetrolLog {
  id: string;
  liters: number;
  amount: number;
  stationName?: string;
  odometerKm: number;
  timestamp: string;
  notes?: string;
}

export interface PetrolSummary {
  totalSpent: number;
  totalLiters: number;
  avgPricePerLiter: number;
  logCount: number;
}

export function calculatePetrolSummary(logs: PetrolLog[]): PetrolSummary {
  const totalSpent = logs.reduce((acc, log) => acc + log.amount, 0);
  const totalLiters = logs.reduce((acc, log) => acc + log.liters, 0);
  const avgPricePerLiter = totalLiters > 0 ? totalSpent / totalLiters : 0;
  return {
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalLiters: Math.round(totalLiters * 100) / 100,
    avgPricePerLiter: Math.round(avgPricePerLiter * 100) / 100,
    logCount: logs.length,
  };
}

export interface TripLog {
  id: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  distanceKm: number;
  maxSpeedKmH: number;
  avgSpeedKmH: number;
  estimatedCO2Grams: number;
}

export function createCompletedTrip(
  startTime: Date,
  endTime: Date,
  distanceKm: number,
  maxSpeedKmH: number
): TripLog {
  const durationSeconds = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 1000));
  const hours = durationSeconds / 3600;
  const avgSpeedKmH = hours > 0 ? Math.round((distanceKm / hours) * 10) / 10 : 0;
  const drivingCO2 = calculateStandardDrivingCO2(distanceKm, avgSpeedKmH);

  return {
    id: `trip-${Date.now()}`,
    startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    durationSeconds,
    distanceKm: Math.round(distanceKm * 10) / 10,
    maxSpeedKmH: Math.round(maxSpeedKmH),
    avgSpeedKmH,
    estimatedCO2Grams: drivingCO2.gramsCO2,
  };
}

/* =======================================================================
 * 6. DRIVING PERFORMANCE RATING
 * ======================================================================= */

export interface DrivingRating {
  overallScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  stars: number;
  speedScore: number;
  ecoScore: number;
  smoothnessScore: number;
  idleScore: number;
  badges: string[];
  feedback: string;
  savedCO2Grams: number;
}

export function calculateDrivingRating(
  distanceKm: number,
  durationSeconds: number,
  maxSpeedKmH: number,
  speedLimit: number,
  idleSeconds: number,
  userName: string = 'Friend'
): DrivingRating {
  let speedScore = 100;
  if (maxSpeedKmH > speedLimit) {
    const excess = maxSpeedKmH - speedLimit;
    speedScore = Math.max(40, Math.round(100 - excess * 2.2));
  }

  let idleScore = 100;
  if (idleSeconds > 40) {
    const excessIdle = idleSeconds - 40;
    idleScore = Math.max(45, Math.round(100 - excessIdle * 0.9));
  } else if (idleSeconds > 20) {
    idleScore = 92;
  }

  const ecoScore = Math.round(idleScore * 0.6 + (speedScore >= 85 ? 40 : 30));
  const smoothnessScore = speedScore >= 90 ? 96 : speedScore >= 75 ? 88 : 78;

  const overallScore = Math.min(
    100,
    Math.max(
      35,
      Math.round(speedScore * 0.4 + ecoScore * 0.35 + smoothnessScore * 0.25)
    )
  );

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'A+';
  let stars = 5;
  if (overallScore >= 94) {
    grade = 'A+';
    stars = 5;
  } else if (overallScore >= 85) {
    grade = 'A';
    stars = 4;
  } else if (overallScore >= 75) {
    grade = 'B';
    stars = 3;
  } else if (overallScore >= 60) {
    grade = 'C';
    stars = 2;
  } else {
    grade = 'D';
    stars = 1;
  }

  const badges: string[] = ['Sunnah Traveler'];
  if (speedScore >= 90) badges.push('Safe Speed Pilot');
  if (idleSeconds <= 40) badges.push('Green Idle Master');
  if (distanceKm >= 15) badges.push('Highway Cruiser');
  if (smoothnessScore >= 90) badges.push('Smooth Throttle');

  let feedback = `${userName}, Alhamdulillah for our safe journey! Outstanding speed control and eco-friendly driving.`;
  if (overallScore < 75) {
    feedback = `${userName}, drive completed safely! Let's watch our speed on future journeys and shut off the ignition while stopped to cut emissions.`;
  } else if (idleSeconds > 40) {
    feedback = `Great driving, ${userName}! Just keep an eye on idle time—switching off when stationary saves fuel and cuts CO2.`;
  }

  const savedCO2Grams = Math.max(0, Math.round(distanceKm * 28));

  return {
    overallScore,
    grade,
    stars,
    speedScore,
    ecoScore,
    smoothnessScore,
    idleScore,
    badges,
    feedback,
    savedCO2Grams,
  };
}

export function parseVoiceCommand(transcript: string): {
  intent: 'NAVIGATE' | 'FUEL' | 'PRAYER' | 'RADIO' | 'WEATHER' | 'SPEED' | 'UNKNOWN';
  query?: string;
  action?: string;
} {
  const clean = transcript.toLowerCase().trim();

  if (clean.includes('navigate') || clean.includes('go to') || clean.includes('route') || clean.includes('drive to')) {
    const query = clean.replace(/navigate to|go to|route to|drive to/i, '').trim();
    return { intent: 'NAVIGATE', query: query || 'Destination' };
  }

  if (clean.includes('fuel') || clean.includes('gas') || clean.includes('petrol') || clean.includes('station')) {
    return { intent: 'FUEL', action: 'find_nearest_station' };
  }

  if (clean.includes('prayer') || clean.includes('namaz') || clean.includes('salah') || clean.includes('azan') || clean.includes('adhan')) {
    return { intent: 'PRAYER', action: 'show_prayer_times' };
  }

  if (clean.includes('radio') || clean.includes('fm') || clean.includes('music') || clean.includes('play') || clean.includes('quran') || clean.includes('station')) {
    return { intent: 'RADIO', action: clean.includes('stop') || clean.includes('pause') || clean.includes('mute') ? 'pause' : 'play' };
  }

  if (clean.includes('weather') || clean.includes('rain') || clean.includes('forecast')) {
    return { intent: 'WEATHER', action: 'check_rain' };
  }

  if (clean.includes('speed') || clean.includes('limit') || clean.includes('how fast')) {
    return { intent: 'SPEED', action: 'check_speed' };
  }

  return { intent: 'UNKNOWN', query: clean };
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}
