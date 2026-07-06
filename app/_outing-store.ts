// ─────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────

export type TransportMode = 'walk' | 'drive' | 'transit';

export type Stop = {
  id: string;
  name: string;
  category: string;
  color: string;
  description: string;
  neighborhood: string;
  priceTier: string;
  connector?: { mode: TransportMode; time: string };
};

export type OutingVariant = 'initial' | 'alternate';

export type OutingPlan = {
  id: string;
  name: string;
  caption: string;
  vibeTags: string[];
  stops: Stop[];
  variant: OutingVariant;
  isDraft: boolean;
  lastEdited: number | null;
  hasBegun: boolean;
  startTime: number | null;
  currentStopIndex: number;
};

// ─────────────────────────────────────────
//  SEED DATA
// ─────────────────────────────────────────

export const INITIAL_PLAN: OutingPlan = {
  id: 'plan-initial',
  name: 'DC Art & Coffee Loop',
  caption: 'Coffee, culture, and something to show for it.',
  vibeTags: ['Artsy', 'Walkable', 'Cultural'],
  variant: 'initial',
  isDraft: false,
  lastEdited: null,
  hasBegun: false,
  startTime: null,
  currentStopIndex: 0,
  stops: [
    {
      id: '1',
      name: 'Compass Coffee',
      category: 'COFFEE & CAFÉS',
      color: '#6B4530',
      neighborhood: 'Shaw',
      priceTier: '$',
      description:
        'A Shaw neighborhood staple known for its single-origin pour-overs and cozy brick interior with exposed beams.',
      connector: { mode: 'walk', time: '8 min walk' },
    },
    {
      id: '2',
      name: 'Hirshhorn Museum',
      category: 'ARTS & CULTURE',
      color: '#5C4080',
      neighborhood: 'National Mall',
      priceTier: 'Free',
      description:
        "DC's modern and contemporary art museum set inside a striking cylindrical building on the National Mall.",
      connector: { mode: 'walk', time: '14 min walk' },
    },
    {
      id: '3',
      name: 'National Mall',
      category: 'OUTDOORS',
      color: '#3A6445',
      neighborhood: 'Downtown',
      priceTier: 'Free',
      description:
        'Stroll the iconic 2-mile greenway flanked by world-class museums and memorials. Best midday light here.',
      connector: { mode: 'walk', time: '20 min walk' },
    },
    {
      id: '4',
      name: 'The Dabney',
      category: 'EAT & DRINK',
      color: '#B84E38',
      neighborhood: 'Shaw',
      priceTier: '$$$',
      description:
        "A James Beard–nominated restaurant celebrating the Mid-Atlantic's finest ingredients over a wood-burning hearth.",
    },
  ],
};

export const ALTERNATE_PLAN: OutingPlan = {
  id: 'plan-alternate',
  name: 'Capitol Hill Culture Day',
  caption: 'History, market stalls, and a proper dinner.',
  vibeTags: ['Historic', 'Curated', 'Local'],
  variant: 'alternate',
  isDraft: false,
  lastEdited: null,
  hasBegun: false,
  startTime: null,
  currentStopIndex: 0,
  stops: [
    {
      id: 'a1',
      name: 'Bluestone Lane',
      category: 'COFFEE & CAFÉS',
      color: '#6B4530',
      neighborhood: 'Logan Circle',
      priceTier: '$$',
      description:
        'Australian-style café known for specialty espresso drinks and all-day avocado toast in a light-filled space.',
      connector: { mode: 'walk', time: '6 min walk' },
    },
    {
      id: 'a2',
      name: 'National Portrait Gallery',
      category: 'ARTS & CULTURE',
      color: '#5C4080',
      neighborhood: 'Penn Quarter',
      priceTier: 'Free',
      description:
        'Presidential portraits and bold contemporary commissions inside a stunning neoclassical palace.',
      connector: { mode: 'transit', time: '18 min ride' },
    },
    {
      id: 'a3',
      name: 'Eastern Market',
      category: 'MARKETS',
      color: '#A0622A',
      neighborhood: 'Capitol Hill',
      priceTier: '$',
      description:
        "Capitol Hill's historic market with weekend vendors, local produce, and handcrafted goods since 1873.",
      connector: { mode: 'walk', time: '10 min walk' },
    },
    {
      id: 'a4',
      name: 'Cranes',
      category: 'EAT & DRINK',
      color: '#B84E38',
      neighborhood: 'Penn Quarter',
      priceTier: '$$$',
      description:
        'Japanese-Spanish kaiseki cuisine in a serene Penn Quarter setting — best seats at the omakase counter.',
    },
  ],
};

// ─────────────────────────────────────────
//  MODULE STATE
// ─────────────────────────────────────────

const DRAFT_CAP = 5;

let _currentPlan: OutingPlan = { ...INITIAL_PLAN, stops: [...INITIAL_PLAN.stops] };
let _drafts: OutingPlan[] = [];

// ─────────────────────────────────────────
//  PLAN API
// ─────────────────────────────────────────

export function getCurrentPlan(): OutingPlan {
  return _currentPlan;
}

export function setCurrentPlan(plan: OutingPlan): void {
  _currentPlan = plan;
}

// ─────────────────────────────────────────
//  DRAFT API
// ─────────────────────────────────────────

export function getDrafts(): OutingPlan[] {
  return _drafts;
}

export function getMostRecentDraft(): OutingPlan | null {
  return _drafts[0] ?? null;
}

export function getDraftById(id: string): OutingPlan | undefined {
  return _drafts.find((d) => d.id === id);
}

function resetToUnusedVariant(): void {
  const nextVariant: OutingVariant = _currentPlan.variant === 'initial' ? 'alternate' : 'initial';
  const nextBase = nextVariant === 'initial' ? INITIAL_PLAN : ALTERNATE_PLAN;
  _currentPlan = { ...nextBase, stops: [...nextBase.stops] };
}

export function saveDraftFromCurrent(): { success: boolean; capReached: boolean } {
  const existingIdx = _drafts.findIndex((d) => d.id === _currentPlan.id);

  const draft: OutingPlan = {
    ..._currentPlan,
    id: existingIdx !== -1
      ? _drafts[existingIdx].id
      : `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    stops: [..._currentPlan.stops],
    isDraft: true,
    lastEdited: Date.now(),
  };

  if (existingIdx !== -1) {
    _drafts[existingIdx] = draft;
    _drafts.sort((a, b) => (b.lastEdited ?? 0) - (a.lastEdited ?? 0));
    resetToUnusedVariant();
    return { success: true, capReached: false };
  }

  if (_drafts.length >= DRAFT_CAP) {
    return { success: false, capReached: true };
  }

  _drafts.push(draft);
  _drafts.sort((a, b) => (b.lastEdited ?? 0) - (a.lastEdited ?? 0));
  resetToUnusedVariant();
  return { success: true, capReached: false };
}

export function hasAllVariantsExhausted(): boolean {
  return (
    _drafts.some((d) => d.id === 'plan-initial') &&
    _drafts.some((d) => d.id === 'plan-alternate')
  );
}

export function deleteDraft(id: string): void {
  _drafts = _drafts.filter((d) => d.id !== id);
}

// ─────────────────────────────────────────
//  ACTIVE OUTING API
// ─────────────────────────────────────────

export function beginOuting(): void {
  _currentPlan = {
    ..._currentPlan,
    hasBegun: true,
    startTime: Date.now(),
    currentStopIndex: 0,
  };
}

export function completeCurrentStop(): void {
  _currentPlan = {
    ..._currentPlan,
    currentStopIndex: Math.min(_currentPlan.currentStopIndex + 1, _currentPlan.stops.length),
  };
}

export function goToPreviousStop(): void {
  _currentPlan = {
    ..._currentPlan,
    currentStopIndex: Math.max(_currentPlan.currentStopIndex - 1, 0),
  };
}

export function endOuting(): void {
  _currentPlan = {
    ..._currentPlan,
    hasBegun: false,
  };
}

export function isOutingComplete(): boolean {
  return _currentPlan.currentStopIndex >= _currentPlan.stops.length;
}
