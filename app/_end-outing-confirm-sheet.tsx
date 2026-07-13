/**
 * FORAGE — EndOutingConfirmSheet
 * app/_end-outing-confirm-sheet.tsx
 *
 * Compact bottom-sheet warning shown when the user taps "End outing" from
 * active-outing.tsx's bottom bar (early termination, not finishing
 * normally). Same visual/motion pattern as _active-outing-warning-sheet.tsx
 * (slide-up sheet, 300ms ease-out, backdrop fade) — but a separate file
 * since the copy and props are specific to this scenario, not the FAB
 * interruption one. Like that sheet, this is a data-loss warning: the
 * backdrop is inert and only the two explicit buttons can dismiss it.
 */

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
import { C } from '../data/colors';
import { F } from '../data/fonts';

// Fallback offscreen distance used before the sheet's real height has been
// measured via onLayout, so the very first slide-in still has somewhere to
// animate from.
const OFFSCREEN_FALLBACK = 320;
const MOTION_DURATION = 300;

// ─────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────

export interface EndOutingConfirmSheetProps {
  planName: string;
  visible: boolean;
  onKeepGoing: () => void;
  onEndOuting: () => void;
}

// ─────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────

export default function EndOutingConfirmSheet({
  planName,
  visible,
  onKeepGoing,
  onEndOuting,
}: EndOutingConfirmSheetProps) {
  const insets = useSafeAreaInsets();

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

  return (
    <Modal visible={rendered} transparent animationType="none" onRequestClose={() => {}}>
      <View style={styles.root}>
        {/* No onPress here — this is a data-loss warning, not a casual
            picker, so tapping outside the sheet must not dismiss it. */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16, transform: [{ translateY }] },
          ]}
          onLayout={e => setSheetHeight(e.nativeEvent.layout.height)}
        >
          <View style={styles.handle} />

          <Text style={styles.scoutLine}>Ending early?</Text>

          <Text style={styles.progressLine}>{planName} isn't finished yet.</Text>

          <Pressable style={styles.keepGoingBtn} onPress={onKeepGoing}>
            <Text style={styles.keepGoingText}>Keep going</Text>
          </Pressable>

          <Pressable style={styles.endBtn} onPress={onEndOuting}>
            <Text style={styles.endText}>End outing</Text>
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
  scoutLine: {
    fontFamily: F.med,
    fontSize: 16,
    color: C.textPrimary,
    lineHeight: 22,
    marginBottom: 6,
  },
  progressLine: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textSec,
    lineHeight: 18,
    marginBottom: 20,
  },
  keepGoingBtn: {
    alignSelf: 'stretch',
    backgroundColor: C.amber,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  keepGoingText: {
    fontFamily: F.semi,
    fontSize: 14,
    color: '#FFFFFF',
  },
  endBtn: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  endText: {
    fontFamily: F.med,
    fontSize: 13,
    color: C.textSec,
  },
});
