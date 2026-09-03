import problemsData from "./data/problems.json";
import type { Problem, ProblemSet } from "./types";
import { parseCsv } from "./lib/csv";

const DEFAULT_SET_ID = "default";
const CUSTOM_SETS_KEY = "dsa-enforcer:custom-sets:v1";
const ACTIVE_SET_KEY = "dsa-enforcer:active-set:v1";

const defaultSet: ProblemSet = {
  id: DEFAULT_SET_ID,
  name: "Google Prep 2K26",
  builtIn: true,
  createdAt: 0,
  problems: problemsData as Problem[],
};

function loadCustomSets(): ProblemSet[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SETS_KEY);
    return raw ? (JSON.parse(raw) as ProblemSet[]) : [];
  } catch {
    console.warn("dsa-enforcer: failed to parse custom sets, ignoring");
    return [];
  }
}

function saveCustomSets(sets: ProblemSet[]) {
  localStorage.setItem(CUSTOM_SETS_KEY, JSON.stringify(sets));
}

export function getAllSets(): ProblemSet[] {
  return [defaultSet, ...loadCustomSets()];
}

export function getSet(id: string): ProblemSet | undefined {
  return getAllSets().find((s) => s.id === id);
}

export function getActiveSetId(): string {
  return localStorage.getItem(ACTIVE_SET_KEY) || DEFAULT_SET_ID;
}

export function setActiveSetId(id: string) {
  localStorage.setItem(ACTIVE_SET_KEY, id);
}

export function addCustomSet(name: string, problems: Problem[]): ProblemSet {
  const sets = loadCustomSets();
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "set";
  let id = `custom-${slug}`;
  let n = 2;
  while (sets.some((s) => s.id === id) || id === DEFAULT_SET_ID) {
    id = `custom-${slug}-${n++}`;
  }
  const set: ProblemSet = { id, name: name.trim(), builtIn: false, createdAt: Date.now(), problems };
  saveCustomSets([...sets, set]);
  return set;
}

export function removeCustomSet(id: string) {
  saveCustomSets(loadCustomSets().filter((s) => s.id !== id));
  if (getActiveSetId() === id) setActiveSetId(DEFAULT_SET_ID);
}

// --- CSV import for user-supplied problem sets ---

const HEADER_ALIASES: Record<string, keyof Problem | "skip"> = {
  title: "title",
  problem: "title",
  name: "title",
  question: "title",
  url: "url",
  link: "url",
  topic: "topic",
  category: "topic",
  tag: "topic",
  difficulty: "difficulty",
  week: "week",
  "weekday #": "weekday",
  weekday: "weekday",
  day: "weekday",
  rank: "rank",
  "#": "rank",
  no: "rank",
};

function normalizeHeader(h: string): keyof Problem | "skip" {
  const key = h.trim().toLowerCase();
  return HEADER_ALIASES[key] ?? "skip";
}

function slugify(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 80) || "problem"
  );
}

function idFromUrl(url: string): string {
  const m = url.match(/\/problems\/([^/?#]+)/i);
  if (m) return m[1];
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    if (last) return slugify(last);
  } catch {
    // not a valid absolute URL — fall through
  }
  return slugify(url);
}

export interface CsvImportResult {
  problems: Problem[];
  errors: string[];
  warnings: string[];
}

export function parseProblemsCsv(text: string, setSlug: string): CsvImportResult {
  const rows = parseCsv(text);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (rows.length === 0) {
    return { problems: [], errors: ["The file is empty."], warnings };
  }

  const headerRow = rows[0].map(normalizeHeader);
  if (!headerRow.includes("title")) {
    errors.push('No "Title"/"Problem" column found in the header row.');
  }
  if (!headerRow.includes("url")) {
    errors.push('No "URL"/"Link" column found in the header row.');
  }
  if (errors.length > 0) return { problems: [], errors, warnings };

  const problems: Problem[] = [];
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();

  rows.slice(1).forEach((row, i) => {
    const lineNo = i + 2; // account for header + 1-indexing
    const get = (field: keyof Problem): string => {
      const colIdx = headerRow.indexOf(field);
      return colIdx === -1 ? "" : (row[colIdx] ?? "").trim();
    };

    const title = get("title");
    const url = get("url");

    if (!title && !url) return; // silently skip fully blank rows
    if (!title) {
      errors.push(`Row ${lineNo}: missing title.`);
      return;
    }
    if (!url || !/^https?:\/\//i.test(url)) {
      errors.push(`Row ${lineNo} ("${title}"): missing or invalid URL (must start with http:// or https://).`);
      return;
    }
    if (seenUrls.has(url)) {
      warnings.push(`Row ${lineNo} ("${title}"): duplicate URL, skipped.`);
      return;
    }
    seenUrls.add(url);

    let id = `${setSlug}::${idFromUrl(url)}`;
    let n = 2;
    while (seenIds.has(id)) id = `${setSlug}::${idFromUrl(url)}-${n++}`;
    seenIds.add(id);

    const difficultyRaw = get("difficulty");
    const difficulty = ["Easy", "Medium", "Hard"].includes(difficultyRaw) ? (difficultyRaw as Problem["difficulty"]) : "";

    problems.push({
      id,
      title,
      url,
      topic: get("topic") || "General",
      difficulty,
      week: Number(get("week")) || 0,
      weekday: Number(get("weekday")) || 0,
      rank: Number(get("rank")) || i + 1,
    });
  });

  return { problems, errors, warnings };
}

export const SAMPLE_CSV = `Title,URL,Topic,Difficulty,Week,Weekday #,Rank
Two Sum,https://leetcode.com/problems/two-sum/,Arrays & Hashing,Easy,1,1,1
Valid Anagram,https://leetcode.com/problems/valid-anagram/,Arrays & Hashing,Easy,1,1,2
Binary Search,https://leetcode.com/problems/binary-search/,Binary Search,Easy,1,2,3
`;

export function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dsa-enforcer-sample-set.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
