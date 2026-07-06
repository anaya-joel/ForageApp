/**
 * FORAGE — SwapStopScreen
 * app/swap-stop.tsx
 *
 * Full-screen candidate list for swapping one stop in an outing plan.
 * Pushed from OutingPreviewScreen (Edit mode) when the user taps "Swap"
 * on a stop. On "Choose", writes the selection to the swap store and
 * navigates back — OutingPreviewScreen picks it up via useFocusEffect.
 *
 * Params (via useLocalSearchParams):
 *   stopId     — ID of the stop being replaced
 *   stopName   — name of the stop, used in header
 *   category   — category string, used to filter candidates
 *   travelHint — travel time string from the adjacent stop, shown per row
 */

import { LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VENUES, type Venue } from '../data/venues';
import { getCatIcon } from './_category-icons';
import { setPendingSwap } from './_swap-store';

// ─────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────

const C = {
  bg:          '#F3EDE4',
  card:        '#FFFFFF',
  amber:       '#B86820',
  amberTint:   '#FEF4E8',
  amberBorder: '#DDB878',
  textPrimary: '#2A2420',
  textSec:     '#6B6460',
  textTert:    '#9A8E88',
  border:      '#EDE8E2',
  divider:     '#F5F0EA',
};

const F = {
  serif: 'LibreBaskerville_700Bold',
  reg:   'PlusJakartaSans_400Regular',
  med:   'PlusJakartaSans_500Medium',
  semi:  'PlusJakartaSans_600SemiBold',
};

// ─────────────────────────────────────────
//  CANDIDATE ROW
// ─────────────────────────────────────────

function CandidateRow({
  place,
  travelHint,
  onChoose,
}: {
  place: Venue;
  travelHint: string;
  onChoose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = getCatIcon(place.category);

  return (
    <View style={styles.rowContainer}>
      {/* Main info row */}
      <View style={styles.rowMain}>
        {/* Thumbnail */}
        <View style={[styles.thumb, { backgroundColor: place.color + '22' }]}>
          <View style={styles.thumbIcon}>
            <Icon size={28} color={place.color} />
          </View>
        </View>

        {/* Text block */}
        <View style={styles.rowTextBlock}>
          <Text style={styles.placeName}>{place.name}</Text>
          <Text style={styles.placeCategory}>{place.category}</Text>
          <Text style={styles.placeMeta}>
            {place.neighborhood}
            {'  ·  '}
            <Text style={styles.priceTier}>{place.priceTier}</Text>
          </Text>
          <Text style={styles.travelTime}>{travelHint}</Text>
        </View>
      </View>

      {/* Expanded description */}
      {expanded && (
        <Text style={styles.placeDescription}>{place.description}</Text>
      )}

      {/* Row actions */}
      <View style={styles.rowActions}>
        <Pressable
          style={styles.detailsLink}
          onPress={() => setExpanded((e) => !e)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.detailsLinkText}>
            {expanded ? 'Less' : 'Details'}
          </Text>
          <ChevronRight
            size={11}
            color={C.textSec}
            style={expanded ? styles.chevronUp : undefined}
          />
        </Pressable>

        <Pressable style={styles.chooseBtn} onPress={onChoose}>
          <Text style={styles.chooseBtnText}>Choose</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────

export default function SwapStopScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded, fontError] = useFonts({
    LibreBaskerville_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  const { stopId, stopName, category, travelHint } = useLocalSearchParams<{
    stopId: string;
    stopName: string;
    category: string;
    travelHint: string;
  }>();

  if (!fontsLoaded && !fontError) return null;

  const candidates = VENUES.filter(
    (p) => p.category === category
  );

  function handleChoose(place: Venue) {
    setPendingSwap({
      stopId,
      place: {
        id:           place.id,
        name:         place.name,
        category:     place.category,
        color:        place.color,
        description:  place.description,
        neighborhood: place.neighborhood,
        priceTier:    place.priceTier,
      },
    });
    router.back();
  }

  return (
    <View style={[styles.screen, { backgroundColor: C.bg }]}>
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            Swap {stopName}
          </Text>
          <Text style={styles.headerSubtitle}>Choose from curated places</Text>
        </View>
      </View>

      {/* ── CANDIDATE LIST ── */}
      {candidates.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No other options in this category yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={candidates}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <CandidateRow
              place={item}
              travelHint={travelHint}
              onChoose={() => handleChoose(item)}
            />
          )}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

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
  headerSubtitle: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textSec,
    marginTop: 4,
  },

  // ── List ──
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  separator: {
    height: 1,
    backgroundColor: C.divider,
    marginHorizontal: 14,
  },

  // ── Candidate row ──
  rowContainer: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    padding: 14,
    marginBottom: 10,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  // Thumbnail
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  thumbIcon: {
    opacity: 0.6,
  },

  // Text block
  rowTextBlock: {
    flex: 1,
    gap: 2,
  },
  placeName: {
    fontFamily: F.semi,
    fontSize: 15,
    color: C.textPrimary,
    lineHeight: 20,
  },
  placeCategory: {
    fontFamily: F.reg,
    fontSize: 11,
    color: C.textTert,
  },
  placeMeta: {
    fontFamily: F.reg,
    fontSize: 11,
    color: C.textSec,
    marginTop: 1,
  },
  priceTier: {
    fontFamily: F.med,
    fontSize: 11,
    color: C.textSec,
  },
  travelTime: {
    fontFamily: F.reg,
    fontSize: 11,
    color: C.textSec,
    marginTop: 2,
  },

  // Expanded description
  placeDescription: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textSec,
    lineHeight: 18,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },

  // Row actions
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detailsLinkText: {
    fontFamily: F.semi,
    fontSize: 12,
    color: C.textSec,
  },
  chevronUp: {
    transform: [{ rotate: '90deg' }],
  },
  chooseBtn: {
    backgroundColor: C.amberTint,
    borderWidth: 1,
    borderColor: C.amberBorder,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  chooseBtnText: {
    fontFamily: F.semi,
    fontSize: 12,
    color: C.amber,
  },

  // ── Empty state ──
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontFamily: F.med,
    fontSize: 14,
    color: C.textSec,
    textAlign: 'center',
  },
});
