/**
 * FORAGE — PlaceDetailScreen
 * app/place-detail.tsx
 *
 * Simple single-venue detail view. Receives venue fields as string params
 * (useLocalSearchParams), same pattern as app/swap-stop.tsx. Venue has no
 * photo or lat/lng yet (see DECISIONS.md), so the "photo" area reuses the
 * same 3-slide tinted-color-plus-category-icon placeholder pattern as
 * PlaceDetailModal in app/outing-preview.tsx — same visual language, but
 * this screen is a plain pushed Stack.Screen (see app/_layout.tsx), not
 * an RN <Modal> like PlaceDetailModal. A plain View-based screen works
 * fine for this: nothing here (photo swipe, overlaid buttons, pager dots)
 * depends on Modal-specific behavior, it's just absolutely-positioned
 * overlays on a photo block same as any other screen content.
 *
 * The heart/save button here is local useState only, screen-scoped, reset
 * on every navigation — same honesty level as ForYouCard's save toggle in
 * app/index.tsx, not the shared savedPlaceIds store PlaceDetailModal uses.
 */

import { LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Heart, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../data/colors';
import { F } from '../data/fonts';
import { getCatIcon } from './_category-icons';

const PHOTO_COUNT = 3;

export default function PlaceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [fontsLoaded, fontError] = useFonts({
    LibreBaskerville_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  const { name, category, description, neighborhood, priceTier, hours, color } =
    useLocalSearchParams<{
      id: string;
      name: string;
      category: string;
      description: string;
      neighborhood: string;
      priceTier: string;
      hours: string;
      color: string;
    }>();

  const [photoIdx, setPhotoIdx] = useState(0);
  const [saved, setSaved] = useState(false);

  if (!fontsLoaded && !fontError) return null;

  const CatIcon = getCatIcon(category);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Swipeable photo area */}
      <View style={styles.photoWrap}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / width));
          }}
          style={{ height: 280 }}
        >
          {Array.from({ length: PHOTO_COUNT }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.photoSlide,
                {
                  width,
                  backgroundColor: color + (i === 0 ? '33' : i === 1 ? '22' : '18'),
                },
              ]}
            >
              <View style={styles.photoIcon}>
                <CatIcon size={80} color={color} />
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Category pill — bottom left of photo */}
        <View style={[styles.catPill, { backgroundColor: color }]}>
          <Text style={styles.catText}>{category}</Text>
        </View>

        {/* Back — top left */}
        <Pressable
          style={[styles.backBtn, { top: insets.top + 12 }]}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={18} color="#FFFFFF" />
        </Pressable>

        {/* Heart / save — top right, 30px circle, 44×44pt hitSlop */}
        <Pressable
          style={[styles.heartBtn, { top: insets.top + 12 }]}
          onPress={() => setSaved(s => !s)}
          hitSlop={{ top: 7, bottom: 7, left: 7, right: 7 }}
        >
          <Heart
            size={13}
            color={saved ? C.eat : C.textTert}
            fill={saved ? C.eat : 'none'}
          />
        </Pressable>

        {/* Pager dots */}
        <View style={styles.pagerDots}>
          {Array.from({ length: PHOTO_COUNT }).map((_, i) => (
            <View
              key={i}
              style={[styles.pagerDot, i === photoIdx && styles.pagerDotActive]}
            />
          ))}
        </View>
      </View>

      {/* Info */}
      <ScrollView
        style={styles.infoScroll}
        contentContainerStyle={[styles.info, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.name}>{name}</Text>
        <View style={styles.metaRow}>
          <MapPin size={12} color={C.textTert} />
          <Text style={styles.neighborhood}>{neighborhood}</Text>
          <Text style={styles.sep}>·</Text>
          <Text style={styles.price}>{priceTier}</Text>
        </View>
        <Text style={styles.description}>{description}</Text>

        {/* Hours */}
        <View style={styles.hoursBlock}>
          <Text style={styles.hoursLabel}>HOURS</Text>
          <Text style={styles.hoursText}>{hours}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ── Photo block (matches PlaceDetailModal in outing-preview.tsx) ──
  photoWrap: {
    height: 280,
    position: 'relative',
    overflow: 'hidden',
  },
  photoSlide: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: {
    opacity: 0.25,
  },
  catPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  catText: {
    fontFamily: F.semi,
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtn: {
    position: 'absolute',
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagerDots: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  pagerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  pagerDotActive: {
    width: 16,
    backgroundColor: '#FFFFFF',
  },

  // ── Info (matches detailName/detailMetaRow/detailDescription exactly) ──
  infoScroll: {
    flex: 1,
  },
  info: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  name: {
    fontFamily: F.serif,
    fontSize: 24,
    color: C.textPrimary,
    lineHeight: 30,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  neighborhood: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textSec,
  },
  sep: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textTert,
  },
  price: {
    fontFamily: F.med,
    fontSize: 13,
    color: C.textSec,
  },
  description: {
    fontFamily: F.reg,
    fontSize: 15,
    color: C.textSec,
    lineHeight: 23,
    marginBottom: 24,
  },

  // ── Hours (kept from prior version, placement adjusted) ──
  hoursBlock: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
  hoursLabel: {
    fontFamily: F.semi,
    fontSize: 10,
    color: C.textSec,
    letterSpacing: 1,
    marginBottom: 6,
  },
  hoursText: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textPrimary,
  },
});
