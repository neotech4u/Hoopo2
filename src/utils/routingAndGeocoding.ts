/**
 * Real Routing & Geocoding Service for Hoopo Car Cockpit.
 * Provides live search for places in Tamil Nadu & worldwide (Nominatim),
 * real turn-by-turn road calculations (OSRM), and Google Maps tile endpoints.
 *
 * 100% Free: No API keys required, works directly inside the browser.
 */

export interface LivePlaceResult {
  id: string;
  name: string;
  category: 'Mosque' | 'Airport' | 'Plaza' | 'City Center' | 'Highway';
  address: string;
  lat: number;
  lng: number;
  distanceKm?: number;
}

export interface LiveRouteResult {
  waypoints: [number, number][];
  distanceKm: number;
  durationMins: number;
  steps: Array<{
    distance: string;
    text: string;
    icon: string;
  }>;
}

export const GOOGLE_MAPS_TILES = {
  roadmap: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
  satellite: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  terrain: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
};

// Haversine distance helper
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Searches places globally using OpenStreetMap Nominatim with prioritize bias toward current location
 */
export async function searchPlacesLive(
  query: string,
  userLat?: number,
  userLng?: number
): Promise<LivePlaceResult[]> {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = encodeURIComponent(query.trim());
  let url = `https://nominatim.openstreetmap.org/search?format=json&q=${cleanQuery}&addressdetails=1&limit=6`;

  // If user location is known, add viewbox bias (roughly ~200km radius around user)
  if (userLat !== undefined && userLng !== undefined) {
    const latDelta = 1.8;
    const lngDelta = 1.8;
    const viewbox = `${userLng - lngDelta},${userLat + latDelta},${userLng + lngDelta},${userLat - latDelta}`;
    url += `&viewbox=${viewbox}&bounded=0`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9,ta;q=0.8',
      },
    });

    if (!response.ok) return [];
    const data = await response.json();

    if (!Array.isArray(data)) return [];

    return data.map((item: any, idx: number) => {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);

      // Categorize based on item type
      let category: 'Mosque' | 'Airport' | 'Plaza' | 'City Center' | 'Highway' = 'City Center';
      const typeStr = (item.type || item.class || '').toLowerCase();
      const displayName = (item.display_name || '').toLowerCase();

      if (typeStr.includes('aerodrome') || typeStr.includes('airport') || displayName.includes('airport')) {
        category = 'Airport';
      } else if (
        typeStr.includes('mosque') ||
        typeStr.includes('place_of_worship') ||
        displayName.includes('masjid') ||
        displayName.includes('mosque') ||
        displayName.includes('dargah')
      ) {
        category = 'Mosque';
      } else if (
        typeStr.includes('fuel') ||
        typeStr.includes('service') ||
        typeStr.includes('mall') ||
        displayName.includes('plaza') ||
        displayName.includes('petrol')
      ) {
        category = 'Plaza';
      } else if (typeStr.includes('motorway') || typeStr.includes('trunk') || displayName.includes('bypass') || displayName.includes('expressway')) {
        category = 'Highway';
      }

      const dist = userLat !== undefined && userLng !== undefined ? getDistanceKm(userLat, userLng, lat, lng) : undefined;

      const titleParts = (item.display_name || '').split(',');
      const shortName = titleParts[0]?.trim() || item.name || query;
      const address = titleParts.slice(1, 4).join(', ').trim() || item.display_name;

      return {
        id: `live-${item.place_id || idx}-${Date.now()}`,
        name: shortName,
        category,
        address,
        lat,
        lng,
        distanceKm: dist,
      };
    });
  } catch (err) {
    console.warn('Live geocoding error:', err);
    return [];
  }
}

/**
 * Calculates a genuine driving route using OSRM (Open Source Routing Machine)
 */
export async function calculateLiveRoute(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): Promise<LiveRouteResult | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const json = await res.json();

    if (!json.routes || json.routes.length === 0) return null;

    const route = json.routes[0];
    // GeoJSON coordinates are [lng, lat] -> convert to Leaflet [lat, lng]
    const waypoints: [number, number][] = route.geometry.coordinates.map((coord: [number, number]) => [
      coord[1],
      coord[0],
    ]);

    const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
    const durationMins = Math.max(1, Math.round(route.duration / 60));

    // Extract turn-by-turn guidance steps
    const steps: Array<{ distance: string; text: string; icon: string }> = [];
    if (route.legs && route.legs[0] && route.legs[0].steps) {
      route.legs[0].steps.forEach((step: any) => {
        const stepDistMeters = Math.round(step.distance);
        const distStr = stepDistMeters > 950 ? `${(stepDistMeters / 1000).toFixed(1)} km` : `${stepDistMeters} m`;
        const modifier = (step.maneuver?.modifier || '').toLowerCase();
        const type = (step.maneuver?.type || '').toLowerCase();

        let icon = 'straight';
        if (modifier.includes('right')) icon = 'right';
        else if (modifier.includes('left')) icon = 'left';
        else if (type.includes('arrive') || type.includes('destination')) icon = 'destination';
        else if (type.includes('roundabout')) icon = 'roundabout';

        const text = step.name
          ? `Proceed onto ${step.name}`
          : step.maneuver?.instruction || 'Continue straight on route';

        if (stepDistMeters > 10) {
          steps.push({
            distance: distStr,
            text,
            icon,
          });
        }
      });
    }

    return {
      waypoints,
      distanceKm,
      durationMins,
      steps: steps.length > 0 ? steps.slice(0, 10) : [
        { distance: `${distanceKm} km`, text: 'Head towards destination along highway', icon: 'straight' },
        { distance: '50 m', text: 'Arrive at destination', icon: 'destination' },
      ],
    };
  } catch (err) {
    console.warn('OSRM live routing error:', err);
    return null;
  }
}
