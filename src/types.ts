export type Difficulty = "Easy" | "Medium" | "Hard" | "";

export interface Problem {
  id: string;
  rank: number;
  week: number;
  weekday: number;
  title: string;
  url: string;
  topic: string;
  difficulty: Difficulty;
}

export type Status = "not_started" | "in_progress" | "done" | "failed";
export type Confidence = "low" | "medium" | "high";

export interface ProgressEntry {
  status: Status;
  startedAt: number | null;
  completedAt: number | null;
  confidence: Confidence | null;
  timeSpentSec: number | null;
  attempts: number;
  tags: string[];
  notes: string;
}

export type ProgressMap = Record<string, ProgressEntry>;

export interface ProblemSet {
  id: string;
  name: string;
  builtIn: boolean;
  createdAt: number;
  problems: Problem[];
}

export interface SolutionEntry {
  approach: string[];
  complexity: { time: string; space: string };
  code: string;
}

export type SolutionMap = Record<string, SolutionEntry>;

export const TIMER_LIMIT_SEC = 60 * 60;

export function emptyEntry(): ProgressEntry {
  return {
    status: "not_started",
    startedAt: null,
    completedAt: null,
    confidence: null,
    timeSpentSec: null,
    attempts: 0,
    tags: [],
    notes: "",
  };
}
