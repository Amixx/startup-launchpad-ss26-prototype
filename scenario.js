const SCENARIO = {
  product: {
    name: "Nubo",
  },
  roles: [
    {
      id: "site",
      label: "1 · Capture",
      persona: "Site manager",
      device: "Mobile",
    },
    {
      id: "claim",
      label: "2 · Claim file",
      persona: "Commercial lead",
      device: "Desktop",
    },
    {
      id: "decision",
      label: "3 · Decision",
      persona: "Project director",
      device: "Dashboard",
    },
  ],
  eventId: "N‑204",
  claimId: "CL‑204",
  project: "Munich utility trench · Lot 4",
  incident: "Excavator hit unmarked pipe",
  value: "€18,400",
  deadline: "Notice due in 48h",
  avoided: "€24k+ dispute risk avoided",
  transcript:
    "Excavator hit a pipe while digging trench section B. The pipe was not marked in the plan. Work stopped at 10:42. We need repair, delay notice, and evidence for the claim file.",
  capture: {
    location: "Trench B · chainage 42m",
    coordinates: "48.1351°N · 11.5820°E",
    time: "Today · 10:42",
    voice:
      "We just caught a pipe in trench B — not on the drawing. Stopping the excavator now, area is secured. Need repair crew and client confirmation.",
  },
  ai: {
    classification: "Potential change / damage claim",
    cause: "Unmarked utility pipe not shown in plan set",
    work: "Stop excavation, secure pipe, repair crew, idle equipment",
    missing: "Client/site-supervisor confirmation",
  },
  money: [
    ["Pipe repair crew", "€7,900"],
    ["Excavator idle time", "€3,600"],
    ["Delay / coordination", "€6,900"],
  ],
  documents: [
    "Incident photo with timestamp",
    "Voice note transcribed into facts",
    "Plan extract: pipe not marked",
    "Cost basis and delay note",
  ],
};

const I18N = {
  en: {
    static: {
      brandTag: "AI claim files for construction",
      navHint: "Keyboard: ← back · →/Enter next · R restart",
      back: "← Back",
      next: "Next →",
      restart: "Restart",
      autoplay: "Autoplay demo",
      autoplaying: "Playing…",
      restartNext: "Restart ↻",
      toast: "Claim file exported as PDF",
    },
  },
  de: {
    static: {
      brandTag: "KI-Nachtragsakten für Bauprojekte",
      navHint: "Tastatur: ← zurück · →/Enter weiter · R Neustart",
      back: "← Zurück",
      next: "Weiter →",
      restart: "Neustart",
      autoplay: "Demo abspielen",
      autoplaying: "Läuft…",
      restartNext: "Neu starten ↻",
      toast: "Nachtragsakte als PDF exportiert",
    },
  },
};

let currentLanguage = "en";
