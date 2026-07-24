/**
 * FORAGE — useStopCompletion
 * app/_use-stop-completion.ts
 *
 * Stop-progression and rating-overlay state for the active outing screen.
 * Extracted from app/active-outing.tsx — behavior is unchanged.
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import {
  completeCurrentStop,
  endOuting,
  getActiveOuting,
  goToPreviousStop,
  setScoutSuggestion,
  type OutingPlan,
  type Stop,
} from './_outing-store';
import { useAddHistoryEntry, type OutingStatus } from './_use-outing-history';
import { generatePlan } from './_generate-plan';
import { deriveInputsFromPlan } from './outing-preview';
import type { Venue } from '../data/venues';

// Regenerate the home screen's Scout suggestion so it doesn't just keep
// showing the outing that was finished/ended. There's no taste-profile
// store yet, so this derives inputs from the just-completed plan itself
// (same helper the "Regenerate" button in outing-preview.tsx uses) rather
// than reusing hardcoded or empty values.
export function regenerateScoutSuggestion(finishedPlan: OutingPlan, venues: Venue[]) {
  const inputs = deriveInputsFromPlan(finishedPlan);
  try {
    const nextPlan = generatePlan(inputs, venues);
    setScoutSuggestion(nextPlan);
  } catch {
    Alert.alert('Nothing open right now', "Try again later, or widen what you're looking for.");
  }
}

type ActivePrompt = 'none' | 'stop' | 'overall';

// `outingId` is accepted for API shape (mirroring the id props the rating
// prompts already take) but isn't used to select data yet — the store only
// ever tracks a single active outing via getActiveOuting().
export function useStopCompletion(outingId: string, venues: Venue[]) {
  const [plan, setPlan] = useState<OutingPlan | null>(() => getActiveOuting());

  // Rating overlay state — 'stop' shows after every "Complete Stop" press,
  // including the final one; 'overall' shows once that stop's rating is
  // dismissed (if it was the final stop) or after an early "End outing".
  // The finished plan is captured separately because by the time the
  // overall prompt is showing, endOuting() may have already cleared
  // _activeOuting.
  const [activePrompt, setActivePrompt] = useState<ActivePrompt>('none');
  const [ratedStop, setRatedStop]       = useState<Stop | null>(null);
  const [finishedPlan, setFinishedPlan] = useState<OutingPlan | null>(null);
  // Set alongside finishedPlan, at the same moment — 'completed' only when the
  // final stop was actually completed (dismissStopPrompt's final-stop branch);
  // 'partial' for every "End outing" early-exit. currentStopIndex alone can't
  // disambiguate these: the final-stop-completion branch never calls
  // completeCurrentStop(), so it leaves currentStopIndex at stops.length - 1 —
  // identical to what an early end on that same last stop would leave behind.
  const [finishStatus, setFinishStatus] = useState<OutingStatus>('completed');

  const addHistoryEntryMutation = useAddHistoryEntry();

  useFocusEffect(
    useCallback(() => {
      setPlan(getActiveOuting());
    }, [])
  );

  const refreshPlan = useCallback(() => {
    setPlan(getActiveOuting());
  }, []);

  const currentStop: Stop | undefined = plan?.stops[plan.currentStopIndex];
  const nextStop: Stop | undefined    = plan?.stops[plan.currentStopIndex + 1];
  const isFinalStop = plan != null && plan.currentStopIndex === plan.stops.length - 1;

  function handlePreviousStop() {
    goToPreviousStop();
    refreshPlan();
  }

  // completeCurrentStop() itself is deferred until the rating prompt is
  // dismissed, so the overlay appears over the just-finished stop's view
  // and only *then* transitions to the next stop (or, on the final stop,
  // into the overall rating prompt) — matching spec Part 9's "shows
  // prompt, transitions to next stop view" ordering.
  function handleCompleteStop() {
    if (!plan || !currentStop) return;
    setRatedStop(currentStop);
    setActivePrompt('stop');
  }

  // No confirmation sheet yet — end outing shows the overall rating prompt,
  // then goes home (future prompt for the confirmation itself).
  function handleEndOuting() {
    setFinishedPlan(getActiveOuting());
    setFinishStatus('partial');
    setActivePrompt('overall');
  }

  function dismissStopPrompt() {
    if (isFinalStop) {
      setFinishedPlan(plan);
      setFinishStatus('completed');
      setActivePrompt('overall');
      setRatedStop(null);
      return;
    }
    completeCurrentStop();
    refreshPlan();
    setActivePrompt('none');
    setRatedStop(null);
  }

  // Navigation (router.replace('/')) stays with the caller — this only
  // performs the store mutation + local state reset, in the same order as
  // before extraction.
  function finishOuting() {
    if (finishedPlan) {
      regenerateScoutSuggestion(finishedPlan, venues);
      // Partial (early-ended) outings only recorded stops up through the one
      // in progress when "End outing" was tapped — the rest were never
      // visited. Full completions keep every stop, including the last one
      // (see the finishStatus comment above for why currentStopIndex can't
      // be used to tell these apart on its own).
      const completedStops = finishStatus === 'completed'
        ? finishedPlan.stops
        : finishedPlan.stops.slice(0, finishedPlan.currentStopIndex);

      addHistoryEntryMutation.mutate({
        id: finishedPlan.id,
        name: finishedPlan.name,
        caption: finishedPlan.caption,
        vibeTags: finishedPlan.vibeTags,
        stops: completedStops,
        status: finishStatus,
        startTime: finishedPlan.startTime,
      });
    }
    endOuting();
    refreshPlan();
    setActivePrompt('none');
    setFinishedPlan(null);
  }

  return {
    plan,
    currentStop,
    nextStop,
    isFinalStop,
    activePrompt,
    ratedStop,
    finishedPlan,
    refreshPlan,
    handlePreviousStop,
    handleCompleteStop,
    handleEndOuting,
    dismissStopPrompt,
    finishOuting,
  };
}
