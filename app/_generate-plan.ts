import { VENUES, type Venue } from '../data/venues';
import { createStopInstanceId, type OutingPlan, type Stop } from './_outing-store';

// ─────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────

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
  duration?: number;
  timeOfDay?: Date;
};

// ─────────────────────────────────────────
//  STOP COUNT (by time of day)
// ─────────────────────────────────────────

export function getStopCountForTime(date: Date): number {
  const hour = date.getHours();
  if (hour < 15) return 4;
  if (hour < 18) return 3;
  if (hour < 21) return 2;
  return 1;
}

// ─────────────────────────────────────────
//  BUDGET
// ─────────────────────────────────────────

const BUDGET_RANK: Record<BudgetTier, number> = { Free: 0, '$': 1, '$$': 2, '$$$': 3 };

function budgetAllows(priceTier: string, budget: BudgetTier): boolean {
  const rank = BUDGET_RANK[priceTier as BudgetTier];
  if (rank === undefined) return false;
  return rank <= BUDGET_RANK[budget];
}

// ─────────────────────────────────────────
//  STOP SELECTION
// ─────────────────────────────────────────

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

// ─────────────────────────────────────────
//  NAME + CAPTION TEMPLATES
// ─────────────────────────────────────────

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

// ─────────────────────────────────────────
//  GENERATE PLAN
// ─────────────────────────────────────────

export function generatePlan(inputs: PlanInputs): OutingPlan {
  const stopCount = getStopCountForTime(inputs.timeOfDay ?? new Date());

  const { exact, widened } = selectPool(inputs.categories, inputs.budget, stopCount);

  let selected: Venue[];
  if (exact.length >= stopCount) {
    selected = pickWithVariety(exact, stopCount);
  } else {
    const fill = pickWithVariety(widened, stopCount - exact.length);
    selected = [...exact, ...fill];
  }

  const fallbackFired = exact.length < stopCount;

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
    variant: 'generated',
    isDraft: false,
    lastEdited: null,
    hasBegun: false,
    startTime: null,
    currentStopIndex: 0,
    stops,
  };
}