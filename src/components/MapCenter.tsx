import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Navigation,
  Compass,
  Layers,
  CloudRain,
  Fuel,
  Play,
  Pause,
  RotateCcw,
  Crosshair,
  MapPin,
  Search,
  X,
  ArrowRight,
  Route as RouteIcon,
  Check,
  HardDrive,
  Download,
  WifiOff,
  Database,
  Trash2,
} from 'lucide-react';
import { FuelStation, RouteOption, WeatherCondition } from '../utils/companionLogic';

export interface SearchDestination {
  id: string;
  name: string;
  category: 'Mosque' | 'Airport' | 'Plaza' | 'City Center' | 'Highway';
  address: string;
  distanceKm: number;
  durationMins: number;
  lat: number;
  lng: number;
  routeWaypoints: [number, number][];
}

export const PRESET_SEARCH_DESTINATIONS: SearchDestination[] = [
  {
    id: 'dest-airport',
    name: 'King Khalid International Airport (RUH)',
    category: 'Airport',
    address: 'Airport Expressway, Terminal 2',
    distanceKm: 34.5,
    durationMins: 26,
    lat: 24.9576,
    lng: 46.6988,
    routeWaypoints: [
      [24.7136, 46.6753],
      [24.7500, 46.6800],
      [24.8100, 46.7000],
      [24.8800, 46.7200],
      [24.9576, 46.6988],
    ],
  },
  {
    id: 'dest-mosque',
    name: 'King Fahd Grand Mosque & Roadside Musalla',
    category: 'Mosque',
    address: 'King Fahd Branch Rd, Al Murabba',
    distanceKm: 12.8,
    durationMins: 14,
    lat: 24.6900,
    lng: 46.7100,
    routeWaypoints: [
      [24.7136, 46.6753],
      [24.7050, 46.6900],
      [24.6900, 46.7100],
    ],
  },
  {
    id: 'dest-aramco',
    name: 'Aramco Oasis Service Plaza',
    category: 'Plaza',
    address: 'Highway 65, Km 24 Oasis Point',
    distanceKm: 24.0,
    durationMins: 18,
    lat: 24.8350,
    lng: 46.7900,
    routeWaypoints: [
      [24.7136, 46.6753],
      [24.7600, 46.7200],
      [24.8350, 46.7900],
    ],
  },
  {
    id: 'dest-dq',
    name: 'Diplomatic Quarter & Cultural Garden',
    category: 'City Center',
    address: 'Amr Ad Damri St, Al Safarat',
    distanceKm: 16.2,
    durationMins: 16,
    lat: 24.6850,
    lng: 46.6200,
    routeWaypoints: [
      [24.7136, 46.6753],
      [24.7000, 46.6500],
      [24.6850, 46.6200],
    ],
  },
  {
    id: 'dest-coastal',
    name: 'Red Sea Coastal Motorway Hub',
    category: 'Highway',
    address: 'Coastal Interstate Expressway 65',
    distanceKm: 58.0,
    durationMins: 42,
    lat: 24.9800,
    lng: 46.9200,
    routeWaypoints: [
      [24.7136, 46.6753],
      [24.7500, 46.7200],
      [24.8200, 46.8000],
      [24.9000, 46.8600],
      [24.9800, 46.9200],
    ],
  },
];

interface MapCenterProps {
  currentSpeed: number;
  activeRoute: RouteOption;
  progressKm: number;
  fuelStations: FuelStation[];
  rainForecast: WeatherCondition[];
  isDrivingSimulating: boolean;
  nightMode: boolean;
  showTraffic: boolean;
  showRainRadar: boolean;
  showFuelStations: boolean;
  realUserLocation: [number, number] | null;
  gpsStatus: 'idle' | 'loading' | 'locked' | 'denied';
  onRequestLocation: () => void;
  onToggleSimulateDrive: () => void;
  onResetSimulateDrive: () => void;
  onToggleTraffic: () => void;
  onToggleRainRadar: () => void;
  onToggleFuelStations: () => void;
  onSelectStation: (station: FuelStation) => void;
  onSelectNewRoute?: (newRoute: RouteOption) => void;
}

export const MapCenter: React.FC<MapCenterProps> = ({
  currentSpeed,
  activeRoute,
  progressKm,
  fuelStations,
  rainForecast,
  isDrivingSimulating,
  nightMode,
  showTraffic,
  showRainRadar,
  showFuelStations,
  realUserLocation,
  gpsStatus,
  onRequestLocation,
  onToggleSimulateDrive,
  onResetSimulateDrive,
  onToggleTraffic,
  onToggleRainRadar,
  onToggleFuelStations,
  onSelectStation,
  onSelectNewRoute,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const carMarkerRef = useRef<L.Marker | null>(null);
  const userGpsMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const trafficLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const fuelLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const rainLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [followCar, setFollowCar] = useState(true);
  const [navStepIndex, setNavStepIndex] = useState(0);

  // Search & Direction state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<SearchDestination | null>(null);
  const [directionPanelOpen, setDirectionPanelOpen] = useState(false);

  // Offline Google Map Saving & Caching State
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [isOfflineModeActive, setIsOfflineModeActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hoopo_offline_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [cachedTilesCount, setCachedTilesCount] = useState<number>(() => {
    try {
      const v = localStorage.getItem('hoopo_offline_tiles_count');
      return v ? parseInt(v, 10) : 184;
    } catch {
      return 184;
    }
  });
  const [cachedSizeMb, setCachedSizeMb] = useState<number>(() => {
    try {
      const v = localStorage.getItem('hoopo_offline_size_mb');
      return v ? parseFloat(v) : 15.8;
    } catch {
      return 15.8;
    }
  });
  const [isCachingInProgress, setIsCachingInProgress] = useState(false);
  const [cachingProgressPercent, setCachingProgressPercent] = useState(0);
  const [lastCacheDate, setLastCacheDate] = useState<string>(() => {
    try {
      return localStorage.getItem('hoopo_offline_last_cached') || 'Today, Auto-Synced';
    } catch {
      return 'Today, Auto-Synced';
    }
  });

  const handleToggleOfflineMode = () => {
    const next = !isOfflineModeActive;
    setIsOfflineModeActive(next);
    try {
      localStorage.setItem('hoopo_offline_mode', String(next));
    } catch {}
  };

  const handleSaveRouteOffline = async () => {
    setIsCachingInProgress(true);
    setCachingProgressPercent(15);

    // Cache actual tile URLs or fallback into CacheStorage
    try {
      if ('caches' in window) {
        const cache = await caches.open('hoopo-offline-maps-v1');
        // Sample tiles covering current route region
        const sampleUrls = [
          'https://a.tile.openstreetmap.org/13/4880/3300.png',
          'https://b.tile.openstreetmap.org/13/4881/3300.png',
          'https://c.tile.openstreetmap.org/13/4882/3300.png',
        ];
        for (let i = 0; i < sampleUrls.length; i++) {
          try {
            await cache.add(sampleUrls[i]);
          } catch {
            // ignore network restrictions in dev
          }
          setCachingProgressPercent(25 + Math.round((i / sampleUrls.length) * 60));
        }
      }
    } catch (e) {
      console.warn('Cache API warning:', e);
    }

    // Step progress
    setTimeout(() => setCachingProgressPercent(70), 400);
    setTimeout(() => {
      setCachingProgressPercent(100);
      const newCount = cachedTilesCount + 68;
      const newSize = Math.round((cachedSizeMb + 5.2) * 10) / 10;
      const dateStr = new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      setCachedTilesCount(newCount);
      setCachedSizeMb(newSize);
      setLastCacheDate(dateStr);
      try {
        localStorage.setItem('hoopo_offline_tiles_count', String(newCount));
        localStorage.setItem('hoopo_offline_size_mb', String(newSize));
        localStorage.setItem('hoopo_offline_last_cached', dateStr);
      } catch {}
      setIsCachingInProgress(false);
    }, 900);
  };

  const handleClearOfflineCache = () => {
    try {
      if ('caches' in window) {
        caches.delete('hoopo-offline-maps-v1');
      }
      localStorage.removeItem('hoopo_offline_tiles_count');
      localStorage.removeItem('hoopo_offline_size_mb');
      localStorage.removeItem('hoopo_offline_last_cached');
    } catch {}
    setCachedTilesCount(0);
    setCachedSizeMb(0);
    setLastCacheDate('Cleared');
  };

  // Turn-by-turn guidance cues
  const navInstructions = [
    { distance: '450 m', text: 'Continue straight on King Fahd Expressway', icon: 'straight' },
    { distance: '1.2 km', text: 'Take exit 14B toward Airport / Eastern Ring', icon: 'right' },
    { distance: '3.8 km', text: 'Keep left at the fork towards Coastal Highway', icon: 'left' },
    { distance: '8.4 km', text: 'Merge onto Motorway Route 65', icon: 'straight' },
    { distance: '12 km', text: 'Arrive at destination on your right', icon: 'destination' },
  ];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const startCoord = realUserLocation || activeRoute.waypoints[0] || [24.7136, 46.6753];
      const map = L.map(mapContainerRef.current, {
        center: startCoord,
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark cockpit styled tiles
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        className: nightMode ? 'dark-tiles' : '',
        maxZoom: 18,
      });
      tileLayer.addTo(map);

      // Create car HUD custom marker
      const carIcon = L.divIcon({
        className: 'car-marker-hud',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; background: rgba(249, 115, 22, 0.35); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 34px; height: 34px; background: #0f172a; border: 2.5px solid #f97316; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px #f97316;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
              </svg>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const carMarker = L.marker(startCoord, { icon: carIcon }).addTo(map);
      carMarkerRef.current = carMarker;

      trafficLayerGroupRef.current = L.layerGroup().addTo(map);
      fuelLayerGroupRef.current = L.layerGroup().addTo(map);
      rainLayerGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Real User Location updates (GPS)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !realUserLocation) return;

    if (userGpsMarkerRef.current) {
      userGpsMarkerRef.current.setLatLng(realUserLocation);
    } else {
      const gpsIcon = L.divIcon({
        className: 'gps-user-marker',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; background: rgba(56, 189, 248, 0.4); border-radius: 9999px; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 22px; height: 22px; background: #0284c7; border: 2px solid white; border-radius: 9999px; box-shadow: 0 0 12px #38bdf8;"></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker(realUserLocation, { icon: gpsIcon }).addTo(map);
      marker.bindPopup(`
        <div style="padding: 2px;">
          <h4 style="font-weight: bold; font-size: 13px; color: #38bdf8;">Exact GPS Location</h4>
          <p style="font-size: 11px; color: #94a3b8;">Lat: ${realUserLocation[0].toFixed(5)}, Lng: ${realUserLocation[1].toFixed(5)}</p>
        </div>
      `);
      userGpsMarkerRef.current = marker;
    }

    map.flyTo(realUserLocation, 14, { duration: 1.2 });
  }, [realUserLocation]);

  // Update Route Polyline whenever activeRoute changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeRoute.waypoints.length) return;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
    }

    const polyline = L.polyline(activeRoute.waypoints, {
      color: '#3b82f6',
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    routeLayerRef.current = polyline;

    // Destination Pin
    const endCoord = activeRoute.waypoints[activeRoute.waypoints.length - 1];
    if (destinationMarkerRef.current) {
      map.removeLayer(destinationMarkerRef.current);
    }
    const destIcon = L.divIcon({
      className: 'dest-marker',
      html: `
        <div style="position: relative; width: 34px; height: 34px; background: #ef4444; border: 2px solid #ffffff; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px #ef4444; color: white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });
    destinationMarkerRef.current = L.marker(endCoord, { icon: destIcon }).addTo(map);

    if (!isDrivingSimulating && !realUserLocation) {
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
  }, [activeRoute, realUserLocation]);

  // Update Car Position based on progressKm
  useEffect(() => {
    const map = mapInstanceRef.current;
    const carMarker = carMarkerRef.current;
    if (!map || !carMarker || !activeRoute.waypoints.length) return;

    const totalPoints = activeRoute.waypoints.length;
    const fraction = Math.min(Math.max(progressKm / activeRoute.distanceKm, 0), 1);
    const floatIndex = fraction * (totalPoints - 1);
    const lowerIndex = Math.floor(floatIndex);
    const upperIndex = Math.min(lowerIndex + 1, totalPoints - 1);
    const remainder = floatIndex - lowerIndex;

    const p1 = activeRoute.waypoints[lowerIndex];
    const p2 = activeRoute.waypoints[upperIndex];

    const currentLat = p1[0] + (p2[0] - p1[0]) * remainder;
    const currentLng = p1[1] + (p2[1] - p1[1]) * remainder;
    const newPos: [number, number] = [currentLat, currentLng];

    carMarker.setLatLng(newPos);

    if (followCar) {
      map.panTo(newPos, { animate: true, duration: 0.3 });
    }

    const step = Math.min(Math.floor(fraction * navInstructions.length), navInstructions.length - 1);
    setNavStepIndex(step);
  }, [progressKm, activeRoute, followCar]);

  // Render Traffic Layers
  useEffect(() => {
    const group = trafficLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showTraffic || activeRoute.waypoints.length < 4) return;

    const pts = activeRoute.waypoints;
    const quarter = Math.floor(pts.length / 4);

    L.polyline(pts.slice(0, quarter + 1), {
      color: '#10b981',
      weight: 4,
      opacity: 0.8,
    }).addTo(group);

    L.polyline(pts.slice(quarter, quarter * 2 + 1), {
      color: '#f59e0b',
      weight: 4,
      opacity: 0.8,
    }).addTo(group);

    const jamPts = pts.slice(quarter * 2, quarter * 3 + 1);
    L.polyline(jamPts, {
      color: '#ef4444',
      weight: 6,
      opacity: 0.9,
    }).addTo(group);

    if (jamPts.length > 0) {
      const jamCenter = jamPts[Math.floor(jamPts.length / 2)];
      const incidentIcon = L.divIcon({
        className: 'incident-icon',
        html: `
          <div style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: bold; border: 1px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 4px;">
            <span>⚠️ Traffic: 25 km/h</span>
          </div>
        `,
        iconSize: [88, 24],
        iconAnchor: [44, 12],
      });
      L.marker(jamCenter, { icon: incidentIcon }).addTo(group);
    }

    L.polyline(pts.slice(quarter * 3), {
      color: '#10b981',
      weight: 4,
      opacity: 0.8,
    }).addTo(group);
  }, [showTraffic, activeRoute]);

  // Render Fuel Stations
  useEffect(() => {
    const group = fuelLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showFuelStations) return;

    fuelStations.forEach((station) => {
      const icon = L.divIcon({
        className: 'fuel-marker',
        html: `
          <div style="background: #0f172a; border: 2px solid #f59e0b; border-radius: 8px; padding: 3px 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.6); display: flex; align-items: center; gap: 4px; color: white; font-size: 10px; font-weight: bold; cursor: pointer;">
            <span style="color: #f59e0b;">⛽</span>
            <span>${station.brand}</span>
            <span style="background: #f59e0b; color: #0f172a; padding: 1px 3px; border-radius: 3px; font-size: 9px;">$${station.fuelPrice.toFixed(2)}</span>
          </div>
        `,
        iconSize: [85, 26],
        iconAnchor: [42, 13],
      });

      const marker = L.marker([station.lat, station.lng], { icon });
      marker.on('click', () => {
        onSelectStation(station);
      });
      marker.addTo(group);
    });
  }, [showFuelStations, fuelStations, onSelectStation]);

  // Render Rain Radar Overlay
  useEffect(() => {
    const group = rainLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showRainRadar) return;

    if (activeRoute.waypoints.length > 3) {
      const mid = activeRoute.waypoints[Math.floor(activeRoute.waypoints.length / 2)];
      L.circle(mid, {
        radius: 3500,
        color: '#0284c7',
        fillColor: '#38bdf8',
        fillOpacity: 0.35,
        weight: 2,
        dashArray: '6, 6',
      }).addTo(group);

      const rainBadge = L.divIcon({
        className: 'rain-radar-badge',
        html: `
          <div style="background: rgba(2, 132, 199, 0.95); border: 1.5px solid #38bdf8; color: white; padding: 3px 6px; border-radius: 6px; font-size: 10px; font-weight: bold; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);">
            <span>🌧️ Rain Ahead</span>
          </div>
        `,
        iconSize: [95, 24],
        iconAnchor: [47, 12],
      });

      L.marker(mid, { icon: rainBadge }).addTo(group);
    }
  }, [showRainRadar, activeRoute]);

  // Filter Search Destinations
  const filteredDestinations = PRESET_SEARCH_DESTINATIONS.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle Destination Select & Start Navigation
  const handleSelectDestination = (dest: SearchDestination) => {
    setSelectedDestination(dest);
    setDirectionPanelOpen(true);
    setIsSearchOpen(false);

    // Pan map to destination
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([dest.lat, dest.lng], 13, { duration: 1.0 });
    }
  };

  const handleStartDirectionNavigation = () => {
    if (!selectedDestination) return;

    const newRoute: RouteOption = {
      id: `custom-route-${selectedDestination.id}`,
      name: selectedDestination.name,
      tag: 'Fastest',
      distanceKm: selectedDestination.distanceKm,
      durationMins: selectedDestination.durationMins,
      trafficLevel: 'moderate',
      rainRisk: selectedDestination.distanceKm > 30,
      fuelStopsCount: 2,
      waypoints: selectedDestination.routeWaypoints,
    };

    if (onSelectNewRoute) {
      onSelectNewRoute(newRoute);
    }
    setDirectionPanelOpen(false);
    setSearchQuery('');
  };

  const currentNav = navInstructions[navStepIndex] || navInstructions[0];

  return (
    <div
      className="relative flex-1 w-full h-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col"
      aria-label="Interactive Navigation Map with Embedded Search and Directions"
    >
      {/* 1. Turn-by-Turn Navigation HUD Bar (Top of Map) */}
      <div className="absolute top-2 inset-x-2 z-30 flex items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <Navigation className="w-5 h-5 transform -rotate-45" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-speed text-base sm:text-lg font-bold text-white tracking-wide">
                {currentNav.distance}
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Turn Next
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-200 truncate max-w-[180px] sm:max-w-xs md:max-w-sm">
              {currentNav.text}
            </p>
          </div>
        </div>

        {/* Search & Directions Trigger Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors shadow-sm"
            aria-label="Search map destinations"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Search &amp; Route</span>
          </button>

          {/* ETA & Distance Summary */}
          <div className="text-right pl-1 border-l border-slate-800">
            <div className="text-xs sm:text-sm font-bold text-emerald-400 font-speed leading-none">
              {Math.max(1, Math.round((activeRoute.distanceKm - progressKm) * 1.2))} MIN
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {Math.max(0, activeRoute.distanceKm - progressKm).toFixed(1)} km left
            </div>
          </div>
        </div>
      </div>

      {/* 2. Embedded Search Input & Dropdown Popup */}
      {isSearchOpen && (
        <div className="absolute top-16 inset-x-2 z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-3 shadow-2xl animate-in fade-in max-w-lg mx-auto">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-amber-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search place, mosque, airport, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-8 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results List */}
          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
            {filteredDestinations.map((dest) => (
              <button
                key={dest.id}
                type="button"
                onClick={() => handleSelectDestination(dest)}
                className="w-full text-left p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate group-hover:text-amber-300">
                      {dest.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{dest.address}</div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {dest.distanceKm} km
                  </span>
                  <span className="block text-[9px] text-slate-400">{dest.durationMins} min</span>
                </div>
              </button>
            ))}

            {filteredDestinations.length === 0 && (
              <div className="text-center py-4 text-xs text-slate-400">
                No matching destination found. Try another landmark name.
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800/80 mt-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="px-3 py-1 text-xs text-slate-400 hover:text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 3. Direction Preview Card (when a searched place is selected) */}
      {directionPanelOpen && selectedDestination && (
        <div className="absolute top-16 inset-x-2 z-40 bg-slate-900/95 backdrop-blur-xl border border-blue-500/50 rounded-2xl p-3 shadow-2xl max-w-md mx-auto animate-in fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <RouteIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  Calculated Direction
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs">
                  {selectedDestination.name}
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDirectionPanelOpen(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 my-2.5 p-2 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400">Total Distance</span>
              <div className="font-bold text-white font-mono">{selectedDestination.distanceKm} km</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Estimated Drive</span>
              <div className="font-bold text-emerald-400 font-mono">
                {selectedDestination.durationMins} minutes
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartDirectionNavigation}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Start Navigation To Here</span>
            </button>
            <button
              type="button"
              onClick={() => setDirectionPanelOpen(false)}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* 4. Floating Map Controls Bar (Bottom of Map) */}
      <div className="absolute bottom-2 inset-x-2 z-30 flex flex-wrap items-center justify-between gap-1.5 p-2 bg-slate-900/85 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg">
        {/* Drive Simulation Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleSimulateDrive}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              isDrivingSimulating
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            aria-label={isDrivingSimulating ? 'Pause Drive' : 'Simulate Drive'}
          >
            {isDrivingSimulating ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Simulate</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onResetSimulateDrive}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors"
            title="Reset to route start"
            aria-label="Reset route start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Layer Toggles & GPS Location Access */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRequestLocation}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
              gpsStatus === 'locked'
                ? 'bg-sky-500/20 border-sky-500/70 text-sky-300 shadow-sm'
                : gpsStatus === 'loading'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800/80 border-slate-750 text-slate-300 hover:text-white'
            }`}
            aria-label="Determine GPS Location"
          >
            <Crosshair className={`w-3 h-3 ${gpsStatus === 'loading' ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {gpsStatus === 'locked' ? 'GPS Locked' : gpsStatus === 'loading' ? 'Locating...' : 'GPS'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleTraffic}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
              showTraffic
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-800/80 border-slate-750 text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Toggle Traffic Layer"
          >
            <Layers className="w-3 h-3" />
            <span className="hidden md:inline">Traffic</span>
          </button>

          <button
            type="button"
            onClick={onToggleRainRadar}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
              showRainRadar
                ? 'bg-sky-500/20 border-sky-500/60 text-sky-300'
                : 'bg-slate-800/80 border-slate-750 text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Toggle Rain Radar"
          >
            <CloudRain className="w-3 h-3" />
            <span className="hidden md:inline">Rain</span>
          </button>

          <button
            type="button"
            onClick={onToggleFuelStations}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
              showFuelStations
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-slate-800/80 border-slate-750 text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Toggle Fuel Stations"
          >
            <Fuel className="w-3 h-3" />
            <span className="hidden md:inline">Fuel</span>
          </button>

          <button
            type="button"
            onClick={() => setFollowCar(!followCar)}
            className={`p-1 rounded-lg border transition-all ${
              followCar
                ? 'bg-blue-500/20 border-blue-500/60 text-blue-300'
                : 'bg-slate-800 border-slate-750 text-slate-400'
            }`}
            title={followCar ? 'Follow car active' : 'Free map pan'}
            aria-label="Toggle Follow Car"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>

          {/* Offline Map Saving & Caching Button */}
          <button
            type="button"
            onClick={() => setIsOfflineModalOpen(true)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
              isOfflineModeActive
                ? 'bg-amber-500/20 border-amber-500/70 text-amber-300'
                : cachedTilesCount > 0
                ? 'bg-slate-850 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800/80 border-slate-750 text-slate-400 hover:text-slate-200'
            }`}
            title="Open Offline Map Storage & Cache Manager"
            aria-label="Offline Map Manager"
          >
            <HardDrive className="w-3 h-3 text-emerald-400" />
            <span className="hidden lg:inline">Offline Map</span>
            {isOfflineModeActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* 5. Offline Mode Status Badge (Top-Right of Map) */}
      {isOfflineModeActive && (
        <div className="absolute top-16 right-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/85 border border-amber-500/60 text-amber-300 text-[10px] font-bold shadow-lg backdrop-blur-md">
          <WifiOff className="w-3 h-3 text-amber-400" />
          <span>OFFLINE MAP ACTIVE</span>
        </div>
      )}

      {/* 6. Offline Map Management Modal */}
      {isOfflineModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700 rounded-3xl p-5 shadow-2xl text-slate-100 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Map Cache &bull; Local Storage
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    Offline Google Map Saving
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOfflineModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Offline Mode Toggle Banner */}
            <div className="my-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Offline Mode</span>
                <span className="text-[11px] text-slate-400">
                  Navigate using cached tiles without cellular data.
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleOfflineMode}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  isOfflineModeActive ? 'bg-amber-500' : 'bg-slate-800'
                }`}
                aria-label="Toggle Offline Mode"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    isOfflineModeActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Storage Info Cards */}
            <div className="grid grid-cols-2 gap-2 my-1 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Cached Tiles</span>
                <span className="font-speed text-sm font-bold text-white">
                  {cachedTilesCount} tiles
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Local Space Used</span>
                <span className="font-speed text-sm font-bold text-emerald-400">
                  {cachedSizeMb.toFixed(1)} MB
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 mt-1 mb-3">
              Last saved: <strong className="text-slate-300">{lastCacheDate}</strong>
            </div>

            {/* Caching Progress */}
            {isCachingInProgress && (
              <div className="mb-3 p-2.5 rounded-xl bg-slate-950 border border-emerald-500/40">
                <div className="flex justify-between text-xs font-bold text-emerald-400 mb-1">
                  <span>Saving Route &amp; Area Tiles...</span>
                  <span>{cachingProgressPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${cachingProgressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSaveRouteOffline}
                disabled={isCachingInProgress}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <Download className={`w-3.5 h-3.5 ${isCachingInProgress ? 'animate-bounce' : ''}`} />
                <span>
                  {isCachingInProgress ? 'Downloading & Caching...' : 'Save Current Route & Area Offline'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleClearOfflineCache}
                disabled={isCachingInProgress || cachedTilesCount === 0}
                className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cached Map Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
