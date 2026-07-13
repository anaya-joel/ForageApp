import { Home, MapPin, Sparkles, User, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../data/colors';

const F = {
  reg:  'PlusJakartaSans_400Regular',
  semi: 'PlusJakartaSans_600SemiBold',
};

// ─────────────────────────────────────────
//  BOTTOM NAV  (visual stub — replace with
//  Expo Router tabs or React Navigation)
// ─────────────────────────────────────────

export default function BottomNav({ activeTab = 'Home', onFabPress, onProfilePress }: { activeTab?: string; onFabPress?: () => void; onProfilePress?: () => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tabs = [
    { name: 'Home',    Icon: Home },
    { name: 'Explore', Icon: MapPin },
    { name: 'Outing',  Icon: null },  // FAB
    { name: 'Friends', Icon: Users },
    { name: 'Profile', Icon: User },
  ];
  return (
    <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
      {tabs.map(tab => {
        if (tab.name === 'Outing') {
          return (
            <View key="fab" style={styles.fabWrap}>
              <Pressable style={styles.fab} onPress={onFabPress}>
                <LinearGradient
                  colors={[C.fabTop, C.fabBottom]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.fabGradient}
                >
                  <Sparkles size={24} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            </View>
          );
        }
        const isActive = activeTab === tab.name;
        const iconColor = isActive ? C.amberNav : C.textTert;
        const Icon = tab.Icon;

        if(!Icon) return null;

        return (
          <Pressable
            key={tab.name}
            style={styles.navTab}
            onPress={
              isActive ? undefined :
              tab.name === 'Home' ? () => router.push('/') :
              tab.name === 'Explore' ? () => router.push('/explore') :
              tab.name === 'Profile' ? onProfilePress :
              tab.name === 'Friends' ? () => router.push('/friends') :
              undefined
            }
          >
            <Icon size={22} color={iconColor} />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {tab.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 84,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  navLabel: {
    fontFamily: F.reg,
    fontSize: 10,
    color: C.textTert,
  },
  navLabelActive: {
    fontFamily: F.semi,
    color: C.amberNav,
  },
  fabWrap: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  fab: {
    position: 'absolute',
    top: -30,
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(180,95,20,1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.48,
    shadowRadius: 18,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
