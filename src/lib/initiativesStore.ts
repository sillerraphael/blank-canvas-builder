export interface CommunityInitiative {
  id: string;
  title: string;
  category: string;
  description: string;
  upvotes: number;
  lat: number;
  lng: number;
}

const STORAGE_KEY = "individuWahl_initiatives";

const defaultInitiatives: CommunityInitiative[] = [
  {
    id: "init-1",
    title: "Autofreie Zone vor der Grundschule",
    category: "Verkehr",
    description:
      "Einrichtung einer verkehrsberuhigten Zone im Umkreis von 200m um die Grundschule an der Schillerstraße. Eltern-Taxis sollen auf einen Sammelplatz umgeleitet werden.",
    upvotes: 42,
    lat: 48.1382,
    lng: 11.5730,
  },
  {
    id: "init-2",
    title: "Mehr Bäume in der Schillerstraße",
    category: "Grünflächen",
    description:
      "Pflanzung von 30 neuen Stadtbäumen entlang der Schillerstraße zur Verbesserung des Mikroklimas und der Aufenthaltsqualität.",
    upvotes: 67,
    lat: 48.1365,
    lng: 11.5755,
  },
  {
    id: "init-3",
    title: "Öffentlicher Trinkbrunnen am Viktualienmarkt",
    category: "Infrastruktur",
    description:
      "Installation eines kostenlosen Trinkbrunnens auf dem Viktualienmarkt — besonders wichtig an heißen Sommertagen für Anwohner und Touristen.",
    upvotes: 31,
    lat: 48.1350,
    lng: 11.5762,
  },
];

export function getInitiatives(): CommunityInitiative[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // corrupted — reset
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultInitiatives));
  return [...defaultInitiatives];
}

export function saveInitiatives(items: CommunityInitiative[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addInitiative(init: Omit<CommunityInitiative, "id" | "upvotes" | "lat" | "lng">) {
  const items = getInitiatives();
  const newItem: CommunityInitiative = {
    ...init,
    id: `init-${Date.now()}`,
    upvotes: 0,
    lat: 48.1371 + (Math.random() - 0.5) * 0.006,
    lng: 11.5761 + (Math.random() - 0.5) * 0.008,
  };
  items.unshift(newItem);
  saveInitiatives(items);
  return newItem;
}

export function voteInitiative(id: string, delta: number) {
  const items = getInitiatives();
  const item = items.find((i) => i.id === id);
  if (item) {
    item.upvotes = Math.max(0, item.upvotes + delta);
    saveInitiatives(items);
  }
  return items;
}
