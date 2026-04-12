import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { scenarios, type ScenarioId, type MarkerCategory } from "@/data/mapData";
import { ChevronDown, icons } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Helper to render a Lucide icon by kebab-case name
function LucideIcon({ name, className }: { name: string; className?: string }) {
  // Convert kebab-case to PascalCase
  const pascalName = name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
  const IconComponent = (icons as any)[pascalName];
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
}

// ── Category group definitions ──
interface CategoryGroup {
  id: string;
  label: string;
  icon: string;
  categoryIds: string[];
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "verkehr",
    label: "Verkehr",
    icon: "bus",
    categoryIds: ["oepnv", "radweg", "parkplatz"],
  },
  {
    id: "umwelt",
    label: "Umwelt & Grünflächen",
    icon: "trees",
    categoryIds: ["park", "spielplatz"],
  },
  {
    id: "bebauung",
    label: "Bebauung",
    icon: "building-2",
    categoryIds: ["bauprojekt"],
  },
  {
    id: "sonstiges",
    label: "Sonstiges",
    icon: "pin",
    categoryIds: ["kultur", "konflikt"],
  },
];

interface MapChipBarProps {
  activeScenario: ScenarioId;
  onScenarioChange: (id: ScenarioId) => void;
  disabledCategories: Set<string>;
  onToggleCategory: (id: string) => void;
  pointCategories: MarkerCategory[];
  streetCategories: MarkerCategory[];
}

function DropdownGroup({
  group,
  allCategories,
  disabledCategories,
  onToggleCategory,
}: {
  group: CategoryGroup;
  allCategories: MarkerCategory[];
  disabledCategories: Set<string>;
  onToggleCategory: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const matchedCats = group.categoryIds
    .map((id) => allCategories.find((c) => c.id === id))
    .filter(Boolean) as MarkerCategory[];

  if (matchedCats.length === 0) return null;

  const enabledCount = matchedCats.filter((c) => !disabledCategories.has(c.id)).length;
  const allEnabled = enabledCount === matchedCats.length;
  const someEnabled = enabledCount > 0;

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 8, left: rect.left });
    }
    setOpen(!open);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`
          flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[12px] sm:text-[13px] font-normal
          whitespace-nowrap
          glass-chip ${someEnabled ? "glass-chip-active" : ""}
        `}
      >
        <LucideIcon name={group.icon} className="w-4 h-4" />
        <span>{group.label}</span>
        <span className={`text-[10px] font-normal px-1.5 py-0.5 rounded-full ${someEnabled ? "bg-white/20" : "bg-foreground/5"}`}>
          {enabledCount}/{matchedCats.length}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="fixed glass-chip rounded-2xl p-1.5 min-w-[220px] z-[9999]"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <button
              onClick={() => {
                matchedCats.forEach((c) => {
                  const isEnabled = !disabledCategories.has(c.id);
                  if (allEnabled && isEnabled) onToggleCategory(c.id);
                  if (!allEnabled && !isEnabled) onToggleCategory(c.id);
                });
              }}
              className="w-full text-left px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-white/30 rounded-xl transition-colors mb-0.5"
            >
              {allEnabled ? "Alle deaktivieren" : "Alle aktivieren"}
            </button>

            <div className="h-px bg-foreground/10 mx-2 my-1" />

            {matchedCats.map((cat) => {
              const enabled = !disabledCategories.has(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => onToggleCategory(cat.id)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all
                    ${enabled ? "text-foreground" : "text-foreground"}
                    hover:bg-white/30
                  `}
                >
                  
                  <span className="flex-1 text-left font-medium text-[13px]">{cat.label}</span>
                  <div
                    className={`
                      w-8 h-[18px] rounded-full relative transition-colors duration-200
                      ${enabled ? "bg-[hsl(213,90%,52%)]" : "bg-foreground/15"}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MapChipBar({
  activeScenario,
  onScenarioChange,
  disabledCategories,
  onToggleCategory,
  pointCategories,
  streetCategories,
}: MapChipBarProps) {
  const allCategories = [...pointCategories, ...streetCategories];

  const initiativeCat = allCategories.find((c) => c.id === "initiative");
  const initiativeEnabled = initiativeCat ? !disabledCategories.has("initiative") : false;

  return (
    <div className="flex flex-col gap-1.5 pointer-events-auto">
      {/* Scenario pill toggle */}
      <div className="flex flex-wrap justify-start gap-1.5">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => onScenarioChange(s.id)}
            className={`
              text-[12px] sm:text-[13px] px-3 sm:px-4 py-1.5 rounded-full whitespace-pre-line shrink-0
              glass-chip ${activeScenario === s.id ? "glass-chip-active" : ""}
            `}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Group dropdown buttons + initiative chip */}
      <div className="flex flex-wrap gap-1.5 sm:gap-1.5 pb-1">
        {initiativeCat && (
          <button
            onClick={() => onToggleCategory("initiative")}
            className={`
              flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[12px] sm:text-[13px] font-normal
              whitespace-nowrap shrink-0
              glass-chip ${initiativeEnabled ? "glass-chip-active" : ""}
            `}
          >
            <LucideIcon name={initiativeCat.icon} className="w-4 h-4" />
            <span>{initiativeCat.label}</span>
          </button>
        )}

        {CATEGORY_GROUPS.map((group) => (
          <DropdownGroup
            key={group.id}
            group={group}
            allCategories={allCategories}
            disabledCategories={disabledCategories}
            onToggleCategory={onToggleCategory}
          />
        ))}
      </div>
    </div>
  );
}
