/**
 * FORAGE — StopRatingSheet
 * app/_stop-rating-sheet.tsx
 *
 * Compact bottom-sheet variant of StopRatingPrompt (_stop-rating-prompt.tsx),
 * for use on the Home screen's Active Outing card. Same visual language
 * (star control, heart/save control, colors, fonts) as the full-screen
 * prompt, but slides up as a partial-height sheet instead of covering the
 * screen. Presentation + callbacks only — no persistence here.
 */

import { Heart, Star } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCatIcon, getCategoryColor } from './_category-icons';
import type { Stop } from './_outing-store';
import { F } from '../data/fonts';

// ─────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────

const C = {
  card:        '#FFFFFF',
  amber:       '#B86820',
  textPrimary: '#2A2420',
  textSec:     '#6B6460',
  textTert:    '#9A8E88',
  border:      '#EDE8E2',
  eat:         '#B84E38',
};

// Fallback offscreen distance used before the sheet's real height has been
// measured via onLayout, so the very first slide-in still has somewhere to
// animate from.
const OFFSCREEN_FALLBACK = 320;
const MOTION_DURATION = 300;

// ─────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────

export interface StopRatingSheetProps {
  stop: Stop;
  visible: boolean;
  onRate: (stars: number) => void;
  onSave: (saved: boolean) => void;
  onDismiss: () => void;
}

// ─────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────

export default function StopRatingSheet({
  stop,
  visible,
  onRate,
  onSave,
  onDismiss,
}: StopRatingSheetProps) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [saved, setSaved]   = useState(false);
  const CatIcon  = getCatIcon(stop.category);
  const catColor = getCategoryColor(stop.category);

  // This component stays mounted across stops (only `visible` toggles), so
  // reset on stop change rather than relying on unmount.
  useEffect(() => {
    setRating(0);
    setSaved(false);
  }, [stop.stopInstanceId]);

  // Kept mounted through the exit animation — flips back to false only
  // once the slide-down finishes, matching the app's 300ms ease-out.
  const [rendered, setRendered] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);

  const translateY = useRef(new Animated.Value(visible ? 0 : OFFSCREEN_FALLBACK)).current;
  const backdropOpacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) setRendered(true);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: visible ? 0 : (sheetHeight || OFFSCREEN_FALLBACK),
        duration: MOTION_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: MOTION_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && !visible) setRendered(false);
    });
  }, [visible, sheetHeight]);

  if (!rendered) return null;

  function handleRate(stars: number) {
    setRating(stars);
    onRate(stars);
  }

  function handleToggleSave() {
    const next = !saved;
    setSaved(next);
    onSave(next);
  }

  return (
    <Modal visible={rendered} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16, transform: [{ translateY }] },
          ]}
          onLayout={e => setSheetHeight(e.nativeEvent.layout.height)}
        >
          <View style={styles.handle} />

          <Pressable
            style={styles.heartBtn}
            onPress={handleToggleSave}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Heart size={16} color={saved ? C.eat : C.textTert} fill={saved ? C.eat : 'none'} />
          </Pressable>

          <View style={styles.header}>
            <View style={[styles.catIconWrap, { backgroundColor: catColor }]}>
              <CatIcon size={18} color="#FFFFFF" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.prompt}>How was it?</Text>
              <Text style={styles.placeName} numberOfLines={1}>{stop.name}</Text>
            </View>
          </View>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(n => (
              <Pressable
                key={n}
                onPress={() => handleRate(n)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Star
                  size={28}
                  color={n <= rating ? C.amber : C.textTert}
                  fill={n <= rating ? C.amber : C.textTert}
                />
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.dismissBtn} onPress={onDismiss}>
            <Text style={styles.dismissText}>Done</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingRight: 34,
  },
  catIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  prompt: {
    fontFamily: F.semi,
    fontSize: 10,
    color: C.textTert,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  placeName: {
    fontFamily: F.med,
    fontSize: 15,
    color: C.textPrimary,
  },
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 1,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  dismissBtn: {
    alignSelf: 'stretch',
    backgroundColor: C.amber,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissText: {
    fontFamily: F.semi,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
