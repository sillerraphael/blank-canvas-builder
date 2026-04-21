import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Loader2,
  SlidersHorizontal,
  Bus,
  Trees,
  Building2,
  Pin,
  X,
  Map as MapIcon,
  icons,
} from "lucide-react";
import { useMapOutletContext } from "@/components/MapLayout";
import { useMapMarkers, useStreetLines } from "@/hooks/useMapData";
import { scenarios, type ScenarioId, type MapMarkerData, type StreetLineData, type MarkerCategory } from "@/data/mapData";

/* ── Status badge color map ─────────────────────────────────────────── */
const statusStyles: Record<string, string> = {
  Bestand: "bg-blue-100 text-blue-800",
  Aktiv: "bg-emerald-100 text-emerald-800",
  "Im Bau": "bg-amber-100 text-amber-800",
  Offen: "bg-red-100 text-red-800",
  "In Bearbeitung": "bg-amber-100 text-amber-800",
  Gelöst: "bg-emerald-100 text-emerald-800",
  "In Prüfung": "bg-indigo-100 text-indigo-800",
  Abgelehnt: "bg-red-100 text-red-800",
  Umgesetzt: "bg-emerald-100 text-emerald-800",
  Geplant: "bg-violet-100 text-violet-800",
  Planung: "bg-indigo-100 text-indigo-800",
  Genehmigt: "bg-emerald-100 text-emerald-800",
  Vorschlag: "bg-amber-100 text-amber-800",
  Vorhanden: "bg-emerald-100 text-emerald-800",
  Bestehend: "bg-blue-100 text-blue-800",
  Fiktiv: "bg-red-100 text-red-800",
};

/* ── Category group definitions (mirrored from MapChipBar) ──────────── */
interface CategoryGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  categoryIds: string[];
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  { id: "verkehr", label: "Verkehr & Mobilität", icon: Bus, categoryIds: ["oepnv", "radweg", "parkplatz"] },
  { id: "umwelt", label: "Umwelt & Grünflächen", icon: Trees, categoryIds: ["park", "spielplatz"] },
  { id: "bebauung", label: "Bebauung & Planung", icon: Building2, categoryIds: ["bauprojekt"] },
  { id: "sonstiges", label: "Sonstiges", icon: Pin, categoryIds: ["kultur", "konflikt"] },
];

/* ── Unified item type ──────────────────────────────────────────────── */
interface ListItem {
  id: string;
  type: "marker" | "line";
  category: string;
  label: string;
  description: string;
  status?: string;
  data: MapMarkerData | StreetLineData;
}

/* ── Marker detail card ─────────────────────────────────────────────── */
function MarkerDetail({ m }: { m: MapMarkerData }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground leading-relaxed">{m.description}</p>

      {m.funding && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Finanzierung</span>
            <span className="font-semibold text-foreground">{m.funding}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: m.funding }} />
          </div>
        </div>
      )}

      {(m.startDate || m.endDate) && (
        <div className="p-3 rounded-xl bg-orange-50 text-orange-900 text-xs space-y-0.5">
          {m.startDate && <p><span className="font-semibold">Start:</span> {m.startDate}</p>}
          {m.endDate && <p><span className="font-semibold">Ende:</span> {m.endDate}</p>}
        </div>
      )}

      {m.impact && (
        <div className="p-3 rounded-xl bg-orange-50 text-orange-900 text-xs">
          <span className="font-semibold">Auswirkung:</span> {m.impact}
        </div>
      )}

      {m.area && (
        <p className="text-xs text-emerald-600">🌳 Fläche: {m.area.toLocaleString("de-DE")} m²</p>
      )}

      {m.conflictType && (
        <div className="p-3 rounded-xl bg-red-50 text-red-900 text-xs">
          <span className="font-semibold">Typ:</span> {m.conflictType}
        </div>
      )}

      {m.equipment && m.equipment.length > 0 && (
        <p className="text-xs text-pink-600">🎠 Geräte: {m.equipment.join(", ")}</p>
      )}

      {m.ageGroup && (
        <p className="text-xs text-muted-foreground">👶 Altersgruppe: {m.ageGroup}</p>
      )}

      {m.radius && (
        <p className="text-xs text-muted-foreground">📍 Umkreis: {m.radius}m Nachbarschaftszone</p>
      )}
    </div>
  );
}

/* ── Street line detail card ────────────────────────────────────────── */
function LineDetail({ line }: { line: StreetLineData }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground leading-relaxed">{line.description}</p>

      {line.oepnvType && (
        <span
          className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white"
          style={{
            background:
              line.oepnvType === "ubahn" ? "#1d4ed8" : line.oepnvType === "tram" ? "#dc2626" : "#ca8a04",
          }}
        >
          {line.lineName || line.oepnvType.toUpperCase()}
        </span>
      )}

      {line.details && (
        <div className="p-3 rounded-xl bg-muted/50 text-xs text-foreground">{line.details}</div>
      )}

      {line.funding && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Finanzierung</span>
            <span className="font-semibold text-foreground">{line.funding}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: line.funding }} />
          </div>
        </div>
      )}

      {line.impacts && line.impacts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-foreground mb-1 uppercase tracking-wide">
            ⚡ Auswirkungen
          </p>
          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
            {line.impacts.map((imp, i) => (
              <li key={i}>{imp}</li>
            ))}
          </ul>
        </div>
      )}

      {line.politicalContext && (
        <div className="p-3 rounded-xl bg-amber-50 text-amber-900 text-xs">
          <span className="font-semibold">🏛️ Politisch:</span> {line.politicalContext}
        </div>
      )}
    </div>
  );
}

/* ── Single list item row ───────────────────────────────────────────── */
function ListItemRow({
  item,
  catMeta,
  isExpanded,
  onToggle,
  onViewOnMap,
}: {
  item: ListItem;
  catMeta?: MarkerCategory;
  isExpanded: boolean;
  onToggle: () => void;
  onViewOnMap: () => void;
}) {
  return (
    <div className="group">
      <button
        onClick={onToggle}
        className="w-full text-left p-3 md:p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-border/80"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ background: `${catMeta?.markerBg ?? "#94a3b8"}20` }}
          >
            {catMeta?.emoji ?? "📍"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-semibold text-foreground truncate">{item.label}</h3>
              {item.status && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 ${
                    statusStyles[item.status] ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.status}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
          </div>
          <ChevronRight
            className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mx-1 mt-1 mb-2 p-3 md:p-4 rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 shadow-inner">
              {item.type === "marker" ? (
                <MarkerDetail m={item.data as MapMarkerData} />
              ) : (
                <LineDetail line={item.data as StreetLineData} />
              )}

              {/* View on map button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewOnMap();
                }}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[13px] font-semibold transition-all duration-200 active:scale-[0.98]"
              >
                <MapIcon className="w-4 h-4" />
                Auf Karte anzeigen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Collapsible category section ───────────────────────────────────── */
function CategorySection({
  catMeta,
  items,
  expandedItem,
  onToggleItem,
  onViewOnMap,
}: {
  catMeta: MarkerCategory;
  items: ListItem[];
  expandedItem: string | null;
  onToggleItem: (id: string) => void;
  onViewOnMap: (item: ListItem) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 hover:bg-foreground/[0.03] group"
      >
        <div className="w-1 h-8 rounded-full shrink-0" style={{ background: catMeta.markerBg }} />
        <span className="text-lg">{catMeta.emoji}</span>
        <span className="text-sm font-semibold text-foreground flex-1 text-left">{catMeta.label}</span>
        <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
          {items.length}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            collapsed ? "-rotate-90" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pl-2">
              {items.map((item) => (
                <ListItemRow
                  key={item.id}
                  item={item}
                  catMeta={catMeta}
                  isExpanded={expandedItem === item.id}
                  onToggle={() => onToggleItem(item.id)}
                  onViewOnMap={() => onViewOnMap(item)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Left sidebar filter panel ──────────────────────────────────────── */
function FilterSidebar({
  activeScenario,
  onScenarioChange,
  disabledCategories,
  onToggleCategory,
  allCategories,
  totalItems,
}: {
  activeScenario: ScenarioId;
  onScenarioChange: (id: ScenarioId) => void;
  disabledCategories: Set<string>;
  onToggleCategory: (id: string) => void;
  allCategories: MarkerCategory[];
  totalItems: number;
}) {
  return (
    <aside className="w-[260px] shrink-0 border-r border-border/30 bg-background/50 backdrop-blur-sm overflow-y-auto h-full">
      <div className="p-5 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Filter</h2>
          <span className="ml-auto text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
            {totalItems}
          </span>
        </div>

        {/* ── Scenario toggle ─────────────────────────────── */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Ansicht
          </p>
          <div className="space-y-1">
            {scenarios.map((s) => {
              const isActive = activeScenario === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onScenarioChange(s.id)}
                  className={`
                    w-full text-left px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground/70 hover:bg-foreground/[0.04] hover:text-foreground"
                    }
                  `}
                >
                  {s.label.trim()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-border/40" />

        {/* ── Category groups ─────────────────────────────── */}
        <div className="space-y-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Kategorien
          </p>

          {CATEGORY_GROUPS.map((group) => {
            const matchedCats = group.categoryIds
              .map((id) => allCategories.find((c) => c.id === id))
              .filter(Boolean) as MarkerCategory[];

            if (matchedCats.length === 0) return null;

            const enabledCount = matchedCats.filter((c) => !disabledCategories.has(c.id)).length;
            const allEnabled = enabledCount === matchedCats.length;
            const GroupIcon = group.icon;

            return (
              <div key={group.id} className="space-y-1">
                {/* Group header with toggle-all */}
                <button
                  onClick={() => {
                    matchedCats.forEach((c) => {
                      const isEnabled = !disabledCategories.has(c.id);
                      if (allEnabled && isEnabled) onToggleCategory(c.id);
                      if (!allEnabled && !isEnabled) onToggleCategory(c.id);
                    });
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-foreground/[0.03] transition-colors group"
                >
                  <GroupIcon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="text-xs font-semibold text-foreground/80 flex-1 text-left">
                    {group.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {enabledCount}/{matchedCats.length}
                  </span>
                </button>

                {/* Individual category toggles */}
                <div className="space-y-0.5 ml-1">
                  {matchedCats.map((cat) => {
                    const enabled = !disabledCategories.has(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => onToggleCategory(cat.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-150 hover:bg-foreground/[0.03]"
                      >
                        {/* Color dot */}
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0 transition-opacity duration-200"
                          style={{
                            background: cat.markerBg,
                            opacity: enabled ? 1 : 0.25,
                          }}
                        />
                        <span
                          className={`flex-1 text-left font-medium transition-colors duration-200 ${
                            enabled ? "text-foreground" : "text-foreground/35"
                          }`}
                        >
                          {cat.label}
                        </span>

                        {/* Toggle switch */}
                        <div
                          className={`
                            w-8 h-[18px] rounded-full relative transition-colors duration-200
                            ${enabled ? "bg-primary" : "bg-foreground/15"}
                          `}
                        >
                          <div
                            className={`
                              absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-200
                              ${enabled ? "translate-x-[16px]" : "translate-x-[2px]"}
                            `}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

/* ── Mobile filter drawer toggle ────────────────────────────────────── */
function MobileFilterToggle({
  isOpen,
  onToggle,
  activeCount,
}: {
  isOpen: boolean;
  onToggle: () => void;
  activeCount: number;
}) {
  return (
    <button
      onClick={onToggle}
      className="md:hidden fixed bottom-6 right-6 z-[50] flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
    >
      {isOpen ? <X className="w-5 h-5" /> : <SlidersHorizontal className="w-5 h-5" />}
      <span className="text-sm font-semibold">Filter</span>
      <span className="bg-primary-foreground/20 text-primary-foreground text-[11px] font-bold px-1.5 py-0.5 rounded-full">
        {activeCount}
      </span>
    </button>
  );
}

/* ── Main ListView page ─────────────────────────────────────────────── */
export default function ListView() {
  const {
    activeScenario,
    setActiveScenario,
    disabledCategories,
    toggleCategory,
    categoryData,
    flyTo,
  } = useMapOutletContext();

  const { data: markers, isLoading: markersLoading } = useMapMarkers(activeScenario);
  const { data: lines, isLoading: linesLoading } = useStreetLines(activeScenario);

  const isLoading = markersLoading || linesLoading;

  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const toggleItem = (id: string) => {
    setExpandedItem((prev) => (prev === id ? null : id));
  };

  const handleViewOnMap = (item: ListItem) => {
    if (item.type === "marker") {
      const m = item.data as MapMarkerData;
      flyTo(m.lat, m.lng, 16);
    } else {
      const l = item.data as StreetLineData;
      // Fly to the midpoint of the route
      const wp = l.path ?? l.waypoints;
      if (wp.length > 0) {
        const mid = wp[Math.floor(wp.length / 2)];
        flyTo(mid[0], mid[1], 15);
      }
    }
  };

  const allCategories = categoryData?.allCategories ?? [];

  // Filter out initiative and wohnort from sidebar categories
  const filterableCategories = useMemo(
    () => allCategories.filter((c) => c.id !== "initiative" && c.id !== "wohnort"),
    [allCategories],
  );

  const groupedItems = useMemo(() => {
    const items: ListItem[] = [];

    (markers ?? []).forEach((m) => {
      if (m.category === "initiative" || m.category === "wohnort") return;
      if (disabledCategories.has(m.category)) return;
      items.push({
        id: `m-${m.id}`,
        type: "marker",
        category: m.category,
        label: m.label,
        description: m.description,
        status: m.status,
        data: m,
      });
    });

    (lines ?? []).forEach((l) => {
      if (disabledCategories.has(l.category)) return;
      items.push({
        id: `l-${l.id}`,
        type: "line",
        category: l.category,
        label: l.label,
        description: l.description,
        status: l.status,
        data: l,
      });
    });

    const groups = new Map<string, ListItem[]>();
    for (const item of items) {
      if (!groups.has(item.category)) groups.set(item.category, []);
      groups.get(item.category)!.push(item);
    }

    const ordered: { catMeta: MarkerCategory; items: ListItem[] }[] = [];
    for (const cat of allCategories) {
      if (cat.id === "initiative" || cat.id === "wohnort") continue;
      const groupItems = groups.get(cat.id);
      if (groupItems && groupItems.length > 0) {
        ordered.push({ catMeta: cat, items: groupItems });
      }
    }

    return ordered;
  }, [markers, lines, disabledCategories, allCategories]);

  const totalItems = groupedItems.reduce((sum, g) => sum + g.items.length, 0);
  const activeFilterCount = filterableCategories.filter((c) => !disabledCategories.has(c.id)).length;

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-start relative w-full min-w-0">
      {/* ── Desktop sidebar ──────────────────────────── */}
      <div className="hidden md:block sticky top-0 h-[calc(100vh-72px)]">
        <FilterSidebar
          activeScenario={activeScenario}
          onScenarioChange={setActiveScenario}
          disabledCategories={disabledCategories}
          onToggleCategory={toggleCategory}
          allCategories={filterableCategories}
          totalItems={totalItems}
        />
      </div>

      {/* ── Mobile filter drawer (overlay) ────────────── */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[48] bg-black/30 md:hidden"
              onClick={() => setMobileFilterOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-[49] md:hidden"
            >
              <div className="pt-[60px] h-full">
                <FilterSidebar
                  activeScenario={activeScenario}
                  onScenarioChange={setActiveScenario}
                  disabledCategories={disabledCategories}
                  onToggleCategory={toggleCategory}
                  allCategories={filterableCategories}
                  totalItems={totalItems}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content area ────────────────────────── */}
      <div className="flex-1 pb-10">
        {/* Page header */}
        <header className="border-b border-border/40 bg-background/60 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-4">
            <div className="flex items-center gap-3 mb-1">
              <MapPin className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Listenansicht</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Alle Einträge auf der Karte als durchsuchbare Liste —{" "}
              <span className="font-medium text-foreground">{totalItems} Einträge</span>
            </p>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3 bg-background/90 px-6 py-4 rounded-2xl shadow-lg border border-border/30">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm font-medium text-foreground">Daten laden…</span>
              </div>
            </div>
          )}

          {!isLoading && groupedItems.length === 0 && (
            <div className="text-center py-20">
              <MapPin className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Keine Einträge für die aktuelle Filterauswahl.
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Aktiviere Kategorien im Filtermenü links, um Einträge zu sehen.
              </p>
            </div>
          )}

          {!isLoading &&
            groupedItems.map(({ catMeta, items }) => (
              <CategorySection
                key={catMeta.id}
                catMeta={catMeta}
                items={items}
                expandedItem={expandedItem}
                onToggleItem={toggleItem}
                onViewOnMap={handleViewOnMap}
              />
            ))}
        </main>
      </div>

      {/* ── Mobile FAB ───────────────────────────────── */}
      <MobileFilterToggle
        isOpen={mobileFilterOpen}
        onToggle={() => setMobileFilterOpen(!mobileFilterOpen)}
        activeCount={activeFilterCount}
      />
    </div>
  );
}
