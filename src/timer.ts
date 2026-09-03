import { TIMER_LIMIT_SEC, type ProgressEntry } from "./types";

export function elapsedSec(entry: ProgressEntry, now = Date.now()): number {
  if (!entry.startedAt) return 0;
  return Math.floor((now - entry.startedAt) / 1000);
}

export function remainingSec(entry: ProgressEntry, now = Date.now()): number {
  return Math.max(0, TIMER_LIMIT_SEC - elapsedSec(entry, now));
}

export function isExpired(entry: ProgressEntry, now = Date.now()): boolean {
  return entry.status === "in_progress" && elapsedSec(entry, now) >= TIMER_LIMIT_SEC;
}

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function formatDuration(totalSec: number | null): string {
  if (totalSec == null) return "—";
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}
