import { useState, useEffect } from "react";

const CATEGORIES_URL =
  "https://hook.eu1.make.com/ruhiwkznls354cv4iq5t7marzp7ohkgd";

const fallbackCategories = [
  "Verkehr",
  "Grünflächen",
  "Infrastruktur",
  "Bildung",
  "Kultur",
  "Sicherheit",
];

// Assign a consistent color pair per category index
const colorPalette = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-pink-100 text-pink-700",
  "bg-red-100 text-red-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-lime-100 text-lime-700",
  "bg-fuchsia-100 text-fuchsia-700",
];

export function buildCategoryColors(categories: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  categories.forEach((c, i) => {
    map[c] = colorPalette[i % colorPalette.length];
  });
  return map;
}

export function useCategories() {
  const [categories, setCategories] = useState<string[]>(fallbackCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const res = await fetch(CATEGORIES_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Support both array-of-strings and array-of-objects with a name/label field
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item: unknown) =>
            typeof item === "string"
              ? item
              : (item as Record<string, string>).name ??
                (item as Record<string, string>).label ??
                String(item)
          );
          if (!cancelled) setCategories(mapped);
        }
      } catch (err) {
        console.warn("Failed to fetch categories, using fallback:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCategories();
    return () => { cancelled = true; };
  }, []);

  return { categories, categoryColors: buildCategoryColors(categories), loading };
}
