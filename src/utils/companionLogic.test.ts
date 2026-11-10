import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkSpeedSafety,
  getNextPrayer,
  detectUpcomingRain,
  parseVoiceCommand,
  formatDuration,
  calculatePetrolSummary,
  createCompletedTrip,
  calculateIdleCO2Emission,
  calculateStandardDrivingCO2,
  calculateHaversineDistance,
  calculateGpsVelocity,
  resolveVehicleSpeed,
  calculateDrivingRating,
  formatSpeedAlert,
  formatRainAlert,
  formatIdleCO2Alert,
  formatPrayerAlert,
  generateFriendlyCompanionComment,
  PrayerTime,
  WeatherCondition,
} from './companionLogic';

test('checkSpeedSafety accurately categorizes safe, caution, and danger speeds', () => {
  const safe = checkSpeedSafety(65, 80);
  assert.equal(safe.isUnsafe, false);
  assert.equal(safe.severity, 'safe');
  assert.equal(safe.excessSpeed, 0);

  const caution = checkSpeedSafety(88, 80);
  assert.equal(caution.isUnsafe, true);
  assert.equal(caution.severity, 'caution');
  assert.equal(caution.excessSpeed, 8);

  const danger = checkSpeedSafety(115, 80);
  assert.equal(danger.isUnsafe, true);
  assert.equal(danger.severity, 'danger');
  assert.equal(danger.excessSpeed, 35);
});

test('getNextPrayer correctly finds upcoming prayer and countdown minutes', () => {
  const samplePrayers: PrayerTime[] = [
    { name: 'Fajr', arabicName: 'الفجر', time: '05:15' },
    { name: 'Dhuhr', arabicName: 'الظهر', time: '12:30' },
    { name: 'Asr', arabicName: 'العصر', time: '15:45' },
    { name: 'Maghrib', arabicName: 'المغرب', time: '18:10' },
    { name: 'Isha', arabicName: 'العشاء', time: '19:30' },
  ];

  const result = getNextPrayer(samplePrayers, 12, 15);
  assert.equal(result.nextPrayer.name, 'Dhuhr');
  assert.equal(result.minutesRemaining, 15);
  assert.equal(result.isApproaching, true);

  const lateNight = getNextPrayer(samplePrayers, 21, 0);
  assert.equal(lateNight.nextPrayer.name, 'Fajr');
  assert.equal(lateNight.minutesRemaining, 3 * 60 + 5 * 60 + 15);
  assert.equal(lateNight.isApproaching, false);
});

test('detectUpcomingRain identifies rain in route lookahead window', () => {
  const weatherPoints: WeatherCondition[] = [
    { location: 'Highway km 10', kmMark: 10, condition: 'Clear', riskLevel: 'low', advisory: 'Clear skies' },
    { location: 'Valley pass km 35', kmMark: 35, condition: 'Rain', riskLevel: 'moderate', advisory: 'Slick roads' },
  ];

  const alert = detectUpcomingRain(weatherPoints, 15, 30);
  assert.notEqual(alert, null);
  assert.equal(alert?.location, 'Valley pass km 35');
  assert.equal(alert?.condition, 'Rain');
});

test('calculateIdleCO2Emission uses Argonne National Lab standard (0.6977 g/s) and triggers threshold at 40s', () => {
  const under = calculateIdleCO2Emission(25, 'Zaid');
  assert.equal(under.isOverThreshold, false);
  assert.ok(under.message.includes('Zaid'));

  const over = calculateIdleCO2Emission(42, 'Mustafa');
  assert.equal(over.isOverThreshold, true);
  // At 42s: 42 * 0.6977 ~ 29.3g
  assert.ok(over.gramsCO2 >= 28 && over.gramsCO2 <= 31);
  assert.ok(over.message.includes('Mustafa'));
  assert.ok(over.message.includes('42s'));
  assert.ok(over.standardModel.includes('EPA / Argonne National Lab'));
});

test('calculateStandardDrivingCO2 calculates emissions according to EPA 2,392g/L standard', () => {
  // 50 km driven at 70 km/h (optimal cruising speed)
  const result = calculateStandardDrivingCO2(50, 70);
  assert.equal(result.effectiveLPer100Km, 6.8);
  assert.equal(result.fuelLiters, 3.4); // 50km * 6.8L/100km = 3.4L
  // 3.4L * 2,392g = 8,133g CO2
  assert.equal(result.gramsCO2, 8133);
});

test('calculateHaversineDistance and calculateGpsVelocity compute real speed accurately', () => {
  // Two points in Riyadh approx ~1.11 km apart
  const p1 = { lat: 24.7136, lon: 46.6753 };
  const p2 = { lat: 24.7236, lon: 46.6753 };
  const distanceMeters = calculateHaversineDistance(p1.lat, p1.lon, p2.lat, p2.lon);
  assert.ok(distanceMeters > 1100 && distanceMeters < 1120);

  // If traveled in 60 seconds (1 minute): speed ~ 1.11km / (1/60 hr) = 66.7 km/h
  const speed = calculateGpsVelocity(p1.lat, p1.lon, 0, p2.lat, p2.lon, 60000);
  assert.ok(speed >= 65 && speed <= 68);
});

test('format alerts prepend user name in conversational friend tone', () => {
  const speedAlert = formatSpeedAlert('Hamza', 95, 80);
  assert.ok(speedAlert.startsWith('Hamza, ease up on the pedal!'));
  assert.ok(speedAlert.includes('95 km/h'));

  const weatherPoint: WeatherCondition = {
    location: 'Airport Expressway',
    kmMark: 20,
    condition: 'Rain',
    riskLevel: 'moderate',
    advisory: 'Wet roads',
  };
  const rainAlert = formatRainAlert('Amina', weatherPoint);
  assert.ok(rainAlert.startsWith('Amina, heads up friend!'));
  assert.ok(rainAlert.includes('Airport Expressway'));

  const idleAlert = formatIdleCO2Alert('Zaid', 45, 31.4);
  assert.ok(idleAlert.startsWith('Zaid, quick friendly check:'));

  const prayerAlert = formatPrayerAlert('Mustafa', 'Asr', 15);
  assert.ok(prayerAlert.startsWith('Mustafa, Asr prayer time enters in 15 minutes'));
});

test('generateFriendlyCompanionComment creates personalized comments with user name', () => {
  const weatherComment = generateFriendlyCompanionComment('Fatima', 'weather', { weatherCondition: 'Clear' });
  assert.ok(weatherComment.includes('Fatima'));
  assert.ok(weatherComment.includes('skies'));

  const breakComment = generateFriendlyCompanionComment('Mustafa', 'break', { tripMinutes: 50 });
  assert.ok(breakComment.includes('Mustafa'));
  assert.ok(breakComment.includes('hydrated'));
});

test('calculateDrivingRating personalizes feedback and calculates grades', () => {
  const rating = calculateDrivingRating(40, 1800, 75, 80, 10, 'Bilal');
  assert.ok(rating.overallScore >= 90);
  assert.equal(rating.grade, 'A+');
  assert.ok(rating.feedback.includes('Bilal'));
});
