import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getCurrentSession } from './_auth-store';
import type { Stop } from './_outing-store';

export type OutingStatus = 'completed' | 'partial';

type OutingHistoryRow = {
  id: string;
  name: string;
  caption: string;
  vibe_tags: string[];
  stops: Stop[];
  status: OutingStatus;
  start_time: string | null;
  ended_at: string;
};

export type OutingHistoryEntry = {
  id: string;
  name: string;
  caption: string;
  vibeTags: string[];
  stops: Stop[];
  status: OutingStatus;
  startTime: number | null;
  endedAt: string;
};

function toOutingHistoryEntry(row: OutingHistoryRow): OutingHistoryEntry {
  return {
    id: row.id,
    name: row.name,
    caption: row.caption,
    vibeTags: row.vibe_tags,
    stops: row.stops,
    status: row.status,
    startTime: row.start_time ? new Date(row.start_time).getTime() : null,
    endedAt: row.ended_at,
  };
}

async function fetchOutingHistory(userId: string): Promise<OutingHistoryEntry[]> {
  const { data, error } = await supabase
    .from('outing_history')
    .select('id, name, caption, vibe_tags, stops, status, start_time, ended_at')
    .eq('user_id', userId)
    .order('ended_at', { ascending: false });

  if (error) throw error;
  return (data as OutingHistoryRow[]).map(toOutingHistoryEntry);
}

/** Cached under React Query so this hook shares its session lookup with useTasteProfile's. */
function useSessionUserId() {
  return useQuery({
    queryKey: ['session-user-id'],
    queryFn: async () => {
      const { session } = await getCurrentSession();
      return session?.user?.id ?? null;
    },
  }).data;
}

export function useOutingHistory() {
  const userId = useSessionUserId();

  return useQuery({
    queryKey: ['outing-history', userId],
    queryFn: () => fetchOutingHistory(userId as string),
    enabled: !!userId,
  });
}

export type AddHistoryEntryInput = {
  id: string;
  name: string;
  caption: string;
  vibeTags: string[];
  stops: Stop[];
  status: OutingStatus;
  startTime: number | null;
};

async function addHistoryEntry(input: AddHistoryEntryInput): Promise<void> {
  const { session } = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error('No authenticated user — cannot save outing history.');
  }

  const { error } = await supabase.from('outing_history').insert({
    id: input.id,
    user_id: userId,
    name: input.name,
    caption: input.caption,
    vibe_tags: input.vibeTags,
    stops: input.stops,
    status: input.status,
    start_time: input.startTime != null ? new Date(input.startTime).toISOString() : null,
  });

  if (error) throw error;
}

export function useAddHistoryEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addHistoryEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outing-history'] });
    },
  });
}
