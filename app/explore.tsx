/**
 * FORAGE — ExploreScreen
 * app/explore.tsx
 *
 * Explore tab landing screen. Header pattern matches app/profile.tsx and
 * app/friends.tsx (stacked serif title, no back button). Category filter
 * chips reuse the visual/selection-state conventions from the vibe chips
 * in app/outing-questions.tsx (chip/chipSelected — amber-tint bg + amber
 * border when selected), laid out as a wrapped grid rather than a
 * horizontal scroll since no such pattern exists elsewhere in the app.
 *
 * Venue cards are a local near-identical copy of ForYouCard from
 * app/index.tsx rather than an import — ForYouCard isn't exported from
 * index.tsx, and this build is scoped to not touch index.tsx. The heart/
 * save button and its local state are intentionally omitted (out of scope
 * for this pass).
 */

import { LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from './_bottom-nav';
import { getCatIcon } from './_category-icons';
import { getActiveOuting } from './_outing-store';
import { C } from '../data/colors';
import { F } from '../data/fonts';
import { VENUES, type Venue } from '../data/venues';

const CATEGORIES = [
  'All',
  'EAT & DRINK',
  'COFFEE & CAFÉS',
  'OUTDOORS',
  'ARTS & CULTURE',
  'EXPERIENCES',
  'NIGHTLIFE',
  'MARKETS',
] as const;

// ─────────────────────────────────────────
//  VENUE CARD  (near-identical copy of ForYouCard, no heart/save)
// ─────────────────────────────────────────

function VenueCard({ item }: { item: Venue }) {
  const router = useRouter();
  const CatIcon = getCatIcon(item.category);
  return (
    <Pressable
      style={styles.vCard}
      onPress={() => router.push({
        pathname: '/place-detail',
        params: {
          id: item.id,
          name: item.name,
          category: item.category,
          description: item.description,
          neighborhood: item.neighborhood,
          priceTier: item.priceTier,
          hours: item.hours,
          color: item.color,
        },
      })}
    >
      {/* Photo area */}
      <View style={styles.vPhoto}>
        <View style={styles.vPhotoPlaceholder}>
          <CatIcon size={40} color={item.color} />
        </View>
        {/* Category pill */}
        <View style={[styles.vCatPill, { backgroundColor: item.color }]}>
          <Text style={styles.vCatText} numberOfLines={1}>{item.category}</Text>
        </View>
        <View style={styles.vScrim} />
      </View>
      {/* Info strip */}
      <View style={styles.vInfo}>
        <View style={styles.vNameWrap}>
          <Text style={styles.vName} numberOfLines={2}>{item.name}</Text>
        </View>
        <View style={styles.vDivider} />
        <View style={styles.vMeta}>
          <View style={styles.vMetaLeft}>
            <MapPin size={10} color={C.textSec} />
            <Text style={styles.vNeighborhood} numberOfLines={1}>{item.neighborhood}</Text>
          </View>
          <Text style={styles.vPrice}>{item.priceTier}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded, fontError] = useFonts({
    LibreBaskerville_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredVenues = useMemo(() => {
    if (selectedCategory === 'All') return VENUES;
    return VENUES.filter(v => v.category === selectedCategory);
  }, [selectedCategory]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Explore</Text>
        </View>

        {/* ── CATEGORY FILTER ── */}
        <View style={styles.filterGrid}>
          {CATEGORIES.map(cat => {
            const selected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{cat}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── VENUE GRID ── */}
        {filteredVenues.length > 0 ? (
          <View style={styles.vGrid}>
            {filteredVenues.map(item => (
              <VenueCard key={item.id} item={item} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nothing here yet. That's fixable.</Text>
          </View>
        )}
      </ScrollView>

      {/* ── BOTTOM NAV ── */}
      <BottomNav
        activeTab="Explore"
        onFabPress={() => {
          if (getActiveOuting()) {
            router.push('/');
          } else {
            router.push('/outing-questions');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 100,
  },

  // ── Header ──
  header: {
    marginBottom: 28,
  },
  title: {
    fontFamily: F.serif,
    fontSize: 32,
    color: C.textPrimary,
    lineHeight: 38,
  },

  // ── Category filter ──
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
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

  // ── Venue grid (2-column, matches index.tsx's expanded For You grid) ──
  vGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  vCard: {
    width: 160,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  vPhoto: {
    height: 148,
    backgroundColor: C.bg,
  },
  vPhotoPlaceholder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.25,
  },
  vScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  vCatPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 20,
    height: 24,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  vCatText: {
    fontFamily: F.semi,
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  vInfo: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    height: 89,
  },
  vNameWrap: {
    height: 40,
    marginBottom: 6,
  },
  vName: {
    fontFamily: F.serif,
    fontSize: 13,
    color: C.textPrimary,
    lineHeight: 18,
  },
  vDivider: {
    height: 1,
    backgroundColor: '#E3DACD',
    marginBottom: 6,
  },
  vMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  vNeighborhood: {
    fontFamily: F.reg,
    fontSize: 11,
    color: C.textSec,
    flexShrink: 1,
  },
  vPrice: {
    fontFamily: F.med,
    fontSize: 11,
    color: C.textSec,
    flexShrink: 0,
    paddingLeft: 6,
  },

  // ── Empty state ──
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: F.reg,
    fontSize: 14,
    color: C.textSec,
  },
});
