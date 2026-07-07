/**
 * FORAGE — StopRatingPrompt
 * app/_stop-rating-prompt.tsx
 *
 * Lightweight, non-blocking rating prompt shown after "Complete Stop" on
 * any non-final stop. Presentation + callbacks only — no persistence here;
 * the outing store owns the actual state.
 */

import { Heart, Star, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getCatIcon } from './_category-icons';

// ─────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────

const C = {
  card:        '#FFFFFF',
  amber:       '#B86820',
  amberTint:   '#FEF4E8',
  textPrimary: '#2A2420',
  textSec:     '#6B6460',
  textTert:    '#9A8E88',
  border:      '#EDE8E2',
  eat:         '#B84E38',
};

const F = {
  reg:  'PlusJakartaSans_400Regular',
  med:  'PlusJakartaSans_500Medium',
  semi: 'PlusJakartaSans_600SemiBold',
};

// ─────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────

export interface StopRatingPromptProps {
  stopId: string;
  placeName: string;
  category: string;
  onRate: (stars: number) => void;
  onSave: (saved: boolean) => void;
  onDismiss: () => void;
}

// ─────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────

export default function StopRatingPrompt({
  placeName,
  category,
  onRate,
  onSave,
  onDismiss,
}: StopRatingPromptProps) {
  const [rating, setRating] = useState(0);
  const [saved, setSaved]   = useState(false);
  const CatIcon = getCatIcon(category);

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
    <View style={styles.root} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onDismiss} />

      <View style={styles.sheet}>
        <Pressable
          style={styles.closeBtn}
          onPress={onDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={16} color={C.textTert} />
        </Pressable>

        <View style={styles.header}>
          <View style={styles.catIconWrap}>
            <CatIcon size={18} color={C.amber} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.prompt}>How was it?</Text>
            <Text style={styles.placeName} numberOfLines={1}>{placeName}</Text>
          </View>
          <Pressable
            style={styles.heartBtn}
            onPress={handleToggleSave}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Heart size={16} color={saved ? C.eat : C.textTert} fill={saved ? C.eat : 'none'} />
          </Pressable>
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
                color={n <= rating ? C.amber : C.border}
                fill={n <= rating ? C.amber : C.border}
              />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.skipBtn}
          onPress={onDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginHorizontal: 14,
    marginBottom: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingRight: 26,
  },
  catIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.amberTint,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  skipBtn: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  skipText: {
    fontFamily: F.reg,
    fontSize: 12,
    color: C.textTert,
  },
});
