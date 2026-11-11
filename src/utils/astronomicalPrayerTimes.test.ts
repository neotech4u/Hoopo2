import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOfflinePrayerSchedule,
  calculateQiblaDirection,
  getNextPrayerCountdown,
} from './astronomicalPrayerTimes';

test('calculateQiblaDirection accurately computes Kaaba bearing', () => {
  // From Riyadh (lat 24.7136, lon 46.6753), Kaaba is around ~245° - 250° (West-South-West)
  const riyadhQibla = calculateQiblaDirection(24.7136, 46.6753);
  assert.ok(riyadhQibla > 240 && riyadhQibla < 255, `Expected Riyadh Qibla ~247°, got ${riyadhQibla}`);

  // From London (lat 51.5074, lon -0.1278), Kaaba is around ~118° - 120° (East-South-East)
  const londonQibla = calculateQiblaDirection(51.5074, -0.1278);
  assert.ok(londonQibla > 115 && londonQibla < 125, `Expected London Qibla ~119°, got ${londonQibla}`);

  // From New Delhi (lat 28.6139, lon 77.2090), Kaaba is around ~265° - 275° (West)
  const delhiQibla = calculateQiblaDirection(28.6139, 77.2090);
  assert.ok(delhiQibla > 260 && delhiQibla < 275, `Expected Delhi Qibla ~267°, got ${delhiQibla}`);
});

test('calculateOfflinePrayerSchedule produces valid sequential chronological prayer times', () => {
  const targetDate = new Date('2026-05-15T10:00:00Z');
  // Riyadh coordinates
  const schedule = calculateOfflinePrayerSchedule(24.7136, 46.6753, targetDate, 'MWL');

  assert.ok(schedule.fajr, 'Fajr exists');
  assert.ok(schedule.sunrise, 'Sunrise exists');
  assert.ok(schedule.dhuhr, 'Dhuhr exists');
  assert.ok(schedule.asr, 'Asr exists');
  assert.ok(schedule.maghrib, 'Maghrib exists');
  assert.ok(schedule.isha, 'Isha exists');

  // Verify chronological order: Fajr < Sunrise < Dhuhr < Asr < Maghrib < Isha
  assert.ok(schedule.fajrDate < schedule.sunriseDate, 'Fajr is before Sunrise');
  assert.ok(schedule.sunriseDate < schedule.dhuhrDate, 'Sunrise is before Dhuhr');
  assert.ok(schedule.dhuhrDate < schedule.asrDate, 'Dhuhr is before Asr');
  assert.ok(schedule.asrDate < schedule.maghribDate, 'Asr is before Maghrib');
  assert.ok(schedule.maghribDate < schedule.ishaDate, 'Maghrib is before Isha');
});

test('getNextPrayerCountdown detects upcoming prayer accurately', () => {
  const targetDate = new Date('2026-05-15T08:00:00');
  const schedule = calculateOfflinePrayerSchedule(24.7136, 46.6753, targetDate, 'MWL');

  // Set test time to 11:30 AM (before Dhuhr)
  const testNow = new Date(schedule.dhuhrDate.getTime() - 45 * 60 * 1000); // 45 min before Dhuhr
  const countdown = getNextPrayerCountdown(schedule, testNow);

  assert.equal(countdown.nextPrayer, 'Dhuhr');
  assert.equal(countdown.minutesRemaining, 45);
  assert.equal(countdown.isAdhanNow, false);
});
