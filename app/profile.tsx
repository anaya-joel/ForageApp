/**
 * FORAGE — ProfileScreen
 * app/profile.tsx
 *
 * Profile tab landing screen. Row visual language (icon circle + label +
 * chevron) matches the place rows in app/outing-preview.tsx; card styling
 * matches DraftRow in app/drafts.tsx.
 */

import { LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { ChevronRight, Clock, History, SlidersHorizontal } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from './_bottom-nav';
import { C } from '../data/colors';
import { F } from '../data/fonts';
import { getActiveOuting } from './_outing-store';
import { getUserEmail, getUserName } from './_user-profile-store';

// ─────────────────────────────────────────
//  PROFILE ROW
// ─────────────────────────────────────────

function ProfileRow({
  Icon,
  label,
  onPress,
}: {
  Icon: typeof Clock;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.card, styles.row]} onPress={onPress}>
      <View style={styles.iconCircle}>
        <Icon size={18} color={C.amber} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <ChevronRight size={16} color={C.textTert} />
    </Pressable>
  );
}

// ─────────────────────────────────────────
//  SCREEN
// ─────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded, fontError] = useFonts({
    LibreBaskerville_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

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
          <Text style={styles.name}>{getUserName()}</Text>
          <Text style={styles.email}>{getUserEmail()}</Text>
        </View>

        {/* ── ROWS ── */}
        <View style={styles.rowList}>
          <ProfileRow Icon={Clock} label="Drafts" onPress={() => router.push('/drafts')} />
          <ProfileRow Icon={History} label="Outing History" onPress={() => router.push('/outing-history')} />
          <ProfileRow Icon={SlidersHorizontal} label="Preferences" onPress={() => router.push('/preferences')} />
        </View>
      </ScrollView>

      {/* ── BOTTOM NAV ── */}
      <BottomNav
        activeTab="Profile"
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
  name: {
    fontFamily: F.serif,
    fontSize: 32,
    color: C.textPrimary,
    lineHeight: 38,
  },
  email: {
    fontFamily: F.reg,
    fontSize: 14,
    color: C.textSec,
    marginTop: 4,
  },

  // ── Rows ──
  rowList: {
    gap: 12,
  },
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
  rowLabel: {
    flex: 1,
    fontFamily: F.semi,
    fontSize: 15,
    color: C.textPrimary,
  },
});
