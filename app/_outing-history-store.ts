import type { Stop } from './_outing-store';

// ─────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────

export type HistoryEntry = {
  id: string;
  name: string;
  startTime: number | null;
  stops: Stop[];
  vibeTags: string[];
};

// ─────────────────────────────────────────
//  MODULE STATE
// ─────────────────────────────────────────

let _historyEntries: HistoryEntry[] = [];

// ─────────────────────────────────────────
//  OUTING HISTORY API
// ─────────────────────────────────────────

export function addHistoryEntry(entry: HistoryEntry): void {
  _historyEntries = [entry, ..._historyEntries];
}

export function getHistoryEntries(): HistoryEntry[] {
  return _historyEntries;
}
