/**
 * FORAGE — OutingQuestionsScreen (3 quick single-tap questions → generate plan)
 * app/outing-questions.tsx
 */

import { LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCatIcon } from './_category-icons';
import { C } from '../data/colors';
import { F } from '../data/fonts';
import { generatePlan, type BudgetTier, type Category, type PlanInputs } from './_generate-plan';
import { setWorkingPlan } from './_outing-store';

const CATEGORIES: Category[] = [
  'EAT & DRINK',
  'COFFEE & CAFÉS',
  'OUTDOORS',
  'ARTS & CULTURE',
  'EXPERIENCES',
  'NIGHTLIFE',
  'MARKETS',
];

function getCategoryColor(cat: Category): string {
  switch (cat) {
    case 'EAT & DRINK':    return C.eat;
    case 'COFFEE & CAFÉS': return C.coffee;
    case 'OUTDOORS':       return C.outdoors;
    case 'ARTS & CULTURE': return C.arts;
    case 'EXPERIENCES':    return C.experiences;
    case 'NIGHTLIFE':      return C.nightlife;
    case 'MARKETS':        return C.markets;
    default:                return C.textPrimary;
  }
}

const CATEGORY_ROWS: Category[][] = [];
for (let i = 0; i < CATEGORIES.length; i += 2) {
  CATEGORY_ROWS.push(CATEGORIES.slice(i, i + 2));
}

const BUDGETS: BudgetTier[] = ['Free', '$', '$$', '$$$'];

const VIBES = ['Chill', 'Social', 'Active', 'Romantic', 'Artsy', 'Foodie'];

const VIBE_ROWS: string[][] = [];
for (let i = 0; i < VIBES.length; i += 3) {
  VIBE_ROWS.push(VIBES.slice(i, i + 3));
}

export default function OutingQuestionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded, fontError] = useFonts({
    LibreBaskerville_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedBudget, setSelectedBudget]         = useState<BudgetTier>('$$');
  const [selectedVibes, setSelectedVibes]           = useState<string[]>([]);

  if (!fontsLoaded && !fontError) return null;

  const canFindOuting = selectedCategories.length > 0;

  function toggleCategory(cat: Category) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function toggleVibe(vibe: string) {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  }

  function handleFindOuting() {
    const inputs: PlanInputs = {
      categories: selectedCategories,
      vibes: selectedVibes,
      budget: selectedBudget,
      timeOfDay: new Date(),
    };

    let plan;
    try {
      plan = generatePlan(inputs);
    } catch {
      Alert.alert('Nothing open right now', "Try again later, or widen what you're looking for.");
      return;
    }

    setWorkingPlan(plan);
    router.push({ pathname: '/outing-preview', params: { fromQuestions: '1' } });
  }

  return (
    <View style={[styles.screen, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── HEADER ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.backBtn}
          >
            <ChevronLeft size={22} color={C.textPrimary} />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Tell me what you're after.</Text>
            <Text style={styles.subtitle}>Three questions. Then I'll take it from here.</Text>
          </View>
        </View>
      </View>

      {/* ── SCROLLABLE QUESTIONS ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1 — Category */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.tileGrid}>
            {CATEGORY_ROWS.map((row, idx) => (
              <View key={idx} style={[styles.tileRow, row.length === 1 && styles.tileRowCentered]}>
                {row.map((cat) => {
                  const CatIcon = getCatIcon(cat);
                  const selected = selectedCategories.includes(cat);
                  return (
                    <Pressable
                      key={cat}
                      style={[styles.tile, selected && styles.tileSelected]}
                      onPress={() => toggleCategory(cat)}
                    >
                      <CatIcon size={28} color={selected ? getCategoryColor(cat) : C.textPrimary} />
                      <Text style={[styles.tileLabel, selected && { color: getCategoryColor(cat) }]}>{cat}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Section 2 — Budget */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Budget</Text>
          <View style={styles.segmentedRow}>
            {BUDGETS.map((tier) => {
              const selected = selectedBudget === tier;
              return (
                <Pressable
                  key={tier}
                  style={[styles.segment, selected && styles.segmentSelected]}
                  onPress={() => setSelectedBudget(tier)}
                >
                  <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                    {tier}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 3 — Vibe */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Vibe</Text>
          <View style={styles.vibeGrid}>
            {VIBE_ROWS.map((row, idx) => (
              <View key={idx} style={styles.vibeRow}>
                {row.map((vibe) => {
                  const selected = selectedVibes.includes(vibe);
                  return (
                    <Pressable
                      key={vibe}
                      style={[styles.chip, styles.vibePill, selected && styles.chipSelected]}
                      onPress={() => toggleVibe(vibe)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{vibe}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── FIXED BOTTOM CTA ── */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={[styles.findBtn, !canFindOuting && styles.findBtnDisabled]}
          onPress={handleFindOuting}
          disabled={!canFindOuting}
        >
          <Text style={[styles.findBtnText, !canFindOuting && styles.findBtnTextDisabled]}>
            Find my outing
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // ── Header ──
  header: {
    backgroundColor: C.bg,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backBtn: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    flexShrink: 0,
  },
  headerContent: {
    flex: 1,
    paddingTop: 4,
  },
  title: {
    fontFamily: F.serif,
    fontSize: 24,
    color: C.textPrimary,
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textSec,
    lineHeight: 19,
    marginTop: 6,
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 20,
  },

  // ── Section ──
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: F.semi,
    fontSize: 11,
    color: C.textSec,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // ── Chips (vibe) ──
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  chipSelected: {
    backgroundColor: C.amberTint,
    borderWidth: 1.5,
    borderColor: C.amber,
  },
  chipText: {
    fontFamily: F.med,
    fontSize: 13,
    color: C.textPrimary,
  },
  chipTextSelected: {
    color: C.amber,
  },

  // ── Vibe grid (3-column) ──
  vibeGrid: {
    flexDirection: 'column',
  },
  vibeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  vibePill: {
    flex: 1,
    justifyContent: 'center',
  },

  // ── Category tiles (2-column grid) ──
  tileGrid: {
    flexDirection: 'column',
  },
  tileRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tileRowCentered: {
    justifyContent: 'center',
  },
  tile: {
    width: '48%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingVertical: 14,
  },
  tileSelected: {
    backgroundColor: C.amberTint,
    borderWidth: 1.5,
    borderColor: C.amber,
  },
  tileLabel: {
    fontFamily: F.med,
    fontSize: 12,
    color: C.textPrimary,
    textAlign: 'center',
    marginTop: 8,
  },

  // ── Segmented row (budget) ──
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingVertical: 12,
  },
  segmentSelected: {
    backgroundColor: C.amber,
    borderColor: C.amber,
  },
  segmentText: {
    fontFamily: F.semi,
    fontSize: 13,
    color: C.textSec,
  },
  segmentTextSelected: {
    color: '#FFFFFF',
  },

  // ── Bottom CTA ──
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingTop: 12,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  findBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: C.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findBtnDisabled: {
    backgroundColor: C.pillMuted,
  },
  findBtnText: {
    fontFamily: F.semi,
    fontSize: 15,
    color: '#FFFFFF',
  },
  findBtnTextDisabled: {
    color: C.textTert,
  },
});
