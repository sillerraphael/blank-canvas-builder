export interface Party {
  id: string;
  name: string;
  shortName: string;
  color: string; // HSL for theming
  contactUrl: string;
}

export interface PartyResponse {
  partyId: string;
  statement: string;
}

// ── Party definitions ────────────────────────────────────────────────

export const parties: Party[] = [
  {
    id: "gruene",
    name: "Bündnis 90/Die Grünen",
    shortName: "Grüne",
    color: "120 60% 34%",
    contactUrl: "https://www.gruene-muenchen.de/tag/sprechstunde/",
  },
  {
    id: "spd",
    name: "SPD München",
    shortName: "SPD",
    color: "0 78% 50%",
    contactUrl: "https://spd-rathausmuenchen.de/sprechstunde/",
  },
  {
    id: "csu",
    name: "CSU München",
    shortName: "CSU",
    color: "210 60% 40%",
    contactUrl: "https://www.csu.de/service/kontakt/",
  },
  {
    id: "fdp",
    name: "FDP München",
    shortName: "FDP",
    color: "48 100% 50%",
    contactUrl: "https://www.fdp-muenchen.de/",
  },
  {
    id: "linke",
    name: "Die Linke München",
    shortName: "Linke",
    color: "340 80% 45%",
    contactUrl:
      "https://www.dielinke-muenchen-stadtrat.de/aktuelles/detail/news/wohn-und-sozialsprechstunde-mit-stefan-jagel-5/",
  },
  {
    id: "afd",
    name: "AfD München",
    shortName: "AfD",
    color: "207 90% 45%",
    contactUrl: "https://www.afd-stadtrat-muenchen.de/kontakt/",
  },
  {
    id: "volt",
    name: "Volt München",
    shortName: "Volt",
    color: "270 60% 50%",
    contactUrl: "https://voltdeutschland.org/muenchen/kontakt",
  },
  {
    id: "fw",
    name: "Freie Wähler Bayern",
    shortName: "Freie Wähler",
    color: "25 85% 50%",
    contactUrl: "https://www.fw-bayern.de/kontakt",
  },
  {
    id: "oedp",
    name: "ÖDP München-Land",
    shortName: "ÖDP",
    color: "30 80% 45%",
    contactUrl: "https://www.oedp-muenchen-land.de/mitmachen/kontakt",
  },
];

// ── Category-specific response pools ─────────────────────────────────
// Each party has multiple response variants per topic cluster to avoid repetition.
// We group initiative categories into broader themes.

type ThemeId =
  | "umwelt"
  | "verkehr"
  | "soziales"
  | "wirtschaft"
  | "digital"
  | "sicherheit"
  | "wohnen"
  | "bildung"
  | "kultur"
  | "infrastruktur"
  | "default";

const categoryToTheme: Record<string, ThemeId> = {
  // Map known initiative categories to themes
  Umwelt: "umwelt",
  Grünflächen: "umwelt",
  Klima: "umwelt",
  Verkehr: "verkehr",
  Mobilität: "verkehr",
  Radwege: "verkehr",
  ÖPNV: "verkehr",
  Soziales: "soziales",
  Integration: "soziales",
  Jugend: "soziales",
  Bildung: "bildung",
  Wirtschaft: "wirtschaft",
  Arbeit: "wirtschaft",
  Digitalisierung: "digital",
  Sicherheit: "sicherheit",
  Wohnen: "wohnen",
  Bauen: "wohnen",
  Kultur: "kultur",
  Infrastruktur: "infrastruktur",
};

// Response pool: partyId → theme → string[]
const responsePool: Record<string, Partial<Record<ThemeId, string[]>>> = {
  gruene: {
    umwelt: [
      "Wir unterstützen diese Initiative voll. Mehr Grün in der Stadt ist ein zentraler Baustein unserer Klimastrategie.",
      "Umweltschutz beginnt vor Ort. Diese Initiative zeigt, wie Bürgerbeteiligung und Klimaschutz Hand in Hand gehen.",
      "Jede neue Grünfläche verbessert die Lebensqualität. Wir setzen uns dafür ein, dass solche Projekte schneller umgesetzt werden.",
    ],
    verkehr: [
      "Die Verkehrswende beginnt im Viertel. Mehr Radwege und weniger Autos schaffen lebenswerte Straßen.",
      "Wir fordern den Ausbau sicherer Radinfrastruktur und eine konsequente Förderung des ÖPNV.",
      "Nachhaltige Mobilität muss Vorrang haben. Diese Initiative geht genau in die richtige Richtung.",
    ],
    soziales: [
      "Soziale Teilhabe und ökologische Verantwortung gehören zusammen. Wir unterstützen diesen Ansatz.",
      "Bürgerinitiativen stärken den sozialen Zusammenhalt. Wir stehen hinter diesem Engagement.",
    ],
    wohnen: [
      "Bezahlbares Wohnen muss ökologisch und sozial gedacht werden. Wir unterstützen gemeinwohlorientierte Konzepte.",
      "Nachverdichtung ja – aber immer mit Grünflächen und nachhaltiger Bauweise.",
    ],
    default: [
      "Bürgerbeteiligung ist das Herzstück unserer Politik. Wir nehmen diese Initiative ernst und prüfen Umsetzungswege.",
      "Wir begrüßen bürgerschaftliches Engagement. Diese Initiative verdient eine ernsthafte Prüfung im Stadtrat.",
    ],
  },
  spd: {
    umwelt: [
      "Umweltschutz muss sozial gerecht gestaltet werden. Wir unterstützen diese Initiative, wenn sie alle Bürger mitnimmt.",
      "Grüne Stadtentwicklung ist wichtig – aber die Kosten dürfen nicht bei den Ärmsten landen.",
    ],
    verkehr: [
      "Gute Mobilität ist ein Grundrecht. Wir setzen uns für einen bezahlbaren und zuverlässigen ÖPNV ein.",
      "Verkehrssicherheit für alle – besonders für Kinder, Senioren und Pendler. Diese Initiative hat unsere Unterstützung.",
    ],
    soziales: [
      "Soziale Gerechtigkeit steht bei uns an erster Stelle. Diese Initiative stärkt den Zusammenhalt in unserer Stadt.",
      "Wir kämpfen für gleiche Chancen. Bürgerengagement wie dieses zeigt, was möglich ist.",
      "Die Stärkung sozialer Infrastruktur ist unser Kernthema. Wir setzen uns aktiv für diese Idee ein.",
    ],
    wohnen: [
      "Bezahlbares Wohnen ist die soziale Frage unserer Zeit. Wir unterstützen Initiativen gegen Mietenwahnsinn.",
      "Wohnen darf kein Luxus sein. Wir fordern mehr sozialen Wohnungsbau und Mieterschutz.",
    ],
    wirtschaft: [
      "Gute Arbeit und faire Löhne – darauf kommt es an. Wirtschaftsförderung muss den Arbeitnehmern zugutekommen.",
      "Wir setzen auf eine starke lokale Wirtschaft mit guten Arbeitsbedingungen für alle.",
    ],
    default: [
      "Politik muss nah bei den Menschen sein. Diese Initiative zeigt, dass Demokratie vor Ort funktioniert.",
      "Wir nehmen die Anliegen der Bürgerinnen und Bürger ernst und prüfen diese Initiative konstruktiv.",
    ],
  },
  csu: {
    umwelt: [
      "Umweltschutz und wirtschaftliche Vernunft müssen zusammengehen. Wir prüfen diese Initiative unter Kosten-Nutzen-Gesichtspunkten.",
      "Wir stehen für eine verantwortungsvolle Umweltpolitik, die Arbeitsplätze und Wohlstand sichert.",
    ],
    verkehr: [
      "München braucht eine leistungsfähige Verkehrsinfrastruktur. Wir setzen auf einen ausgewogenen Mix aller Verkehrsträger.",
      "Verkehrssicherheit und Wirtschaftsverkehr haben für uns Priorität. Ideologische Verbote lehnen wir ab.",
    ],
    sicherheit: [
      "Sicherheit und Ordnung sind Grundpfeiler einer funktionierenden Stadtgesellschaft. Diese Initiative hat unsere volle Unterstützung.",
      "Wir stehen für konsequentes Durchgreifen und eine sichere Stadt für alle Bürgerinnen und Bürger.",
      "Ordnung muss sein. Wir unterstützen Initiativen, die das Sicherheitsgefühl der Bürger stärken.",
    ],
    wirtschaft: [
      "Eine starke Wirtschaft sichert Arbeitsplätze und Wohlstand. Wir unterstützen unternehmerfreundliche Initiativen.",
      "München als Wirtschaftsstandort muss gestärkt werden. Bürokratieabbau und Innovation sind der Schlüssel.",
    ],
    wohnen: [
      "Wir setzen auf Eigentumsförderung und marktgerechte Lösungen im Wohnungsbau. Enteignungen lehnen wir ab.",
      "Mehr Bauen statt mehr Regulieren – das ist unser Weg zu bezahlbarem Wohnraum.",
    ],
    default: [
      "Wir hören den Bürgern zu und handeln pragmatisch. Diese Initiative werden wir sorgfältig prüfen.",
      "Vernunft und Verantwortung leiten unser Handeln. Wir nehmen diesen Vorschlag ernst.",
    ],
  },
  fdp: {
    umwelt: [
      "Umweltschutz gelingt am besten durch Innovation und Technologie, nicht durch Verbote. Wir setzen auf marktwirtschaftliche Lösungen.",
      "Ökologische Ziele erreichen wir effizienter mit Anreizen als mit Vorschriften.",
    ],
    verkehr: [
      "Mobilität ist Freiheit. Wir setzen auf technologieoffene Verkehrskonzepte statt auf Verbote einzelner Verkehrsmittel.",
      "Ein moderner ÖPNV und digitale Mobilitätslösungen machen unsere Stadt lebenswert – ohne Bevormundung.",
    ],
    wirtschaft: [
      "Wirtschaftliche Freiheit schafft Wohlstand für alle. Wir unterstützen Initiativen, die Bürokratie abbauen.",
      "Gründergeist und Eigenverantwortung sind die Motoren unserer Gesellschaft. Weniger Staat, mehr Freiraum.",
      "Innovation entsteht dort, wo der Staat sich zurückhält. Wir stehen für unternehmerische Freiheit.",
    ],
    digital: [
      "Digitalisierung ist der Schlüssel zur Stadt der Zukunft. Schnelles Internet und digitale Verwaltung müssen selbstverständlich sein.",
      "Wir fordern eine konsequente Digitalisierung aller kommunalen Dienstleistungen. Bürgerfreundlich und effizient.",
    ],
    wohnen: [
      "Mehr Baugenehmigungen, weniger Vorschriften – so schaffen wir Wohnraum. Marktwirtschaft statt Mietendeckel.",
      "Eigentumsbildung muss gefördert werden. Wir setzen auf Entlastung statt Regulierung.",
    ],
    default: [
      "Bürgerliches Engagement verdient Respekt. Wir prüfen, wie der Staat hier weniger hindern und mehr ermöglichen kann.",
      "Freiheit und Eigenverantwortung sind unsere Leitprinzipien. Diese Initiative verdient eine offene Diskussion.",
    ],
  },
  linke: {
    umwelt: [
      "Klimagerechtigkeit heißt: Umweltschutz darf nicht auf Kosten der Ärmsten gehen. Wir unterstützen sozial-ökologische Initiativen.",
      "Die Klimakrise trifft die Schwächsten am härtesten. Umweltpolitik muss sozial gerecht sein.",
    ],
    verkehr: [
      "ÖPNV muss kostenlos und für alle zugänglich sein. Mobilität ist ein Grundrecht, kein Luxus.",
      "Wir fordern den Ausbau des ÖPNV und kostenlose Mobilität für Geringverdienende.",
    ],
    soziales: [
      "Soziale Gleichheit ist nicht verhandelbar. Diese Initiative zeigt, dass Solidarität von unten wächst.",
      "Wir stehen an der Seite der Bürgerinnen und Bürger. Gegen Sozialabbau, für eine solidarische Stadt.",
      "Jeder Mensch verdient ein würdevolles Leben. Diese Initiative setzt ein wichtiges Zeichen.",
    ],
    wohnen: [
      "Wohnen ist ein Menschenrecht. Wir fordern Mietendeckel, mehr sozialen Wohnungsbau und ein Ende der Spekulation.",
      "Die Mietenkrise ist politisch gemacht – und muss politisch gelöst werden. Enteignung großer Wohnkonzerne bleibt auf dem Tisch.",
      "Bezahlbarer Wohnraum für alle – das ist unser Versprechen. Spekulation mit Wohnraum muss gestoppt werden.",
    ],
    wirtschaft: [
      "Wirtschaft muss den Menschen dienen, nicht umgekehrt. Wir fordern gerechte Löhne und starke Gewerkschaften.",
    ],
    default: [
      "Basisdemokratie ist unser Prinzip. Wir unterstützen Bürgerinitiativen, die für soziale Gerechtigkeit kämpfen.",
      "Die Stimme der Bürgerinnen und Bürger muss gehört werden. Wir stehen solidarisch hinter diesem Anliegen.",
    ],
  },
  afd: {
    umwelt: [
      "Umweltschutz ja – aber nicht zu Lasten der Bürger und des Wirtschaftsstandorts. Ideologische Klimapolitik lehnen wir ab.",
      "Vernünftiger Naturschutz statt ideologiegetriebener Verbotspolitik. Die Bürger dürfen nicht weiter belastet werden.",
    ],
    verkehr: [
      "Autofahrer dürfen nicht weiter gegängelt werden. Wir setzen auf individuelle Mobilität und lehnen Fahrverbote ab.",
      "Die Verkehrsinfrastruktur muss ausgebaut, nicht zurückgebaut werden. Gegen ideologische Verkehrspolitik.",
    ],
    sicherheit: [
      "Innere Sicherheit muss oberste Priorität haben. Wir fordern mehr Polizeipräsenz und konsequente Strafverfolgung.",
      "Sicherheit und Ordnung sind das Fundament einer funktionierenden Gesellschaft. Hier muss der Staat entschlossen handeln.",
      "Die Bürger haben ein Recht auf Sicherheit in ihrem Viertel. Wir fordern konsequentes Durchgreifen.",
    ],
    wohnen: [
      "Der Wohnungsmarkt braucht weniger Regulierung und mehr Neubau. Die Zuwanderung verschärft die Lage zusätzlich.",
    ],
    default: [
      "Wir stehen für die Interessen der deutschen Bürger. Diese Initiative werden wir unter diesem Gesichtspunkt bewerten.",
      "Bürgernähe statt Ideologie – wir nehmen die Sorgen der Bevölkerung ernst.",
    ],
  },
  volt: {
    umwelt: [
      "Klimaschutz kennt keine Grenzen. Wir brauchen europäische Lösungen für lokale Umweltprobleme.",
      "München kann Vorreiter für nachhaltige Stadtentwicklung in Europa werden. Diese Initiative ist ein guter Anfang.",
    ],
    verkehr: [
      "Europäische Städte zeigen, wie moderne Mobilität funktioniert. München sollte von den Besten lernen.",
      "Vernetzte, multimodale Mobilität nach europäischem Vorbild – das ist unsere Vision für München.",
    ],
    digital: [
      "Digitale Innovation und europäische Zusammenarbeit können unsere Stadt transformieren. Wir unterstützen diese Initiative.",
      "Smart-City-Konzepte aus ganz Europa inspirieren uns. München hat das Potenzial, digitaler Vorreiter zu werden.",
      "Open Data und digitale Bürgerbeteiligung müssen Standard werden. Diese Initiative zeigt den Weg.",
    ],
    soziales: [
      "Eine inklusive Gesellschaft braucht europäische Werte: Vielfalt, Offenheit und Solidarität.",
    ],
    default: [
      "Innovation und europäisches Denken sind unsere Stärke. Diese Initiative verdient eine zukunftsorientierte Diskussion.",
      "Wir glauben an evidenzbasierte Politik und europäische Best Practices. Lassen Sie uns gemeinsam die beste Lösung finden.",
    ],
  },
  fw: {
    umwelt: [
      "Umweltschutz muss vor Ort praktisch umgesetzt werden – mit Augenmaß und Bürgernähe.",
      "Pragmatischer Naturschutz statt ideologischer Debatten. Wir setzen auf kommunale Lösungen.",
    ],
    verkehr: [
      "Verkehrspolitik muss sich an den realen Bedürfnissen der Bürger orientieren, nicht an Ideologien.",
      "Gute Verkehrsinfrastruktur entsteht durch kommunale Kompetenz, nicht durch Vorgaben von oben.",
    ],
    wirtschaft: [
      "Wir stärken die lokale Wirtschaft mit pragmatischen Lösungen. Handwerk und Mittelstand sind das Rückgrat unserer Stadt.",
    ],
    infrastruktur: [
      "Kommunale Infrastruktur muss funktionieren – pragmatisch, effizient und bürgernah.",
      "Wir kennen die Probleme vor Ort am besten. Kommunale Selbstverwaltung ist unser Prinzip.",
    ],
    default: [
      "Als Freie Wähler stehen wir für kommunale Pragmatik. Diese Initiative prüfen wir unvoreingenommen und lösungsorientiert.",
      "Parteipolitik bringt uns nicht weiter – Sachpolitik schon. Wir bewerten diese Initiative nach ihrem konkreten Nutzen.",
    ],
  },
  oedp: {
    umwelt: [
      "Mensch und Natur gehören zusammen. Wir setzen uns konsequent für ökologische Nachhaltigkeit ein.",
      "Artenschutz, Flächenschutz, Klimaschutz – das sind keine Nebensachen, sondern Überlebensfragen. Wir unterstützen diese Initiative.",
      "Echte Nachhaltigkeit bedeutet, die Schöpfung zu bewahren. Diese Initiative geht in die richtige Richtung.",
    ],
    verkehr: [
      "Weniger Flächenverbrauch, mehr nachhaltige Mobilität – das ist unsere Vision für München.",
      "Verkehrswende heißt auch Wertewende: Gemeinwohl vor Individualinteressen.",
    ],
    wohnen: [
      "Nachhaltiges Bauen und Flächensparen müssen Hand in Hand gehen. Wir fordern ökologische Baustandards.",
    ],
    soziales: [
      "Gemeinwohl geht vor Eigennutz. Wir unterstützen Initiativen, die den sozialen Zusammenhalt stärken.",
    ],
    default: [
      "Wertebasierte Politik braucht engagierte Bürger. Diese Initiative verdient unsere volle Aufmerksamkeit.",
      "Ökologie und Gemeinwohl sind die Leitlinien unserer Politik. Wir prüfen diese Initiative mit großem Interesse.",
    ],
  },
};

// ── Response picker ──────────────────────────────────────────────────

function getTheme(category: string): ThemeId {
  // Try exact match first, then case-insensitive partial match
  if (categoryToTheme[category]) return categoryToTheme[category];

  const lower = category.toLowerCase();
  for (const [key, theme] of Object.entries(categoryToTheme)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return theme;
    }
  }
  return "default";
}

/**
 * Returns a deterministic but varied response for a party + initiative combination.
 * Uses the initiative ID as a seed so the same initiative always shows the same text,
 * but different initiatives get different variants.
 */
export function getPartyResponses(
  initiativeId: string | number,
  category: string,
): PartyResponse[] {
  const theme = getTheme(category);
  const seed = Math.abs(hashCode(String(initiativeId)));

  // Pick 2–3 parties deterministically per initiative
  const count = (seed % 2) + 2; // 2 or 3
  const shuffled = [...parties].sort(
    (a, b) => hashCode(a.id + initiativeId) - hashCode(b.id + initiativeId),
  );
  const selected = shuffled.slice(0, count);

  return selected.map((party) => {
    const pool =
      responsePool[party.id]?.[theme] ?? responsePool[party.id]?.default ?? [];
    const fallback =
      responsePool[party.id]?.default?.[0] ??
      "Wir nehmen diese Initiative zur Kenntnis und werden sie intern beraten.";

    const text =
      pool.length > 0 ? pool[seed % pool.length] : fallback;

    return { partyId: party.id, statement: text };
  });
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function getPartyById(id: string): Party | undefined {
  return parties.find((p) => p.id === id);
}
