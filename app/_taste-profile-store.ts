import type { Category } from './_generate-plan';

// ─────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────

export type QuizOption = 'A' | 'B' | 'C' | 'D' | 'E';

export type QuizAnswers = {
  q1: QuizOption;
  q2: QuizOption;
  q3: QuizOption;
  q4: QuizOption;
  q5: QuizOption;
};

export type TasteProfileResult = {
  categories: [Category, Category, Category]; // top 3, tie-broken
  vibes: string[]; // top 3, tie-broken, most-frequent-first
};

// ─────────────────────────────────────────
//  WEIGHT TABLE
// ─────────────────────────────────────────

type QuestionOption = {
  primary: Category;
  secondary: Category;
  vibe: string;
};

const QUESTION_WEIGHTS: Record<keyof QuizAnswers, Record<QuizOption, QuestionOption>> = {
  q1: {
    A: { primary: 'EAT & DRINK', secondary: 'MARKETS', vibe: 'unhurried' },
    B: { primary: 'COFFEE & CAFÉS', secondary: 'NIGHTLIFE', vibe: 'quiet' },
    C: { primary: 'OUTDOORS', secondary: 'EAT & DRINK', vibe: 'energized' },
    D: { primary: 'ARTS & CULTURE', secondary: 'OUTDOORS', vibe: 'curious' },
    E: { primary: 'EXPERIENCES', secondary: 'MARKETS', vibe: 'adventurous' },
  },
  q2: {
    A: { primary: 'EAT & DRINK', secondary: 'ARTS & CULTURE', vibe: 'unhurried' },
    B: { primary: 'COFFEE & CAFÉS', secondary: 'EXPERIENCES', vibe: 'quiet' },
    C: { primary: 'OUTDOORS', secondary: 'EXPERIENCES', vibe: 'energized' },
    D: { primary: 'NIGHTLIFE', secondary: 'ARTS & CULTURE', vibe: 'high-energy' },
    E: { primary: 'MARKETS', secondary: 'EAT & DRINK', vibe: 'chill' },
  },
  q3: {
    A: { primary: 'EAT & DRINK', secondary: 'COFFEE & CAFÉS', vibe: 'unhurried' },
    B: { primary: 'OUTDOORS', secondary: 'ARTS & CULTURE', vibe: 'energized' },
    C: { primary: 'NIGHTLIFE', secondary: 'COFFEE & CAFÉS', vibe: 'high-energy' },
    D: { primary: 'MARKETS', secondary: 'ARTS & CULTURE', vibe: 'chill' },
    E: { primary: 'EXPERIENCES', secondary: 'COFFEE & CAFÉS', vibe: 'adventurous' },
  },
  q4: {
    A: { primary: 'EAT & DRINK', secondary: 'MARKETS', vibe: 'unhurried' },
    B: { primary: 'OUTDOORS', secondary: 'EXPERIENCES', vibe: 'energized' },
    C: { primary: 'NIGHTLIFE', secondary: 'EXPERIENCES', vibe: 'high-energy' },
    D: { primary: 'COFFEE & CAFÉS', secondary: 'MARKETS', vibe: 'quiet' },
    E: { primary: 'ARTS & CULTURE', secondary: 'EXPERIENCES', vibe: 'curious' },
  },
  q5: {
    A: { primary: 'ARTS & CULTURE', secondary: 'OUTDOORS', vibe: 'curious' },
    B: { primary: 'EXPERIENCES', secondary: 'EAT & DRINK', vibe: 'adventurous' },
    C: { primary: 'MARKETS', secondary: 'OUTDOORS', vibe: 'chill' },
    D: { primary: 'COFFEE & CAFÉS', secondary: 'EAT & DRINK', vibe: 'quiet' },
    E: { primary: 'NIGHTLIFE', secondary: 'EXPERIENCES', vibe: 'high-energy' },
  },
};

const CATEGORY_TIEBREAK: Category[] = [
  'EAT & DRINK',
  'COFFEE & CAFÉS',
  'OUTDOORS',
  'ARTS & CULTURE',
  'EXPERIENCES',
  'NIGHTLIFE',
  'MARKETS',
];

const VIBE_TIEBREAK: string[] = [
  'unhurried',
  'quiet',
  'energized',
  'curious',
  'adventurous',
  'high-energy',
  'chill',
];

// ─────────────────────────────────────────
//  SCORING
// ─────────────────────────────────────────

export function scoreTasteProfile(answers: QuizAnswers): TasteProfileResult {
  const categoryTally = new Map<Category, number>(CATEGORY_TIEBREAK.map((cat) => [cat, 0]));
  const vibeTally = new Map<string, number>();

  (Object.keys(QUESTION_WEIGHTS) as (keyof QuizAnswers)[]).forEach((question) => {
    const option = QUESTION_WEIGHTS[question][answers[question]];
    categoryTally.set(option.primary, categoryTally.get(option.primary)! + 2);
    categoryTally.set(option.secondary, categoryTally.get(option.secondary)! + 1);
    vibeTally.set(option.vibe, (vibeTally.get(option.vibe) ?? 0) + 1);
  });

  const sortedCategories = [...categoryTally.entries()].sort(([catA, countA], [catB, countB]) => {
    if (countB !== countA) return countB - countA;
    return CATEGORY_TIEBREAK.indexOf(catA) - CATEGORY_TIEBREAK.indexOf(catB);
  });
  const categories: [Category, Category, Category] = [
    sortedCategories[0][0],
    sortedCategories[1][0],
    sortedCategories[2][0],
  ];

  const sortedVibes = [...vibeTally.entries()].sort(([vibeA, countA], [vibeB, countB]) => {
    if (countB !== countA) return countB - countA;
    return VIBE_TIEBREAK.indexOf(vibeA) - VIBE_TIEBREAK.indexOf(vibeB);
  });
  const vibes = sortedVibes.slice(0, 3).map(([vibe]) => vibe);

  return { categories, vibes };
}

// ─────────────────────────────────────────
//  MODULE STATE
// ─────────────────────────────────────────

let _tasteProfileComplete = false;
let _tasteProfile: TasteProfileResult | null = null;

// ─────────────────────────────────────────
//  TASTE PROFILE API
// ─────────────────────────────────────────

export function getTasteProfileComplete(): boolean {
  return _tasteProfileComplete;
}

export function setTasteProfileComplete(complete: boolean): void {
  _tasteProfileComplete = complete;
}

export function getTasteProfile(): TasteProfileResult | null {
  return _tasteProfile;
}

export function setTasteProfile(profile: TasteProfileResult): void {
  _tasteProfile = profile;
}
