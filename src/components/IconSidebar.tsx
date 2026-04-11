import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, Layers, MessageCircle, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

const navIcons = [
  { icon: LayoutGrid, label: "Dashboard", path: "/" },
  { icon: Layers, label: "Layers", path: "/" },
  { icon: MessageCircle, label: "Chat", path: "/" },
  { icon: Lightbulb, label: "Initiativen", path: "/initiativen" },
];

export function IconSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeIdx = navIcons.findIndex((n) => n.path === location.pathname) ?? 0;
  return (
    <aside className="fixed left-0 top-0 h-full z-[60] w-[72px] flex flex-col items-center py-7 liquid-glass-panel rounded-none border-r border-t-0 border-b-0 border-l-0">
      {/* Logo */}
      <div className="mb-8 group cursor-pointer">
        <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
          <span className="text-primary-foreground font-bold text-sm">IW</span>
        </div>
      </div>

      {/* Nav icons */}
      <nav className="flex flex-col gap-5 flex-1">
        {navIcons.map((item, i) => (
          <motion.button
            key={item.label}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(item.path)}
            className={`p-3 rounded-2xl transition-all duration-300 ${
              activeIdx === i
                ? "bg-background/80 shadow-sm text-primary translate-x-0.5"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <item.icon className="w-5 h-5" strokeWidth={activeIdx === i ? 2 : 1.5} />
          </motion.button>
        ))}
      </nav>

      {/* Avatar */}
      <div className="mt-auto">
        <div className="w-9 h-9 rounded-full bg-surface-container-high border-2 border-background/50 flex items-center justify-center text-xs font-semibold text-muted-foreground">
          U
        </div>
      </div>
    </aside>
  );
}
