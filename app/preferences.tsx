/**
 * FORAGE — PreferencesScreen
 * app/preferences.tsx
 *
 * Lets the user change their top-3 categories without retaking the quiz.
 * Header/back-button pattern matches app/outing-history.tsx; category
 * colors/icons are read from _category-icons.ts rather than re-hardcoded.
 */

import { LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { Check, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCatIcon, getCategoryColor } from './_category-icons';
import { C } from '../data/colors';
import { F } from '../data/fonts';
import { generatePlan, type Category, type PlanInputs } from './_generate-plan';
import { setScoutSuggestion } from './_outing-store';
import { getTasteProfile, setTasteProfile } from './_taste-profile-store';

const ALL_CATEGORIES: Category[] = [
  'COFFEE & CAFÉS',
  'ARTS & CULTURE',
  'OUTDOORS',
  'EAT & DRINK',
  'MARKETS',
  'EXPERIENCES',
  'NIGHTLIFE',
];

const REQUIRED_COUNT = 3;

function CategoryChip({
  category,
  selected,
  onPress,
}: {
  category: Category;
  selected: boolean;
  onPress: () => void;
}) {
  const color = getCategoryColor(category);
  const Icon = getCatIcon(category);

  return (
    <Pressable
      style={[
        styles.chip,
        selected
          ? { borderColor: color, backgroundColor: color + '14' }
          : { borderColor: C.border, backgroundColor: C.card },
      ]}
      onPress={onPress}
    >
      <View style={[styles.chipIconCircle, { backgroundColor: selected ? color + '22' : C.amberTint }]}>
        <Icon size={18} color={selected ? color : C.textTert} />
      </View>
      <Text style={[styles.chipLabel, { color: selected ? C.textPrimary : C.textSec }]} numberOfLines={2}>
        {category}
      </Text>
      {selected && (
        <View style={[styles.checkBadge, { backgroundColor: color }]}>
          <Check size={11} color="#FFFFFF" strokeWidth={3} />
        </View>
      )}
    </Pressable>
  );
}

export default function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded, fontError] = useFonts({
    LibreBaskerville_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  const [profile] = useState(() => getTasteProfile());
  const [selected, setSelected] = useState<Category[]>(() => profile?.categories ?? []);

  if (!fontsLoaded && !fontError) return null;

  const canSave = selected.length === REQUIRED_COUNT;

  function toggleCategory(category: Category) {
    setSelected(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      }
      // Already at the cap — ignore the tap rather than bumping the oldest
      // selection, so the user always has to make an explicit deselect first.
      if (prev.length >= REQUIRED_COUNT) {
        return prev;
      }
      return [...prev, category];
    });
  }

  function handleSave() {
    if (!canSave) return;

    const categories = selected as [Category, Category, Category];
    const vibes = profile?.vibes ?? [];

    setTasteProfile({ categories, vibes });

    const inputs: PlanInputs = {
      categories,
      vibes,
      budget: '$$',
      timeOfDay: new Date(),
    };

    let plan;
    try {
      plan = generatePlan(inputs);
    } catch {
      Alert.alert('Nothing open right now', "Try again later, or widen what you're looking for.");
      return;
    }

    setScoutSuggestion(plan);

    router.back();
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── HEADER ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
        >
          <ChevronLeft size={22} color={C.textPrimary} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Preferences</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>
          Pick {REQUIRED_COUNT} categories ({selected.length}/{REQUIRED_COUNT})
        </Text>

        <View style={styles.chipGrid}>
          {ALL_CATEGORIES.map(category => (
            <CategoryChip
              key={category}
              category={category}
              selected={selected.includes(category)}
              onPress={() => toggleCategory(category)}
            />
          ))}
        </View>

        <Pressable
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>Save</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
  },
  backBtn: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
    marginTop: 2,
  },
  headerText: {
    flex: 1,
    paddingTop: 4,
  },
  headerTitle: {
    fontFamily: F.serif,
    fontSize: 22,
    color: C.textPrimary,
    lineHeight: 28,
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },

  sectionLabel: {
    fontFamily: F.semi,
    fontSize: 12,
    color: C.textSec,
    letterSpacing: 0.4,
    marginBottom: 14,
  },

  // ── Chip grid ──
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    width: '47%',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  chipIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontFamily: F.semi,
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Save button ──
  saveBtn: {
    marginTop: 28,
    backgroundColor: C.amber,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: C.pillMuted,
  },
  saveBtnText: {
    fontFamily: F.semi,
    fontSize: 15,
    color: '#FFFFFF',
  },
  saveBtnTextDisabled: {
    color: C.textTert,
  },
});
