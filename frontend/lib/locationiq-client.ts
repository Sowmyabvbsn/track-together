const LOCATIONIQ_API_KEY = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY || '';
const LOCATIONIQ_BASE_URL = 'https://us1.locationiq.com/v1';

export interface Location {
  lat: number;
  lng: number;
}

export interface Place {
  place_id: string;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  distance?: number;
}

export const locationIQClient = {
  async searchNearby(
    lat: number,
    lng: number,
    radius: number = 5000,
    type: string = 'amenity'
  ): Promise<Place[]> {
    try {
      const response = await fetch(
        `${LOCATIONIQ_BASE_URL}/nearby?key=${LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lng}&radius=${radius}&tag=${type}&format=json`
      );

      if (!response.ok) {
        throw new Error('Nearby search failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Nearby search error:', error);
      return [];
    }
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  calculateCentroid(locations: Location[]): Location {
    if (locations.length === 0) {
      return { lat: 0, lng: 0 };
    }

    const sum = locations.reduce(
      (acc, loc) => ({
        lat: acc.lat + loc.lat,
        lng: acc.lng + loc.lng
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: sum.lat / locations.length,
      lng: sum.lng / locations.length
    };
  }
};

export const isLocationIQConfigured = (): boolean => {
  return !!LOCATIONIQ_API_KEY && LOCATIONIQ_API_KEY !== 'your_locationiq_api_key_here';
};
