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
  Smartphone,
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
import { AndroidApkModal } from './components/AndroidApkModal';

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

// Realistic sample route coordinates
const SAMPLE_ROUTES: RouteOption[] = [
  {
    id: 'route-fast',
    name: 'Fast Highway Route (Toll)',
    tag: 'Fastest',
    distanceKm: 48,
    durationMins: 32,
    trafficLevel: 'moderate',
    rainRisk: true,
    fuelStopsCount: 4,
    waypoints: [
      [24.7136, 46.6753],
      [24.7350, 46.6900],
      [24.7600, 46.7200],
      [24.7950, 46.7600],
      [24.8350, 46.7900],
      [24.8700, 46.8200],
      [24.9100, 46.8500],
      [24.9450, 46.8850],
      [24.9800, 46.9200],
    ],
  },
  {
    id: 'route-coastal',
    name: 'Scenic Coastal Highway',
    tag: 'Scenic',
    distanceKm: 56,
    durationMins: 42,
    trafficLevel: 'smooth',
    rainRisk: false,
    fuelStopsCount: 3,
    waypoints: [
      [24.7136, 46.6753],
      [24.7000, 46.7200],
      [24.7300, 46.7800],
      [24.7800, 46.8400],
      [24.8500, 46.8900],
      [24.9200, 46.9300],
      [24.9800, 46.9200],
    ],
  },
  {
    id: 'route-eco',
    name: 'Eco Green Express',
    tag: 'Eco-Friendly',
    distanceKm: 45,
    durationMins: 36,
    trafficLevel: 'smooth',
    rainRisk: false,
    fuelStopsCount: 2,
    waypoints: [
      [24.7136, 46.6753],
      [24.7400, 46.7000],
      [24.7800, 46.7400],
      [24.8400, 46.8000],
      [24.9000, 46.8600],
      [24.9800, 46.9200],
    ],
  },
];

// Sample Fuel Stations along route
const SAMPLE_FUEL_STATIONS: FuelStation[] = [
  {
    id: 'st-1',
    name: 'Aramco Oasis Service Plaza',
    brand: 'Aramco',
    distanceKm: 8.5,
    fuelPrice: 1.28,
    amenities: ['Highway Musalla', 'Halal Coffee', 'Restroom', 'EV Fast Charge'],
    lat: 24.7600,
    lng: 46.7200,
  },
  {
    id: 'st-2',
    name: 'Shell Select Express',
    brand: 'Shell',
    distanceKm: 18.2,
    fuelPrice: 1.34,
    amenities: ['Air & Water', 'Prayer Area', '24/7 Car Wash', 'Fresh Market'],
    lat: 24.8350,
    lng: 46.7900,
  },
  {
    id: 'st-3',
    name: 'Petronas Highway Hub',
    brand: 'Petronas',
    distanceKm: 31.0,
    fuelPrice: 1.31,
    amenities: ['Air-Conditioned Musalla', 'EV Charger 150kW', 'Dine-in Halal Cafe'],
    lat: 24.8700,
    lng: 46.8200,
  },
  {
    id: 'st-4',
    name: 'Adnoc Travel Center',
    brand: 'Adnoc',
    distanceKm: 42.4,
    fuelPrice: 1.29,
    amenities: ['Grand Musalla', 'Tire Service', 'Convenience Store'],
    lat: 24.9450,
    lng: 46.8850,
  },
];

// Weather forecasts along route
const SAMPLE_WEATHER: WeatherCondition[] = [
  {
    location: 'Km 12 - Airport Expressway',
    kmMark: 12,
    condition: 'Clear',
    riskLevel: 'low',
    advisory: 'Clear visibility and dry road surface.',
  },
  {
    location: 'Km 34 - Valley Pass Highway',
    kmMark: 34,
    condition: 'Rain',
    riskLevel: 'moderate',
    advisory: 'Moderate rainfall expected. Maintain safe following distance and activate wipers.',
  },
  {
    location: 'Km 46 - Northern Ring Interchange',
    kmMark: 46,
    condition: 'Cloudy',
    riskLevel: 'low',
    advisory: 'Overcast skies with mild crosswinds.',
  },
];

// Daily Islamic prayer times
const PRAYER_SCHEDULE: PrayerTime[] = [
  { name: 'Fajr', arabicName: 'الفجر', time: '05:14' },
  { name: 'Sunrise', arabicName: 'الشروق', time: '06:32' },
  { name: 'Dhuhr', arabicName: 'الظهر', time: '12:22' },
  { name: 'Asr', arabicName: 'العصر', time: '15:40' },
  { name: 'Maghrib', arabicName: 'المغرب', time: '18:12' },
  { name: 'Isha', arabicName: 'العشاء', time: '19:35' },
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
  const [showApkModal, setShowApkModal] = useState(false);

  // 3. Navigation & Map State
  const [activeRoute, setActiveRoute] = useState<RouteOption>(SAMPLE_ROUTES[0]);
  const [progressKm, setProgressKm] = useState(0);
  const [isDrivingSimulating, setIsDrivingSimulating] = useState(false);
  const [nightMode, setNightMode] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showRainRadar, setShowRainRadar] = useState(true);
  const [showFuelStations, setShowFuelStations] = useState(true);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // 4. Real Location & Hardware GPS Speedometer
  const [realUserLocation, setRealUserLocation] = useState<[number, number] | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'locked' | 'denied'>('idle');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isGpsLiveMode, setIsGpsLiveMode] = useState(false);
  const [calculatedGpsSpeed, setCalculatedGpsSpeed] = useState(0);

  // Track previous GPS coordinates to calculate Haversine ground speed
  const prevGpsPosRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

  // 5. Vehicle Cluster State
  const [simulatedSpeed, setSimulatedSpeed] = useState(72);
  const [speedLimit, setSpeedLimit] = useState(80);
  const [gear, setGear] = useState<'P' | 'R' | 'N' | 'D' | 'S'>('D');
  const [unit, setUnit] = useState<'km/h' | 'mph'>('km/h');
  const [cruiseControlActive, setCruiseControlActive] = useState(false);
  const [fuelLevel, setFuelLevel] = useState(78);
  const [odometerKm, setOdometerKm] = useState(14250);

  // Effective velocity: resolves real GPS speed when live mode is active, else simulated speedometer
  const currentSpeed = isGpsLiveMode ? calculatedGpsSpeed : simulatedSpeed;

  // 6. Ignition & Trip Telematics State
  const [ignitionOn, setIgnitionOn] = useState(true);
  const [tripDistance, setTripDistance] = useState(0);
  const [tripSeconds, setTripSeconds] = useState(0);
  const [tripStartTime, setTripStartTime] = useState<Date>(new Date());
  const [tripMaxSpeed, setTripMaxSpeed] = useState(72);
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
        liters: 42.5,
        amount: 55.25,
        stationName: 'Aramco Oasis Plaza',
        odometerKm: 14120,
        timestamp: 'Nov 8, 09:20 AM',
        notes: 'Full tank refill',
      },
      {
        id: 'p-2',
        liters: 38.0,
        amount: 50.92,
        stationName: 'Shell Select Express',
        odometerKm: 14250,
        timestamp: 'Nov 10, 01:15 PM',
        notes: 'Highway fuel stop',
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

  // 10. Live Clock & Prayer Calculation
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const prayerCalc = getNextPrayer(
    PRAYER_SCHEDULE,
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

  // 13. Trip Distance & Simulation Loop
  useEffect(() => {
    let driveInterval: any = null;
    if (isDrivingSimulating && ignitionOn) {
      driveInterval = setInterval(() => {
        const deltaKm = 0.35;
        setProgressKm((prev) => {
          const next = prev + deltaKm;
          if (next >= activeRoute.distanceKm) {
            setIsDrivingSimulating(false);
            return activeRoute.distanceKm;
          }
          return next;
        });

        setTripDistance((prev) => prev + deltaKm);
        setTripSeconds((prev) => prev + 1);
        setOdometerKm((prev) => prev + deltaKm);

        if (!cruiseControlActive && !isGpsLiveMode) {
          setSimulatedSpeed((prev) => {
            const jitter = (Math.random() - 0.48) * 3;
            const updated = Math.min(130, Math.max(35, prev + jitter));
            setTripMaxSpeed((m) => Math.max(m, updated));
            return updated;
          });
        }
      }, 600);
    }
    return () => clearInterval(driveInterval);
  }, [isDrivingSimulating, ignitionOn, activeRoute.distanceKm, cruiseControlActive, isGpsLiveMode]);

  // 14. Periodic Ambient Travel Friend Chatter (every ~3.5 mins of driving)
  useEffect(() => {
    let chatterTimer: any = null;
    if (ignitionOn && currentSpeed > 20 && voiceEnabled) {
      chatterTimer = setInterval(() => {
        const categories: Array<'weather' | 'music' | 'break' | 'smooth_driving'> = [
          'weather',
          'music',
          'break',
          'smooth_driving',
        ];
        const pickedCategory = categories[Math.floor(Math.random() * categories.length)];
        const friendlyRemark = generateFriendlyCompanionComment(userName, pickedCategory, {
          speed: currentSpeed,
          weatherCondition: upcomingRain ? upcomingRain.condition : 'Clear',
          tripMinutes: Math.round(tripSeconds / 60) || 12,
        });
        speakHoopoMessage(friendlyRemark);
      }, 210000); // 3.5 minutes
    }
    return () => clearInterval(chatterTimer);
  }, [ignitionOn, currentSpeed, voiceEnabled, userName, upcomingRain, tripSeconds]);

  // Request AI Companion Comment via Server-Side Gemini API
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
    setIsDrivingSimulating(false);
    setSimulatedSpeed(0);
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
      setTripMaxSpeed(60);
      setSimulatedSpeed(60);

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

        if (voiceEnabled) {
          speakHoopoMessage(`${userName}, exact GPS coordinates acquired. Live speedometer engaged.`);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsStatus('denied');
        if (voiceEnabled) {
          speakHoopoMessage(`${userName}, could not lock GPS. Please ensure location permissions are granted.`);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 20000 }
    );
  };

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
      speakHoopoMessage(`${userName}, logged ${entry.liters} liters for $${entry.amount}. Fuel tank updated.`);
    }
  };

  const handleDeletePetrolLog = (id: string) => {
    setPetrolLogs((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSpeedChange = (newSpeed: number) => {
    if (!ignitionOn || isGpsLiveMode) return;
    setSimulatedSpeed(newSpeed);
    setTripMaxSpeed((m) => Math.max(m, newSpeed));
    if (cruiseControlActive && Math.abs(newSpeed - 75) > 5) {
      setCruiseControlActive(false);
    }
  };

  const handleSlowDownToLimit = () => {
    if (!isGpsLiveMode) {
      setSimulatedSpeed(speedLimit);
    }
  };

  const handleToggleCruise = () => {
    if (!ignitionOn || isGpsLiveMode) return;
    if (!cruiseControlActive) {
      setCruiseControlActive(true);
      setSimulatedSpeed(75);
    } else {
      setCruiseControlActive(false);
    }
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
          {/* Android APK Compilation & Install Button */}
          <button
            type="button"
            onClick={() => setShowApkModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/60 text-xs font-bold text-emerald-300 transition-all shadow-sm"
            aria-label="Install or compile Android APK"
            title="Install or compile Hoopoe as an Android APK"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Install APK</span>
          </button>

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
      <main className="flex-1 min-h-0 p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-y-auto lg:overflow-hidden">
        {/* COLUMN 1 (LEFT, ~25-28%): Speed Gauge Cluster + Telematics */}
        <section
          aria-label="Vehicle Instrument Cluster"
          className="lg:col-span-3 xl:col-span-3 flex flex-col gap-3 h-full min-h-[460px] lg:min-h-0 overflow-y-auto"
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
              onSpeedChange={handleSpeedChange}
              onGearChange={setGear}
              onToggleCruise={handleToggleCruise}
              onToggleUnit={() => setUnit(unit === 'km/h' ? 'mph' : 'km/h')}
              onToggleIgnition={handleToggleIgnition}
              onToggleGpsLiveMode={() => setIsGpsLiveMode(!isGpsLiveMode)}
              onFastTriggerIdle40={() => {
                setIdleSeconds(40);
                setSimulatedSpeed(0);
                setCalculatedGpsSpeed(0);
              }}
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
          className="lg:col-span-6 xl:col-span-6 flex flex-col h-[500px] lg:h-full min-h-0"
        >
          <MapCenter
            currentSpeed={currentSpeed}
            activeRoute={activeRoute}
            progressKm={progressKm}
            fuelStations={SAMPLE_FUEL_STATIONS}
            rainForecast={SAMPLE_WEATHER}
            isDrivingSimulating={isDrivingSimulating}
            nightMode={nightMode}
            showTraffic={showTraffic}
            showRainRadar={showRainRadar}
            showFuelStations={showFuelStations}
            realUserLocation={realUserLocation}
            gpsStatus={gpsStatus}
            onRequestLocation={handleRequestLocation}
            onToggleSimulateDrive={() => {
              if (!ignitionOn) {
                setIgnitionOn(true);
              }
              setIsDrivingSimulating(!isDrivingSimulating);
            }}
            onResetSimulateDrive={() => setProgressKm(0)}
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
          className="lg:col-span-3 xl:col-span-3 flex flex-col gap-2.5 h-full min-h-[500px] lg:min-h-0 overflow-y-auto"
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
              onSlowDown={handleSlowDownToLimit}
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
              prayers={PRAYER_SCHEDULE}
              currentPrayer={prayerCalc.currentPrayer}
              nextPrayer={prayerCalc.nextPrayer}
              minutesRemaining={prayerCalc.minutesRemaining}
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
            setSimulatedSpeed(60);
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
        activeRouteId={activeRoute.id}
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

      {/* Android APK Compilation & Install Modal */}
      <AndroidApkModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
      />
    </div>
  );
}
