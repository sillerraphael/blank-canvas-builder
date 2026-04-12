import { useState } from "react";
import { ChevronDown, ExternalLink, Landmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getPartyResponses,
  getPartyById,
  type PartyResponse,
} from "@/data/partyResponses";

interface PartyResponsesProps {
  initiativeId: string | number;
  category: string;
}

function PartyBadge({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-full shrink-0"
      style={{ backgroundColor: `hsl(${color})` }}
    />
  );
}

function PartyCard({ response }: { response: PartyResponse }) {
  const party = getPartyById(response.partyId);
  if (!party) return null;

  return (
    <div className="flex gap-3 p-3 rounded-xl bg-muted/40 border border-border/30">
      <div className="pt-0.5">
        <PartyBadge color={party.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground mb-0.5">
          {party.shortName}
        </p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {response.statement}
        </p>
        <a
          href={party.contactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Sprechstunde vereinbaren
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

export default function PartyResponses({
  initiativeId,
  category,
}: PartyResponsesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const responses = getPartyResponses(initiativeId, category);

  return (
    <div className="mt-3 border-t border-border/30 pt-3">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <Landmark className="w-3.5 h-3.5" />
        <span>Antworten der Parteien</span>
        <span className="text-[10px] text-muted-foreground/70 ml-0.5">
          ({responses.length})
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 ml-auto transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 pt-3">
              {responses.map((r) => (
                <PartyCard key={r.partyId} response={r} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
