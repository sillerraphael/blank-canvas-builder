// OSRM public routing service – drives/bike/foot profiles
// Uses the free OSRM demo server

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

export async function fetchRoute(
  waypoints: [number, number][],
  signal?: AbortSignal,
): Promise<[number, number][]> {
  if (waypoints.length < 2) return waypoints;

  // OSRM expects lng,lat
  const coords = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return waypoints;

    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return waypoints;

    const geojsonCoords: [number, number][] = data.routes[0].geometry.coordinates;
    return geojsonCoords.map(([lng, lat]) => [lat, lng] as [number, number]);
  } catch {
    return waypoints;
  }
}

const routeCache = new Map<string, [number, number][]>();

export async function fetchRouteCached(
  waypoints: [number, number][],
  signal?: AbortSignal,
): Promise<[number, number][]> {
  const key = waypoints.map(([a, b]) => `${a},${b}`).join(";");
  if (routeCache.has(key)) return routeCache.get(key)!;
  const result = await fetchRoute(waypoints, signal);
  routeCache.set(key, result);
  return result;
}
