import { useQuery } from "@tanstack/react-query";
import {
  fetchCategories,
  fetchMarkers,
  fetchStreetLines,
  type CategoryResponse,
  type PointMarkerResponse,
  type StreetLineResponse,
} from "@/lib/mapApi";
import {
  pointCategories as fallbackPointCategories,
  streetCategories as fallbackStreetCategories,
  allCategories as fallbackAllCategories,
  mapMarkers as fallbackMarkers,
  streetLines as fallbackStreetLines,
  type MarkerCategory,
  type MapMarkerData,
  type StreetLineData,
  type ScenarioId,
} from "@/data/mapData";
import { toast } from "sonner";

// ── Transform API responses into app types ───────────────────────────

function toMarkerCategory(c: CategoryResponse): MarkerCategory {
  return {
    id: String(c.id),
    label: c.label,
    emoji: c.emoji ?? "📍",
    color: c.color ?? "bg-gray-400",
    markerBg: c.marker_bg ?? "#94a3b8",
  };
}

function toMapMarker(m: PointMarkerResponse): MapMarkerData {
  return {
    id: typeof m.id === "string" ? parseInt(m.id, 10) || 0 : m.id,
    lat: m.lat,
    lng: m.lng,
    label: m.label,
    description: m.description ?? "",
    category: m.category ?? "",
    scenario: m.scenario as ScenarioId,
    status: m.status ?? undefined,
    funding: m.funding ?? undefined,
    radius: m.radius ?? undefined,
    verified: m.verified ?? undefined,
    polygon: Array.isArray(m.polygon) ? m.polygon : undefined,
    area: m.area ?? undefined,
    supporters: m.supporters ?? undefined,
    conflictType: m.conflictType ?? undefined,
    startDate: m.startDate ?? undefined,
    endDate: m.endDate ?? undefined,
    impact: m.impact ?? undefined,
    equipment: Array.isArray(m.equipment) ? m.equipment : undefined,
    ageGroup: m.ageGroup ?? undefined,
  };
}

function toStreetLine(l: StreetLineResponse): StreetLineData {
  return {
    id: typeof l.id === "string" ? parseInt(l.id, 10) || 0 : l.id,
    label: l.label,
    description: l.description ?? "",
    category: l.category ?? "",
    scenario: l.scenario as ScenarioId,
    status: l.status ?? undefined,
    funding: l.funding ?? undefined,
    waypoints: Array.isArray(l.waypoints)
      ? l.waypoints
      : typeof l.waypoints === "string"
        ? JSON.parse(l.waypoints)
        : [],
    path: Array.isArray(l.path)
      ? l.path
      : typeof l.path === "string"
        ? JSON.parse(l.path)
        : undefined,
    lineStyle: (l.lineStyle === "dashed" ? "dashed" : "solid"),
    details: l.details ?? undefined,
    impacts: Array.isArray(l.impacts) ? l.impacts : undefined,
    politicalContext: l.politicalContext ?? undefined,
    oepnvType: (l.oepnvType as "ubahn" | "tram" | "bus") ?? undefined,
    lineName: l.lineName ?? undefined,
  };
}

// ── Fallback category structure ──────────────────────────────────────

const fallbackCategoryData = {
  allCategories: fallbackAllCategories,
  pointCategories: fallbackPointCategories,
  streetCategories: fallbackStreetCategories,
};

// ── React Query hooks with fallback ──────────────────────────────────

export function useMapCategories() {
  const query = useQuery({
    queryKey: ["map-categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    select: (data) => {
      const all = data.map(toMarkerCategory);
      return { allCategories: all, pointCategories: all, streetCategories: [] as MarkerCategory[] };
    },
    meta: {
      onError: () => toast.error("Fehler beim Laden der Kategorien"),
    },
  });

  return {
    ...query,
    data: query.data ?? fallbackCategoryData,
  };
}

export function useMapMarkers(scenario: ScenarioId) {
  const query = useQuery({
    queryKey: ["map-markers", scenario],
    queryFn: () => fetchMarkers(scenario),
    staleTime: 2 * 60 * 1000,
    retry: 2,
    select: (data) => data.map(toMapMarker),
    meta: {
      onError: () => toast.error("Fehler beim Laden der Marker"),
    },
  });

  return {
    ...query,
    data: query.data ?? fallbackMarkers.filter((m) => m.scenario === scenario),
  };
}

export function useStreetLines(scenario: ScenarioId) {
  const query = useQuery({
    queryKey: ["map-street-lines", scenario],
    queryFn: () => fetchStreetLines(scenario),
    staleTime: 2 * 60 * 1000,
    retry: 2,
    select: (data) => data.map(toStreetLine),
    meta: {
      onError: () => toast.error("Fehler beim Laden der Straßenlinien"),
    },
  });

  return {
    ...query,
    data: query.data ?? fallbackStreetLines.filter((l) => l.scenario === scenario),
  };
}
