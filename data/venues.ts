import { C } from './colors';

export type Venue = {
  id: string;
  name: string;
  category: string;
  color: string;
  neighborhood: string;
  priceTier: string;
  description: string;
  hours: string;
};

export const VENUES: Venue[] = [
  // ── Coffee & Cafés ──
  {
    id: 'c1',
    name: 'Bluestone Lane',
    category: 'COFFEE & CAFÉS',
    color: C.coffee,
    neighborhood: 'Logan Circle',
    priceTier: '$$',
    description: 'Australian-style café with specialty espresso drinks and all-day avocado toast.',
    hours: 'Mon–Fri 7am–5pm, Sat–Sun 8am–5pm',
  },
  {
    id: 'c2',
    name: 'Baked & Wired',
    category: 'COFFEE & CAFÉS',
    color: C.coffee,
    neighborhood: 'Georgetown',
    priceTier: '$',
    description: "Georgetown's beloved bakery-café famous for cupcakes and great pour-overs.",
    hours: 'Mon–Sat 7am–8pm, Sun 8am–7pm',
  },
  {
    id: 'c3',
    name: 'Slipstream Coffee',
    category: 'COFFEE & CAFÉS',
    color: C.coffee,
    neighborhood: 'Columbia Heights',
    priceTier: '$',
    description: 'Columbia Heights café with excellent filter coffee and a relaxed neighborhood vibe.',
    hours: 'Daily 7am–9pm',
  },

  // ── Arts & Culture ──
  {
    id: 'c4',
    name: 'National Portrait Gallery',
    category: 'ARTS & CULTURE',
    color: C.arts,
    neighborhood: 'Penn Quarter',
    priceTier: 'Free',
    description: 'Presidential portraits and bold contemporary commissions in a stunning neoclassical palace.',
    hours: 'Daily 11:30am–7pm',
  },
  {
    id: 'c5',
    name: 'Smithsonian American Art',
    category: 'ARTS & CULTURE',
    color: C.arts,
    neighborhood: 'Penn Quarter',
    priceTier: 'Free',
    description: "The nation's oldest federal art collection, with folk art, photography, and modern works.",
    hours: 'Daily 11:30am–7pm',
  },
  {
    id: 'v3',
    name: 'Hirshhorn Museum',
    category: 'ARTS & CULTURE',
    color: C.arts,
    neighborhood: 'The Mall',
    priceTier: 'Free',
    description: 'Contemporary and modern art in a striking cylindrical building on the National Mall.',
    hours: 'Daily 10am–5:30pm',
  },

  // ── Outdoors ──
  {
    id: 'c6',
    name: 'Meridian Hill Park',
    category: 'OUTDOORS',
    color: C.outdoors,
    neighborhood: 'Columbia Heights',
    priceTier: 'Free',
    description: 'A cascading fountain park perched above Columbia Heights with skyline views.',
    hours: 'Daily 6am–10pm',
  },
  {
    id: 'c7',
    name: 'Rock Creek Park',
    category: 'OUTDOORS',
    color: C.outdoors,
    neighborhood: 'Northwest DC',
    priceTier: 'Free',
    description: '1,700 acres of urban forest with trails, a planetarium, and creek-side picnic spots.',
    hours: 'Daily dawn to dusk',
  },
  {
    id: 'c8',
    name: 'Gravelly Point Park',
    category: 'OUTDOORS',
    color: C.outdoors,
    neighborhood: 'Arlington',
    priceTier: 'Free',
    description: 'Watch planes land 200 feet overhead from a grassy riverside lawn along the Potomac.',
    hours: 'Daily dawn to dusk',
  },

  // ── Eat & Drink ──
  {
    id: 'v1',
    name: 'The Dabney',
    category: 'EAT & DRINK',
    color: C.eat,
    neighborhood: 'Shaw',
    priceTier: '$$$',
    description: 'Hearth-driven Mid-Atlantic cooking in a warmly lit Shaw dining room.',
    hours: 'Tue–Thu 5:30pm–10pm, Fri–Sat 5pm–10:30pm',
  },
  {
    id: 'c9',
    name: 'Cranes',
    category: 'EAT & DRINK',
    color: C.eat,
    neighborhood: 'Penn Quarter',
    priceTier: '$$$',
    description: 'Japanese-Spanish kaiseki cuisine in a serene Penn Quarter setting.',
    hours: 'Tue–Sat 5:30pm–10pm',
  },
  {
    id: 'c10',
    name: 'The Roost',
    category: 'EAT & DRINK',
    color: C.eat,
    neighborhood: 'Capitol Hill',
    priceTier: '$$',
    description: 'A rotating food hall with DC-born vendors across breakfast, lunch, and dinner.',
    hours: 'Mon–Sat 8am–9pm, Sun 10am–6pm',
  },

  // ── Markets ──
  {
    id: 'c11',
    name: 'Eastern Market',
    category: 'MARKETS',
    color: C.markets,
    neighborhood: 'Capitol Hill',
    priceTier: '$',
    description: "Capitol Hill's historic public market with local produce, art, and food vendors.",
    hours: 'Tue–Fri 7am–7pm, Sat–Sun 7am–6pm',
  },

  // ── Nightlife ──
  {
    id: 'c12',
    name: 'Flash Nightclub',
    category: 'NIGHTLIFE',
    color: C.nightlife,
    neighborhood: 'Penn Quarter',
    priceTier: '$$',
    description: "DC's premier underground electronic music venue with world-class DJs.",
    hours: 'Fri–Sat 10pm–4am',
  },
];
