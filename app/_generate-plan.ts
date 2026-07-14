import { VENUES, type Venue } from '../data/venues';
import { createStopInstanceId, type OutingPlan, type Stop } from './_outing-store';

export type Category =
  | 'COFFEE & CAFÉS'
  | 'ARTS & CULTURE'
  | 'OUTDOORS'
  | 'EAT & DRINK'
  | 'MARKETS'
  | 'EXPERIENCES'
  | 'NIGHTLIFE';

export type BudgetTier = 'Free' | '$' | '$$' | '$$$';

export type PlanInputs = {
  categories: Category[];
  vibes: string[];
  budget: BudgetTier;
  timeOfDay?: Date;
};

export function getStopCountForTime(date: Date): number {
  const hour = date.getHours();
  if (hour < 12) return 4;
  if (hour < 16) return 4;
  if (hour < 20) return 3;
  return 3; // ceiling only for 8pm+ — generatePlan degrades this by real venue availability
}

const BUDGET_RANK: Record<BudgetTier, number> = { Free: 0, '$': 1, '$$': 2, '$$$': 3 };

function budgetAllows(priceTier: string, budget: BudgetTier): boolean {
  const rank = BUDGET_RANK[priceTier as BudgetTier];
  if (rank === undefined) return false;
  return rank <= BUDGET_RANK[budget];
}

const DAY_ABBR: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function expandDayRange(spec: string): number[] {
  if (spec === 'Daily') return [0, 1, 2, 3, 4, 5, 6];
  const parts = spec.split('–');
  if (parts.length === 1) {
    const d = DAY_ABBR[parts[0]];
    return d === undefined ? [] : [d];
  }
  const start = DAY_ABBR[parts[0]];
  const end = DAY_ABBR[parts[1]];
  if (start === undefined || end === undefined) return [];
  const days: number[] = [];
  let d = start;
  for (let i = 0; i < 8; i++) {
    days.push(d);
    if (d === end) break;
    d = (d + 1) % 7;
  }
  return days;
}

function parseClockToMinutes(token: string): number | null {
  const m = token.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  const period = m[3].toLowerCase();
  if (hour === 12) hour = 0;
  if (period === 'pm') hour += 12;
  return hour * 60 + minute;
}

type HoursClause =
  | { days: number[]; allDay: true }
  | { days: number[]; allDay?: false; startMin: number; endMin: number };

function parseClause(clause: string): HoursClause | null {
  const trimmed = clause.trim();
  const m = trimmed.match(/^(Daily|[A-Za-z]{3}(?:–[A-Za-z]{3})?)\s+(.+)$/);
  if (!m) return null;
  const daySpec = m[1];
  const timeSpec = m[2].trim();
  const days = expandDayRange(daySpec);
  if (days.length === 0) return null;

  if (/^24\s*hours$/i.test(timeSpec)) {
    return { days, allDay: true };
  }

  const timeMatch = timeSpec.match(/^(.+?)–(.+)$/);
  if (!timeMatch) return null;
  const startMin = parseClockToMinutes(timeMatch[1]);
  const endMin = parseClockToMinutes(timeMatch[2]);
  if (startMin === null || endMin === null) return null;
  return { days, startMin, endMin };
}

/**
 * Parses `venue.hours` (freeform, comma-separated day+time clauses) and checks
 * whether the venue is open at `date`. Fails closed: any clause that doesn't
 * match a recognized shape (e.g. "dawn to dusk", "varies by show") makes the
 * whole venue count as unavailable rather than guessing.
 */
export function isVenueOpenAt(venue: Venue, date: Date): boolean {
  const clauses = venue.hours.split(',').map(parseClause);
  if (clauses.some(c => c === null)) return false;

  const day = date.getDay();
  const minutesOfDay = date.getHours() * 60 + date.getMinutes();
  const prevDay = (day + 6) % 7;

  for (const clause of clauses) {
    if (!clause) continue;
    if (clause.allDay) {
      if (clause.days.includes(day)) return true;
      continue;
    }
    const { days, startMin, endMin } = clause;
    if (endMin > startMin) {
      if (days.includes(day) && minutesOfDay >= startMin && minutesOfDay < endMin) return true;
    } else {
      // wraps past midnight
      if (days.includes(day) && minutesOfDay >= startMin) return true;
      if (days.includes(prevDay) && minutesOfDay < endMin) return true;
    }
  }
  return false;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Picks up to `count` venues, round-robining across categories so one category doesn't dominate. */
function pickWithVariety(pool: Venue[], count: number): Venue[] {
  const byCategory = new Map<string, Venue[]>();
  for (const v of pool) {
    const list = byCategory.get(v.category) ?? [];
    list.push(v);
    byCategory.set(v.category, list);
  }
  const groups = shuffle([...byCategory.values()]).map(shuffle);

  const result: Venue[] = [];
  let i = 0;
  while (result.length < count && groups.some(g => g.length > 0)) {
    const group = groups[i % groups.length];
    if (group.length > 0) result.push(group.shift()!);
    i++;
  }
  return result;
}

/**
 * Fallback ladder (relax category first, then budget) — returns matches in
 * two tiers instead of one flat list, so exact category+budget matches are
 * never lost when the pool has to widen to fill remaining stops.
 */
function selectPool(
  categories: Category[],
  budget: BudgetTier,
  stopCount: number
): { exact: Venue[]; widened: Venue[] } {
  const exact = VENUES.filter(
    v => categories.includes(v.category as Category) && budgetAllows(v.priceTier, budget)
  );
  if (exact.length >= stopCount) return { exact, widened: [] };

  const exactIds = new Set(exact.map(v => v.id));
  const byBudgetOnly = VENUES.filter(v => budgetAllows(v.priceTier, budget));
  if (byBudgetOnly.length >= stopCount) {
    return { exact, widened: byBudgetOnly.filter(v => !exactIds.has(v.id)) };
  }

  return { exact, widened: VENUES.filter(v => !exactIds.has(v.id)) };
}

const CATEGORY_TEMPLATES: Record<Category, { names: string[]; captions: string[] }> = {
  'COFFEE & CAFÉS': {
    names: ['DC Coffee Crawl', "Café Hopper's Loop", 'Slow Morning Coffee Loop'],
    captions: [
      "Good coffee, better people-watching.",
      "A caffeine-fueled wander through DC's best cafés.",
      'Pour-overs and quiet corners, one stop at a time.',
    ],
  },
  'ARTS & CULTURE': {
    names: ['DC Art & Culture Loop', "Gallery Hopper's Day", 'Mall Museum Circuit'],
    captions: [
      'Coffee, culture, and something to show for it.',
      'A day of galleries, quiet halls, and big ideas.',
      'Art-forward, easy on the feet.',
    ],
  },
  OUTDOORS: {
    names: ['DC Green Space Loop', 'Parks & Fresh Air Day', 'Riverside Ramble'],
    captions: [
      'Trails, skyline views, and room to breathe.',
      'A green-and-easy day around the city.',
      'Fresh air first, everything else second.',
    ],
  },
  'EAT & DRINK': {
    names: ['DC Dinner & Drinks Loop', 'Eat Your Way Through DC', 'Shaw Supper Circuit'],
    captions: [
      'A proper night out, one plate at a time.',
      'Good food, better company.',
      'Dinner-first planning, done right.',
    ],
  },
  MARKETS: {
    names: ['DC Market Day', 'Stalls & Small Bites Loop', 'Capitol Hill Market Circuit'],
    captions: [
      'History, market stalls, and a proper dinner.',
      'Local vendors, local flavor.',
      'A market-first kind of day.',
    ],
  },
  NIGHTLIFE: {
    names: ['DC After Dark Loop', 'Nightlife Circuit', 'Late Night DC'],
    captions: [
      'Music, drinks, and a late start home.',
      'The night gets better from here.',
      'DC after the sun goes down.',
    ],
  },
  EXPERIENCES: {
    names: ['DC Wildcard Loop', 'Something Different Circuit', 'Off-Script DC Day'],
    captions: [
      'Not a museum. Not a bar. Something else entirely.',
      'For when "normal" outing sounds boring.',
      'DC has more going on than you think.',
    ],
  },
};

// Generic on purpose — used whenever the final stops don't match what was
// actually requested, so the name doesn't claim a category it didn't deliver.
const FALLBACK_TEMPLATES = {
  names: ['DC Mixed Bag', 'Whatever Fits Loop', 'Wildcard DC Day'],
  captions: [
    "Not exactly what you asked for, but still a good day out.",
    'A little bit of everything DC has going on nearby.',
    "We had to get creative — here's what we found.",
  ],
};

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function dominantCategory(stops: Venue[]): Category {
  const counts = new Map<string, number>();
  for (const s of stops) counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
  let best = stops[0].category;
  let bestCount = 0;
  for (const [category, count] of counts) {
    if (count > bestCount) {
      best = category;
      bestCount = count;
    }
  }
  return best as Category;
}

// ─────────────────────────────────────────
//  VIBE TAGS (lookup, not generation)
// ─────────────────────────────────────────

const VIBE_TAG_MAP: Record<string, string> = {
  chill: 'Relaxed',
  relaxed: 'Relaxed',
  social: 'Social',
  active: 'Active',
  romantic: 'Romantic',
  family: 'Family-friendly',
  artsy: 'Artsy',
  foodie: 'Foodie',
  nightlife: 'Late-night',
  historic: 'Historic',
  walkable: 'Walkable',
  curated: 'Curated',
  local: 'Local',
  cultural: 'Cultural',
  outdoorsy: 'Outdoorsy',
};

const CATEGORY_TAG_MAP: Record<Category, string> = {
  'COFFEE & CAFÉS': 'Caffeinated',
  'ARTS & CULTURE': 'Cultural',
  OUTDOORS: 'Outdoorsy',
  'EAT & DRINK': 'Foodie',
  MARKETS: 'Local',
  NIGHTLIFE: 'Late-night',
  EXPERIENCES: 'Immersive',
};

function buildVibeTags(vibes: string[], categories: Category[]): string[] {
  const tags: string[] = [];
  for (const vibe of vibes) {
    const tag = VIBE_TAG_MAP[vibe.toLowerCase()] ?? (vibe.charAt(0).toUpperCase() + vibe.slice(1));
    if (!tags.includes(tag)) tags.push(tag);
  }
  for (const category of categories) {
    const tag = CATEGORY_TAG_MAP[category];
    if (tag && !tags.includes(tag)) tags.push(tag);
  }
  return tags.slice(0, 3);
}

export function generatePlan(inputs: PlanInputs): OutingPlan {
  const requestedDate = inputs.timeOfDay ?? new Date();
  const stopCeiling = getStopCountForTime(requestedDate);

  const { exact, widened } = selectPool(inputs.categories, inputs.budget, stopCeiling);

  const openExact = exact.filter(v => isVenueOpenAt(v, requestedDate));
  const openWidened = widened.filter(v => isVenueOpenAt(v, requestedDate));
  const availableCount = openExact.length + openWidened.length;

  if (availableCount === 0) {
    // Needs an explicit product decision (relax categories vs. a Scout-voiced
    // empty state) — surfacing loudly instead of guessing or returning an
    // empty plan.
    throw new Error(
      `generatePlan: no venues open for categories [${inputs.categories.join(', ')}] at ${requestedDate.toISOString()} — empty-state handling not yet implemented.`
    );
  }

  const stopCount = Math.max(1, Math.min(stopCeiling, availableCount));

  let selected: Venue[];
  if (openExact.length >= stopCount) {
    selected = pickWithVariety(openExact, stopCount);
  } else {
    const fill = pickWithVariety(openWidened, stopCount - openExact.length);
    selected = [...openExact, ...fill];
  }

  const fallbackFired = openExact.length < stopCount;

  const templates = fallbackFired ? FALLBACK_TEMPLATES : CATEGORY_TEMPLATES[dominantCategory(selected)];
  const name = pickOne(templates.names);
  const caption = pickOne(templates.captions);

  const vibeTags = buildVibeTags(inputs.vibes, inputs.categories);

  const stops: Stop[] = selected.map((venue, i) => {
    const stop: Stop = {
      id: venue.id,
      stopInstanceId: createStopInstanceId(),
      name: venue.name,
      category: venue.category,
      color: venue.color,
      description: venue.description,
      neighborhood: venue.neighborhood,
      priceTier: venue.priceTier,
    };
    if (i < selected.length - 1) {
      // Estimated, not measured — same as the manual-add precedent elsewhere in the app.
      const estimatedConnectorMinutes = 6 + Math.floor(Math.random() * 15);
      stop.connector = { mode: 'walk', time: `${estimatedConnectorMinutes} min walk` };
    }
    return stop;
  });

  return {
    id: `plan-generated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    caption,
    vibeTags,
    lastEdited: null,
    startTime: null,
    currentStopIndex: 0,
    stops,
  };
}