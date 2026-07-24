import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getCurrentSession } from './_auth-store';
import type { QuizAnswers, TasteProfileResult } from './_taste-profile-store';

type TasteProfileRow = {
  categories: string[];
  vibes: string[];
  quiz_answers: QuizAnswers | null;
};

export type TasteProfileQueryResult = {
  profile: TasteProfileResult | null;
  quizAnswers: QuizAnswers | null;
};

function toTasteProfileQueryResult(row: TasteProfileRow | null): TasteProfileQueryResult {
  if (!row) return { profile: null, quizAnswers: null };
  return {
    profile: {
      categories: row.categories as TasteProfileResult['categories'],
      vibes: row.vibes,
    },
    quizAnswers: row.quiz_answers,
  };
}

async function fetchTasteProfile(userId: string): Promise<TasteProfileQueryResult> {
  const { data, error } = await supabase
    .from('taste_profiles')
    .select('categories, vibes, quiz_answers')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return toTasteProfileQueryResult(data as TasteProfileRow | null);
}

/** Cached under React Query so both hooks below share one session lookup. */
function useSessionUserId() {
  return useQuery({
    queryKey: ['session-user-id'],
    queryFn: async () => {
      const { session } = await getCurrentSession();
      return session?.user?.id ?? null;
    },
  }).data;
}

export function useTasteProfile() {
  const userId = useSessionUserId();

  return useQuery({
    queryKey: ['taste-profile', userId],
    queryFn: () => fetchTasteProfile(userId as string),
    enabled: !!userId,
  });
}

export type SaveTasteProfileInput = {
  categories: TasteProfileResult['categories'];
  vibes: TasteProfileResult['vibes'];
  quizAnswers: QuizAnswers;
};

async function saveTasteProfile(input: SaveTasteProfileInput): Promise<void> {
  const { session } = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error('No authenticated user — cannot save taste profile.');
  }

  const upsertPayload = {
    user_id: userId,
    categories: input.categories,
    vibes: input.vibes,
    quiz_answers: input.quizAnswers,
  };

  const result = await supabase.from('taste_profiles').upsert(
    upsertPayload,
    { onConflict: 'user_id' }
  );

  if (result.error) throw result.error;
}

export function useSaveTasteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveTasteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taste-profile'] });
    },
  });
}
