/**
 * FORAGE — DraftsScreen
 * app/drafts.tsx
 *
 * Full list of saved outing drafts. Row visual language (stop circles,
 * date/stop-count formatting, card styling) matches OutingDraftCard in
 * app/index.tsx — this screen is just that card's list form, plus delete.
 */

import { LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Clock, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../data/colors';
import { F } from '../data/fonts';
import {
  deleteDraft,
  getDrafts,
  saveDraftFromCurrent,
  type OutingPlan,
} from './_outing-store';

// ─────────────────────────────────────────
//  DRAFT ROW
// ─────────────────────────────────────────

function DraftRow({
  draft,
  onPress,
  onDelete,
}: {
  draft: OutingPlan;
  onPress: () => void;
  onDelete: () => void;
}) {
  const stopCount  = draft.stops.length;
  const stopColors = draft.stops.map(s => s.color).slice(0, 3);
  const extraStops = Math.max(0, draft.stops.length - 3);
  const dateLabel  = draft.lastEdited
    ? new Date(draft.lastEdited).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : '';

  return (
    <Pressable style={[styles.card, styles.draftRow]} onPress={onPress}>
      <View style={styles.draftLeft}>
        <View style={styles.clockCircle}>
          <Clock size={18} color={C.amber} />
        </View>
        <View style={styles.draftText}>
          <Text style={styles.draftLabel}>OUTING DRAFT</Text>
          <Text style={styles.draftName} numberOfLines={1}>{draft.name}</Text>
          <Text style={styles.draftMeta}>{dateLabel}  ·  {stopCount} stops</Text>
        </View>
      </View>

      <View style={styles.draftRight}>
        <View style={styles.stopCircles}>
          {stopColors.map((color, i) => (
            <View
              key={i}
              style={[
                styles.draftStopCircle,
                { backgroundColor: color, marginLeft: i === 0 ? 0 : -8, zIndex: stopColors.length - i },
              ]}
            />
          ))}
          {extraStops > 0 && (
            <View style={[styles.draftStopCircle, styles.draftStopExtra, { marginLeft: -8 }]}>
              <Text style={styles.draftExtraText}>+{extraStops}</Text>
            </View>
          )}
        </View>

        <Pressable
          style={styles.deleteBtn}
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Trash2 size={16} color={C.textTert} />
        </Pressable>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────
//  SCREEN
// ─────────────────────────────────────────

export default function DraftsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pendingSave } = useLocalSearchParams<{ pendingSave?: string }>();

  const [fontsLoaded, fontError] = useFonts({
    LibreBaskerville_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  const [drafts, setDrafts] = useState<OutingPlan[]>(() => getDrafts());

  if (!fontsLoaded && !fontError) return null;

  function handleOpenDraft(draft: OutingPlan) {
    router.push({ pathname: '/outing-preview', params: { draftId: draft.id } });
  }

  // Only reached via DraftCapModal's "View drafts" action (which passes
  // pendingSave=true) — Home's "View draft list" link and the Profile tab
  // don't pass this param, so a delete there never touches _workingPlan,
  // which may be stale or empty for those entry points.
  function handleDelete(id: string) {
    deleteDraft(id);
    setDrafts(getDrafts());

    if (pendingSave !== 'true') return;

    const result = saveDraftFromCurrent();
    if (!result.success) return; // still over cap (or nothing pending) — stay put, no retry loop

    // Pops both /drafts and the stale outing-preview instance underneath
    // it, landing wherever outing-preview was originally pushed from —
    // matching the normal (non-cap) "Save draft" success path, which is
    // just a single router.back() from outing-preview.
    if (router.canDismiss()) {
      router.dismiss(2);
    } else {
      router.back();
    }
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
          <Text style={styles.headerTitle}>Your Drafts</Text>
        </View>
      </View>

      {/* ── LIST / EMPTY STATE ── */}
      {drafts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyLine}>Nothing here yet. That's fixable.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {drafts.map(draft => (
            <DraftRow
              key={draft.id}
              draft={draft}
              onPress={() => handleOpenDraft(draft)}
              onDelete={() => handleDelete(draft.id)}
            />
          ))}
        </ScrollView>
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

  // ── Draft row (matches OutingDraftCard in app/index.tsx) ──
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
  draftRow: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 90,
  },
  draftLeft: {
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
  draftText: {
    flex: 1,
    minWidth: 0,
  },
  draftLabel: {
    fontFamily: F.semi,
    fontSize: 9,
    color: C.amber,
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  draftName: {
    fontFamily: F.serif,
    fontSize: 17,
    color: C.textPrimary,
    marginBottom: 3,
  },
  draftMeta: {
    fontFamily: F.reg,
    fontSize: 11,
    color: C.textSec,
  },
  draftRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  stopCircles: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  draftStopCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: C.card,
  },
  draftStopExtra: {
    backgroundColor: '#F0EBE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftExtraText: {
    fontFamily: F.reg,
    fontSize: 12,
    color: C.textSec,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
