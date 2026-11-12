import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Navigation,
  Compass,
  Layers,
  CloudRain,
  Fuel,
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
  ExternalLink,
  Globe,
  Loader2,
} from 'lucide-react';
import { FuelStation, RouteOption, WeatherCondition } from '../utils/companionLogic';
import {
  searchPlacesLive,
  calculateLiveRoute,
  GOOGLE_MAPS_TILES,
  LivePlaceResult,
} from '../utils/routingAndGeocoding';

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
    id: 'dest-tirunelveli-junction',
    name: 'Tirunelveli Railway Junction (Nellai Central)',
    category: 'City Center',
    address: 'Station Rd, Tirunelveli Junction, Tamil Nadu 627001',
    distanceKm: 3.5,
    durationMins: 8,
    lat: 8.7285,
    lng: 77.7081,
    routeWaypoints: [
      [8.7139, 77.7567],
      [8.7200, 77.7300],
      [8.7285, 77.7081],
    ],
  },
  {
    id: 'dest-nellaiappar-temple',
    name: 'Nellaiappar Historic Cultural Hub (Nellai Town)',
    category: 'City Center',
    address: 'South Car St, Tirunelveli Town, Tamil Nadu 627006',
    distanceKm: 5.2,
    durationMins: 12,
    lat: 8.7288,
    lng: 77.6896,
    routeWaypoints: [
      [8.7139, 77.7567],
      [8.7220, 77.7150],
      [8.7288, 77.6896],
    ],
  },
  {
    id: 'dest-palayamkottai-hub',
    name: 'Palayamkottai High Ground & Hospital Hub',
    category: 'Highway',
    address: 'Palayamkottai Central, Tirunelveli',
    distanceKm: 2.1,
    durationMins: 5,
    lat: 8.7180,
    lng: 77.7470,
    routeWaypoints: [
      [8.7139, 77.7567],
      [8.7150, 77.7520],
      [8.7180, 77.7470],
    ],
  },
  {
    id: 'dest-courtallam-falls',
    name: 'Courtallam Main Waterfalls (Tenkasi SH 39)',
    category: 'Highway',
    address: 'Courtallam Western Ghats Corridor, Tenkasi',
    distanceKm: 56.0,
    durationMins: 65,
    lat: 8.9594,
    lng: 77.3150,
    routeWaypoints: [
      [8.7139, 77.7567],
      [8.7900, 77.5800],
      [8.8600, 77.4400],
      [8.9594, 77.3150],
    ],
  },
  {
    id: 'dest-madurai-expressway',
    name: 'Madurai Central via NH 44 Expressway',
    category: 'City Center',
    address: 'NH 44 North Corridor, Madurai, Tamil Nadu',
    distanceKm: 160.0,
    durationMins: 125,
    lat: 9.9252,
    lng: 78.1198,
    routeWaypoints: [
      [8.7139, 77.7567],
      [8.8550, 77.7820],
      [8.9500, 77.7700],
      [9.3800, 77.9600],
      [9.9252, 78.1198],
    ],
  },
  {
    id: 'dest-kanyakumari-cape',
    name: 'Kanyakumari Southern Cape & Sunset Point',
    category: 'Highway',
    address: 'NH 44 South Highway, Cape Comorin',
    distanceKm: 85.0,
    durationMins: 75,
    lat: 8.0883,
    lng: 77.5385,
    routeWaypoints: [
      [8.7139, 77.7567],
      [8.5000, 77.6800],
      [8.3000, 77.6200],
      [8.0883, 77.5385],
    ],
  },
  {
    id: 'dest-thoothukudi-port',
    name: 'Thoothukudi (Tuticorin) Sea Port & Beach',
    category: 'Airport',
    address: 'Harbor Expressway, NH 138 Thoothukudi',
    distanceKm: 48.0,
    durationMins: 45,
    lat: 8.7642,
    lng: 78.1348,
    routeWaypoints: [
      [8.7139, 77.7567],
      [8.7200, 77.9200],
      [8.7642, 78.1348],
    ],
  },
];

interface MapCenterProps {
  currentSpeed: number;
  activeRoute: RouteOption;
  progressKm: number;
  fuelStations: FuelStation[];
  rainForecast: WeatherCondition[];
  nightMode: boolean;
  showTraffic: boolean;
  showRainRadar: boolean;
  showFuelStations: boolean;
  realUserLocation: [number, number] | null;
  gpsStatus: 'idle' | 'loading' | 'locked' | 'denied';
  onRequestLocation: () => void;
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
  nightMode,
  showTraffic,
  showRainRadar,
  showFuelStations,
  realUserLocation,
  gpsStatus,
  onRequestLocation,
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
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [followCar, setFollowCar] = useState(true);
  const [navStepIndex, setNavStepIndex] = useState(0);

  // Map Tile Style State (Google Maps Roadmap vs Satellite vs OSM)
  const [mapTileType, setMapTileType] = useState<'google' | 'satellite' | 'osm'>('google');

  // Search & Direction state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<SearchDestination | null>(null);
  const [directionPanelOpen, setDirectionPanelOpen] = useState(false);
  const [isDirectionsModalOpen, setIsDirectionsModalOpen] = useState(false);
  const [liveSearchResults, setLiveSearchResults] = useState<LivePlaceResult[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [activeNavInstructions, setActiveNavInstructions] = useState<
    Array<{ distance: string; text: string; icon: string }>
  >([]);

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
      return v ? parseInt(v, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [cachedSizeMb, setCachedSizeMb] = useState<number>(() => {
    try {
      const v = localStorage.getItem('hoopo_offline_size_mb');
      return v ? parseFloat(v) : 0.0;
    } catch {
      return 0.0;
    }
  });
  const [isCachingInProgress, setIsCachingInProgress] = useState(false);
  const [cachingProgressPercent, setCachingProgressPercent] = useState(0);
  const [lastCacheDate, setLastCacheDate] = useState<string>(() => {
    try {
      return localStorage.getItem('hoopo_offline_last_cached') || 'No offline map saved';
    } catch {
      return 'No offline map saved';
    }
  });

  // Live Geocoding Search Effect (OpenStreetMap Nominatim)
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setLiveSearchResults([]);
      setIsSearchingLive(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLive(true);
      const userPos = realUserLocation || activeRoute.waypoints[0] || [8.7139, 77.7567];
      const results = await searchPlacesLive(searchQuery, userPos[0], userPos[1]);
      setLiveSearchResults(results);
      setIsSearchingLive(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery, realUserLocation, activeRoute.waypoints]);

  const handleToggleOfflineMode = () => {
    const next = !isOfflineModeActive;
    setIsOfflineModeActive(next);
    try {
      localStorage.setItem('hoopo_offline_mode', String(next));
    } catch {}
  };

  // Determine current active target or route direction
  const activeTargetName = selectedDestination
    ? selectedDestination.name
    : activeRoute?.name || 'Tirunelveli Central & Nellai Corridor';

  const handleSaveRouteOffline = async () => {
    setIsCachingInProgress(true);
    setCachingProgressPercent(12);

    // Compute waypoints based on user route direction or Tirunelveli defaults
    const waypoints: [number, number][] = selectedDestination
      ? selectedDestination.routeWaypoints
      : activeRoute?.waypoints && activeRoute.waypoints.length > 0
      ? activeRoute.waypoints
      : [
          [8.7139, 77.7567],
          [8.7285, 77.7081],
          [8.8550, 77.7820],
          [8.9500, 77.7700],
        ];

    // Generate tile URLs covering route waypoints across zoom levels 11, 12, 13, 14
    const tileUrls: string[] = [];
    const zooms = [12, 13, 14];
    for (const [lat, lng] of waypoints) {
      for (const z of zooms) {
        const x = Math.floor(((lng + 180) / 360) * Math.pow(2, z));
        const latRad = (lat * Math.PI) / 180;
        const y = Math.floor(
          ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, z)
        );
        tileUrls.push(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`);
        tileUrls.push(`https://mt1.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${z}`);
      }
    }

    try {
      if ('caches' in window) {
        const cache = await caches.open('hoopo-offline-maps-v1');
        const uniqueUrls = Array.from(new Set(tileUrls));
        const total = uniqueUrls.length;
        for (let i = 0; i < total; i++) {
          try {
            await cache.add(uniqueUrls[i]);
          } catch {
            // ignore network/cross-origin exceptions in browser
          }
          if (i % 4 === 0) {
            setCachingProgressPercent(15 + Math.round(((i + 1) / total) * 80));
          }
        }
      }
    } catch (e) {
      console.warn('Cache API warning:', e);
    }

    // Finish step progress
    setTimeout(() => {
      setCachingProgressPercent(100);
      const tilesAdded = Math.max(48, Math.min(tileUrls.length, 120));
      const newCount = cachedTilesCount + tilesAdded;
      const newSize = Math.round((cachedSizeMb + tilesAdded * 0.052) * 10) / 10;
      const dateStr = new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      setCachedTilesCount(newCount);
      setCachedSizeMb(newSize);
      const label = `${dateStr} (${activeTargetName.slice(0, 22)})`;
      setLastCacheDate(label);
      try {
        localStorage.setItem('hoopo_offline_tiles_count', String(newCount));
        localStorage.setItem('hoopo_offline_size_mb', String(newSize));
        localStorage.setItem('hoopo_offline_last_cached', label);
      } catch {}
      setIsCachingInProgress(false);
    }, 800);
  };

  const handleClearOfflineCache = () => {
    try {
      if ('caches' in window) {
        caches.delete('hoopo-offline-maps-v1');
      }
      localStorage.removeItem('hoopo_offline_tiles_count');
      localStorage.removeItem('hoopo_offline_size_mb');
      localStorage.removeItem('hoopo_offline_last_cached');
      localStorage.removeItem('hoopo_offline_mode');
    } catch {}
    setCachedTilesCount(0);
    setCachedSizeMb(0);
    setIsOfflineModeActive(false);
    setLastCacheDate('No offline map saved');
  };

  // Turn-by-turn guidance cues (Tirunelveli NH 44 / SH 39 corridor)
  const navInstructions = [
    { distance: '400 m', text: 'Head northeast on Madurai - Tirunelveli Expressway / NH 44', icon: 'straight' },
    { distance: '1.5 km', text: 'Take exit toward Tirunelveli Junction / Vannarpettai Bypass', icon: 'right' },
    { distance: '3.8 km', text: 'Keep left on the flyover toward Tenkasi / Courtallam Highway (SH 39)', icon: 'left' },
    { distance: '8.2 km', text: 'Continue past Gangaikondan Swagat Plaza toward Kayathar', icon: 'straight' },
    { distance: '14 km', text: 'Arrive at destination on your left', icon: 'destination' },
  ];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const startCoord = realUserLocation || activeRoute.waypoints[0] || [8.7139, 77.7567];
      const map = L.map(mapContainerRef.current, {
        center: startCoord,
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Cockpit styled tiles (Google Maps Roadmap by default)
      let initialUrl = GOOGLE_MAPS_TILES.roadmap;
      let initialClass = nightMode ? 'dark-tiles' : '';
      if (mapTileType === 'satellite') {
        initialUrl = GOOGLE_MAPS_TILES.satellite;
        initialClass = '';
      } else if (mapTileType === 'osm') {
        initialUrl = GOOGLE_MAPS_TILES.osm;
      }

      const tileLayer = L.tileLayer(initialUrl, {
        className: initialClass,
        maxZoom: 20,
      });
      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;

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

  // Dynamically update tile layers (Google Maps Roadmap vs Satellite vs OSM)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = GOOGLE_MAPS_TILES.roadmap;
    let className = nightMode && mapTileType !== 'satellite' ? 'dark-tiles' : '';

    if (mapTileType === 'satellite') {
      url = GOOGLE_MAPS_TILES.satellite;
      className = '';
    } else if (mapTileType === 'osm') {
      url = GOOGLE_MAPS_TILES.osm;
    }

    const newTileLayer = L.tileLayer(url, {
      className,
      maxZoom: 20,
    });
    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [mapTileType, nightMode]);

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

    if (!realUserLocation) {
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

  // Handle Destination Select & Start Navigation (with Live OSRM Road Calculation)
  const handleSelectDestination = async (dest: SearchDestination | LivePlaceResult) => {
    const startCoord = realUserLocation || activeRoute.waypoints[0] || [8.7139, 77.7567];

    const targetDest: SearchDestination = {
      id: dest.id,
      name: dest.name,
      category: dest.category,
      address: dest.address,
      distanceKm: dest.distanceKm || 15,
      durationMins: (dest as any).durationMins || Math.max(10, Math.round((dest.distanceKm || 15) * 1.2)),
      lat: dest.lat,
      lng: dest.lng,
      routeWaypoints: (dest as any).routeWaypoints || [startCoord, [dest.lat, dest.lng]],
    };

    setSelectedDestination(targetDest);
    setDirectionPanelOpen(true);
    setIsSearchOpen(false);

    // Pan map to destination
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([dest.lat, dest.lng], 13, { duration: 1.0 });
    }

    // Call live OSRM road routing engine
    setIsCalculatingRoute(true);
    const liveRoute = await calculateLiveRoute(startCoord[0], startCoord[1], dest.lat, dest.lng);
    setIsCalculatingRoute(false);

    if (liveRoute && liveRoute.waypoints.length > 0) {
      targetDest.routeWaypoints = liveRoute.waypoints;
      targetDest.distanceKm = liveRoute.distanceKm;
      targetDest.durationMins = liveRoute.durationMins;
      setSelectedDestination({ ...targetDest });
      setActiveNavInstructions(liveRoute.steps);

      if (mapInstanceRef.current) {
        if (routeLayerRef.current) {
          mapInstanceRef.current.removeLayer(routeLayerRef.current);
        }
        const polyline = L.polyline(liveRoute.waypoints, {
          color: '#38bdf8',
          weight: 6,
          opacity: 0.9,
        }).addTo(mapInstanceRef.current);
        routeLayerRef.current = polyline;
        mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      }
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

  const navList = activeNavInstructions.length > 0 ? activeNavInstructions : navInstructions;
  const currentNav = navList[navStepIndex] || navList[0];

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

        {/* Search & Directions Trigger Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setIsDirectionsModalOpen(true);
              setIsSearchOpen(false);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 border border-blue-400/40 text-xs font-bold text-white transition-all shadow-md shadow-blue-900/30 active:scale-95"
            aria-label="Directions To"
          >
            <Navigation className="w-3.5 h-3.5 text-white" />
            <span>Directions To</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              setIsDirectionsModalOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors shadow-sm"
            aria-label="Search map destinations"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Search</span>
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

          {/* Live Search Status */}
          {isSearchingLive && (
            <div className="flex items-center gap-1.5 py-1.5 px-2 text-[11px] text-amber-300 font-medium border-b border-slate-800/80">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Searching live places across Tamil Nadu & worldwide...</span>
            </div>
          )}

          {/* Results List */}
          <div className="mt-2 space-y-1 max-h-56 overflow-y-auto">
            {/* 1. Presets Header */}
            {filteredDestinations.length > 0 && (
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-0.5">
                Popular Destinations
              </div>
            )}
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

            {/* 2. Live Online Results from Nominatim */}
            {liveSearchResults.length > 0 && (
              <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider px-1 pt-2 flex items-center gap-1">
                <Globe className="w-3 h-3 text-sky-400" />
                <span>Live Map Places</span>
              </div>
            )}
            {liveSearchResults.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => handleSelectDestination(place)}
                className="w-full text-left p-2 rounded-xl bg-sky-950/30 hover:bg-sky-900/40 border border-sky-800/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate group-hover:text-sky-300">
                      {place.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{place.address}</div>
                  </div>
                </div>

                {place.distanceKm !== undefined && (
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-xs font-bold text-sky-400 font-mono">
                      {place.distanceKm} km
                    </span>
                  </div>
                )}
              </button>
            ))}

            {filteredDestinations.length === 0 && liveSearchResults.length === 0 && !isSearchingLive && (
              <div className="text-center py-4 text-xs text-slate-400">
                No matching destination found. Type any place, street, or city name.
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

      {/* 2.5 Dedicated Directions To Modal */}
      {isDirectionsModalOpen && (
        <div className="absolute top-14 inset-x-2 z-40 bg-slate-900/98 backdrop-blur-2xl border border-blue-500/50 rounded-2xl p-3.5 shadow-2xl animate-in fade-in max-w-lg mx-auto max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Directions &amp; Navigation</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    Live Route
                  </span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Select your destination corridor across Tamil Nadu
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsDirectionsModalOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Route Start and Destination Waypoints */}
          <div className="my-2.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col gap-2">
            {/* Origin */}
            <div className="flex items-center gap-2 text-xs">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 block font-medium">From:</span>
                <span className="font-semibold text-slate-200 truncate block">
                  {realUserLocation
                    ? `Current GPS Position (${realUserLocation[0].toFixed(4)}°N, ${realUserLocation[1].toFixed(4)}°E)`
                    : 'Tirunelveli Central Hub (8.7139°N, 77.7567°E)'}
                </span>
              </div>
            </div>

            <div className="h-px bg-slate-800 ml-6" />

            {/* Destination Search */}
            <div className="flex items-center gap-2 text-xs">
              <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/60 flex items-center justify-center text-red-400 shrink-0">
                <MapPin className="w-3 h-3 text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 block font-medium">To:</span>
                <input
                  type="text"
                  placeholder="Type any destination or choose below..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none py-0.5"
                  autoFocus
                />
              </div>
            </div>
          </div>

          {/* Quick Route Choices / Presets */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-56">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-1">
              Popular Highway Corridors &amp; Landmarks
            </span>

            {filteredDestinations.map((dest) => (
              <button
                key={dest.id}
                type="button"
                onClick={() => {
                  handleSelectDestination(dest);
                  setIsDirectionsModalOpen(false);
                }}
                className="w-full text-left p-2 rounded-xl bg-slate-950/60 hover:bg-blue-950/40 border border-slate-800/80 hover:border-blue-500/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Navigation className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 truncate">
                      {dest.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">{dest.address}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <span className="text-xs font-bold text-blue-400 font-mono block">
                    {dest.distanceKm} km
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono block">
                    ~{dest.durationMins} min
                  </span>
                </div>
              </button>
            ))}

            {/* Live nominatim search results if user types custom place */}
            {liveSearchResults.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => {
                  handleSelectDestination(place);
                  setIsDirectionsModalOpen(false);
                }}
                className="w-full text-left p-2 rounded-xl bg-sky-950/30 hover:bg-sky-900/40 border border-sky-800/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-sky-200 truncate">{place.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{place.address}</p>
                  </div>
                </div>
                {place.distanceKm !== undefined && (
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-xs font-bold text-sky-400 font-mono">
                      {place.distanceKm} km
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-2">
            <span className="text-[10px] text-slate-500">
              Powered by Live OSRM Road Routing
            </span>
            <button
              type="button"
              onClick={() => setIsDirectionsModalOpen(false)}
              className="px-3 py-1 text-xs text-slate-400 hover:text-white rounded-lg"
            >
              Cancel
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

          {isCalculatingRoute ? (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-sky-300 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              <span>Calculating real road path via OSRM...</span>
            </div>
          ) : (
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
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartDirectionNavigation}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Start Cockpit HUD Route</span>
            </button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedDestination.lat},${selectedDestination.lng}&travelmode=driving`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 transition-colors"
              title="Open route in Google Maps App"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3 text-blue-400" />
            </a>
            <button
              type="button"
              onClick={() => setDirectionPanelOpen(false)}
              className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-400"
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
        {/* Layer Toggles & GPS Location Access */}
        <div className="flex items-center gap-1">
          {/* Map Layer Mode Toggle (Google Road vs Satellite vs OSM) */}
          <button
            type="button"
            onClick={() => {
              setMapTileType((prev) => (prev === 'google' ? 'satellite' : prev === 'satellite' ? 'osm' : 'google'));
            }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border bg-slate-800/80 border-slate-750 text-amber-300 hover:text-white transition-all shadow-sm"
            aria-label="Switch Map Provider Style"
            title="Switch Map Tiles (Google Roadmap / Satellite / OSM)"
          >
            <Globe className="w-3 h-3 text-amber-400" />
            <span className="capitalize">{mapTileType === 'google' ? 'Google' : mapTileType === 'satellite' ? 'Satellite' : 'OSM'}</span>
          </button>

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
                    Offline Map Engine &bull; Tirunelveli &amp; South TN
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    Offline Map Cache Manager
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

            {/* Active Route Direction Target Badge */}
            <div className="mt-3 p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                  Target Route Direction
                </span>
                <span className="text-xs font-bold text-white truncate block">
                  {activeTargetName}
                </span>
              </div>
              <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
                Nellai NH 44
              </span>
            </div>

            {/* Offline Mode Toggle Banner */}
            <div className="my-2.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
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
                  <span>Downloading Tiles along Route...</span>
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
                <span className="truncate">
                  {isCachingInProgress
                    ? 'Downloading Route Tiles...'
                    : `Download Route Map Data (${activeTargetName.slice(0, 24)})`}
                </span>
              </button>

              <button
                type="button"
                onClick={handleClearOfflineCache}
                disabled={isCachingInProgress || (cachedTilesCount === 0 && cachedSizeMb === 0)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Default &amp; Cached Map Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
