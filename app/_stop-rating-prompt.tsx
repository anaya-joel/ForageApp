/**
 * FORAGE — StopRatingPrompt
 * app/_stop-rating-prompt.tsx
 *
 * Lightweight, non-blocking rating prompt shown after "Complete Stop" on
 * any non-final stop. Presentation + callbacks only — no persistence here;
 * the outing store owns the actual state.
 */

import { Heart, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getCatIcon, getCategoryColor } from './_category-icons';
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
  const catColor = getCategoryColor(category);

  function handleRate(stars: number) {
    setRating(stars);
    onRate(stars);
  }

  function handleToggleSave() {
    const next = !saved;
    setSaved(next);
    onSave(next);
  }

  function handleConfirm() {
    onDismiss();
  }

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={styles.backdrop} />

      <View style={styles.sheet}>
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
            <Text style={styles.placeName} numberOfLines={1}>{placeName}</Text>
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

        <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Done</Text>
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
  confirmBtn: {
    alignSelf: 'stretch',
    backgroundColor: C.amber,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: F.semi,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
