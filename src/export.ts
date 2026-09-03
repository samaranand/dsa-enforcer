import type { Problem, ProgressMap } from "./types";
import { getAllProgress, importProgress } from "./storage";
import { toCsvField } from "./lib/csv";

interface ExportRow {
  id: string;
  rank: number;
  week: number;
  title: string;
  topic: string;
  difficulty: string;
  url: string;
  status: string;
  confidence: string;
  timeSpentSec: number | null;
  attempts: number;
  tags: string;
  notes: string;
  startedAt: string;
  completedAt: string;
}

function buildRows(problems: Problem[]): ExportRow[] {
  const progress = getAllProgress();
  return problems.map((p) => {
    const e = progress[p.id];
    return {
      id: p.id,
      rank: p.rank,
      week: p.week,
      title: p.title,
      topic: p.topic,
      difficulty: p.difficulty,
      url: p.url,
      status: e?.status ?? "not_started",
      confidence: e?.confidence ?? "",
      timeSpentSec: e?.timeSpentSec ?? null,
      attempts: e?.attempts ?? 0,
      tags: (e?.tags ?? []).join("|"),
      notes: e?.notes ?? "",
      startedAt: e?.startedAt ? new Date(e.startedAt).toISOString() : "",
      completedAt: e?.completedAt ? new Date(e.completedAt).toISOString() : "",
    };
  });
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportJson(problems: Problem[]) {
  const payload = {
    exportedAt: new Date().toISOString(),
    tool: "dsa-enforcer",
    version: 1,
    progress: getAllProgress(),
    rows: buildRows(problems),
  };
  download(
    `dsa-enforcer-progress-${Date.now()}.json`,
    JSON.stringify(payload, null, 2),
    "application/json",
  );
}

export function exportCsv(problems: Problem[]) {
  const rows = buildRows(problems);
  const header = Object.keys(rows[0] ?? {});
  const lines = [
    header.join(","),
    ...rows.map((r) => header.map((h) => toCsvField((r as any)[h])).join(",")),
  ];
  download(`dsa-enforcer-progress-${Date.now()}.csv`, lines.join("\n"), "text/csv");
}

export async function importJsonFile(file: File): Promise<number> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const progress: ProgressMap | undefined = parsed.progress;
  if (!progress || typeof progress !== "object") {
    throw new Error("File doesn't look like a dsa-enforcer export (missing 'progress').");
  }
  importProgress(progress);
  return Object.keys(progress).length;
}
