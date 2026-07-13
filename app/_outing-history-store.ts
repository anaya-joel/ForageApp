import type { Stop } from './_outing-store';

export type HistoryEntry = {
  id: string;
  name: string;
  startTime: number | null;
  stops: Stop[];
  vibeTags: string[];
};

let _historyEntries: HistoryEntry[] = [];

export function addHistoryEntry(entry: HistoryEntry): void {
  _historyEntries = [entry, ..._historyEntries];
}

export function getHistoryEntries(): HistoryEntry[] {
  return _historyEntries;
}
