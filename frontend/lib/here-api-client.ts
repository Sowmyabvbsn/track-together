const HERE_API_KEY = process.env.NEXT_PUBLIC_HERE_API_KEY || '';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Waypoint extends Coordinates {
  name?: string;
  type?: 'start' | 'stop' | 'via' | 'end';
}

export interface RouteSection {
  id: string;
  type: string;
  departure: {
    time: string;
    place: {
      type: string;
      location: Coordinates;
      originalLocation: Coordinates;
    };
  };
  arrival: {
    time: string;
    place: {
      type: string;
      location: Coordinates;
      originalLocation: Coordinates;
    };
  };
  summary: {
    duration: number;
    length: number;
    baseDuration: number;
  };
  polyline: string;
  transport: {
    mode: string;
  };
  notices?: Array<{
    code: string;
    title: string;
    severity: string;
  }>;
}

export interface TrafficIncident {
  id: string;
  type: string;
  location: {
    shape: {
      type: string;
      coordinates: number[][];
    };
  };
  incidentDetails: {
    type: string;
    severity: string;
    description: string;
    criticality: number;
    startTime?: string;
    endTime?: string;
  };
}

export interface OptimizedRoute {
  id: string;
  sections: RouteSection[];
  summary: {
    duration: number;
    length: number;
    baseDuration: number;
  };
  notices?: Array<{
    code: string;
    title: string;
    severity: string;
  }>;
  polyline: string;
  alternatives?: OptimizedRoute[];
}

export interface RouteOptimizationResult {
  routes: OptimizedRoute[];
  aiRecommendation?: string;
  trafficIncidents: TrafficIncident[];
  estimatedArrival: string;
  fuelEfficiency?: number;
}

export const isHereAPIConfigured = (): boolean => {
  return !!HERE_API_KEY && HERE_API_KEY !== 'your_here_api_key_here';
};

function decodeFlexiblePolyline(encoded: string): Coordinates[] {
  const decoded: Coordinates[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    decoded.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return decoded;
}

export const hereAPIClient = {
  async optimizeRoute(
    origin: Coordinates,
    destination: Coordinates,
    waypoints: Waypoint[] = [],
    options: {
      mode?: 'fastest' | 'shortest' | 'balanced';
      avoidTraffic?: boolean;
      avoidTolls?: boolean;
      avoidHighways?: boolean;
      alternatives?: number;
    } = {}
  ): Promise<RouteOptimizationResult> {
    if (!isHereAPIConfigured()) {
      console.warn('HERE API not configured, using fallback route');
      return this.generateFallbackRoute(origin, destination, waypoints);
    }

    try {
      const {
        mode = 'fastest',
        avoidTraffic = true,
        avoidTolls = false,
        avoidHighways = false,
        alternatives = 2,
      } = options;

      const baseUrl = 'https://router.hereapi.com/v8/routes';

      let url = `${baseUrl}?transportMode=car`;
      url += `&origin=${origin.lat},${origin.lng}`;
      url += `&destination=${destination.lat},${destination.lng}`;

      waypoints.forEach((wp, index) => {
        url += `&via=${wp.lat},${wp.lng}`;
      });

      url += `&return=polyline,summary,notices,turnByTurnActions`;
      url += `&alternatives=${alternatives}`;

      if (avoidTraffic) {
        url += `&departureTime=now`;
      }

      const avoid = [];
      if (avoidTolls) avoid.push('tollRoad');
      if (avoidHighways) avoid.push('controlledAccessHighway');
      if (avoid.length > 0) {
        url += `&avoid[features]=${avoid.join(',')}`;
      }

      url += `&apiKey=${HERE_API_KEY}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HERE API error: ${response.status}`);
      }

      const data = await response.json();

      const trafficIncidents = await this.getTrafficIncidents(
        origin,
        destination
      );

      const routes: OptimizedRoute[] = data.routes.map((route: any) => ({
        id: route.id,
        sections: route.sections,
        summary: {
          duration: route.sections.reduce((sum: number, s: any) => sum + s.summary.duration, 0),
          length: route.sections.reduce((sum: number, s: any) => sum + s.summary.length, 0),
          baseDuration: route.sections.reduce((sum: number, s: any) => sum + s.summary.baseDuration, 0),
        },
        notices: route.notices || [],
        polyline: route.sections.map((s: any) => s.polyline).join(''),
      }));

      const bestRoute = routes[0];
      const estimatedArrival = new Date(
        Date.now() + bestRoute.summary.duration * 1000
      ).toISOString();

      return {
        routes,
        trafficIncidents,
        estimatedArrival,
      };
    } catch (error) {
      console.error('HERE API route optimization error:', error);
      return this.generateFallbackRoute(origin, destination, waypoints);
    }
  },

  async getTrafficIncidents(
    origin: Coordinates,
    destination: Coordinates,
    radius: number = 10000
  ): Promise<TrafficIncident[]> {
    if (!isHereAPIConfigured()) {
      return [];
    }

    try {
      const centerLat = (origin.lat + destination.lat) / 2;
      const centerLng = (origin.lng + destination.lng) / 2;

      const url = `https://data.traffic.hereapi.com/v7/incidents?bbox=${centerLng - 0.1},${centerLat - 0.1},${centerLng + 0.1},${centerLat + 0.1}&apiKey=${HERE_API_KEY}`;

      const response = await fetch(url);

      if (!response.ok) {
        console.warn('Traffic data unavailable');
        return [];
      }

      const data = await response.json();

      return data.results || [];
    } catch (error) {
      console.error('Traffic incidents fetch error:', error);
      return [];
    }
  },

  async getRealTimeObstacles(
    routePolyline: string
  ): Promise<TrafficIncident[]> {
    if (!isHereAPIConfigured()) {
      return [];
    }

    try {
      const decoded = decodeFlexiblePolyline(routePolyline);

      if (decoded.length === 0) return [];

      const bounds = decoded.reduce(
        (acc, coord) => ({
          minLat: Math.min(acc.minLat, coord.lat),
          maxLat: Math.max(acc.maxLat, coord.lat),
          minLng: Math.min(acc.minLng, coord.lng),
          maxLng: Math.max(acc.maxLng, coord.lng),
        }),
        {
          minLat: decoded[0].lat,
          maxLat: decoded[0].lat,
          minLng: decoded[0].lng,
          maxLng: decoded[0].lng,
        }
      );

      const url = `https://data.traffic.hereapi.com/v7/incidents?bbox=${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}&apiKey=${HERE_API_KEY}`;

      const response = await fetch(url);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return data.results || [];
    } catch (error) {
      console.error('Real-time obstacles fetch error:', error);
      return [];
    }
  },

  async getAlternativeRoutes(
    origin: Coordinates,
    destination: Coordinates,
    currentIncidents: TrafficIncident[]
  ): Promise<OptimizedRoute[]> {
    const result = await this.optimizeRoute(origin, destination, [], {
      alternatives: 3,
      avoidTraffic: true,
    });

    return result.routes;
  },

  decodePolyline(encoded: string): Coordinates[] {
    return decodeFlexiblePolyline(encoded);
  },

  generateFallbackRoute(
    origin: Coordinates,
    destination: Coordinates,
    waypoints: Waypoint[] = []
  ): RouteOptimizationResult {
    const allPoints = [origin, ...waypoints, destination];

    const totalDistance = allPoints.reduce((sum, point, index) => {
      if (index === 0) return 0;
      const prev = allPoints[index - 1];
      return sum + this.calculateDistance(prev, point);
    }, 0);

    const estimatedDuration = totalDistance * 50;

    const polyline = this.encodeSimplePolyline(allPoints);

    const route: OptimizedRoute = {
      id: 'fallback-route',
      sections: [
        {
          id: 'section-1',
          type: 'vehicle',
          departure: {
            time: new Date().toISOString(),
            place: {
              type: 'location',
              location: origin,
              originalLocation: origin,
            },
          },
          arrival: {
            time: new Date(Date.now() + estimatedDuration * 1000).toISOString(),
            place: {
              type: 'location',
              location: destination,
              originalLocation: destination,
            },
          },
          summary: {
            duration: estimatedDuration,
            length: totalDistance * 1000,
            baseDuration: estimatedDuration,
          },
          polyline: polyline,
          transport: {
            mode: 'car',
          },
        },
      ],
      summary: {
        duration: estimatedDuration,
        length: totalDistance * 1000,
        baseDuration: estimatedDuration,
      },
      polyline: polyline,
    };

    return {
      routes: [route],
      trafficIncidents: [],
      estimatedArrival: new Date(Date.now() + estimatedDuration * 1000).toISOString(),
    };
  },

  calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371;
    const dLat = ((to.lat - from.lat) * Math.PI) / 180;
    const dLng = ((to.lng - from.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.lat * Math.PI) / 180) *
        Math.cos((to.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  encodeSimplePolyline(points: Coordinates[]): string {
    return points.map(p => `${p.lat},${p.lng}`).join(';');
  },

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },

  formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  },
};
