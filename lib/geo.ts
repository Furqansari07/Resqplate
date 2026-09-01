/**
 * Returns the great-circle distance between two lat/lng points in
 * kilometers, using the Haversine formula. Good enough for "how far is
 * this pickup" style display — not turn-by-turn routing distance.
 */
export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_KM = 6371;

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
}

export function hasCoordinates(
  value: { latitude?: number | null; longitude?: number | null } | null | undefined
): value is { latitude: number; longitude: number } {
  return (
    !!value &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number'
  );
}