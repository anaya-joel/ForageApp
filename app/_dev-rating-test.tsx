/**
 * ⚠️ DEV ONLY — DELETE BEFORE SHIP ⚠️
 *
 * FORAGE — Dev Rating Test Harness
 * app/_dev-rating-test.tsx
 *
 * Temporary scaffold for previewing and manually triggering
 * _stop-rating-prompt.tsx and _overall-rating-prompt.tsx with mock data,
 * since Active Outing detail screen doesn't exist yet to invoke them for
 * real. Logs onRate/onSave/onDismiss/onSubmit payloads to the console —
 * no real state wiring. Delete this file once real wiring is in place.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import OverallRatingPrompt from './_overall-rating-prompt';
import StopRatingPrompt from './_stop-rating-prompt';

// ─────────────────────────────────────────
//  MOCK DATA
// ─────────────────────────────────────────

// Two "EAT & DRINK" stops + one "OUTDOORS" stop — exercises the
// dominant-category logic (EAT & DRINK wins, 2 vs 1) in OverallRatingPrompt.
const MOCK_STOPS = [
  { id: 'dev-1', name: 'The Dabney', category: 'EAT & DRINK' },
  { id: 'dev-2', name: 'Rock Creek Park', category: 'OUTDOORS' },
  { id: 'dev-3', name: "Ben's Chili Bowl", category: 'EAT & DRINK' },
];

type ActivePrompt = 'none' | 'stop' | 'overall';

// ─────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────

export default function DevRatingTestScreen() {
  const [activePrompt, setActivePrompt] = useState<ActivePrompt>('none');

  return (
    <View style={styles.screen}>
      <Text style={styles.banner}>DEV ONLY — DELETE BEFORE SHIP</Text>
      <Text style={styles.title}>Rating Component Test Harness</Text>

      <View style={styles.mockList}>
        <Text style={styles.mockListLabel}>Mock stops:</Text>
        {MOCK_STOPS.map(stop => (
          <Text key={stop.id} style={styles.mockListItem}>
            • {stop.name} — {stop.category}
          </Text>
        ))}
      </View>

      <Pressable
        style={styles.btn}
        onPress={() => setActivePrompt('stop')}
      >
        <Text style={styles.btnText}>Show per-stop rating</Text>
      </Pressable>

      <Pressable
        style={styles.btn}
        onPress={() => setActivePrompt('overall')}
      >
        <Text style={styles.btnText}>Show overall rating</Text>
      </Pressable>

      {activePrompt === 'stop' && (
        <StopRatingPrompt
          stopId={MOCK_STOPS[0].id}
          placeName={MOCK_STOPS[0].name}
          category={MOCK_STOPS[0].category}
          onRate={stars => console.log('[dev-rating-test] onRate', stars)}
          onSave={saved => console.log('[dev-rating-test] onSave', saved)}
          onDismiss={() => {
            console.log('[dev-rating-test] onDismiss');
            setActivePrompt('none');
          }}
        />
      )}

      {activePrompt === 'overall' && (
        <OverallRatingPrompt
          outingId="dev-outing"
          stops={MOCK_STOPS.map(s => ({ category: s.category }))}
          onSubmit={rating => {
            console.log('[dev-rating-test] onSubmit', rating);
            setActivePrompt('none');
          }}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3EDE4',
    paddingTop: 60,
    paddingHorizontal: 20,
    gap: 12,
  },
  banner: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: '#B84E38',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2420',
    marginBottom: 8,
  },
  mockList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 4,
  },
  mockListLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B6460',
    marginBottom: 4,
  },
  mockListItem: {
    fontSize: 13,
    color: '#2A2420',
  },
  btn: {
    height: 46,
    borderRadius: 10,
    backgroundColor: '#B86820',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
