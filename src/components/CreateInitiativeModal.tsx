import { useState } from "react";
import { X, MapPin, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES = [
  "Verkehr",
  "Grünflächen",
  "Infrastruktur",
  "Bildung",
  "Kultur",
  "Sicherheit",
  "Sonstiges",
];

interface CreateInitiativeModalProps {
  lat: number;
  lng: number;
  onClose: () => void;
  onSubmit: (data: { title: string; category: string; description: string; lat: number; lng: number }) => void;
  isSubmitting?: boolean;
}

export function CreateInitiativeModal({ lat, lng, onClose, onSubmit, isSubmitting }: CreateInitiativeModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), category, description: description.trim(), lat, lng });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-card border border-border/50 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Neue Initiative erstellen</h3>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Location info */}
          <div className="px-5 pt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <MapPin className="w-3 h-3" />
              <span>Position: {lat.toFixed(5)}, {lng.toFixed(5)}</span>
            </div>
          </div>

          {/* Form */}
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Titel *</label>
              <Input
                placeholder="z.B. Mehr Bänke am Marienplatz"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Kategorie</label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      category === c
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Beschreibung</label>
              <Textarea
                placeholder="Beschreibe deine Idee..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl" disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 rounded-xl gap-2"
              disabled={!title.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Senden…
                </>
              ) : (
                "Initiative einreichen"
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
