/**
 * FORAGE — OverallRatingPrompt
 * app/_overall-rating-prompt.tsx
 *
 * Full-screen closing step shown after the final stop's "Complete Stop" or
 * a confirmed "End outing." Unlike the per-stop prompt, there is no
 * dismiss-without-saving path — presentation + callback only, no
 * persistence. The outing store owns the actual state.
 */

import { Star } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../data/colors';
import { F } from '../data/fonts';

// ─────────────────────────────────────────
//  RATING DIMENSIONS
// ─────────────────────────────────────────

interface Dimension {
  key: string;
  label: string;
  options: string[];
}

const UNIVERSAL_DIMENSIONS: Dimension[] = [
  { key: 'pacing',  label: 'Pacing',       options: ['Well-paced', 'Moderate', 'Rushed'] },
  { key: 'feel',    label: 'Overall feel', options: ['Loved it', 'It was fine', 'Not for me'] },
  { key: 'repeat',  label: 'Would repeat', options: ['Would go again', 'Maybe', "Wouldn't repeat"] },
];

const CATEGORY_DIMENSIONS: Record<string, Dimension> = {
  'NIGHTLIFE':       { key: 'energy',    label: 'Energy',    options: ['Lively', 'Chill', 'Dead'] },
  'OUTDOORS':        { key: 'setting',   label: 'Setting',   options: ['Peaceful', 'Busy', 'Crowded'] },
  'ARTS & CULTURE':  { key: 'depth',     label: 'Depth',     options: ['Thought-provoking', 'Enjoyable', 'Skimmed it'] },
  'EAT & DRINK':     { key: 'value',     label: 'Value',     options: ['Worth it', 'Fair', 'Pricier than expected'] },
  'COFFEE & CAFÉS':  { key: 'atmosphere', label: 'Atmosphere', options: ['Great', 'Fine', 'Too crowded'] },
  'EXPERIENCES':     { key: 'impact',    label: 'Impact',    options: ['Totally worth it', 'Good once', 'One and done'] },
  'MARKETS':         { key: 'selection', label: 'Selection', options: ['Great finds', 'Average', 'Slim pickings'] },
};

// Dominant category = the most frequent category among the outing's stops;
// if there's a tie, use the first stop's category.
function getDominantCategory(stops: { category: string }[]): string {
  const counts = new Map<string, number>();
  for (const stop of stops) {
    counts.set(stop.category, (counts.get(stop.category) ?? 0) + 1);
  }
  let dominant = stops[0]?.category ?? '';
  let maxCount = 0;
  for (const stop of stops) {
    const count = counts.get(stop.category)!;
    if (count > maxCount) {
      maxCount = count;
      dominant = stop.category;
    }
  }
  return dominant;
}

// ─────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────

export interface OverallRatingPromptProps {
  outingId: string;
  stops: { category: string }[];
  onSubmit: (rating: { stars: number; dimensions: Record<string, string>; note?: string }) => void;
}

// ─────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────

export default function OverallRatingPrompt({
  stops,
  onSubmit,
}: OverallRatingPromptProps) {
  const insets = useSafeAreaInsets();

  const dominantCategory = getDominantCategory(stops);
  const categoryDimension = CATEGORY_DIMENSIONS[dominantCategory];
  const dimensions = categoryDimension
    ? [...UNIVERSAL_DIMENSIONS, categoryDimension]
    : UNIVERSAL_DIMENSIONS;

  const [stars, setStars] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');

  function handleSelectOption(dimensionKey: string, option: string) {
    setSelections(prev => {
      const next = { ...prev };
      if (next[dimensionKey] === option) delete next[dimensionKey];
      else next[dimensionKey] = option;
      return next;
    });
  }

  function handleSubmit() {
    onSubmit({
      stars,
      dimensions: selections,
      note: note.trim() || undefined,
    });
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 24, paddingBottom: 140 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>How was the outing?</Text>
        <Text style={styles.subheading}>Rate your time out and tell us what stood out.</Text>

        {/* Stars */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <Pressable
              key={n}
              onPress={() => setStars(n)}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Star
                size={34}
                color={n <= stars ? C.amber : C.textTert}
                fill={n <= stars ? C.amber : C.textTert}
              />
            </Pressable>
          ))}
        </View>

        {/* Spectrum dimensions */}
        <View style={styles.dimensionsWrap}>
          {dimensions.map(dimension => (
            <View key={dimension.key} style={styles.dimensionRow}>
              <Text style={styles.dimensionLabel}>{dimension.label}</Text>
              <View style={styles.optionRow}>
                {dimension.options.map(option => {
                  const isSelected = selections[dimension.key] === option;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.option, isSelected && styles.optionSelected]}
                      onPress={() => handleSelectOption(dimension.key, option)}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]} numberOfLines={1}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Free-text note */}
        <Text style={styles.sectionLabel}>ANYTHING ELSE?</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Optional note about your outing…"
          placeholderTextColor={C.textTert}
          value={note}
          onChangeText={setNote}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Done</Text>
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
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
  },

  heading: {
    fontFamily: F.serif,
    fontSize: 28,
    color: C.textPrimary,
    lineHeight: 34,
    marginBottom: 6,
  },
  subheading: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textSec,
    marginBottom: 22,
  },

  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 28,
  },

  sectionLabel: {
    fontFamily: F.semi,
    fontSize: 10,
    color: C.textPrimary,
    letterSpacing: 1,
    marginBottom: 10,
  },

  dimensionsWrap: {
    marginBottom: 22,
  },
  dimensionRow: {
    marginBottom: 16,
  },
  dimensionLabel: {
    fontFamily: F.med,
    fontSize: 13,
    color: C.textPrimary,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: C.amber,
    borderColor: C.amber,
  },
  optionText: {
    fontFamily: F.med,
    fontSize: 12,
    color: C.textSec,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },

  noteInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: C.card,
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textPrimary,
    lineHeight: 19,
  },

  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: C.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontFamily: F.semi,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
