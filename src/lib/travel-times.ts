export type TravelMode = "drive" | "transit" | "walk" | "bike";
export type TravelTimeSource = "google" | "estimate";

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface TravelTimeEstimate {
  distanceKm: number;
  durationMinutes: number;
  source: TravelTimeSource;
}

const MODE_ASSUMPTIONS: Record<
  TravelMode,
  { speedKmh: number; routeFactor: number; fixedMinutes: number }
> = {
  drive: { speedKmh: 38, routeFactor: 1.28, fixedMinutes: 2 },
  transit: { speedKmh: 24, routeFactor: 1.35, fixedMinutes: 8 },
  walk: { speedKmh: 4.8, routeFactor: 1.15, fixedMinutes: 0 },
  bike: { speedKmh: 15, routeFactor: 1.2, fixedMinutes: 1 },
};

export function straightLineKm(a: Coordinate, b: Coordinate): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const lat1 = radians(a.lat);
  const lat2 = radians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

export function estimateTravelTime(
  origin: Coordinate,
  destination: Coordinate,
  mode: TravelMode
): TravelTimeEstimate {
  const assumption = MODE_ASSUMPTIONS[mode];
  const distanceKm = straightLineKm(origin, destination) * assumption.routeFactor;
  const durationMinutes =
    (distanceKm / assumption.speedKmh) * 60 + assumption.fixedMinutes;
  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMinutes: Math.max(1, Math.round(durationMinutes)),
    source: "estimate",
  };
}
