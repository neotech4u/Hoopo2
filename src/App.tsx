/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Mic,
  Route as RouteIcon,
  Fuel,
  Volume2,
  VolumeX,
  BookOpen,
  CloudRain,
  ShieldCheck,
  Clock,
  Sparkles,
  Layers,
  Power,
  Crosshair,
  MapPin,
  Leaf,
  FileText,
  Award,
  User,
  Satellite,
  MessageCircle,
  Sliders,
  Settings,
} from 'lucide-react';

import { SpeedGauge } from './components/SpeedGauge';
import { MapCenter } from './components/MapCenter';
import { RadioFMModule } from './components/RadioFMModule';
import { HoopoTravelBuddy } from './components/HoopoTravelBuddy';
import { PrayerTimesWidget } from './components/PrayerTimesWidget';
import { TravelDuaModal } from './components/TravelDuaModal';
import { IslamicGreetingBanner } from './components/IslamicGreetingBanner';
import { RouteSuggestionsModal } from './components/RouteSuggestionsModal';
import { FuelStationLocator } from './components/FuelStationLocator';
import { VoiceNavigationModal } from './components/VoiceNavigationModal';
import { PetrolExpenseModal } from './components/PetrolExpenseModal';
import { TripLogModal } from './components/TripLogModal';
import { DrivingRatingModal } from './components/DrivingRatingModal';
import { UserProfileModal } from './components/UserProfileModal';
import { calculateOfflinePrayerSchedule } from './utils/astronomicalPrayerTimes';

import {
  checkSpeedSafety,
  getNextPrayer,
  detectUpcomingRain,
  createCompletedTrip,
  calculateDrivingRating,
  calculateIdleCO2Emission,
  calculateStandardDrivingCO2,
  calculateHaversineDistance,
  calculateGpsVelocity,
  resolveVehicleSpeed,
  formatSpeedAlert,
  formatRainAlert,
  formatIdleCO2Alert,
  formatPrayerAlert,
  generateFriendlyCompanionComment,
  DrivingRating,
  PrayerTime,
  WeatherCondition,
  FuelStation,
  RouteOption,
  PetrolLog,
  TripLog,
} from './utils/companionLogic';
import { soundEngine, speakHoopoMessage } from './utils/audioSynthesizer';

// Realistic route coordinates across Tirunelveli & South Tamil Nadu highways
const SAMPLE_ROUTES: RouteOption[] = [
  {
    id: 'route-madurai',
    name: 'Tirunelveli to Madurai (NH 44 North Expressway)',
    tag: 'Fastest',
    distanceKm: 160,
    durationMins: 125,
    trafficLevel: 'smooth',
    rainRisk: true,
    fuelStopsCount: 4,
    waypoints: [
      [8.7139, 77.7567], // Tirunelveli Central
      [8.8550, 77.7820], // Gangaikondan Industrial Hub
      [8.9500, 77.7700], // Kayathar Toll Plaza
      [9.1700, 77.8700], // Kovilpatti Bypass
      [9.3800, 77.9600], // Sattur Bridge
      [9.5800, 77.9500], // Virudhunagar Expressway Junction
      [9.9252, 78.1198], // Madurai City Hub
    ],
  },
  {
    id: 'route-kanyakumari',
    name: 'Tirunelveli to Kanyakumari (NH 44 South Highway)',
    tag: 'Scenic',
    distanceKm: 85,
    durationMins: 75,
    trafficLevel: 'smooth',
    rainRisk: false,
    fuelStopsCount: 3,
    waypoints: [
      [8.7139, 77.7567], // Tirunelveli Central
      [8.4900, 77.6600], // Nanguneri Toll
      [8.3300, 77.6000], // Valliyur Bypass
      [8.2200, 77.5600], // Panagudi Corridor
      [8.0883, 77.5385], // Kanyakumari Cape Comorin
    ],
  },
  {
    id: 'route-courtallam',
    name: 'Tirunelveli to Courtallam & Tenkasi (SH 39)',
    tag: 'Scenic',
    distanceKm: 58,
    durationMins: 65,
    trafficLevel: 'smooth',
    rainRisk: false,
    fuelStopsCount: 2,
    waypoints: [
      [8.7139, 77.7567], // Tirunelveli Town
      [8.7900, 77.5800], // Alangulam
      [8.8600, 77.4400], // Pavoorchatram
      [8.9594, 77.3150], // Tenkasi / Courtallam Falls
    ],
  },
  {
    id: 'route-thoothukudi',
    name: 'Tirunelveli to Thoothukudi Port (NH 138)',
    tag: 'Eco-Friendly',
    distanceKm: 48,
    durationMins: 45,
    trafficLevel: 'smooth',
    rainRisk: false,
    fuelStopsCount: 2,
    waypoints: [
      [8.7139, 77.7567], // Palayamkottai
      [8.7200, 77.9200], // Vagaikulam
      [8.7642, 78.1348], // Thoothukudi (Tuticorin) Sea Port
    ],
  },
];

// Sample Highway Fuel Plazas around Tirunelveli & South Tamil Nadu
const SAMPLE_FUEL_STATIONS: FuelStation[] = [
  {
    id: 'st-1',
    name: 'BPCL Highway Lounge - Tirunelveli Bypass (NH 44)',
    brand: 'BPCL',
    distanceKm: 4.5,
    fuelPrice: 101.4,
    amenities: ['Highway Musalla', 'Nellai Cafe & Snacks', '24/7 Air & Water', 'Clean Restrooms'],
    lat: 8.7320,
    lng: 77.7250,
  },
  {
    id: 'st-2',
    name: 'Indian Oil Swagat COCO Plaza (Gangaikondan NH 44)',
    brand: 'Indian Oil',
    distanceKm: 18.0,
    fuelPrice: 101.2,
    amenities: ['Air-Conditioned Musalla', 'A2B Restaurant', 'EV Fast Charge 60kW', 'Dormitory'],
    lat: 8.8550,
    lng: 77.7820,
  },
  {
    id: 'st-3',
    name: 'HPCL Fuel Oasis & Musalla - Palayamkottai South',
    brand: 'HPCL',
    distanceKm: 6.2,
    fuelPrice: 101.5,
    amenities: ['Prayer Hall', '24/7 Car Care', 'EV Fast Charge 120kW', 'South Indian Cafe'],
    lat: 8.7050,
    lng: 77.7420,
  },
  {
    id: 'st-4',
    name: 'Shell Service Station - Tirunelveli New Bus Stand',
    brand: 'Shell',
    distanceKm: 2.8,
    fuelPrice: 107.8,
    amenities: ['Prayer Area', 'Shell Deli2go Fresh Market', '24/7 Car Wash', 'EV Charger'],
    lat: 8.7190,
    lng: 77.7320,
  },
];

// Weather forecasts along Tirunelveli & South Tamil Nadu highway corridors
const SAMPLE_WEATHER: WeatherCondition[] = [
  {
    location: 'Km 12 - Tirunelveli Bypass / Gangaikondan NH 44',
    kmMark: 12,
    condition: 'Clear',
    riskLevel: 'low',
    advisory: 'Clear visibility and dry road surface along Tirunelveli NH 44 corridor.',
  },
  {
    location: 'Km 45 - Tenkasi Western Ghats Sector',
    kmMark: 45,
    condition: 'Rain',
    riskLevel: 'moderate',
    advisory: 'Western Ghats hill mist & light monsoon showers near Courtallam. Maintain safe following distance.',
  },
  {
    location: 'Km 35 - Thoothukudi Port Coastal Expressway',
    kmMark: 35,
    condition: 'Cloudy',
    riskLevel: 'low',
    advisory: 'Moderate coastal sea breeze with smooth highway cruising conditions.',
  },
];

// Default Islamic prayer times baseline (Tirunelveli / Tamil Nadu IST)
const DEFAULT_PRAYER_SCHEDULE: PrayerTime[] = [
  { name: 'Fajr', arabicName: 'الفجر', time: '05:02' },
  { name: 'Sunrise', arabicName: 'الشروق', time: '06:12' },
  { name: 'Dhuhr', arabicName: 'الظهر', time: '12:12' },
  { name: 'Asr', arabicName: 'العصر', time: '15:32' },
  { name: 'Maghrib', arabicName: 'المغرب', time: '18:04' },
  { name: 'Isha', arabicName: 'العشاء', time: '19:18' },
];

export default function App() {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isAutoStart = searchParams?.get('autostart') === '1';

  // 1. Driver Profile & Name State
  const [userName, setUserName] = useState<string>(() => {
    try {
      return localStorage.getItem('hoopo_driver_name') || 'Mustafa';
    } catch {
      return 'Mustafa';
    }
  });

  const handleUpdateUserName = (newName: string) => {
    setUserName(newName);
    try {
      localStorage.setItem('hoopo_driver_name', newName);
    } catch {
      // ignore
    }
    if (voiceEnabled) {
      speakHoopoMessage(`Nice to meet you, ${newName}! I am Hoopo, your road companion.`);
    }
  };

  // 2. Modals & Greetings
  const [showDuaModal, setShowDuaModal] = useState(!isAutoStart);
  const [showGreetingBanner, setShowGreetingBanner] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showPetrolModal, setShowPetrolModal] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 3. Navigation & Map State (Starts clean in Free Drive mode without pre-drawn demo highway)
  const [activeRoute, setActiveRoute] = useState<RouteOption | null>(null);
  const [progressKm, setProgressKm] = useState(0);
  const [nightMode, setNightMode] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showRainRadar, setShowRainRadar] = useState(true);
  const [showFuelStations, setShowFuelStations] = useState(true);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // 4. Real Location & Hardware GPS Speedometer (Automatic Live Mode)
  const [realUserLocation, setRealUserLocation] = useState<[number, number] | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'locked' | 'denied'>('loading');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isGpsLiveMode, setIsGpsLiveMode] = useState(true);
  const [calculatedGpsSpeed, setCalculatedGpsSpeed] = useState(0);

  // Track previous GPS coordinates to calculate Haversine ground speed
  const prevGpsPosRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

  // 5. Vehicle Cluster State
  const [speedLimit, setSpeedLimit] = useState(80);
  const [gear, setGear] = useState<'P' | 'R' | 'N' | 'D' | 'S'>('D');
  const [unit, setUnit] = useState<'km/h' | 'mph'>('km/h');
  const [cruiseControlActive, setCruiseControlActive] = useState(false);
  const [fuelLevel, setFuelLevel] = useState(78);
  const [odometerKm, setOdometerKm] = useState(14250);

  // Effective velocity: Pure live GPS hardware speed
  const currentSpeed = calculatedGpsSpeed;

  // 6. Ignition & Trip Telematics State
  const [ignitionOn, setIgnitionOn] = useState(true);
  const [tripDistance, setTripDistance] = useState(0);
  const [tripSeconds, setTripSeconds] = useState(0);
  const [tripStartTime, setTripStartTime] = useState<Date>(new Date());
  const [tripMaxSpeed, setTripMaxSpeed] = useState(0);
  const [latestRating, setLatestRating] = useState<DrivingRating | null>(null);

  // 7. Idle Seconds Counter (Increments when ignition ON and speed === 0)
  const [idleSeconds, setIdleSeconds] = useState(0);

  useEffect(() => {
    let idleInterval: any = null;
    if (ignitionOn && currentSpeed === 0) {
      idleInterval = setInterval(() => {
        setIdleSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setIdleSeconds(0);
    }
    return () => clearInterval(idleInterval);
  }, [ignitionOn, currentSpeed]);

  // Trip Logs Storage
  const [tripLogs, setTripLogs] = useState<TripLog[]>(() => {
    try {
      const saved = localStorage.getItem('hoopo_trip_logs');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'init-trip-1',
        startTime: '08:30 AM',
        endTime: '09:15 AM',
        durationSeconds: 2700,
        distanceKm: 34.2,
        maxSpeedKmH: 88,
        avgSpeedKmH: 45.6,
        estimatedCO2Grams: 5560,
      },
    ];
  });

  // Manual Petrol Logs
  const [petrolLogs, setPetrolLogs] = useState<PetrolLog[]>(() => {
    try {
      const saved = localStorage.getItem('hoopo_petrol_logs');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'p-1',
        liters: 35.0,
        amount: 3549.0,
        stationName: 'BPCL Highway Lounge - Tirunelveli Bypass (NH 44)',
        odometerKm: 14120,
        timestamp: 'Nov 11, 09:20 AM',
        notes: 'Full tank refill',
      },
      {
        id: 'p-2',
        liters: 25.0,
        amount: 2530.0,
        stationName: 'HPCL Swagat Plaza - Gangaikondan',
        odometerKm: 14380,
        timestamp: 'Nov 12, 02:15 PM',
        notes: 'Highway fuel top-up',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('hoopo_petrol_logs', JSON.stringify(petrolLogs));
    } catch {}
  }, [petrolLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('hoopo_trip_logs', JSON.stringify(tripLogs));
    } catch {}
  }, [tripLogs]);

  // 8. Radio cum FM State
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [radioFreq, setRadioFreq] = useState(89.2);
  const [radioVolume, setRadioVolume] = useState(0.65);

  // 9. Travel Buddy Voice State
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // 10. Live Clock & Dynamic Astronomical Prayer Calculation
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [activeCoords, setActiveCoords] = useState<[number, number]>(() => {
    try {
      const saved = localStorage.getItem('hoopo_last_known_coords');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [8.7139, 77.7567]; // Default: Tirunelveli, Tamil Nadu
  });

  useEffect(() => {
    if (realUserLocation) {
      setActiveCoords(realUserLocation);
      try {
        localStorage.setItem('hoopo_last_known_coords', JSON.stringify(realUserLocation));
      } catch {}
    }
  }, [realUserLocation]);

  const computedPrayerSchedule = React.useMemo(() => {
    return calculateOfflinePrayerSchedule(activeCoords[0], activeCoords[1], currentTime);
  }, [activeCoords, currentTime.toDateString()]);

  const dynamicPrayerSchedule: PrayerTime[] = React.useMemo(() => [
    { name: 'Fajr', arabicName: 'الفجر', time: computedPrayerSchedule.fajr },
    { name: 'Sunrise', arabicName: 'الشروق', time: computedPrayerSchedule.sunrise },
    { name: 'Dhuhr', arabicName: 'الظهر', time: computedPrayerSchedule.dhuhr },
    { name: 'Asr', arabicName: 'العصر', time: computedPrayerSchedule.asr },
    { name: 'Maghrib', arabicName: 'المغرب', time: computedPrayerSchedule.maghrib },
    { name: 'Isha', arabicName: 'العشاء', time: computedPrayerSchedule.isha },
  ], [computedPrayerSchedule]);

  const prayerCalc = getNextPrayer(
    dynamicPrayerSchedule,
    currentTime.getHours(),
    currentTime.getMinutes()
  );

  // 11. En Route Rain Detection
  const upcomingRain = detectUpcomingRain(SAMPLE_WEATHER, progressKm, 25);

  // 12. Real Continuous GPS Velocity Watcher
  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, accuracy } = pos.coords;
        const now = Date.now();
        setRealUserLocation([latitude, longitude]);
        setGpsAccuracy(accuracy);
        setGpsStatus('locked');

        // Check if browser provides direct speed in m/s
        if (speed !== null && speed !== undefined && speed >= 0) {
          const kmh = Math.round(speed * 3.6 * 10) / 10;
          setCalculatedGpsSpeed(kmh);
        } else if (prevGpsPosRef.current) {
          // Calculate Haversine speed from position delta
          const v = calculateGpsVelocity(
            prevGpsPosRef.current.lat,
            prevGpsPosRef.current.lng,
            prevGpsPosRef.current.time,
            latitude,
            longitude,
            now
          );
          setCalculatedGpsSpeed(v);
        }

        prevGpsPosRef.current = { lat: latitude, lng: longitude, time: now };
      },
      (err) => {
        console.warn('GPS Watch error:', err);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 8000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 13. Odometer & Trip Telematics Tracker (tracks real driving when vehicle is moving)
  useEffect(() => {
    let driveInterval: any = null;
    if (ignitionOn && currentSpeed > 0) {
      driveInterval = setInterval(() => {
        const deltaKm = currentSpeed / 3600; // km per second
        setTripDistance((prev) => prev + deltaKm);
        setTripSeconds((prev) => prev + 1);
        setOdometerKm((prev) => prev + deltaKm);
        setTripMaxSpeed((m) => Math.max(m, currentSpeed));
      }, 1000);
    }
    return () => clearInterval(driveInterval);
  }, [ignitionOn, currentSpeed]);

  // 14. Request AI Companion Comment via Server-Side Gemini API or Local Engine
  const handleRequestAIComment = async (
    category: 'weather' | 'music' | 'break' | 'spontaneous'
  ): Promise<string | void> => {
    try {
      const response = await fetch('/api/hoopo/companion-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          category,
          currentSpeed,
          speedLimit,
          weather: upcomingRain ? upcomingRain.condition : 'Clear',
          nowPlaying: isRadioPlaying ? `Radio FM ${radioFreq} MHz` : 'Peaceful Travel Audio',
          tripMinutes: Math.round(tripSeconds / 60) || 15,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.comment;
      }
    } catch (e) {
      console.warn('Could not reach Gemini companion API:', e);
    }
    return generateFriendlyCompanionComment(userName, category, {
      speed: currentSpeed,
      weatherCondition: upcomingRain ? upcomingRain.condition : 'Clear',
      tripMinutes: Math.round(tripSeconds / 60) || 15,
    });
  };

  // Trigger Finish Ride & Show Driving Rating
  const handleFinishRide = () => {
    const finalDistance = Math.max(tripDistance, 8.5);
    const finalDuration = Math.max(tripSeconds, 180);
    const finalMaxSpeed = Math.max(tripMaxSpeed, currentSpeed, 75);

    const rating = calculateDrivingRating(
      Math.round(finalDistance * 10) / 10,
      finalDuration,
      Math.round(finalMaxSpeed),
      speedLimit,
      idleSeconds,
      userName
    );
    setLatestRating(rating);
    setShowRatingModal(true);

    const newTrip = createCompletedTrip(
      tripStartTime,
      new Date(),
      finalDistance,
      finalMaxSpeed
    );
    setTripLogs((prev) => [newTrip, ...prev]);

    setIgnitionOn(false);
    setCalculatedGpsSpeed(0);
    setCruiseControlActive(false);

    if (voiceEnabled) {
      speakHoopoMessage(
        `${userName}, ride completed! Alhamdulillah. Your driving rating is ${rating.overallScore} out of 100 with Grade ${rating.grade}.`
      );
    }
  };

  // Ignition Toggle Handler: When turning OFF after driving, triggers driving rating!
  const handleToggleIgnition = () => {
    if (ignitionOn) {
      handleFinishRide();
    } else {
      setIgnitionOn(true);
      setTripStartTime(new Date());
      setTripDistance(0);
      setTripSeconds(0);
      setTripMaxSpeed(0);

      soundEngine.playGreetingChime();
      if (voiceEnabled) {
        speakHoopoMessage(`Ignition on, ${userName}! Trip logging activated under standard EPA emission models. Drive safely!`);
      }
    }
  };

  // Location Access: Geolocation API
  const handleRequestLocation = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('denied');
      if (voiceEnabled) speakHoopoMessage(`${userName}, geolocation is not supported by your browser.`);
      return;
    }

    setGpsStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setRealUserLocation([lat, lng]);
        setGpsAccuracy(pos.coords.accuracy);
        setGpsStatus('locked');
        setIsGpsLiveMode(true);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsStatus('denied');
        if (voiceEnabled) {
          speakHoopoMessage(`${userName}, could not lock GPS. Please ensure location permissions are granted.`);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Automatically acquire GPS and pin position on app startup
  useEffect(() => {
    handleRequestLocation();
  }, []);

  const handleDuaModalClose = () => {
    setShowDuaModal(false);
    setShowGreetingBanner(true);
    soundEngine.playGreetingChime();
    if (voiceEnabled) {
      speakHoopoMessage(
        `Fi Amanillah, ${userName}! Welcome aboard. Hoopo is ready as your travel friend. Have a safe and blessed journey!`
      );
    }
  };

  const handleAddPetrolLog = (newLog: Omit<PetrolLog, 'id'>) => {
    const entry: PetrolLog = {
      id: `petrol-${Date.now()}`,
      ...newLog,
    };
    setPetrolLogs((prev) => [entry, ...prev]);
    setFuelLevel(95);
    if (voiceEnabled) {
      speakHoopoMessage(`${userName}, logged ${entry.liters} liters for ₹${entry.amount} rupees. Fuel tank updated.`);
    }
  };

  const handleDeletePetrolLog = (id: string) => {
    setPetrolLogs((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleCruise = () => {
    if (!ignitionOn) return;
    setCruiseControlActive((prev) => !prev);
  };

  const handleSelectStation = (station: FuelStation) => {
    setSelectedStationId(station.id);
    if (voiceEnabled) {
      speakHoopoMessage(`${userName}, added ${station.name} to our route stops.`);
    }
  };

  const handleExecuteVoiceCommand = (cmd: any) => {
    switch (cmd.intent) {
      case 'NAVIGATE':
        setShowRouteModal(true);
        break;
      case 'FUEL':
        setShowFuelModal(true);
        break;
      case 'PRAYER':
        speakHoopoMessage(
          `${userName}, next prayer is ${prayerCalc.nextPrayer.name} in ${prayerCalc.minutesRemaining} minutes.`
        );
        break;
      case 'RADIO':
        if (cmd.action === 'pause') {
          setIsRadioPlaying(false);
        } else {
          setIsRadioPlaying(true);
        }
        break;
      case 'WEATHER':
        if (upcomingRain) {
          speakHoopoMessage(
            `${userName}, rain is expected at ${upcomingRain.location}. Please drive with caution.`
          );
        } else {
          speakHoopoMessage(`${userName}, route skies are currently clear of heavy rain.`);
        }
        break;
      case 'SPEED':
        speakHoopoMessage(
          `${userName}, current speed is ${Math.round(currentSpeed)} km/h. Speed limit is ${speedLimit} km/h.`
        );
        break;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Cockpit Top Navigation & Status Bar */}
      <header className="shrink-0 h-14 bg-slate-900/95 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between z-30 backdrop-blur-md">
        {/* Left: Brand with Official Hoopoe Logo & Driver Name Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-amber-500/50 bg-slate-950 shadow-md shadow-amber-500/20 shrink-0">
              <img
                src="/assets/aistudio/hoopoe_logo_bedb9b31.png"
                alt="HOOPOE Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-wider text-white flex items-center gap-1.5 uppercase font-speed">
                <span>HOOPOE</span>
                <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  COCKPIT
                </span>
              </h1>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                Companion HUD &bull; {ignitionOn ? 'Engine Running' : 'Parked'}
              </span>
            </div>
          </div>

          {/* Driver Profile & Voice Settings Button */}
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-750 border border-red-500/40 text-xs font-semibold text-red-300 transition-all shadow-sm"
            title="Configure Driver Name, System Voice, and Arabic Pronunciation"
            aria-label="Driver profile and voice settings"
          >
            <Sliders className="w-3.5 h-3.5 text-red-400" />
            <span>Voice &amp; Driver: <strong className="text-white">{userName}</strong></span>
          </button>

          {/* GPS status pill with Real Accuracy */}
          <button
            type="button"
            onClick={handleRequestLocation}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
              gpsStatus === 'locked'
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                : gpsStatus === 'loading'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Determine exact GPS location and velocity"
          >
            <Crosshair className={`w-3.5 h-3.5 ${gpsStatus === 'loading' ? 'animate-spin' : ''}`} />
            <span>
              {gpsStatus === 'locked'
                ? `GPS: ${gpsAccuracy ? `±${Math.round(gpsAccuracy)}m` : 'Locked'}`
                : gpsStatus === 'loading'
                ? 'Acquiring GPS...'
                : 'GPS Locate'}
            </span>
          </button>
        </div>

        {/* Center: Live Clock & Next Prayer */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-speed text-sm font-bold text-white tracking-wider">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-300 text-[11px] font-medium">
              Upcoming: <strong className="text-emerald-300">{prayerCalc.nextPrayer.name}</strong> ({prayerCalc.minutesRemaining}m)
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Finish Ride / Driving Rating Button */}
          <button
            type="button"
            onClick={handleFinishRide}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/30 to-amber-600/30 hover:from-amber-500/40 hover:to-amber-600/40 border border-amber-500/60 text-xs font-bold text-amber-300 transition-all shadow-sm"
            aria-label="Finish ride and show driving performance rating"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Driving Rating</span>
          </button>

          {/* Reopen Travel Dua Modal */}
          <button
            type="button"
            onClick={() => setShowDuaModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-xs font-bold text-emerald-300 transition-colors shadow-sm"
            aria-label="Open Travel Dua"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Travel Dua</span>
          </button>

          {/* Manual Petrol & Amount Log */}
          <button
            type="button"
            onClick={() => setShowPetrolModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-amber-300 transition-colors shadow-sm"
            aria-label="Open Petrol Log"
          >
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Petrol Log</span>
          </button>

          {/* Trip Log */}
          <button
            type="button"
            onClick={() => setShowTripModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-slate-200 transition-colors shadow-sm"
            aria-label="Open Trip Distance Logs"
          >
            <RouteIcon className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Trips ({tripLogs.length})</span>
          </button>

          {/* Voice Assistant */}
          <button
            type="button"
            onClick={() => setShowVoiceModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition-transform active:scale-95"
            aria-label="Open Voice Navigation"
          >
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden lg:inline">Voice</span>
          </button>
        </div>
      </header>

      {/* Main Automotive Cockpit: Landscape Three-Column Setup */}
      <main className="flex-1 min-h-0 p-2 sm:p-3 grid grid-cols-1 md:grid-cols-12 landscape:grid-cols-12 gap-2.5 sm:gap-3 overflow-y-auto md:overflow-hidden landscape:overflow-hidden">
        {/* COLUMN 1 (LEFT, ~25-28%): Speed Gauge Cluster + Telematics */}
        <section
          aria-label="Vehicle Instrument Cluster"
          className="md:col-span-3 landscape:col-span-3 flex flex-col gap-2.5 sm:gap-3 h-full min-h-[420px] md:min-h-0 landscape:min-h-0 overflow-y-auto"
        >
          {/* Speed Gauge (At Left Corner) with Real GPS / Simulator modes */}
          <div className="flex-1 min-h-[360px]">
            <SpeedGauge
              currentSpeed={currentSpeed}
              speedLimit={speedLimit}
              gear={gear}
              unit={unit}
              cruiseControlActive={cruiseControlActive}
              fuelLevel={fuelLevel}
              ignitionOn={ignitionOn}
              tripDistance={tripDistance}
              idleSeconds={idleSeconds}
              isGpsLiveMode={isGpsLiveMode}
              gpsAccuracy={gpsAccuracy}
              onGearChange={setGear}
              onToggleCruise={handleToggleCruise}
              onToggleUnit={() => setUnit(unit === 'km/h' ? 'mph' : 'km/h')}
              onToggleIgnition={handleToggleIgnition}
            />
          </div>

          {/* Standard CO2 Emission & Drive Stats Card */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">EPA Emission Model</span>
                <span className="font-bold text-white">
                  {calculateStandardDrivingCO2(tripDistance, currentSpeed).gramsCO2} g CO2 ({calculateStandardDrivingCO2(tripDistance, currentSpeed).effectiveLPer100Km} L/100km)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinishRide}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/50 text-[11px] font-bold text-emerald-300"
            >
              Finish Ride
            </button>
          </div>
        </section>

        {/* COLUMN 2 (CENTRE, ~45-50%): Centre Map with Embedded Search & Direction */}
        <section
          aria-label="Centre Navigation Map"
          className="md:col-span-6 landscape:col-span-6 flex flex-col h-[460px] md:h-full landscape:h-full min-h-0"
        >
          <MapCenter
            currentSpeed={currentSpeed}
            activeRoute={activeRoute}
            progressKm={progressKm}
            fuelStations={SAMPLE_FUEL_STATIONS}
            rainForecast={SAMPLE_WEATHER}
            nightMode={nightMode}
            showTraffic={showTraffic}
            showRainRadar={showRainRadar}
            showFuelStations={showFuelStations}
            realUserLocation={realUserLocation}
            gpsStatus={gpsStatus}
            onRequestLocation={handleRequestLocation}
            onToggleTraffic={() => setShowTraffic(!showTraffic)}
            onToggleRainRadar={() => setShowRainRadar(!showRainRadar)}
            onToggleFuelStations={() => setShowFuelStations(!showFuelStations)}
            onSelectStation={handleSelectStation}
            onSelectNewRoute={(newRoute) => {
              setActiveRoute(newRoute);
              setProgressKm(0);
              if (voiceEnabled) {
                speakHoopoMessage(`${userName}, route mapped to ${newRoute.name}. Safe travels, my friend!`);
              }
            }}
          />
        </section>

        {/* COLUMN 3 (RIGHT, ~25-28%): Other Widgets (Bird Drone Mascot + Upcoming Prayer + Radio & Music Player) */}
        <section
          aria-label="Right Cockpit Widgets"
          className="md:col-span-3 landscape:col-span-3 flex flex-col gap-2 sm:gap-2.5 h-full min-h-[460px] md:min-h-0 landscape:min-h-0 overflow-y-auto"
        >
          {/* Widget 1 (Top): Tiny Animated Hoopo Bird Drone with AI Companion Talk */}
          <div className="shrink-0 min-h-[170px]">
            <HoopoTravelBuddy
              userName={userName}
              currentSpeed={ignitionOn ? currentSpeed : 0}
              speedLimit={speedLimit}
              ignitionOn={ignitionOn}
              idleSeconds={idleSeconds}
              upcomingRain={upcomingRain}
              nextPrayer={prayerCalc.nextPrayer}
              prayerMinutesLeft={prayerCalc.minutesRemaining}
              isPrayerApproaching={prayerCalc.isApproaching}
              voiceEnabled={voiceEnabled}
              nowPlayingTrack={isRadioPlaying ? `Radio ${radioFreq} MHz` : 'Peaceful Travel Audio'}
              tripMinutes={Math.round(tripSeconds / 60) || 12}
              onSlowDown={() => soundEngine.playGreetingChime()}
              onTurnOffIgnition={handleToggleIgnition}
              onLocateMosque={() => setShowFuelModal(true)}
              onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
              onFinishRide={handleFinishRide}
              onRequestAIComment={handleRequestAIComment}
            />
          </div>

          {/* Widget 2 (Middle): Upcoming Prayer Time ONLY (Not All) */}
          <div className="shrink-0 min-h-[140px]">
            <PrayerTimesWidget
              prayers={dynamicPrayerSchedule}
              currentPrayer={prayerCalc.currentPrayer}
              nextPrayer={prayerCalc.nextPrayer}
              minutesRemaining={prayerCalc.minutesRemaining}
              qiblaBearing={computedPrayerSchedule.qiblaBearingDeg}
              onLocateNearestMosque={() => {
                setShowFuelModal(true);
                if (voiceEnabled) {
                  speakHoopoMessage(`${userName}, filtering roadside plazas with dedicated prayer areas.`);
                }
              }}
            />
          </div>

          {/* Widget 3 (Bottom): Connected Radio cum FM & Music Player Module */}
          <div className="flex-1 min-h-[220px]">
            <RadioFMModule
              isPlaying={isRadioPlaying}
              frequency={radioFreq}
              volume={radioVolume}
              onTogglePlay={() => setIsRadioPlaying(!isRadioPlaying)}
              onFrequencyChange={setRadioFreq}
              onVolumeChange={setRadioVolume}
            />
          </div>
        </section>
      </main>

      {/* Opening Travel Dua Modal with Tamil translation */}
      <TravelDuaModal isOpen={showDuaModal} onClose={handleDuaModalClose} />

      {/* Islamic Travel Greeting Banner */}
      <IslamicGreetingBanner
        isVisible={showGreetingBanner}
        onDismiss={() => setShowGreetingBanner(false)}
      />

      {/* Driver User Name Edit Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        currentUserName={userName}
        onClose={() => setShowProfileModal(false)}
        onSaveUserName={handleUpdateUserName}
      />

      {/* Driving Performance Rating Modal (Triggered after finished ride) */}
      {latestRating && (
        <DrivingRatingModal
          isOpen={showRatingModal}
          rating={latestRating}
          tripDistance={Math.round(Math.max(tripDistance, 8.5) * 10) / 10}
          tripDurationSeconds={Math.max(tripSeconds, 180)}
          maxSpeedKmH={Math.round(Math.max(tripMaxSpeed, currentSpeed, 75))}
          avgSpeedKmH={Math.round(currentSpeed > 0 ? currentSpeed * 0.85 : 48)}
          totalCO2Grams={calculateStandardDrivingCO2(Math.max(tripDistance, 8.5), currentSpeed || 60).gramsCO2}
          idleSeconds={idleSeconds}
          onClose={() => setShowRatingModal(false)}
          onStartNewRide={() => {
            setShowRatingModal(false);
            setIgnitionOn(true);
            setTripStartTime(new Date());
            setTripDistance(0);
            setTripSeconds(0);
            setIdleSeconds(0);
          }}
        />
      )}

      {/* Manual Petrol & Amount Log Modal */}
      <PetrolExpenseModal
        isOpen={showPetrolModal}
        logs={petrolLogs}
        currentOdometer={odometerKm}
        onClose={() => setShowPetrolModal(false)}
        onAddLog={handleAddPetrolLog}
        onDeleteLog={handleDeletePetrolLog}
      />

      {/* Ignition-Based Trip Log Modal */}
      <TripLogModal
        isOpen={showTripModal}
        ignitionOn={ignitionOn}
        currentTripDistance={tripDistance}
        currentTripSeconds={tripSeconds}
        tripLogs={tripLogs}
        onClose={() => setShowTripModal(false)}
        onToggleIgnition={handleToggleIgnition}
        onClearTrips={() => setTripLogs([])}
      />

      {/* Personalized Route Suggestions Modal */}
      <RouteSuggestionsModal
        isOpen={showRouteModal}
        routes={SAMPLE_ROUTES}
        activeRouteId={activeRoute?.id || ''}
        onClose={() => setShowRouteModal(false)}
        onSelectRoute={(newRoute) => {
          setActiveRoute(newRoute);
          setProgressKm(0);
          if (voiceEnabled) {
            speakHoopoMessage(`${userName}, selected ${newRoute.name}. Route updated.`);
          }
        }}
      />

      {/* Integrated Fuel Station Locator Modal */}
      <FuelStationLocator
        isOpen={showFuelModal}
        stations={SAMPLE_FUEL_STATIONS}
        selectedStationId={selectedStationId}
        onClose={() => setShowFuelModal(false)}
        onSelectStation={handleSelectStation}
      />

      {/* Voice-Activated Navigation Modal */}
      <VoiceNavigationModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onExecuteCommand={handleExecuteVoiceCommand}
      />
    </div>
  );
}
