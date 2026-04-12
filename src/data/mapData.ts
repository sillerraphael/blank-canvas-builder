// ── Category definitions ──────────────────────────────────────────────
export interface MarkerCategory {
  id: string;
  label: string;
  emoji: string; // kept for map markers
  icon: string; // lucide icon name
  color: string;
  markerBg: string;
  categoryType?: string;
}

export const pointCategories: MarkerCategory[] = [
  { id: "initiative", label: "Initiative", emoji: "💡", icon: "lightbulb", color: "bg-yellow-300", markerBg: "#fde047" },
  { id: "konflikt", label: "Konflikt", emoji: "⚠️", icon: "alert-triangle", color: "bg-red-400", markerBg: "#f87171" },
  { id: "bauprojekt", label: "Bauprojekte", emoji: "🏗️", icon: "building-2", color: "bg-orange-400", markerBg: "#fb923c" },
  { id: "oepnv", label: "ÖPNV", emoji: "🚌", icon: "bus", color: "bg-blue-400", markerBg: "#60a5fa" },
];

export const streetCategories: MarkerCategory[] = [
  { id: "radweg", label: "Radweg", emoji: "🚲", icon: "bike", color: "bg-green-400", markerBg: "#4ade80" },
  { id: "parkplatz", label: "Parkplatz", emoji: "🅿️", icon: "square-parking", color: "bg-slate-400", markerBg: "#94a3b8" },
  { id: "park", label: "Neuer Park", emoji: "🌳", icon: "trees", color: "bg-emerald-500", markerBg: "#10b981" },
  { id: "spielplatz", label: "Kinderspielplatz", emoji: "🎠", icon: "baby", color: "bg-pink-400", markerBg: "#f472b6" },
];

export const allCategories = [...pointCategories, ...streetCategories];

// ── Scenario definitions ─────────────────────────────────────────────
export type ScenarioId = "realitaet" | "zukunft";

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
}

export const scenarios: Scenario[] = [
  { id: "realitaet", label: "Bereits Umgesetzt", description: "Was gerade in der Stadt ist" },
  { id: "zukunft", label: "In Umsetzung\n", description: "Was der Stadtrat plant" },
];

// ── Point marker data ────────────────────────────────────────────────
export interface MapMarkerData {
  id: number;
  lat: number;
  lng: number;
  label: string;
  description: string;
  category: string;
  scenario: ScenarioId;
  status?: string;
  funding?: string;
  radius?: number;
  verified?: boolean;
  /** Polygon outline for parks / bauprojekte [[lat,lng], ...] */
  polygon?: [number, number][];
  /** Area in m² (parks) */
  area?: number;
  /** Number of supporters (initiatives) */
  supporters?: number;
  /** Conflict type */
  conflictType?: string;
  /** Construction start date */
  startDate?: string;
  /** Construction end date */
  endDate?: string;
  /** Construction impact description */
  impact?: string;
  /** Playground equipment list */
  equipment?: string[];
  /** Playground age group */
  ageGroup?: string;
}

// ── Polyline (street) data ───────────────────────────────────────────
export interface StreetLineData {
  id: number;
  label: string;
  description: string;
  category: string;
  scenario: ScenarioId;
  status?: string;
  funding?: string;
  waypoints: [number, number][];
  path?: [number, number][];
  lineStyle: "solid" | "dashed";
  details?: string;
  impacts?: string[];
  politicalContext?: string;
  /** ÖPNV type for coloring */
  oepnvType?: "ubahn" | "tram" | "bus";
  /** ÖPNV line name/number */
  lineName?: string;
}

// ── Point markers ────────────────────────────────────────────────────
export const mapMarkers: MapMarkerData[] = [
  // ── Aktuelle Realität ──────────────────────────────────────────────
  {
    id: 1,
    lat: 48.1371,
    lng: 11.5754,
    label: "Marienplatz Wohngebiet",
    description: "Zentrales Wohngebiet rund um den Marienplatz mit historischer Bebauung.",
    category: "wohnort",
    scenario: "realitaet",
    status: "Bestand",
    radius: 250,
    verified: true,
  },
  {
    id: 2,
    lat: 48.1395,
    lng: 11.569,
    label: "Karlsplatz Straßenbau",
    description: "Laufende Sanierung und Radwegerweiterung am Stachus.",
    category: "bauprojekt",
    scenario: "realitaet",
    status: "Im Bau",
    startDate: "März 2024",
    endDate: "Dez 2025",
    impact: "Straßensperrung, Umleitung Fußgänger",
    polygon: [
      [48.1402, 11.5678],
      [48.1402, 11.5702],
      [48.1388, 11.5702],
      [48.1388, 11.5678],
    ],
  },
  {
    id: 3,
    lat: 48.134,
    lng: 11.582,
    label: "Anwohnerkonflikt Isar",
    description: "Lärmkonflikt zwischen Nachtgastronomie und Anwohnern an der Isar.",
    category: "konflikt",
    scenario: "realitaet",
    status: "Offen",
    conflictType: "Lärm",
  },
  {
    id: 4,
    lat: 48.142,
    lng: 11.58,
    label: "U-Bahn Odeonsplatz",
    description: "U-Bahn-Station Odeonsplatz — Knotenpunkt U3/U6.",
    category: "oepnv",
    scenario: "realitaet",
    status: "Aktiv",
  },
  {
    id: 5,
    lat: 48.1352,
    lng: 11.5698,
    label: "Alter Botanischer Garten",
    description: "Historische Parkanlage nahe dem Hauptbahnhof, beliebter Treffpunkt.",
    category: "park",
    scenario: "realitaet",
    status: "Bestand",
    area: 4200,
    polygon: [
      [48.136, 11.5688],
      [48.136, 11.571],
      [48.1348, 11.5714],
      [48.1344, 11.5694],
      [48.135, 11.5684],
    ],
  },
  {
    id: 6,
    lat: 48.1355,
    lng: 11.573,
    label: "Parkplatz Viktualienmarkt",
    description: "Öffentlicher Parkplatz am Viktualienmarkt, 120 Stellplätze.",
    category: "parkplatz",
    scenario: "realitaet",
    status: "Bestand",
  },
  {
    id: 7,
    lat: 48.138,
    lng: 11.585,
    label: "Spielplatz am Lehel",
    description: "Kinderspielplatz im Lehel mit Klettergerüst und Sandkasten.",
    category: "spielplatz",
    scenario: "realitaet",
    status: "Vorhanden",
    equipment: ["Klettergerüst", "Sandkasten", "Schaukeln"],
    ageGroup: "3–12 Jahre",
  },
  {
    id: 8,
    lat: 48.1325,
    lng: 11.577,
    label: "Verkehrskonflikt Isartor",
    description: "Stauproblematik und Radfahrer-Konflikte am Isartorplatz.",
    category: "konflikt",
    scenario: "realitaet",
    status: "In Bearbeitung",
    conflictType: "Verkehr",
  },
  {
    id: 9,
    lat: 48.141,
    lng: 11.568,
    label: "Bürgerinitiative Maxvorstadt",
    description: "Anwohner fordern Tempo 30 und mehr Grünflächen in der Maxvorstadt.",
    category: "initiative",
    scenario: "realitaet",
    status: "In Prüfung",
    supporters: 1240,
  },

  // ── Geplante Zukunft (Stadtrat) ────────────────────────────────────
  {
    id: 10,
    lat: 48.136,
    lng: 11.576,
    label: "Begrünungsinitiative Altstadt",
    description: "Stadtrat plant 200 neue Bäume in der Altstadt bis 2028.",
    category: "initiative",
    scenario: "zukunft",
    status: "Geplant",
    funding: "60%",
    supporters: 3500,
  },
  {
    id: 11,
    lat: 48.14,
    lng: 11.572,
    label: "Neue Tram-Linie Schwabing",
    description: "Geplante Tramverlängerung Richtung Schwabing-Nord.",
    category: "oepnv",
    scenario: "zukunft",
    status: "Planung",
    funding: "35%",
  },
  {
    id: 12,
    lat: 48.133,
    lng: 11.568,
    label: "Neuer Stadtpark Sendling",
    description: "3.000m² neuer Park am Sendlinger Tor geplant.",
    category: "park",
    scenario: "zukunft",
    status: "Geplant",
    funding: "20%",
    area: 3000,
    polygon: [
      [48.1338, 11.567],
      [48.134, 11.5695],
      [48.1325, 11.5698],
      [48.1322, 11.5675],
    ],
  },
  {
    id: 13,
    lat: 48.139,
    lng: 11.581,
    label: "Spielplatz Hofgarten (geplant)",
    description: "Neuer inklusiver Spielplatz im Hofgarten.",
    category: "spielplatz",
    scenario: "zukunft",
    status: "Geplant",
    equipment: ["Rollstuhl-Karussell", "Kletterwand", "Wasserspiel", "Sandkasten"],
    ageGroup: "2–14 Jahre",
  },
  {
    id: 14,
    lat: 48.1415,
    lng: 11.575,
    label: "Wohnbauprojekt Schwabing",
    description: "480 neue Wohnungen, davon 40% Sozialwohnungen.",
    category: "bauprojekt",
    scenario: "zukunft",
    status: "Genehmigt",
    funding: "75%",
    startDate: "2025",
    endDate: "2028",
    impact: "Lärm, temporäre Straßensperrungen",
    polygon: [
      [48.1422, 11.574],
      [48.1422, 11.5762],
      [48.1408, 11.5762],
      [48.1408, 11.574],
    ],
  },
  {
    id: 15,
    lat: 48.137,
    lng: 11.583,
    label: "Bauprojekt Isar-Uferweg",
    description: "Neugestaltung des Isar-Uferwegs mit Sitzterrassen und Begrünung.",
    category: "bauprojekt",
    scenario: "zukunft",
    status: "Planung",
    funding: "15%",
    startDate: "2026",
    endDate: "2028",
    impact: "Uferweg temporär gesperrt",
    polygon: [
      [48.138, 11.5822],
      [48.1378, 11.5842],
      [48.1362, 11.5838],
      [48.1364, 11.5818],
    ],
  },
];

// ── Street polylines ─────────────────────────────────────────────────
export const streetLines: StreetLineData[] = [
  // ── Radwege ────────────────────────────────────────────────────────
  {
    id: 100,
    label: "Geillooo Radweg",
    description: "Bestehender Radweg entlang der Sendlinger Straße vom Sendlinger Tor zum Marienplatz.",
    category: "radweg",
    scenario: "realitaet",
    status: "Bestand",
    lineStyle: "solid",
    details: "Breite: 2m, geschützt durch Poller. Seit 2019.",
    impacts: ["30 Parkplätze entfallen", "Tempo 30 auf gesamter Strecke", "Unfallrate −40% seit Einführung"],
    politicalContext: "Beschluss: Stadtrat 2018, Grüne/SPD-Mehrheit",
    waypoints: [
      [48.143943, 11.58435],
      [48.145603, 11.5772],
    ],
  },
  {
    id: 101,
    label: "Isar-Radweg Abschnitt Lehel",
    description: "Bestehender Radweg entlang der Isar, Westufer im Lehel.",
    category: "radweg",
    scenario: "realitaet",
    status: "Bestand",
    lineStyle: "solid",
    details: "Asphaltiert, gut beleuchtet. Nutzung: ~3.000 Radfahrer/Tag.",
    impacts: ["Keine Parkplatz-Änderung", "Teil des Isar-Radwanderwegs", "Beleuchtung 2021 erneuert"],
    politicalContext: "Historischer Radweg, zuletzt saniert 2021",
    waypoints: [
      [48.1418, 11.5878],
      [48.1348, 11.5834],
    ],
  },
  {
    id: 110,
    label: "Radschnellweg Maximilianstraße",
    description: "Geschützter Radschnellweg entlang der Maximilianstraße.",
    category: "radweg",
    scenario: "zukunft",
    status: "Planung",
    lineStyle: "dashed",
    funding: "45%",
    details: "3m breit, baulich getrennt vom Autoverkehr.",
    impacts: ["60 Parkplätze entfallen", "1 Autospur wird umgewidmet", "Geschätzte Nutzung: 5.000 Radfahrer/Tag"],
    politicalContext: "Beschluss: Stadtrat 2024. Grüne dafür, CSU/FDP dagegen.",
    waypoints: [
      [48.1396, 11.578],
      [48.138, 11.5883],
    ],
  },
  {
    id: 111,
    label: "Radweg Ludwigstraße",
    description: "Neuer geschützter Radweg auf der gesamten Ludwigstraße.",
    category: "radweg",
    scenario: "zukunft",
    status: "Geplant",
    lineStyle: "dashed",
    funding: "20%",
    details: "Wegfall einer Autospur pro Richtung.",
    impacts: ["45 Parkplätze entfallen", "Buslinien werden umgeleitet", "Baumbestand bleibt erhalten"],
    politicalContext: "Kontrovers: Grüne/SPD dafür, CSU/FDP dagegen. Bürgerentscheid möglich.",
    waypoints: [
      [48.1417, 11.5772],
      [48.1479, 11.5767],
    ],
  },

  // ── ÖPNV Linien ────────────────────────────────────────────────────
  {
    id: 200,
    label: "U3 Marienplatz – Odeonsplatz",
    description: "U-Bahn-Linie U3 Abschnitt durch die Innenstadt.",
    category: "oepnv",
    scenario: "realitaet",
    status: "Bestehend",
    lineStyle: "solid",
    oepnvType: "ubahn",
    lineName: "U3",
    details: "Takt: alle 5 Min. in der HVZ. Kapazität: 940 Fahrgäste/Zug.",
    waypoints: [
      [48.1371, 11.5754],
      [48.139, 11.5775],
      [48.142, 11.58],
    ],
  },
  {
    id: 201,
    label: "Tram 19 Maximilianstraße",
    description: "Straßenbahnlinie 19 entlang der Maximilianstraße.",
    category: "oepnv",
    scenario: "realitaet",
    status: "Bestehend",
    lineStyle: "solid",
    oepnvType: "tram",
    lineName: "Tram 19",
    details: "Takt: 10 Min. Haltestellen: Nationaltheater, Maxmonument, Max-Weber-Platz.",
    waypoints: [
      [48.1395, 11.5775],
      [48.1388, 11.582],
      [48.138, 11.587],
      [48.1375, 11.591],
    ],
  },
  {
    id: 202,
    label: "Bus 52 Marienplatz – Viktualienmarkt",
    description: "Buslinie 52 verbindet Marienplatz mit dem Süden der Altstadt.",
    category: "oepnv",
    scenario: "realitaet",
    status: "Bestehend",
    lineStyle: "solid",
    oepnvType: "bus",
    lineName: "Bus 52",
    details: "Takt: 15 Min. Elektrobus seit 2023.",
    waypoints: [
      [48.1371, 11.5754],
      [48.1355, 11.574],
      [48.134, 11.572],
    ],
  },
  {
    id: 210,
    label: "Tram Nordverlängerung (geplant)",
    description: "Geplante Verlängerung der Tram nach Schwabing-Nord.",
    category: "oepnv",
    scenario: "zukunft",
    status: "Geplant",
    lineStyle: "dashed",
    oepnvType: "tram",
    lineName: "Tram Neu",
    funding: "35%",
    details: "4,2 km Neubau. Kosten: ~120 Mio €.",
    waypoints: [
      [48.142, 11.58],
      [48.146, 11.579],
      [48.15, 11.577],
      [48.154, 11.576],
    ],
  },
];
