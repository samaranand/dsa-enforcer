import { emptyEntry, type ProgressEntry, type ProgressMap } from "./types";

const KEY = "dsa-enforcer:progress:v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function load(): ProgressMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ProgressMap;
  } catch {
    console.warn("dsa-enforcer: failed to parse stored progress, resetting");
    return {};
  }
}

function save(map: ProgressMap) {
  localStorage.setItem(KEY, JSON.stringify(map));
  for (const l of listeners) l();
}

let cache = load();

export function onProgressChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getEntry(problemId: string): ProgressEntry {
  return cache[problemId] ?? emptyEntry();
}

export function getAllProgress(): ProgressMap {
  return cache;
}

export function setEntry(problemId: string, entry: ProgressEntry) {
  cache = { ...cache, [problemId]: entry };
  save(cache);
}

export function updateEntry(
  problemId: string,
  patch: Partial<ProgressEntry>,
) {
  const current = getEntry(problemId);
  setEntry(problemId, { ...current, ...patch });
}

export function resetAllProgress() {
  cache = {};
  localStorage.removeItem(KEY);
  for (const l of listeners) l();
}

export function importProgress(map: ProgressMap) {
  cache = { ...cache, ...map };
  save(cache);
}
