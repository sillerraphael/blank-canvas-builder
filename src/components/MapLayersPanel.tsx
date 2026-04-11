import { useState } from "react";
import { Layers, ChevronUp, ChevronDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { scenarios, type ScenarioId } from "@/data/mapData";

// ── Layer data ───────────────────────────────────────────────────────

interface LayerItem {
  id: string;
  emoji: string;
  label: string;
}

interface LayerGroup {
  id: string;
  title: string;
  items: LayerItem[];
}

const LAYER_GROUPS: LayerGroup[] = [
  {
    id: "verkehr",
    title: "VERKEHR & MOBILITÄT",
    items: [
      { id: "oepnv", emoji: "🚌", label: "ÖPNV" },
      { id: "radweg", emoji: "🚲", label: "Radweg" },
      { id: "parkplatz", emoji: "🅿️", label: "Parkraum" },
      { id: "verkehrsmassnahme", emoji: "🚦", label: "Verkehrsmaßnahme" },
    ],
  },
  {
    id: "umwelt",
    title: "UMWELT & GRÜNFLÄCHEN",
    items: [
      { id: "park", emoji: "🌳", label: "Parks" },
      { id: "baeume", emoji: "🌲", label: "Bäume" },
      { id: "gewaesser", emoji: "💧", label: "Gewässer" },
      { id: "naturschutz", emoji: "🦔", label: "Naturschutz" },
    ],
  },
  {
    id: "bebauung",
    title: "BEBAUUNG",
    items: [
      { id: "bauprojekt", emoji: "🏗️", label: "Bauprojekte" },
      { id: "wohnungsbau", emoji: "🏠", label: "Wohnungsbau" },
      { id: "bebauungsplan", emoji: "📋", label: "Bebauungsplan" },
      { id: "denkmalschutz", emoji: "🏛️", label: "Denkmalschutz" },
    ],
  },
  {
    id: "sonstiges",
    title: "SONSTIGES",
    items: [
      { id: "sonstiges", emoji: "📌", label: "Sonstiges" },
      { id: "spielplatz", emoji: "🎠", label: "Spielplatz" },
    ],
  },
];

const TOTAL_LAYERS = LAYER_GROUPS.reduce((sum, g) => sum + g.items.length, 0);

// ── Toggle Switch ────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`
        relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full
        transition-colors duration-200 ease-in-out focus-visible:outline-none
        ${checked ? "bg-primary" : "bg-muted"}
      `}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="pointer-events-none block h-[18px] w-[18px] rounded-full bg-white shadow-md"
        style={{
          marginTop: 2,
          marginLeft: checked ? 20 : 2,
        }}
      />
    </button>
  );
}

// ── Accordion Group ──────────────────────────────────────────────────

function AccordionGroup({
  group,
  disabledCategories,
  onToggleCategory,
}: {
  group: LayerGroup;
  disabledCategories: Set<string>;
  onToggleCategory: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 px-1 group cursor-pointer"
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
          {group.title}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pb-1">
              {group.items.map((item) => {
                const enabled = !disabledCategories.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => onToggleCategory(item.id)}
                    className={`
                      flex items-center justify-between px-2 py-2 rounded-xl cursor-pointer
                      transition-all duration-150 hover:bg-foreground/[0.04]
                      ${!enabled ? "opacity-40" : ""}
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm leading-none">{item.emoji}</span>
                      <span className="text-[13px] font-medium text-foreground">
                        {item.label}
                      </span>
                    </div>
                    <ToggleSwitch
                      checked={enabled}
                      onChange={() => onToggleCategory(item.id)}
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

interface MapLayersPanelProps {
  activeScenario: ScenarioId;
  onScenarioChange: (id: ScenarioId) => void;
  disabledCategories: Set<string>;
  onToggleCategory: (id: string) => void;
}

export function MapLayersPanel({
  activeScenario,
  onScenarioChange,
  disabledCategories,
  onToggleCategory,
}: MapLayersPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const activeCount = TOTAL_LAYERS - disabledCategories.size;
  const currentScenario = scenarios.find((s) => s.id === activeScenario);

  return (
    <div className="w-72 rounded-2xl shadow-lg border border-border/30 bg-[#fcfbf5] overflow-hidden max-h-[calc(100vh-100px)] flex flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-foreground/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Layers className="w-4.5 h-4.5 text-primary" strokeWidth={2} />
          <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-foreground">
            Kartenebenen
          </span>
          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {activeCount}/{TOTAL_LAYERS}
          </span>
        </div>
        <ChevronUp
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            expanded ? "" : "rotate-180"
          }`}
        />
      </button>

      {/* ── Expandable body ────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden flex-1"
          >
            <div className="px-5 pb-5 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-hide">
              {/* Scenario toggle */}
              <Tabs
                value={activeScenario}
                onValueChange={(v) => onScenarioChange(v as ScenarioId)}
              >
                <TabsList className="grid grid-cols-2 gap-1 h-auto bg-foreground/[0.06] p-1 rounded-xl w-full">
                  {scenarios.map((s) => (
                    <TabsTrigger
                      key={s.id}
                      value={s.id}
                      className="text-[11px] font-semibold px-3 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                    >
                      {s.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Description */}
              {currentScenario && (
                <p className="text-[11px] text-muted-foreground leading-relaxed px-0.5">
                  {currentScenario.description}
                </p>
              )}

              {/* Separator */}
              <div className="h-px bg-border/30" />

              {/* Accordion groups */}
              <div className="space-y-1">
                {LAYER_GROUPS.map((group) => (
                  <AccordionGroup
                    key={group.id}
                    group={group}
                    disabledCategories={disabledCategories}
                    onToggleCategory={onToggleCategory}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
