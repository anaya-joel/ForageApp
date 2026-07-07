/**
 * FORAGE — OverallRatingPrompt
 * app/_overall-rating-prompt.tsx
 *
 * Full-screen closing step shown after the final stop's "Complete Stop" or
 * a confirmed "End outing." Unlike the per-stop prompt, there is no
 * dismiss-without-saving path — presentation + callback only, no
 * persistence. The outing store owns the actual state.
 */

import { Plus, Star } from 'lucide-react-native';
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

// ─────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────

const C = {
  bg:          '#F3EDE4',
  card:        '#FFFFFF',
  amber:       '#B86820',
  amberTint:   '#FEF4E8',
  textPrimary: '#2A2420',
  textSec:     '#6B6460',
  textTert:    '#9A8E88',
  border:      '#EDE8E2',
};

const F = {
  serif: 'LibreBaskerville_700Bold',
  reg:   'PlusJakartaSans_400Regular',
  med:   'PlusJakartaSans_500Medium',
  semi:  'PlusJakartaSans_600SemiBold',
};

// ─────────────────────────────────────────
//  WORD SETS
// ─────────────────────────────────────────

const BASE_WORDS = [
  'Great vibe',
  'Well-paced',
  'Would go again',
  'Surprising',
  'Felt long',
  'Loved it',
];

const CATEGORY_WORDS: Record<string, string[]> = {
  'NIGHTLIFE':       ['Great energy', 'Lively crowd', 'Quiet for a bar'],
  'OUTDOORS':        ['Surprisingly calm', 'Scenic', 'Underrated'],
  'ARTS & CULTURE':  ['Thought-provoking', 'Hidden gem', 'Crowded'],
  'EAT & DRINK':     ['Excellent food', 'Worth the price', 'Overrated'],
  'COFFEE & CAFÉS':  ['Perfect for work', 'Great atmosphere', 'Too crowded'],
  'EXPERIENCES':     ['Unique', 'Totally worth it', 'Overrated'],
  'MARKETS':         ['Great finds', 'Loved browsing', 'Not much there'],
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
  onSubmit: (rating: { stars: number; words: string[]; note?: string }) => void;
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
  const categoryWords    = CATEGORY_WORDS[dominantCategory] ?? [];

  const [stars, setStars]             = useState(0);
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [customInput, setCustomInput] = useState('');
  const [note, setNote]               = useState('');

  const allWords = [...BASE_WORDS, ...categoryWords, ...customWords];

  function handleToggleWord(word: string) {
    setSelectedWords(prev => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  }

  function handleAddCustomWord() {
    const word = customInput.trim();
    if (!word || allWords.includes(word)) {
      setCustomInput('');
      return;
    }
    setCustomWords(prev => [...prev, word]);
    setSelectedWords(prev => new Set(prev).add(word));
    setCustomInput('');
  }

  function handleSubmit() {
    onSubmit({
      stars,
      words: Array.from(selectedWords),
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
                color={n <= stars ? C.amber : C.border}
                fill={n <= stars ? C.amber : C.border}
              />
            </Pressable>
          ))}
        </View>

        {/* Descriptive words */}
        <Text style={styles.sectionLabel}>WHAT STOOD OUT?</Text>
        <View style={styles.pillWrap}>
          {allWords.map(word => {
            const isSelected = selectedWords.has(word);
            return (
              <Pressable
                key={word}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => handleToggleWord(word)}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                  {word}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Add a custom word */}
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            placeholder="Add your own word"
            placeholderTextColor={C.textTert}
            value={customInput}
            onChangeText={setCustomInput}
            onSubmitEditing={handleAddCustomWord}
            returnKeyType="done"
          />
          <Pressable style={styles.customAddBtn} onPress={handleAddCustomWord}>
            <Plus size={16} color="#FFFFFF" />
          </Pressable>
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
    color: C.textTert,
    letterSpacing: 1,
    marginBottom: 10,
  },

  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  pill: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillSelected: {
    backgroundColor: C.amber,
    borderColor: C.amber,
  },
  pillText: {
    fontFamily: F.med,
    fontSize: 13,
    color: C.textSec,
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },

  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  customInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: C.card,
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textPrimary,
  },
  customAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.amber,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
