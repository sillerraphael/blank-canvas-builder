import { useEffect, useRef, useState, useCallback } from "react";
import { getStoredUser } from "@/lib/authStore";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { MapChipBar } from "@/components/MapChipBar";
import { fetchRouteCached } from "@/lib/osrmRouting";
import {
  allCategories as fallbackAllCategories,
  type ScenarioId,
  type MapMarkerData,
  type StreetLineData,
  type MarkerCategory,
} from "@/data/mapData";
import { useMapCategories, useMapMarkers, useStreetLines } from "@/hooks/useMapData";
import { useInitiatives, useCreateInitiative } from "@/hooks/useInitiatives";
import { useSubscriptions, useToggleSubscription } from "@/hooks/useSubscriptions";
import { useAuthStore } from "@/lib/authStore";
import { CreateInitiativeModal } from "@/components/CreateInitiativeModal";
import { Loader2, Plus, MapPin } from "lucide-react";
import { toast } from "sonner";

// Module-level ref updated by the component
let _categories: MarkerCategory[] = [];

function getCategoryMeta(categoryId: string) {
  return _categories.find((c) => c.id === categoryId);
}

function createIcon(marker: MapMarkerData) {
  const cat = getCategoryMeta(marker.category);
  const bg = cat?.markerBg ?? "#94a3b8";
  const emoji = cat?.emoji ?? "📍";

  if (marker.category === "wohnort" && marker.verified) {
    const size = 44;
    return L.divIcon({
      className: "",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
      html: `<div style="
        width:${size}px;height:${size}px;
        background:${bg};
        border:3px solid #fff;
        border-radius:50%;
        box-shadow:0 0 0 6px ${bg}40, 0 0 20px ${bg}60, 0 4px 16px ${bg}66;
        display:flex;align-items:center;justify-content:center;
        font-size:18px;cursor:pointer;
        position:relative;
        animation:wohnort-pulse 2.5s ease-in-out infinite;
      ">
        ${emoji}
        <div style="
          position:absolute;bottom:-2px;right:-2px;
          width:14px;height:14px;
          background:#22c55e;border:2px solid #fff;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:8px;color:#fff;font-weight:bold;
        ">✓</div>
      </div>`,
    });
  }

  const size = 34;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};
      border:3px solid #fff;
      border-radius:50%;
      box-shadow:0 4px 16px ${bg}66;
      display:flex;align-items:center;justify-content:center;
      font-size:15px;cursor:pointer;
      animation:marker-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;
    ">${emoji}</div>`,
  });
}

function buildPopup(m: MapMarkerData, subscribedIds?: Set<number>) {
  const statusColors: Record<string, string> = {
    Bestand: "background:#dbeafe;color:#1e40af",
    Aktiv: "background:#d1fae5;color:#065f46",
    "Im Bau": "background:#fef3c7;color:#92400e",
    Offen: "background:#fee2e2;color:#991b1b",
    "In Bearbeitung": "background:#fef3c7;color:#92400e",
    Gelöst: "background:#d1fae5;color:#065f46",
    "In Prüfung": "background:#e0e7ff;color:#3730a3",
    Abgelehnt: "background:#fee2e2;color:#991b1b",
    Umgesetzt: "background:#d1fae5;color:#065f46",
    Geplant: "background:#ede9fe;color:#5b21b6",
    Planung: "background:#e0e7ff;color:#3730a3",
    Genehmigt: "background:#d1fae5;color:#065f46",
    Vorschlag: "background:#fef3c7;color:#92400e",
    Vorhanden: "background:#d1fae5;color:#065f46",
    Bestehend: "background:#dbeafe;color:#1e40af",
    Fiktiv: "background:#fee2e2;color:#991b1b",
  };
  const badgeStyle = m.status ? statusColors[m.status] || "background:#f3f4f6;color:#374151" : "";
  const cat = getCategoryMeta(m.category);

  const fundingHtml = m.funding
    ? `<div style="margin-top:10px">
        <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:4px">
          <span style="color:#6b7280">Finanzierung</span>
          <span style="font-weight:600">${m.funding}</span>
        </div>
        <div style="width:100%;height:6px;border-radius:9999px;background:#e5e7eb;overflow:hidden">
          <div style="height:100%;border-radius:9999px;background:#005bc1;width:${m.funding}"></div>
        </div>
      </div>`
    : "";

  const verifiedBadge = m.verified
    ? `<span style="padding:2px 6px;border-radius:9999px;font-size:9px;font-weight:700;background:#dcfce7;color:#166534;margin-left:4px">✓ Verifiziert</span>`
    : "";

  let extraHtml = "";

  if (m.category === "park" && m.area) {
    extraHtml += `<p style="font-size:11px;color:#059669;margin:6px 0 0">🌳 Fläche: ${m.area.toLocaleString("de-DE")} m²</p>`;
  }

  if (m.category === "initiative" && m.supporters) {
    extraHtml += `<p style="font-size:11px;color:#ca8a04;margin:6px 0 0">👥 Unterstützer: ${m.supporters.toLocaleString("de-DE")}</p>`;
  }

  if (m.category === "konflikt" && m.conflictType) {
    extraHtml += `<div style="margin-top:6px;padding:4px 8px;background:#fee2e2;border-radius:6px;font-size:11px;color:#991b1b">
      <span style="font-weight:600">Typ:</span> ${m.conflictType}
    </div>`;
  }

  if (m.category === "bauprojekt") {
    const parts: string[] = [];
    if (m.startDate) parts.push(`<span style="font-weight:600">Start:</span> ${m.startDate}`);
    if (m.endDate) parts.push(`<span style="font-weight:600">Ende:</span> ${m.endDate}`);
    if (parts.length > 0) {
      extraHtml += `<div style="margin-top:8px;padding:6px 8px;background:#fff7ed;border-radius:6px;font-size:11px;color:#9a3412;line-height:1.6">
        ${parts.join("<br/>")}
      </div>`;
    }
  }

  if (m.impact) {
    extraHtml += `<div style="margin-top:6px;padding:4px 8px;background:#fff7ed;border-radius:6px;font-size:11px;color:#9a3412">
      <span style="font-weight:600">Auswirkung:</span> ${m.impact}
    </div>`;
  }

  if (m.category === "spielplatz") {
    if (m.equipment?.length) {
      extraHtml += `<p style="font-size:11px;color:#be185d;margin:6px 0 0">🎠 Geräte: ${m.equipment.join(", ")}</p>`;
    }
    if (m.ageGroup) {
      extraHtml += `<p style="font-size:11px;color:#9ca3af;margin:4px 0 0">👶 Altersgruppe: ${m.ageGroup}</p>`;
    }
  }

  const isSub = subscribedIds?.has(m.id) ?? false;
  const bellIcon = isSub
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M2 8c0-2.2.7-4.3 2-6"/><path d="M22 8a10 10 0 0 0-2-6"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
  const subBtnHtml = `
    <button data-subscribe-id="${m.id}" style="
      margin-top:10px;width:100%;padding:6px 12px;border-radius:10px;border:1px solid #e5e7eb;
      background:${isSub ? "#dbeafe" : "#fff"};color:${isSub ? "#1e40af" : "#374151"};
      font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;
      transition:all 0.2s;
    " onmouseover="this.style.background='${isSub ? "#bfdbfe" : "#f3f4f6"}'" onmouseout="this.style.background='${isSub ? "#dbeafe" : "#fff"}'">
      ${bellIcon} ${isSub ? "Abo beenden" : "Abonnieren"}
    </button>
  `;

  return `
    <div style="min-width:220px;font-family:Inter,sans-serif">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">
        <strong style="font-size:13px;line-height:1.3">${cat?.emoji ?? ""} ${m.label}${verifiedBadge}</strong>
        ${m.status ? `<span style="padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;white-space:nowrap;${badgeStyle}">${m.status}</span>` : ""}
      </div>
      <p style="font-size:12px;color:#6b7280;line-height:1.5;margin:0">${m.description}</p>
      ${m.radius ? `<p style="font-size:11px;color:#9ca3af;margin:6px 0 0">📍 Umkreis: ${m.radius}m Nachbarschaftszone</p>` : ""}
      ${extraHtml}
      ${fundingHtml}
      ${subBtnHtml}
    </div>
  `;
}

function getOepnvColor(line: StreetLineData): string {
  if (line.oepnvType === "ubahn") return "#1d4ed8";
  if (line.oepnvType === "tram") return "#dc2626";
  if (line.oepnvType === "bus") return "#ca8a04";
  const cat = getCategoryMeta(line.category);
  return cat?.markerBg ?? "#60a5fa";
}

function buildLinePopup(line: StreetLineData) {
  const statusColors: Record<string, string> = {
    Bestand: "background:#dbeafe;color:#1e40af",
    Bestehend: "background:#dbeafe;color:#1e40af",
    Planung: "background:#e0e7ff;color:#3730a3",
    Geplant: "background:#ede9fe;color:#5b21b6",
    Vorschlag: "background:#fef3c7;color:#92400e",
    Fiktiv: "background:#fee2e2;color:#991b1b",
  };
  const badgeStyle = line.status ? statusColors[line.status] || "background:#f3f4f6;color:#374151" : "";
  const cat = getCategoryMeta(line.category);
  const styleLabel = line.lineStyle === "solid" ? "Bestehend" : "Geplant";

  const fundingHtml = line.funding
    ? `<div style="margin-top:10px">
        <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:4px">
          <span style="color:#6b7280">Finanzierung</span>
          <span style="font-weight:600">${line.funding}</span>
        </div>
        <div style="width:100%;height:6px;border-radius:9999px;background:#e5e7eb;overflow:hidden">
          <div style="height:100%;border-radius:9999px;background:#005bc1;width:${line.funding}"></div>
        </div>
      </div>`
    : "";

  const impactsHtml = line.impacts?.length
    ? `<div style="margin-top:8px">
        <div style="font-size:10px;font-weight:600;color:#374151;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">⚡ Auswirkungen</div>
        <ul style="margin:0;padding:0 0 0 14px;font-size:11px;color:#4b5563;line-height:1.6">
          ${line.impacts.map((i) => `<li>${i}</li>`).join("")}
        </ul>
      </div>`
    : "";

  const politicalHtml = line.politicalContext
    ? `<div style="margin-top:8px;padding:6px 8px;background:#fef3c7;border-radius:6px;font-size:11px;color:#92400e;line-height:1.4">
        <span style="font-weight:600">🏛️ Politisch:</span> ${line.politicalContext}
      </div>`
    : "";

  const oepnvBadge = line.oepnvType
    ? `<span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;margin-left:6px;color:#fff;background:${getOepnvColor(line)}">${line.lineName || line.oepnvType.toUpperCase()}</span>`
    : "";

  const lineColor = line.category === "oepnv" ? getOepnvColor(line) : (cat?.markerBg ?? "#4ade80");

  return `
    <div style="min-width:260px;max-width:320px;font-family:Inter,sans-serif">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">
        <strong style="font-size:13px;line-height:1.3">${cat?.emoji ?? ""} ${line.label}${oepnvBadge}</strong>
        ${line.status ? `<span style="padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;white-space:nowrap;${badgeStyle}">${line.status}</span>` : ""}
      </div>
      <p style="font-size:12px;color:#6b7280;line-height:1.5;margin:0">${line.description}</p>
      <div style="margin-top:8px;padding:6px 8px;background:#f9fafb;border-radius:8px;font-size:11px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <span style="width:24px;height:3px;background:${lineColor};border-radius:2px;${line.lineStyle === "dashed" ? "border-top:2px dashed " + lineColor + ";background:transparent" : ""}"></span>
          <span style="color:#6b7280">${styleLabel}</span>
        </div>
        ${line.details ? `<p style="color:#374151;margin:4px 0 0;line-height:1.4">${line.details}</p>` : ""}
      </div>
      ${impactsHtml}
      ${politicalHtml}
      ${fundingHtml}
    </div>
  `;
}

export type MapFlyTo = (lat: number, lng: number, zoom?: number) => void;

interface MapViewProps {
  activeScenario: ScenarioId;
  onScenarioChange: (id: ScenarioId) => void;
  disabledCategories: Set<string>;
  onToggleCategory: (id: string) => void;
  isPlacingInitiative: boolean;
  onSetPlacingInitiative: (v: boolean) => void;
  flyToRef?: React.MutableRefObject<MapFlyTo | null>;
}

export function MapView({ activeScenario, onScenarioChange, disabledCategories, onToggleCategory, isPlacingInitiative, onSetPlacingInitiative, flyToRef }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Expose flyTo to parent
  useEffect(() => {
    if (flyToRef) {
      flyToRef.current = (lat: number, lng: number, zoom = 15) => {
        mapRef.current?.flyTo([lat, lng], zoom, { duration: 1.5 });
      };
    }
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<L.Layer[]>([]);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const initialFitDoneRef = useRef(false);

  // (cluster popups use native Leaflet popups — no React state needed)

  // ── Subscriptions ──
  const { isLoggedIn } = useAuthStore();
  const { data: subscriptions } = useSubscriptions();
  const toggleSubscription = useToggleSubscription();

  const subscribedIds = new Set(
    (subscriptions ?? []).map((s) => s.event_id)
  );

  // ── Create initiative state ──
  const setIsPlacingInitiative = onSetPlacingInitiative;
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const previewMarkerRef = useRef<L.Marker | null>(null);

  // ── Live data from Supabase ──
  const { data: categoryData, isLoading: catLoading } = useMapCategories();
  const { data: markersData, isLoading: markersLoading } = useMapMarkers(activeScenario);
  const { data: linesData, isLoading: linesLoading } = useStreetLines(activeScenario);

  // ── Community initiatives from API ──
  const { data: initiatives } = useInitiatives();
  const createMutation = useCreateInitiative();

  const isLoading = catLoading || markersLoading || linesLoading;

  _categories = categoryData?.allCategories ?? [];

  // ── Map click handler for placing initiatives ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isPlacingInitiative) {
      map.getContainer().style.cursor = "crosshair";
      const onClick = (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;

        // Remove old preview
        if (previewMarkerRef.current) {
          previewMarkerRef.current.remove();
        }

        // Add preview marker
        const icon = L.divIcon({
          className: "",
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          html: `<div style="
            width:40px;height:40px;
            background:#fde047;border:3px solid #fff;border-radius:50%;
            box-shadow:0 4px 16px #fde04766;
            display:flex;align-items:center;justify-content:center;
            font-size:18px;animation:marker-pulse 1s ease-in-out infinite;
          ">📍</div>`,
        });
        const marker = L.marker([lat, lng], { icon }).addTo(map);
        previewMarkerRef.current = marker;

        setPendingLocation({ lat, lng });
        setIsPlacingInitiative(false);
        map.getContainer().style.cursor = "";
      };
      map.on("click", onClick);
      return () => {
        map.off("click", onClick);
        map.getContainer().style.cursor = "";
      };
    }
  }, [isPlacingInitiative]);

  const handleCreateSubmit = useCallback(
    async (data: { title: string; category: string; description: string; lat: number; lng: number }) => {
      try {
        await createMutation.mutateAsync({
          title: data.title,
          category: data.category,
          description: data.description || null,
          lat: data.lat,
          lng: data.lng,
        });
        toast.success("Initiative erfolgreich erstellt!");
        setPendingLocation(null);
        if (previewMarkerRef.current) {
          previewMarkerRef.current.remove();
          previewMarkerRef.current = null;
        }
      } catch (err) {
        toast.error("Fehler beim Erstellen der Initiative");
        console.error(err);
      }
    },
    [createMutation]
  );

  const handleCancelCreate = useCallback(() => {
    setPendingLocation(null);
    if (previewMarkerRef.current) {
      previewMarkerRef.current.remove();
      previewMarkerRef.current = null;
    }
  }, []);

  // ── Subscribe button event delegation ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handler = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest("[data-subscribe-id]") as HTMLElement | null;
      if (!btn) return;
      const eventIdStr = btn.getAttribute("data-subscribe-id");
      if (!eventIdStr) return;
      const eventId = Number(eventIdStr);
      if (!isLoggedIn) {
        toast.error("Bitte logge dich ein, um zu abonnieren");
        return;
      }
      const isSub = subscribedIds.has(eventId);
      toggleSubscription.mutate(
        { eventId, isCurrentlySubscribed: isSub },
        {
          onSuccess: () => toast.success(isSub ? "Abonnement beendet" : "Erfolgreich abonniert! 🔔"),
          onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
            toast.error(`Fehler: ${msg}`);
          },
        }
      );
      );
    };
    container.addEventListener("click", handler);
    return () => container.removeEventListener("click", handler);
  }, [isLoggedIn, subscribedIds, toggleSubscription]);

  // ── Init map ──
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [48.1371, 11.5761],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OSM &copy; CARTO",
      maxZoom: 19,
    }).addTo(map);

    // Use stored BayernID user location
    const storedUser = getStoredUser();
    if (storedUser?.location) {
      const { lat, lng } = storedUser.location;
      map.setView([lat, lng], 15);

      const wohnortIcon = L.divIcon({
        className: "",
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -10],
        html: `<div style="
          width:14px;height:14px;
          background:#dc2626;
          border:2px solid white;
          border-radius:50%;
          box-shadow:0 0 0 3px rgba(220,38,38,0.2), 0 1px 4px rgba(0,0,0,0.15);
        "></div>`,
      });

      L.marker([lat, lng], { icon: wohnortIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(
          '<div style="font-family:Inter,sans-serif;font-size:13px;font-weight:600">🏠 Mein Standort</div>',
          { closeButton: false },
        );
    }

    
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Render layers ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    layersRef.current.forEach((l) => l.remove());
    layersRef.current = [];
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }

    const boundsLayers: L.Layer[] = [];

    // ── Create cluster group (L0 → L1 progressive disclosure) ──
    const clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 60,
      disableClusteringAtZoom: 15, // L1: individual markers at zoom ≥ 15
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: false,
      animate: true,
      animateAddingMarkers: true,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        // Determine dominant category color
        const children = cluster.getAllChildMarkers();
        const catCounts: Record<string, number> = {};
        children.forEach((m: any) => {
          const cat = m.options._categoryId;
          if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1;
        });
        const dominantCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const catMeta = dominantCat ? getCategoryMeta(dominantCat) : null;
        const bgColor = catMeta?.markerBg ?? "hsl(var(--primary))";
        const emoji = catMeta?.emoji ?? "📍";

        const sizeClass = count < 10 ? "cluster-small" : count < 30 ? "cluster-medium" : "cluster-large";
        const size = count < 10 ? 40 : count < 30 ? 50 : 60;

        return L.divIcon({
          html: `<div style="background:${bgColor};width:${size}px;height:${size}px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${count < 10 ? 12 : 14}px;box-shadow:0 4px 20px rgba(0,0,0,0.2),0 0 0 4px rgba(255,255,255,0.5);font-family:Inter,sans-serif;line-height:1">
            <span style="font-size:14px">${emoji}</span>
            <span>${count}</span>
          </div>`,
          className: `marker-cluster-custom ${sizeClass}`,
          iconSize: L.point(size, size),
        });
      },
    });

    // ── Render point markers into cluster group ──
    const visibleMarkers = (markersData ?? []).filter(
      (m) => !disabledCategories.has(m.category),
    );

    visibleMarkers.forEach((m) => {
      if (m.category === "wohnort" && m.radius) {
        const cat = getCategoryMeta(m.category);
        const circle = L.circle([m.lat, m.lng], {
          radius: m.radius,
          color: cat?.markerBg ?? "#fbbf24",
          fillColor: cat?.markerBg ?? "#fbbf24",
          fillOpacity: 0.08,
          weight: 2,
          opacity: 0.4,
          dashArray: "6 4",
        }).addTo(map);
        layersRef.current.push(circle);
      }

      if (m.polygon && (m.category === "park" || m.category === "bauprojekt")) {
        const cat = getCategoryMeta(m.category);
        const color = cat?.markerBg ?? "#10b981";
        const polygon = L.polygon(m.polygon, {
          color,
          fillColor: color,
          fillOpacity: 0.15,
          weight: 2,
          opacity: 0.6,
        }).addTo(map);
        polygon.bindPopup(buildPopup(m, subscribedIds), { closeButton: false, maxWidth: 300 });
        polygon.on("mouseover", () => {
          polygon.setStyle({ fillOpacity: 0.3, weight: 3, opacity: 0.9 });
        });
        polygon.on("mouseout", () => {
          polygon.setStyle({ fillOpacity: 0.15, weight: 2, opacity: 0.6 });
        });
        layersRef.current.push(polygon);
      }

      const marker = L.marker([m.lat, m.lng], {
        icon: createIcon(m),
        _categoryId: m.category,
        _label: m.label,
        _status: m.status,
        _description: m.description,
      } as any)
        .bindPopup(buildPopup(m, subscribedIds), { closeButton: false, maxWidth: 300 });
      clusterGroup.addLayer(marker);
      boundsLayers.push(marker);
    });

    // ── Render community initiatives into cluster group ──
    if (!disabledCategories.has("initiative") && initiatives) {
      initiatives.forEach((ci) => {
        const size = 34;
        const icon = L.divIcon({
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2],
          html: `<div style="
            width:${size}px;height:${size}px;
            background:#fde047;
            border:3px solid #fff;
            border-radius:50%;
            box-shadow:0 4px 16px #fde04766;
            display:flex;align-items:center;justify-content:center;
            font-size:15px;cursor:pointer;
            animation:marker-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;
          ">💡</div>`,
        });
        const popup = `
          <div style="min-width:200px;font-family:Inter,sans-serif">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">
              <strong style="font-size:13px;line-height:1.3">💡 ${ci.title}</strong>
              <span style="padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;white-space:nowrap;background:#fef3c7;color:#92400e">${ci.category}</span>
            </div>
            <p style="font-size:12px;color:#6b7280;line-height:1.5;margin:0">${ci.description ?? ""}</p>
            <div style="margin-top:8px;display:flex;gap:12px;font-size:11px">
              <span style="color:#16a34a;font-weight:600">👍 ${ci.upvotes}</span>
              <span style="color:#dc2626;font-weight:600">👎 ${ci.downvotes}</span>
            </div>
          </div>
        `;
        const m = L.marker([ci.lat, ci.lng], {
          icon,
          _categoryId: "initiative",
          _label: ci.title,
          _status: undefined,
          _description: ci.description ?? "",
        } as any)
          .bindPopup(popup, { closeButton: false, maxWidth: 300 });
        clusterGroup.addLayer(m);
        boundsLayers.push(m);
      });
    }

    // Add cluster group to map
    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;
    layersRef.current.push(clusterGroup);

    // ── Cluster click → open Leaflet popup with all items ──
    clusterGroup.on("clusterclick", (e: any) => {
      const children = e.layer.getAllChildMarkers();
      const statusColors: Record<string, string> = {
        Bestand: "background:#dbeafe;color:#1e40af",
        Aktiv: "background:#d1fae5;color:#065f46",
        "Im Bau": "background:#fef3c7;color:#92400e",
        Offen: "background:#fee2e2;color:#991b1b",
        Geplant: "background:#ede9fe;color:#5b21b6",
        Planung: "background:#e0e7ff;color:#3730a3",
        Bestehend: "background:#dbeafe;color:#1e40af",
        Vorhanden: "background:#d1fae5;color:#065f46",
        Fiktiv: "background:#fee2e2;color:#991b1b",
      };

      const itemsHtml = children.map((m: any) => {
        const catId = m.options._categoryId ?? "";
        const catMeta = getCategoryMeta(catId);
        const emoji = catMeta?.emoji ?? "📍";
        const label = m.options._label ?? catMeta?.label ?? "Unbekannt";
        const status = m.options._status ?? "";
        const description = m.options._description ?? "";
        const badgeStyle = status ? (statusColors[status] || "background:#f3f4f6;color:#374151") : "";
        const statusBadge = status
          ? `<span style="padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;white-space:nowrap;${badgeStyle}">${status}</span>`
          : "";
        return `
          <div style="padding:8px 0;${children.indexOf(m) < children.length - 1 ? 'border-bottom:1px solid #f3f4f6;' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px">
              <strong style="font-size:13px;line-height:1.3">${emoji} ${label}</strong>
              ${statusBadge}
            </div>
            ${description ? `<p style="font-size:12px;color:#6b7280;line-height:1.5;margin:0">${description}</p>` : ""}
          </div>
        `;
      }).join("");

      const popupHtml = `
        <div style="min-width:220px;max-height:300px;overflow-y:auto;font-family:Inter,sans-serif">
          <div style="font-size:11px;color:#9ca3af;font-weight:600;margin-bottom:8px">${children.length} Einträge in dieser Gruppe</div>
          ${itemsHtml}
        </div>
      `;

      L.popup({ closeButton: false, maxWidth: 320 })
        .setLatLng(e.layer.getLatLng())
        .setContent(popupHtml)
        .openOn(map);
    });

    // ── Render street polylines & resolve OSRM routes ──
    const visibleLines = (linesData ?? []).filter(
      (l) => !disabledCategories.has(l.category),
    );

    const abortController = new AbortController();
    const LINE_DETAIL_ZOOM = 14; // Show full polylines at zoom ≥ 14

    // Track polyline layers so we can toggle visibility on zoom
    const lineLayers: L.Layer[] = [];

    const addLineToMap = (line: typeof visibleLines[0], path: [number, number][]) => {
      if (path.length < 2 || !mapRef.current) return;
      const isOepnv = line.category === "oepnv";
      const color = isOepnv ? getOepnvColor(line) : (getCategoryMeta(line.category)?.markerBg ?? "#4ade80");

      const shadowLine = L.polyline(path, {
        color, weight: 10, opacity: 0.15, lineCap: "round", lineJoin: "round", interactive: false,
      }).addTo(map);
      layersRef.current.push(shadowLine);
      lineLayers.push(shadowLine);

      const isDashed = line.lineStyle === "dashed";
      const polyline = L.polyline(path, {
        color, weight: isOepnv ? 4 : 5, opacity: isDashed ? 0.7 : 0.85, lineCap: "round", lineJoin: "round",
        dashArray: isDashed ? "8 5" : undefined,
      }).addTo(map);
      polyline.bindPopup(buildLinePopup(line), { closeButton: false, maxWidth: 320 });

      polyline.on("mouseover", () => {
        polyline.setStyle({ weight: isOepnv ? 7 : 8, opacity: isDashed ? 0.85 : 1 });
        shadowLine.setStyle({ weight: 18, opacity: 0.35 });
      });
      polyline.on("mouseout", () => {
        polyline.setStyle({ weight: isOepnv ? 4 : 5, opacity: isDashed ? 0.7 : 0.85 });
        shadowLine.setStyle({ weight: 10, opacity: 0.15 });
      });

      layersRef.current.push(polyline);
      lineLayers.push(polyline);
      boundsLayers.push(polyline);

      // Endpoint dots (only visible at detail zoom)
      const cat = getCategoryMeta(line.category);
      const emoji = cat?.emoji ?? "🚲";
      [path[0], path[path.length - 1]].forEach((pos) => {
        const label = isOepnv && line.lineName ? line.lineName : emoji;
        const fontSize = isOepnv ? "8px" : "12px";
        const dot = L.divIcon({
          className: "",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          html: `<div style="
            width:24px;height:24px;background:white;border:2px solid ${color};
            border-radius:50%;display:flex;align-items:center;justify-content:center;
            font-size:${fontSize};font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.15);
            color:${color};
          ">${isOepnv ? label.charAt(0) : emoji}</div>`,
        });
        const m = L.marker(pos as [number, number], { icon: dot }).addTo(map);
        layersRef.current.push(m);
        lineLayers.push(m);
      });

      return { shadowLine, polyline };
    };

    // Add midpoint markers for lines into the cluster group (visible at low zoom)
    visibleLines.forEach((line) => {
      const pts = line.path && line.path.length >= 2 ? line.path : line.waypoints;
      if (!pts || pts.length < 2) return;
      // Calculate midpoint
      const midIdx = Math.floor(pts.length / 2);
      const midLat = pts[midIdx][0];
      const midLng = pts[midIdx][1];

      const isOepnv = line.category === "oepnv";
      const cat = getCategoryMeta(line.category);
      const color = isOepnv ? getOepnvColor(line) : (cat?.markerBg ?? "#4ade80");
      const emoji = cat?.emoji ?? "🚲";
      const displayLabel = isOepnv && line.lineName ? line.lineName : emoji;

      const icon = L.divIcon({
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        html: `<div style="
          width:32px;height:32px;background:${color}18;border:2px solid ${color};
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          font-size:${isOepnv ? '10px' : '14px'};font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.12);
          color:${color};
        ">${isOepnv ? displayLabel.charAt(0) : emoji}</div>`,
      });

      const midMarker = L.marker([midLat, midLng], {
        icon,
        _categoryId: line.category,
        _label: line.label,
        _status: line.status,
        _description: line.description,
      } as any);
      midMarker.bindPopup(buildLinePopup(line), { closeButton: false, maxWidth: 320 });
      clusterGroup.addLayer(midMarker);
    });

    // Render lines: use `path` if available, otherwise waypoints + OSRM fallback
    const lineRefs = new Map<number, { shadowLine: L.Polyline; polyline: L.Polyline }>();
    visibleLines.forEach((line) => {
      const pathPoints = line.path && line.path.length >= 2 ? line.path : null;
      if (pathPoints) {
        const refs = addLineToMap(line, pathPoints);
        if (refs) lineRefs.set(line.id, refs);
      } else if (line.waypoints && line.waypoints.length >= 2) {
        const refs = addLineToMap(line, line.waypoints);
        if (refs) lineRefs.set(line.id, refs);

        fetchRouteCached(line.waypoints, abortController.signal).then((routedPath) => {
          if (abortController.signal.aborted || !mapRef.current) return;
          if (routedPath.length <= line.waypoints.length) return;
          const r = lineRefs.get(line.id);
          if (r) {
            r.shadowLine.setLatLngs(routedPath);
            r.polyline.setLatLngs(routedPath);
          }
        });
      }
    });

    // Toggle line visibility based on zoom level
    const updateLineVisibility = () => {
      const zoom = map.getZoom();
      const show = zoom >= LINE_DETAIL_ZOOM;
      lineLayers.forEach((layer) => {
        const el = (layer as any)._path || (layer as any)._icon;
        if (el) {
          el.style.display = show ? "" : "none";
        }
      });
    };
    updateLineVisibility();
    map.on("zoomend", updateLineVisibility);

    if (boundsLayers.length > 0 && !initialFitDoneRef.current) {
      const group = L.featureGroup(boundsLayers);
      map.fitBounds(group.getBounds().pad(0.3), { maxZoom: 16 });
      initialFitDoneRef.current = true;
    }

    return () => { abortController.abort(); map.off("zoomend", updateLineVisibility); };
  }, [activeScenario, disabledCategories, markersData, linesData, initiatives, subscribedIds]);

  return (
    <div className="absolute inset-0 z-0">
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ filter: "sepia(0.12) saturate(1.1) brightness(1.03)" }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 bg-background/90 px-6 py-4 rounded-2xl shadow-lg border border-border/30">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">Kartendaten laden…</span>
          </div>
        </div>
      )}

      {/* Placing initiative banner */}
      {isPlacingInitiative && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[50]">
          <div className="bg-primary text-primary-foreground px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
            <MapPin className="w-4 h-4" />
            Klicke auf die Karte, um deine Initiative zu platzieren
            <button
              onClick={() => setIsPlacingInitiative(false)}
              className="ml-2 px-2 py-1 rounded-lg bg-primary-foreground/20 hover:bg-primary-foreground/30 text-xs"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}


      {/* Create initiative modal */}
      {pendingLocation && (
        <CreateInitiativeModal
          lat={pendingLocation.lat}
          lng={pendingLocation.lng}
          onClose={handleCancelCreate}
          onSubmit={handleCreateSubmit}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Subtle backdrop strip for contrast stability */}
      <div className="absolute top-[56px] left-0 right-0 h-28 z-29 glass-chip-strip" />

      <div className="absolute top-[84px] left-3 sm:left-4 right-3 sm:right-4 z-30 pointer-events-none">
        <MapChipBar
          activeScenario={activeScenario}
          onScenarioChange={onScenarioChange}
          disabledCategories={disabledCategories}
          onToggleCategory={onToggleCategory}
          pointCategories={_categories.filter(c => !["radweg","parkplatz","park","spielplatz"].includes(c.id))}
          streetCategories={_categories.filter(c => ["radweg","parkplatz","park","spielplatz"].includes(c.id))}
        />
      </div>

      {/* Custom zoom controls */}
      <div className="absolute bottom-4 left-4 z-30 flex flex-col gap-1">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="w-10 h-10 rounded-xl glass-chip flex items-center justify-center text-foreground/80 hover:text-foreground transition-all text-lg font-bold"
          title="Reinzoomen"
        >
          +
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="w-10 h-10 rounded-xl glass-chip flex items-center justify-center text-foreground/80 hover:text-foreground transition-all text-lg font-bold"
          title="Rauszoomen"
        >
          −
        </button>
      </div>

    </div>
  );
}
