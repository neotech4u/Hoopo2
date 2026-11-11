/**
 * Offline Astronomical Solar & Prayer Times Engine (Meeus Astronomical Calculation).
 * Computes exact daily Islamic prayer times (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha)
 * and Qibla bearing based on GPS coordinates and device system time.
 *
 * 100% Offline: Requires zero network, zero external APIs, zero dependencies.
 */

export type CalculationMethod =
  | 'MWL' // Muslim World League (Fajr: 18°, Isha: 17°)
  | 'ISNA' // Islamic Society of North America (Fajr: 15°, Isha: 15°)
  | 'Egypt' // Egyptian General Authority of Survey (Fajr: 19.5°, Isha: 17.5°)
  | 'Makkah' // Umm Al-Qura, Makkah (Fajr: 18.5°, Isha: 90 min after Maghrib)
  | 'Karachi' // University of Islamic Sciences, Karachi (Fajr: 18°, Isha: 18°)
  | 'Tehran' // Institute of Geophysics, Univ of Tehran (Fajr: 17.7°, Isha: 14°)
  | 'Gulf'; // Gulf / UAE (Fajr: 19.5°, Isha: 90 min after Maghrib)

export type AsrJuristic = 'Standard' | 'Hanafi';

export interface MethodParameters {
  fajrAngle: number;
  ishaAngle: number;
  ishaIntervalMinutes?: number; // E.g. 90 minutes after Maghrib
}

export const CALCULATION_METHODS: Record<CalculationMethod, MethodParameters> = {
  MWL: { fajrAngle: 18.0, ishaAngle: 17.0 },
  ISNA: { fajrAngle: 15.0, ishaAngle: 15.0 },
  Egypt: { fajrAngle: 19.5, ishaAngle: 17.5 },
  Makkah: { fajrAngle: 18.5, ishaAngle: 0, ishaIntervalMinutes: 90 },
  Karachi: { fajrAngle: 18.0, ishaAngle: 18.0 },
  Tehran: { fajrAngle: 17.7, ishaAngle: 14.0 },
  Gulf: { fajrAngle: 19.5, ishaAngle: 0, ishaIntervalMinutes: 90 },
};

export interface ComputedPrayerSchedule {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  fajrDate: Date;
  sunriseDate: Date;
  dhuhrDate: Date;
  asrDate: Date;
  maghribDate: Date;
  ishaDate: Date;
  qiblaBearingDeg: number;
}

export interface NextPrayerInfo {
  currentPrayer: string;
  nextPrayer: string;
  nextPrayerTime: string;
  minutesRemaining: number;
  isAdhanNow: boolean;
}

// Math helpers in degrees
const d2r = (deg: number) => (deg * Math.PI) / 180.0;
const r2d = (rad: number) => (rad * 180.0) / Math.PI;
const sinDeg = (deg: number) => Math.sin(d2r(deg));
const cosDeg = (deg: number) => Math.cos(d2r(deg));
const tanDeg = (deg: number) => Math.tan(d2r(deg));
const asinDeg = (val: number) => r2d(Math.asin(val));
const acosDeg = (val: number) => r2d(Math.acos(val));
const atan2Deg = (y: number, x: number) => r2d(Math.atan2(y, x));
const fixAngle = (deg: number) => {
  let a = deg - 360.0 * Math.floor(deg / 360.0);
  return a < 0 ? a + 360.0 : a;
};
const fixHour = (hour: number) => {
  let h = hour - 24.0 * Math.floor(hour / 24.0);
  return h < 0 ? h + 24.0 : h;
};

/**
 * Calculates Julian Day from a Gregorian Date
 */
function getJulianDay(date: Date): number {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  const day = date.getDate();

  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    B -
    1524.5
  );
}

/**
 * Calculates Sun's Declination and Equation of Time for a given Julian Day
 */
function getSunPosition(jd: number): { declination: number; equationOfTime: number } {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * sinDeg(g) + 0.02 * sinDeg(2 * g));

  const e = 23.439 - 0.00000036 * D;
  const declination = asinDeg(sinDeg(e) * sinDeg(L));
  let RA = atan2Deg(cosDeg(e) * sinDeg(L), cosDeg(L)) / 15.0;
  RA = fixHour(RA);

  const equationOfTime = q / 15.0 - RA;
  return { declination, equationOfTime };
}

/**
 * Computes Hour Angle for a given sun altitude angle
 */
function getHourAngle(alpha: number, latitude: number, declination: number): number {
  const cosH =
    (sinDeg(alpha) - sinDeg(latitude) * sinDeg(declination)) /
    (cosDeg(latitude) * cosDeg(declination));
  if (cosH > 1) return 0; // Sun never reaches this altitude
  if (cosH < -1) return 180; // Sun never drops below this altitude
  return acosDeg(cosH);
}

/**
 * Computes Qibla forward azimuth heading from user GPS coordinates towards Holy Kaaba
 */
export function calculateQiblaDirection(latitude: number, longitude: number): number {
  const kaabaLat = 21.4224779;
  const kaabaLon = 39.8261818;

  const deltaLon = kaabaLon - longitude;
  const y = sinDeg(deltaLon);
  const x =
    cosDeg(latitude) * tanDeg(kaabaLat) -
    sinDeg(latitude) * cosDeg(deltaLon);

  return Math.round(fixAngle(atan2Deg(y, x)) * 10) / 10;
}

/**
 * Converts decimal hours to HH:MM format
 */
function decimalHoursToTimeString(decimalHours: number): string {
  const clamped = fixHour(decimalHours);
  const hours = Math.floor(clamped);
  const minutes = Math.floor((clamped - hours) * 60 + 0.5);
  const finalH = hours + Math.floor(minutes / 60);
  const finalM = minutes % 60;
  return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`;
}

/**
 * Converts decimal hours into a real JavaScript Date on the target day
 */
function decimalHoursToDate(targetDay: Date, decimalHours: number): Date {
  const clamped = fixHour(decimalHours);
  const hours = Math.floor(clamped);
  const minutes = Math.floor((clamped - hours) * 60);
  const seconds = Math.floor(((clamped - hours) * 60 - minutes) * 60);

  const d = new Date(targetDay);
  d.setHours(hours, minutes, seconds, 0);
  return d;
}

/**
 * Computes the complete 6-prayer schedule offline for a given location, date, and method
 */
export function calculateOfflinePrayerSchedule(
  latitude: number,
  longitude: number,
  date: Date = new Date(),
  method: CalculationMethod = 'MWL',
  asrJuristic: AsrJuristic = 'Standard'
): ComputedPrayerSchedule {
  const jd = getJulianDay(date);
  const { declination, equationOfTime } = getSunPosition(jd);
  const timezoneOffsetHours = -date.getTimezoneOffset() / 60;

  // Solar Noon (Midday / Dhuhr base)
  const dhuhrHours =
    12 + timezoneOffsetHours - longitude / 15.0 - equationOfTime;

  // Sunrise / Sunset altitude is -0.833° (standard refraction + solar disc)
  const sunAngle = -0.8333;
  const sunH = getHourAngle(sunAngle, latitude, declination);
  const sunriseHours = dhuhrHours - sunH / 15.0;
  const sunsetHours = dhuhrHours + sunH / 15.0;

  // Fajr
  const methodParams = CALCULATION_METHODS[method] || CALCULATION_METHODS.MWL;
  const fajrH = getHourAngle(-methodParams.fajrAngle, latitude, declination);
  const fajrHours = dhuhrHours - fajrH / 15.0;

  // Asr altitude is above horizon: arccot(t + tan(|lat - dec|))
  const shadowFactor = asrJuristic === 'Hanafi' ? 2 : 1;
  const asrAlt = r2d(
    Math.atan(1 / (shadowFactor + Math.tan(d2r(Math.abs(latitude - declination)))))
  );
  const asrH = getHourAngle(asrAlt, latitude, declination);
  const asrHours = dhuhrHours + asrH / 15.0;

  // Maghrib
  const maghribHours = sunsetHours + 2 / 60; // 2 minutes post sunset buffer

  // Isha
  let ishaHours: number;
  if (methodParams.ishaIntervalMinutes) {
    ishaHours = maghribHours + methodParams.ishaIntervalMinutes / 60.0;
  } else {
    const ishaH = getHourAngle(-methodParams.ishaAngle, latitude, declination);
    ishaHours = dhuhrHours + ishaH / 15.0;
  }

  // Dhuhr typically occurs 1-2 minutes past zenith for safety
  const finalDhuhr = dhuhrHours + 1.5 / 60;

  const qibla = calculateQiblaDirection(latitude, longitude);

  return {
    fajr: decimalHoursToTimeString(fajrHours),
    sunrise: decimalHoursToTimeString(sunriseHours),
    dhuhr: decimalHoursToTimeString(finalDhuhr),
    asr: decimalHoursToTimeString(asrHours),
    maghrib: decimalHoursToTimeString(maghribHours),
    isha: decimalHoursToTimeString(ishaHours),
    fajrDate: decimalHoursToDate(date, fajrHours),
    sunriseDate: decimalHoursToDate(date, sunriseHours),
    dhuhrDate: decimalHoursToDate(date, finalDhuhr),
    asrDate: decimalHoursToDate(date, asrHours),
    maghribDate: decimalHoursToDate(date, maghribHours),
    ishaDate: decimalHoursToDate(date, ishaHours),
    qiblaBearingDeg: qibla,
  };
}

/**
 * Finds the currently active prayer and the next upcoming prayer countdown
 */
export function getNextPrayerCountdown(
  schedule: ComputedPrayerSchedule,
  now: Date = new Date()
): NextPrayerInfo {
  const nowMs = now.getTime();

  const prayers = [
    { name: 'Fajr', timeStr: schedule.fajr, date: schedule.fajrDate },
    { name: 'Sunrise', timeStr: schedule.sunrise, date: schedule.sunriseDate },
    { name: 'Dhuhr', timeStr: schedule.dhuhr, date: schedule.dhuhrDate },
    { name: 'Asr', timeStr: schedule.asr, date: schedule.asrDate },
    { name: 'Maghrib', timeStr: schedule.maghrib, date: schedule.maghribDate },
    { name: 'Isha', timeStr: schedule.isha, date: schedule.ishaDate },
  ];

  // Find next upcoming prayer today
  for (let i = 0; i < prayers.length; i++) {
    const p = prayers[i];
    const diffMs = p.date.getTime() - nowMs;
    if (diffMs > 0) {
      const minutesRemaining = Math.max(1, Math.round(diffMs / 60000));
      const currentPrayer = i === 0 ? 'Isha (Previous)' : prayers[i - 1].name;
      // Adhan window: within 2 minutes of prayer entry
      const isAdhanNow = Math.abs(diffMs) <= 120000;
      return {
        currentPrayer,
        nextPrayer: p.name,
        nextPrayerTime: p.timeStr,
        minutesRemaining,
        isAdhanNow,
      };
    }
  }

  // If past Isha today, next is tomorrow's Fajr
  const tomorrowFajr = new Date(schedule.fajrDate.getTime() + 24 * 3600 * 1000);
  const diffMs = tomorrowFajr.getTime() - nowMs;
  return {
    currentPrayer: 'Isha',
    nextPrayer: 'Fajr',
    nextPrayerTime: schedule.fajr,
    minutesRemaining: Math.max(1, Math.round(diffMs / 60000)),
    isAdhanNow: false,
  };
}
