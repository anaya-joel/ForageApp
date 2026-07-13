/**
 * FORAGE — OutingHistoryScreen
 * app/outing-history.tsx
 *
 * List of finished outings. Row visual language (clock icon, stacked stop
 * circles, date/stop-count formatting) matches DraftRow in app/drafts.tsx.
 */

import { LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { ChevronLeft, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from './_bottom-nav';
import { C } from '../data/colors';
import { getHistoryEntries, type HistoryEntry } from './_outing-history-store';

// ─────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────

const F = {
  serif: 'LibreBaskerville_700Bold',
  reg:   'PlusJakartaSans_400Regular',
  med:   'PlusJakartaSans_500Medium',
  semi:  'PlusJakartaSans_600SemiBold',
};

// ─────────────────────────────────────────
//  HISTORY ROW
// ─────────────────────────────────────────

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const stopCount  = entry.stops.length;
  const stopColors = entry.stops.map(s => s.color).slice(0, 3);
  const extraStops = Math.max(0, entry.stops.length - 3);
  const dateLabel  = entry.startTime
    ? new Date(entry.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : '';
  const metaLabel  = dateLabel ? `${dateLabel}  ·  ${stopCount} stops` : `${stopCount} stops`;

  return (
    <View style={[styles.card, styles.row]}>
      <View style={styles.rowLeft}>
        <View style={styles.clockCircle}>
          <Clock size={18} color={C.amber} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>OUTING</Text>
          <Text style={styles.rowName} numberOfLines={1}>{entry.name}</Text>
          <Text style={styles.rowMeta}>{metaLabel}</Text>
        </View>
      </View>

      <View style={styles.stopCircles}>
        {stopColors.map((color, i) => (
          <View
            key={i}
            style={[
              styles.stopCircle,
              { backgroundColor: color, marginLeft: i === 0 ? 0 : -8, zIndex: stopColors.length - i },
            ]}
          />
        ))}
        {extraStops > 0 && (
          <View style={[styles.stopCircle, styles.stopExtra, { marginLeft: -8 }]}>
            <Text style={styles.stopExtraText}>+{extraStops}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────
//  SCREEN
// ─────────────────────────────────────────

export default function OutingHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded, fontError] = useFonts({
    LibreBaskerville_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  const entries = getHistoryEntries();

  if (!fontsLoaded && !fontError) return null;

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
          <Text style={styles.headerTitle}>Outing History</Text>
        </View>
      </View>

      {/* ── LIST / EMPTY STATE ── */}
      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyLine}>Nothing here yet. That's fixable.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {entries.map(entry => (
            <HistoryRow key={entry.id} entry={entry} />
          ))}
        </ScrollView>
      )}

      {/* ── BOTTOM NAV ── */}
      <BottomNav activeTab="Profile" />
    </View>
  );
}

// ─────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────

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
    paddingTop: 16,
    gap: 12,
  },

  // ── Empty state ──
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyLine: {
    fontFamily: F.med,
    fontSize: 15,
    color: C.textSec,
    textAlign: 'center',
  },

  // ── History row (matches DraftRow in app/drafts.tsx) ──
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 90,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  clockCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.amberTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontFamily: F.semi,
    fontSize: 9,
    color: C.amber,
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  rowName: {
    fontFamily: F.serif,
    fontSize: 17,
    color: C.textPrimary,
    marginBottom: 3,
  },
  rowMeta: {
    fontFamily: F.reg,
    fontSize: 11,
    color: C.textSec,
  },
  stopCircles: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  stopCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: C.card,
  },
  stopExtra: {
    backgroundColor: '#F0EBE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopExtraText: {
    fontFamily: F.reg,
    fontSize: 12,
    color: C.textSec,
  },
});
