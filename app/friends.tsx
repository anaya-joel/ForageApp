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
import { UserPlus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddFriendInfoSheet from './_add-friend-info-sheet';
import BottomNav from './_bottom-nav';
import DuoPlanInfoSheet from './_duo-plan-info-sheet';
import { C } from '../data/colors';
import { F } from '../data/fonts';
import { getActiveOuting } from './_outing-store';

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

const INITIAL_FRIENDS: Friend[] = [
  { id: 'f1', name: 'Dana Ilić',      subtext: '3 outings together' },
  { id: 'f2', name: 'Theo Park',      subtext: '1 outing together' },
  { id: 'f3', name: 'Grace Odei',     subtext: '7 outings together' },
  { id: 'f4', name: 'Sam Whitfield',  subtext: 'No outings yet' },
  { id: 'f5', name: 'Lena Castillo',  subtext: '2 outings together' },
];

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

export default function FriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded, fontError] = useFonts({
    LibreBaskerville_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  // Accept moves a request into the friends list; Decline just drops it.
  // Both only mutate local state — no store write, nothing persists
  // across an app restart.
  const [requests, setRequests] = useState<FriendRequest[]>(INITIAL_REQUESTS);
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [duoSheetVisible, setDuoSheetVisible] = useState(false);
  const [addFriendSheetVisible, setAddFriendSheetVisible] = useState(false);

  if (!fontsLoaded && !fontError) return null;

  function handleAccept(id: string) {
    const request = requests.find(r => r.id === id);
    if (!request) return;
    setRequests(prev => prev.filter(r => r.id !== id));
    setFriends(prev => [...prev, { id: request.id, name: request.name, subtext: 'No outings yet' }]);
  }

  function handleDecline(id: string) {
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
          <Pressable
            style={styles.addFriendCorner}
            onPress={() => setAddFriendSheetVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <UserPlus size={18} color={C.amber} />
          </Pressable>
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
                  onAccept={() => handleAccept(r.id)}
                  onDecline={() => handleDecline(r.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── FRIENDS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FRIENDS</Text>
          <View style={styles.rowList}>
            {friends.map(f => (
              <FriendRow key={f.id} name={f.name} subtext={f.subtext} />
            ))}
          </View>
        </View>

        {/* ── DUO PLANS ── */}
        <Pressable style={styles.card} onPress={() => setDuoSheetVisible(true)}>
          <View style={styles.duoCardRow}>
            <View style={styles.iconCircle}>
              <Users size={18} color={C.amber} />
            </View>
            <View style={styles.duoTextBlock}>
              <Text style={styles.duoTitle}>Duo Planning</Text>
              <Text style={styles.duoDescription}>Plan an outing together with a friend.</Text>
            </View>
            <Pressable style={styles.duoButton} onPress={() => setDuoSheetVisible(true)}>
              <Text style={styles.duoButtonText}>Plan Together</Text>
            </Pressable>
          </View>
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

      <AddFriendInfoSheet
        visible={addFriendSheetVisible}
        onDismiss={() => setAddFriendSheetVisible(false)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: F.serif,
    fontSize: 32,
    color: C.textPrimary,
    lineHeight: 38,
  },
  addFriendCorner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.amberTint,
    alignItems: 'center',
    justifyContent: 'center',
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

  // ── Duo Plans card ──
  duoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.amberTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  duoTextBlock: {
    flex: 1,
  },
  duoTitle: {
    fontFamily: F.serif,
    fontSize: 15,
    color: C.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  duoDescription: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textSec,
  },
  duoButton: {
    alignSelf: 'center',
    backgroundColor: C.amber,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  duoButtonText: {
    fontFamily: F.semi,
    fontSize: 12,
    color: '#FFFFFF',
  },
});
