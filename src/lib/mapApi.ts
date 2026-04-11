const API_BASE = "https://blog.bauer-jakob.de/api/v1/map";

// ── API Response types (matching REST API schemas) ──────────────────

export interface CategoryResponse {
  id: string | number;
  label: string;
  emoji: string | null;
  color: string | null;
  marker_bg: string | null;
  category_type: string | null;
}

export interface PointMarkerResponse {
  id: string | number;
  lat: number;
  lng: number;
  label: string;
  description: string | null;
  category: string | null;
  scenario: string;
  status: string | null;
  funding: any | null;
  radius: number | null;
  verified: boolean | null;
  polygon: any | null;
  area: number | null;
  supporters: number | null;
  conflictType: string | null;
  startDate: string | null;
  endDate: string | null;
  impact: any | null;
  equipment: any | null;
  ageGroup: string | null;
}

export interface StreetLineResponse {
  id: string | number;
  label: string;
  description: string | null;
  category: string | null;
  scenario: string;
  status: string | null;
  funding: any | null;
  waypoints: any | null;
  path: any | null;
  lineStyle: any | null;
  details: any | null;
  impacts: any | null;
  politicalContext: string | null;
  oepnvType: string | null;
  lineName: string | null;
}

// ── Fetch functions (REST API) ───────────────────────────────────────

export async function fetchCategories(): Promise<CategoryResponse[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
  return res.json();
}

export async function fetchMarkers(scenario?: string): Promise<PointMarkerResponse[]> {
  const url = new URL(`${API_BASE}/markers`);
  if (scenario) url.searchParams.set("scenario", scenario);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch markers: ${res.status}`);
  return res.json();
}

export async function fetchStreetLines(scenario?: string): Promise<StreetLineResponse[]> {
  const url = new URL(`${API_BASE}/street-lines`);
  if (scenario) url.searchParams.set("scenario", scenario);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch street lines: ${res.status}`);
  return res.json();
}
