/**
 * FORAGE — FriendsScreen
 * app/friends.tsx
 *
 * Friends tab landing screen. Header pattern matches app/profile.tsx
 * (stacked serif title, no back button). Row/card styling matches
 * ProfileRow in app/profile.tsx. All data below is hardcoded/fake — no
 * store, no backend. Requests and friends have no avatar art, so a small
 * local helper deterministically maps a name to one of the app's existing
 * category color tokens for a colored initial circle.
 */

import { LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { ChevronRight, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from './_bottom-nav';
import DuoPlanInfoSheet from './_duo-plan-info-sheet';
import { C } from '../data/colors';
import { F } from '../data/fonts';
import { getActiveOuting } from './_outing-store';

// ─────────────────────────────────────────
//  FAKE DATA
// ─────────────────────────────────────────

interface FriendRequest {
  id: string;
  name: string;
}

interface Friend {
  id: string;
  name: string;
  subtext: string;
}

const INITIAL_REQUESTS: FriendRequest[] = [
  { id: 'r1', name: 'Priya Nair' },
  { id: 'r2', name: 'Marcus Webb' },
];

const FRIENDS: Friend[] = [
  { id: 'f1', name: 'Dana Ilić',      subtext: '3 outings together' },
  { id: 'f2', name: 'Theo Park',      subtext: '1 outing together' },
  { id: 'f3', name: 'Grace Odei',     subtext: '7 outings together' },
  { id: 'f4', name: 'Sam Whitfield',  subtext: 'No outings yet' },
  { id: 'f5', name: 'Lena Castillo',  subtext: '2 outings together' },
];

// ─────────────────────────────────────────
//  AVATAR
// ─────────────────────────────────────────

// Reuses the app's 7 existing category color tokens rather than inventing
// new ones, so fake-friend avatars stay in the same palette family.
const AVATAR_COLORS = [
  C.eat, C.coffee, C.outdoors, C.arts, C.experiences, C.nightlife, C.markets,
];

function getAvatarColor(name: string): string {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function Avatar({ name }: { name: string }) {
  const color = getAvatarColor(name);
  const initial = name.charAt(0).toUpperCase();
  return (
    <View style={[styles.avatarCircle, { backgroundColor: color }]}>
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );
}

// ─────────────────────────────────────────
//  REQUEST ROW
// ─────────────────────────────────────────

function RequestRow({
  name,
  onAccept,
  onDecline,
}: {
  name: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <View style={[styles.card, styles.requestRow]}>
      <View style={styles.requestLeft}>
        <Avatar name={name} />
        <Text style={styles.personName} numberOfLines={1}>{name}</Text>
      </View>
      <View style={styles.requestActions}>
        <Pressable style={styles.acceptBtn} onPress={onAccept}>
          <Text style={styles.acceptText}>Accept</Text>
        </Pressable>
        <Pressable style={styles.declineBtn} onPress={onDecline}>
          <Text style={styles.declineText}>Decline</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────
//  FRIEND ROW
// ─────────────────────────────────────────

function FriendRow({ name, subtext }: { name: string; subtext: string }) {
  return (
    <View style={[styles.card, styles.friendRow]}>
      <Avatar name={name} />
      <View style={styles.friendText}>
        <Text style={styles.personName} numberOfLines={1}>{name}</Text>
        <Text style={styles.friendSubtext}>{subtext}</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────
//  SCREEN
// ─────────────────────────────────────────

export default function FriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded, fontError] = useFonts({
    LibreBaskerville_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  // Tapping Accept/Decline just removes the request from this local list —
  // no store write, nothing persists. Purely cosmetic realism.
  const [requests, setRequests] = useState<FriendRequest[]>(INITIAL_REQUESTS);
  const [duoSheetVisible, setDuoSheetVisible] = useState(false);

  if (!fontsLoaded && !fontError) return null;

  function handleRespond(id: string) {
    setRequests(prev => prev.filter(r => r.id !== id));
  }

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
          <Text style={styles.title}>Friends</Text>
        </View>

        {/* ── REQUESTS ── */}
        {requests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>REQUESTS</Text>
            <View style={styles.rowList}>
              {requests.map(r => (
                <RequestRow
                  key={r.id}
                  name={r.name}
                  onAccept={() => handleRespond(r.id)}
                  onDecline={() => handleRespond(r.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── FRIENDS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FRIENDS</Text>
          <View style={styles.rowList}>
            {FRIENDS.map(f => (
              <FriendRow key={f.id} name={f.name} subtext={f.subtext} />
            ))}
          </View>
        </View>

        {/* ── ADD FRIEND ── */}
        <Pressable style={styles.addFriendBtn} onPress={() => {}}>
          <Text style={styles.addFriendText}>Add Friend</Text>
        </Pressable>

        {/* ── DUO PLANS ── */}
        <Pressable
          style={[styles.card, styles.duoRow]}
          onPress={() => setDuoSheetVisible(true)}
        >
          <View style={styles.iconCircle}>
            <Users size={18} color={C.amber} />
          </View>
          <Text style={styles.duoLabel}>Duo Plans</Text>
          <ChevronRight size={16} color={C.textTert} />
        </Pressable>
      </ScrollView>

      {/* ── BOTTOM NAV ── */}
      <BottomNav
        activeTab="Friends"
        onFabPress={() => {
          if (getActiveOuting()) {
            router.push('/');
          } else {
            router.push('/outing-questions');
          }
        }}
      />

      <DuoPlanInfoSheet
        visible={duoSheetVisible}
        onDismiss={() => setDuoSheetVisible(false)}
      />
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

  // ── Sections ──
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: F.semi,
    fontSize: 12,
    color: C.textSec,
    letterSpacing: 1,
    marginBottom: 12,
  },
  rowList: {
    gap: 12,
  },

  // ── Shared card ──
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

  // ── Avatar ──
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitial: {
    fontFamily: F.semi,
    fontSize: 16,
    color: '#FFFFFF',
  },
  personName: {
    fontFamily: F.semi,
    fontSize: 15,
    color: C.textPrimary,
  },

  // ── Request row ──
  requestRow: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  acceptBtn: {
    backgroundColor: C.amber,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  acceptText: {
    fontFamily: F.semi,
    fontSize: 12,
    color: '#FFFFFF',
  },
  declineBtn: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  declineText: {
    fontFamily: F.med,
    fontSize: 12,
    color: C.textSec,
  },

  // ── Friend row ──
  friendRow: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  friendText: {
    flex: 1,
    minWidth: 0,
  },
  friendSubtext: {
    fontFamily: F.reg,
    fontSize: 12,
    color: C.textTert,
    marginTop: 2,
  },

  // ── Add Friend button (matches Preferences Save button) ──
  addFriendBtn: {
    marginTop: 4,
    marginBottom: 24,
    backgroundColor: C.amber,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFriendText: {
    fontFamily: F.semi,
    fontSize: 15,
    color: '#FFFFFF',
  },

  // ── Duo Plans row (matches ProfileRow) ──
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.amberTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  duoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  duoLabel: {
    flex: 1,
    fontFamily: F.semi,
    fontSize: 15,
    color: C.textPrimary,
  },
});
