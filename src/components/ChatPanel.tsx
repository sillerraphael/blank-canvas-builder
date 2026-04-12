import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, MessageCircle, Minus, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { scenarios, type ScenarioId, type MarkerCategory } from "@/data/mapData";
import { useMapCategories } from "@/hooks/useMapData";
import { usePretextLayout } from "@/hooks/usePretextLayout";
import { useAuthStore } from "@/lib/authStore";

interface Message {
  id: number;
  role: "assistant" | "user";
  content: string;
  time: string;
}

interface ChatPanelProps {
  activeScenario: ScenarioId;
  disabledCategories: Set<string>;
  onEnableCategory: (id: string) => void;
  onDisableCategory: (id: string) => void;
  onShowOnlyCategory: (id: string) => void;
  onDisableAllCategories: () => void;
  onScenarioChange: (id: ScenarioId) => void;
  onFlyTo: (lat: number, lng: number, zoom?: number) => void;
}

const WELCOME_MSG: Message = {
  id: 1,
  role: "assistant",
  content: "Hallo! Ich bin dein Agorix Assistent. Frag mich gerne nach geplanten Projekten in deiner Umgebung.",
  time: "10:24",
};

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function findCat(term: string, cats: MarkerCategory[]) {
  const t = term.toLowerCase().trim();
  return cats.find(
    (c) => c.label.toLowerCase().includes(t) || c.id.toLowerCase().includes(t) ||
      t.includes(c.label.toLowerCase()) || t.includes(c.id.toLowerCase())
  );
}

// ── Sizing ─────────────────────────────────────────────────
const COLLAPSED_W = 360;
const MIN_W = 300;
const MIN_H = 200;
const MAX_W = 900;
const MAX_H_RATIO = 0.85;

export function ChatPanel({
  activeScenario,
  disabledCategories,
  onEnableCategory,
  onDisableCategory,
  onShowOnlyCategory,
  onDisableAllCategories,
  onScenarioChange,
  onFlyTo,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [panelW, setPanelW] = useState(COLLAPSED_W);
  const [panelH, setPanelH] = useState(420);
  const scrollRef = useRef<HTMLDivElement>(null);
  const compactInputRef = useRef<HTMLTextAreaElement>(null);

  const { data: categoryData } = useMapCategories();
  const allCats = categoryData?.allCategories ?? [];
  const maxH = Math.floor(window.innerHeight * MAX_H_RATIO);
  const { measureMessages } = usePretextLayout();

  // Auto-grow height using pretext (no DOM measurement needed), then scroll to bottom
  useEffect(() => {
    // Use pretext to calculate ideal height without DOM
    const idealH = measureMessages(messages, panelW);
    if (idealH > panelH && panelH < maxH) {
      setPanelH(Math.min(idealH, maxH));
    }
    // Scroll to bottom
    const el = scrollRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      });
    }
  }, [messages, maxH, panelW, measureMessages]);

  // ── Edge/corner resize handler ─────────────────────────
  type ResizeEdge = "left" | "bottom" | "bottom-left" | "top" | "top-left";

  const onResizeStart = useCallback((edge: ResizeEdge) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const start = { x: e.clientX, y: e.clientY, w: panelW, h: panelH };
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (edge.includes("left")) {
        setPanelW(Math.min(Math.max(start.w - dx, MIN_W), MAX_W));
      }
      if (edge === "bottom" || edge === "bottom-left") {
        setPanelH(Math.min(Math.max(start.h + dy, MIN_H), maxH));
      }
      if (edge === "top" || edge === "top-left") {
        setPanelH(Math.min(Math.max(start.h - dy, MIN_H), maxH));
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [panelW, panelH, maxH]);

  // ── Map action handler ─────────────────────────────────
  const handleMapAction = useCallback((actionStr: string | undefined) => {
    if (!actionStr || actionStr === "none") return;
    const actions = actionStr.split(",").map((a) => a.trim()).filter(Boolean);
    for (const action of actions) {
      if (action === "disable_all") {
        onDisableAllCategories();
      } else if (action.startsWith("show_only:")) {
        const cat = findCat(action.replace("show_only:", "").trim(), allCats);
        if (cat) onShowOnlyCategory(cat.id);
      } else if (action.startsWith("enable:")) {
        const cat = findCat(action.replace("enable:", "").trim(), allCats);
        if (cat) onEnableCategory(cat.id);
      } else if (action.startsWith("disable:")) {
        const cat = findCat(action.replace("disable:", "").trim(), allCats);
        if (cat) onDisableCategory(cat.id);
      } else if (action.startsWith("scenario:")) {
        let id = action.replace("scenario:", "").trim();
        // Support aliases from webhook
        if (id === "reality") id = "realitaet";
        const valid = scenarios.find((s) => s.id === id);
        if (valid) onScenarioChange(valid.id);
      }
    }
  }, [onEnableCategory, onDisableCategory, onShowOnlyCategory, onDisableAllCategories, onScenarioChange, allCats]);

  // ── Send message ───────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    if (!isExpanded) setIsExpanded(true);

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: text, time: formatTime() },
    ]);
    setInput("");




    try {
      const filters: Record<string, boolean> = {};
      allCats.forEach((c) => { filters[c.id] = !disabledCategories.has(c.id); });

      // Extract user location from auth store (works for both BayernID and normal login)
      let user_lat: number | null = null;
      let user_lng: number | null = null;
      const authState = useAuthStore.getState();
      if (authState.bayernUser?.location?.lat != null && authState.bayernUser?.location?.lng != null) {
        user_lat = authState.bayernUser.location.lat;
        user_lng = authState.bayernUser.location.lng;
      }

      const res = await fetch("https://hook.eu1.make.com/w7v4l1y8819hfzewe1p36xt6m6v691yr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          locationContext: "Schillerstraße",
          activeScenario,
          activeScenarioLabel: scenarios.find((s) => s.id === activeScenario)?.label ?? activeScenario,
          availableScenarios: scenarios.map((s) => ({ id: s.id, label: s.label, description: s.description })),
          filters,
          user_lat,
          user_lng,
        }),
      });
      if (res.ok) {
        const raw = await res.text();
        if (raw) {
          let displayText = raw;
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object" && "reply" in parsed) {
              displayText = parsed.reply;
              handleMapAction(parsed.map_action);
              // Fly to location if coordinates provided
              const lat = parsed.target_lat;
              const lng = parsed.target_lng;
              if (typeof lat === "number" && typeof lng === "number" && isFinite(lat) && isFinite(lng)) {
                onFlyTo(lat, lng, 15);
              }
            }
          } catch { /* raw text */ }
          setMessages((prev) => [
            ...prev,
            { id: Date.now() + 1, role: "assistant", content: displayText, time: formatTime() },
          ]);
        }
      }
    } catch (err) {
      console.error("Webhook error:", err);
    }
  }, [input, isExpanded, activeScenario, disabledCategories, onEnableCategory, onDisableCategory, onShowOnlyCategory, onScenarioChange, allCats, handleMapAction]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold" style={{ color: "#7b9cff" }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // ── Minimized: show FAB ────────────────────────────────
  if (isMinimized) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsMinimized(false)}
        className="fixed top-20 right-6 z-20 w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #0050d4, #618bff)",
          boxShadow: "0 4px 20px rgba(0,80,212,0.35)",
        }}
      >
        <MessageCircle className="w-5 h-5 text-white" />
      </motion.button>
    );
  }

  // ── Compact state: just input bar (before first user message) ──
  if (!isExpanded) {
    // Measure how wide the compact input text needs to be, and grow panel accordingly

    const handleCompactInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      // Auto-resize textarea height
      const ta = e.target;
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
      // Grow panel width if text overflows (measure scrollWidth vs clientWidth)
      if (ta.scrollWidth > ta.clientWidth) {
        setPanelW((prev) => Math.min(prev + 40, MAX_W));
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed top-20 right-6 z-20"
        style={{ width: panelW }}
      >
        <div className="liquid-glass-panel rounded-[1.5rem] p-1.5">
          <div className="flex items-center gap-2 px-4 py-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(123,156,255,0.15)" }}>
              <Sparkles className="w-4 h-4" style={{ color: "#7b9cff" }} />
            </div>
            <textarea
              ref={compactInputRef}
              value={input}
              onChange={handleCompactInput}
              onKeyDown={handleKeyDown}
              placeholder="Frag den Agorix Assistenten..."
              rows={1}
              className="flex-1 bg-transparent text-sm outline-none resize-none overflow-hidden leading-snug"
              style={{ color: "#2c2f31", fontFamily: "Inter, sans-serif", maxHeight: "120px" }}
            />
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={sendMessage}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #0050d4, #618bff)",
                boxShadow: "0 4px 12px rgba(0,80,212,0.3)",
              }}
            >
              <Send className="w-4 h-4 text-white" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Expanded panel ─────────────────────────────────────
  return (
    <motion.section
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed top-20 right-6 z-20 flex flex-col liquid-glass-panel rounded-[1.5rem] overflow-hidden"
      style={{ width: panelW, height: panelH }}
    >
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center gap-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(123,156,255,0.15)", backdropFilter: "blur(10px)" }}>
          <Sparkles className="w-4.5 h-4.5" style={{ color: "#7b9cff" }} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold" style={{ color: "#2c2f31" }}>Agorix AI Chatbot</h2>
          <p className="text-[10px] font-medium" style={{ color: "#00c896" }}>Active now</p>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: "#595c5e" }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, x: msg.role === "user" ? 16 : -16 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              layout
              className={`flex items-end gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === "user" ? "items-end" : ""}`}>
                <div
                  className="px-4 py-3 text-[14px] leading-relaxed rounded-[1.25rem]"
                  style={msg.role === "user"
                    ? {
                        background: "linear-gradient(135deg, rgba(123,156,255,0.5), rgba(97,139,255,0.4))",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(123,156,255,0.3)",
                        color: "#1a1a2e",
                        borderBottomRightRadius: "0.375rem",
                      }
                    : {
                        background: "rgba(238,241,243,0.4)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: "#2c2f31",
                        borderBottomLeftRadius: "0.375rem",
                      }
                  }
                >
                  <span className="whitespace-pre-line">{renderContent(msg.content)}</span>
                </div>
                <span className="text-[10px] font-medium px-1" style={{ color: "#abadaf" }}>{msg.time}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="px-4 py-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div
          className="flex items-center gap-2 rounded-[1.5rem] px-4 py-2.5"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(30px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht eingeben..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#2c2f31", fontFamily: "Inter, sans-serif" }}
          />
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={sendMessage}
            className="h-9 px-4 rounded-full flex items-center justify-center gap-1.5 text-white text-xs font-semibold shrink-0"
            style={{
              background: "linear-gradient(135deg, #0050d4, #618bff)",
              boxShadow: "0 4px 12px rgba(0,80,212,0.3)",
            }}
          >
            Search <Send className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      {/* Resize handles — all edges */}
      {/* Left edge */}
      <div onPointerDown={onResizeStart("left")} className="absolute left-0 top-8 bottom-8 w-2 cursor-ew-resize" style={{ touchAction: "none" }} />
      {/* Bottom edge */}
      <div onPointerDown={onResizeStart("bottom")} className="absolute bottom-0 left-8 right-8 h-2 cursor-ns-resize" style={{ touchAction: "none" }} />
      {/* Top edge */}
      <div onPointerDown={onResizeStart("top")} className="absolute top-0 left-8 right-8 h-2 cursor-ns-resize" style={{ touchAction: "none" }} />
      {/* Bottom-left corner */}
      <div onPointerDown={onResizeStart("bottom-left")} className="absolute bottom-0 left-0 w-5 h-5 cursor-nesw-resize opacity-30 hover:opacity-60 transition-opacity flex items-center justify-center" style={{ touchAction: "none" }}>
        <GripVertical className="w-3 h-3 rotate-45" style={{ color: "#595c5e" }} />
      </div>
      {/* Top-left corner */}
      <div onPointerDown={onResizeStart("top-left")} className="absolute top-0 left-0 w-5 h-5 cursor-nwse-resize" style={{ touchAction: "none" }} />
    </motion.section>
  );
}
