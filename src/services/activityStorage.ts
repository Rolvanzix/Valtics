export interface RecordedActivityItem {
  signature: string;
  timestamp: number;
  type: string;
  pool: string;
  asset: string;
  status: 'confirmed' | 'failed';
  network?: string;
  amountQuote?: string;
  amountBase?: string;
}

const STORAGE_KEY = 'valtics_activity_ledger_v1';
const LISTEN_EVENT = 'valtics_activity_recorded';

export function getRecordedActivities(): RecordedActivityItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse activity ledger:', err);
    return [];
  }
}

export function saveRecordedActivity(item: RecordedActivityItem): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getRecordedActivities();
    // Avoid duplicates by signature
    const filtered = existing.filter((a) => a.signature !== item.signature);
    const updated = [item, ...filtered];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 100)));
    window.dispatchEvent(new CustomEvent(LISTEN_EVENT, { detail: item }));
  } catch (err) {
    console.warn('Failed to persist activity to ledger:', err);
  }
}

export function onActivityRecorded(callback: (item: RecordedActivityItem) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<RecordedActivityItem>;
    if (custom.detail) callback(custom.detail);
  };
  window.addEventListener(LISTEN_EVENT, handler);
  return () => window.removeEventListener(LISTEN_EVENT, handler);
}
