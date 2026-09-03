import type { Confidence, Problem, ProgressEntry, ProgressMap } from "./types";
import { emptyEntry, TIMER_LIMIT_SEC } from "./types";
import { getAllProgress, getEntry, onProgressChange, resetAllProgress, updateEntry } from "./storage";
import { elapsedSec, formatClock, formatDuration, isExpired, remainingSec } from "./timer";
import { exportCsv, exportJson, importJsonFile } from "./export";
import { solutions } from "./data/solutions";
import { applyThemePref, getThemePref, setThemePref, type ThemePref } from "./theme";
import {
  addCustomSet,
  downloadSampleCsv,
  getActiveSetId,
  getAllSets,
  getSet,
  parseProblemsCsv,
  removeCustomSet,
  setActiveSetId,
  type CsvImportResult,
} from "./sets";

const root = document.querySelector<HTMLDivElement>("#app")!;

interface Filters {
  search: string;
  week: string;
  topic: string;
  difficulty: string;
  status: string;
  tag: string;
}

let filters: Filters = { search: "", week: "all", topic: "all", difficulty: "all", status: "all", tag: "all" };
const collapsedGroups = new Set<string>();
const confirmingDone = new Set<string>();
const tagInputOpen = new Set<string>();
let expandedRowId: string | null = null; // only one row's Details panel open at a time
const tagDraft: Record<string, string> = {};
const notesDraft: Record<string, string> = {};

let resetModalOpen = false;
let resetConfirmText = "";

let importModalOpen = false;
let importFileName = "";
let importSetName = "";
let importPreview: CsvImportResult | null = null;

// ---------- helpers ----------

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
const attr = escapeHtml;

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getActiveProblems(): Problem[] {
  return getSet(getActiveSetId())?.problems ?? getSet("default")!.problems;
}

function resetEphemeralUiState() {
  filters = { search: "", week: "all", topic: "all", difficulty: "all", status: "all", tag: "all" };
  collapsedGroups.clear();
  confirmingDone.clear();
  tagInputOpen.clear();
  expandedRowId = null;
}

function collectAllTags(problems: Problem[], progress: ProgressMap): string[] {
  const set = new Set<string>();
  for (const p of problems) {
    const e = progress[p.id];
    if (e) for (const t of e.tags) set.add(t);
  }
  return [...set].sort();
}

function getFilteredProblems(problems: Problem[], progress: ProgressMap): Problem[] {
  return problems.filter((p) => {
    const e = progress[p.id] ?? emptyEntry();
    if (filters.search && !p.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.week !== "all" && String(p.week) !== filters.week) return false;
    if (filters.topic !== "all" && p.topic !== filters.topic) return false;
    if (filters.difficulty !== "all" && p.difficulty !== filters.difficulty) return false;
    if (filters.status !== "all" && e.status !== filters.status) return false;
    if (filters.tag !== "all" && !e.tags.includes(filters.tag)) return false;
    return true;
  });
}

interface Group {
  key: string;
  label: string;
  items: Problem[];
}

function buildGroups(problems: Problem[]): Group[] {
  const hasWeeks = problems.some((p) => p.week > 0);
  const map = new Map<string, Problem[]>();
  for (const p of problems) {
    const key = hasWeeks ? `${p.week}::${p.topic}` : p.topic;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  const groups: Group[] = [];
  for (const [key, items] of map) {
    const label = hasWeeks ? `Week ${items[0].week} · ${items[0].topic}` : items[0].topic;
    groups.push({ key, label, items });
  }
  return groups;
}

// ---------- render ----------

function render() {
  const active = document.activeElement as (HTMLInputElement | HTMLTextAreaElement) | null;
  const activeId = active?.id || null;
  const selStart = activeId && "selectionStart" in active! ? active.selectionStart : null;
  const selEnd = activeId && "selectionEnd" in active! ? active.selectionEnd : null;

  const activeSetId = getActiveSetId();
  const problems = getActiveProblems();
  const progress = getAllProgress();

  root.innerHTML = [
    renderHeader(),
    renderSetsBar(activeSetId),
    renderStats(problems, progress),
    renderToolbar(problems, progress),
    renderList(problems, progress),
    renderFooter(),
    resetModalOpen ? renderResetModal() : "",
    importModalOpen ? renderImportModal() : "",
  ].join("");

  if (activeId) {
    const el = document.getElementById(activeId) as (HTMLInputElement | HTMLTextAreaElement) | null;
    if (el) {
      el.focus();
      if (selStart != null && typeof el.setSelectionRange === "function") {
        try {
          el.setSelectionRange(selStart, selEnd);
        } catch {
          // some input types don't support selection ranges
        }
      }
    }
  }
}

function renderHeader(): string {
  return `<div class="app-header">
    <div class="app-title"><h1>dsa-enforcer</h1><span class="tag">timed C++ practice tracker</span></div>
    <div class="header-actions">
      ${renderThemeToggle()}
      <button class="btn" data-action="export-json">Export JSON</button>
      <button class="btn" data-action="export-csv">Export CSV</button>
      <button class="btn" data-action="open-progress-import">Import progress</button>
      <input type="file" id="progress-import-input" accept="application/json" style="display:none" />
      <button class="btn danger" data-action="open-reset-modal">Reset progress</button>
    </div>
  </div>`;
}

const THEME_OPTIONS: { pref: ThemePref; icon: string; label: string }[] = [
  { pref: "system", icon: "🖥", label: "Match system theme" },
  { pref: "light", icon: "☀", label: "Light theme" },
  { pref: "dark", icon: "🌙", label: "Dark theme" },
];

function renderThemeToggle(): string {
  const current = getThemePref();
  const buttons = THEME_OPTIONS.map(
    ({ pref, icon, label }) =>
      `<button class="theme-option ${pref === current ? "active" : ""}" data-action="set-theme" data-theme-pref="${pref}" title="${attr(label)}" aria-label="${attr(label)}">${icon}</button>`,
  ).join("");
  return `<div class="theme-toggle">${buttons}</div>`;
}

function renderSetsBar(activeId: string): string {
  const sets = getAllSets();
  const tabs = sets
    .map((s) => {
      const del = !s.builtIn
        ? `<span class="remove" data-action="delete-set" data-set-id="${attr(s.id)}" title="Delete this set">×</span>`
        : "";
      return `<span class="set-tab ${s.id === activeId ? "active" : ""}" data-action="switch-set" data-set-id="${attr(s.id)}">${escapeHtml(s.name)} <span class="count">(${s.problems.length})</span>${del}</span>`;
    })
    .join("");
  return `<div class="sets-bar">${tabs}<button class="btn small" data-action="open-import-modal">+ Import set</button></div>`;
}

function renderStats(problems: Problem[], progress: ProgressMap): string {
  const total = problems.length;
  let done = 0,
    inProgress = 0,
    failed = 0;
  for (const p of problems) {
    const e = progress[p.id];
    if (!e) continue;
    if (e.status === "done") done++;
    else if (e.status === "in_progress") inProgress++;
    else if (e.status === "failed") failed++;
  }
  const notStarted = total - done - inProgress - failed;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<div class="stats-bar">
    <div class="stat"><div class="n">${done}/${total}</div><div class="l">Done</div></div>
    <div class="stat"><div class="n">${inProgress}</div><div class="l">In progress</div></div>
    <div class="stat"><div class="n">${failed}</div><div class="l">Failed</div></div>
    <div class="stat"><div class="n">${notStarted}</div><div class="l">Not started</div></div>
    <div class="progress-track">
      <span style="font-size:12px;color:var(--text-muted)">${pct}% complete</span>
      <div class="bar"><div style="width:${pct}%"></div></div>
    </div>
  </div>`;
}

function renderToolbar(problems: Problem[], progress: ProgressMap): string {
  const topics = [...new Set(problems.map((p) => p.topic))];
  const hasWeeks = problems.some((p) => p.week > 0);
  const weeks = hasWeeks ? [...new Set(problems.map((p) => p.week))].sort((a, b) => a - b) : [];
  const tags = collectAllTags(problems, progress);

  return `<div class="toolbar">
    <input type="text" id="search-input" data-filter="search" placeholder="Search problems..." value="${attr(filters.search)}" />
    ${
      hasWeeks
        ? `<select data-filter="week"><option value="all">All weeks</option>${weeks
            .map((w) => `<option value="${w}" ${filters.week === String(w) ? "selected" : ""}>Week ${w}</option>`)
            .join("")}</select>`
        : ""
    }
    <select data-filter="topic"><option value="all">All topics</option>${topics
      .map((t) => `<option value="${attr(t)}" ${filters.topic === t ? "selected" : ""}>${escapeHtml(t)}</option>`)
      .join("")}</select>
    <select data-filter="difficulty">
      <option value="all">All difficulty</option>
      ${["Easy", "Medium", "Hard"]
        .map((d) => `<option value="${d}" ${filters.difficulty === d ? "selected" : ""}>${d}</option>`)
        .join("")}
    </select>
    <select data-filter="status">
      <option value="all">All status</option>
      <option value="not_started" ${filters.status === "not_started" ? "selected" : ""}>Not started</option>
      <option value="in_progress" ${filters.status === "in_progress" ? "selected" : ""}>In progress</option>
      <option value="done" ${filters.status === "done" ? "selected" : ""}>Done</option>
      <option value="failed" ${filters.status === "failed" ? "selected" : ""}>Failed</option>
    </select>
    ${
      tags.length
        ? `<select data-filter="tag"><option value="all">All tags</option>${tags
            .map((t) => `<option value="${attr(t)}" ${filters.tag === t ? "selected" : ""}>${escapeHtml(t)}</option>`)
            .join("")}</select>`
        : ""
    }
  </div>`;
}

function renderList(problems: Problem[], progress: ProgressMap): string {
  const filtered = getFilteredProblems(problems, progress);
  if (filtered.length === 0) {
    return `<div class="empty-state">No problems match your filters.</div>`;
  }
  const groups = buildGroups(filtered);
  return groups
    .map((g) => {
      const doneCount = g.items.filter((p) => progress[p.id]?.status === "done").length;
      const collapsed = collapsedGroups.has(g.key);
      return `<div class="group">
        <div class="group-header" data-action="toggle-group" data-group="${attr(g.key)}">
          <span><span class="caret">${collapsed ? "▸" : "▾"}</span>${escapeHtml(g.label)}</span>
          <span class="count">${doneCount}/${g.items.length} done</span>
        </div>
        ${collapsed ? "" : g.items.map((p) => renderRow(p, progress[p.id] ?? emptyEntry())).join("")}
      </div>`;
    })
    .join("");
}

function renderRow(p: Problem, entry: ProgressEntry): string {
  const isOpen = expandedRowId === p.id;
  const isConfirming = confirmingDone.has(p.id);
  const isTagInputOpen = tagInputOpen.has(p.id);

  let statusHtml = "";
  let actionHtml = "";

  if (entry.status === "not_started") {
    actionHtml = `<button class="btn small primary" data-action="start-timer" data-id="${attr(p.id)}">Start</button>`;
  } else if (entry.status === "in_progress") {
    statusHtml = `<span class="timer-badge">${formatClock(remainingSec(entry))}</span>`;
    actionHtml = isConfirming
      ? `<span class="confidence-picker">
          <button data-action="set-confidence" data-id="${attr(p.id)}" data-level="low">Low</button>
          <button data-action="set-confidence" data-id="${attr(p.id)}" data-level="medium">Med</button>
          <button data-action="set-confidence" data-id="${attr(p.id)}" data-level="high">High</button>
          <button class="btn small" data-action="cancel-done" data-id="${attr(p.id)}">Cancel</button>
        </span>`
      : `<button class="btn small primary" data-action="mark-done" data-id="${attr(p.id)}">Done</button>`;
  } else if (entry.status === "done") {
    statusHtml = `<span class="badge status-done">Done</span>${
      entry.confidence ? `<span class="badge confidence-${entry.confidence}">${capitalize(entry.confidence)}</span>` : ""
    }<span class="timer-badge" style="background:none;color:var(--text-faint)">${formatDuration(entry.timeSpentSec)}</span>`;
    actionHtml = `<button class="btn small icon" data-action="retry" data-id="${attr(p.id)}" title="Retry — restart the 60-minute timer" aria-label="Retry">↺</button>`;
  } else if (entry.status === "failed") {
    statusHtml = `<span class="badge status-failed">Failed — time's up</span>`;
    actionHtml = `<button class="btn small icon" data-action="retry" data-id="${attr(p.id)}" title="Retry — restart the 60-minute timer" aria-label="Retry">↺</button>`;
  }

  const difficultyBadge = p.difficulty
    ? `<span class="badge ${p.difficulty.toLowerCase()}">${p.difficulty}</span>`
    : "";

  const tagChips = entry.tags
    .map(
      (t) =>
        `<span class="tag-chip">${escapeHtml(t)}<button data-action="remove-tag" data-id="${attr(p.id)}" data-tag="${attr(t)}">×</button></span>`,
    )
    .join("");

  return `<div class="row">
    <div class="row-main" data-action="toggle-details" data-id="${attr(p.id)}">
      <span class="row-rank">#${p.rank || "—"}</span>
      <a class="row-title" href="${attr(p.url)}" target="_blank" rel="noopener" data-action="open-link">${escapeHtml(p.title)}</a>
      ${difficultyBadge}
      <span class="badge topic">${escapeHtml(p.topic)}</span>
      ${tagChips}
      <span class="row-spacer"></span>
      ${statusHtml}
      ${actionHtml}
      <span class="row-caret" title="${isOpen ? "Hide" : "Details"}">${isOpen ? "▾" : "▸"}</span>
    </div>
    ${isOpen ? renderDetails(p, entry, isTagInputOpen) : ""}
  </div>`;
}

function renderDetails(p: Problem, entry: ProgressEntry, isTagInputOpen: boolean): string {
  const sol = solutions[p.id];
  const tagInputHtml = isTagInputOpen
    ? `<input class="tag-add-input" id="tag-add-${attr(p.id)}" type="text" placeholder="tag + Enter" value="${attr(tagDraft[p.id] ?? "")}" data-tag-input data-id="${attr(p.id)}" />`
    : `<button class="btn small" data-action="toggle-tag-input" data-id="${attr(p.id)}">+ tag</button>`;

  const solutionHtml = sol
    ? `<ul class="solution-approach">${sol.approach.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>
       <div class="solution-complexity">Time <code>${escapeHtml(sol.complexity.time)}</code> · Space <code>${escapeHtml(sol.complexity.space)}</code></div>
       <pre class="solution-code"><button class="btn small copy-btn" data-action="copy-code" data-id="${attr(p.id)}">Copy</button>${escapeHtml(sol.code)}</pre>`
    : `<div class="solution-empty">No reference solution authored for this problem yet.</div>`;

  return `<div class="row-details">
    <div class="detail-section">
      <div class="label">Tags</div>
      <div class="tags-editor">${tagInputHtml}</div>
    </div>
    <div class="detail-section">
      <div class="label">Notes</div>
      <textarea class="notes-input" id="notes-${attr(p.id)}" data-notes data-id="${attr(p.id)}" placeholder="Notes for next revision...">${escapeHtml(notesDraft[p.id] ?? entry.notes)}</textarea>
    </div>
    <div class="detail-section">
      <div class="label">Solution (C++)</div>
      ${solutionHtml}
    </div>
  </div>`;
}

function renderFooter(): string {
  return `<footer class="app-footer">
    <div>Progress lives only in this browser's local storage — nothing is sent to any server. <a href="https://github.com/samaranand/dsa-enforcer" target="_blank" rel="noopener">Source on GitHub</a></div>
    <div class="credit">Created by Samar Anand · © 2026</div>
  </footer>`;
}

function renderResetModal(): string {
  const canConfirm = resetConfirmText.trim().toLowerCase() === "reset";
  return `<div class="modal-overlay">
    <div class="modal">
      <h2>Reset all progress?</h2>
      <p>This permanently clears every problem's status, timer history, confidence rating, tags, and notes — across all problem sets. This cannot be undone. Consider exporting first.</p>
      <p>Type <b>reset</b> to confirm:</p>
      <input type="text" id="reset-confirm-input" autocomplete="off" placeholder="reset" value="${attr(resetConfirmText)}" />
      <div class="modal-actions">
        <button class="btn" data-action="close-reset-modal">Cancel</button>
        <button class="btn danger" data-action="confirm-reset" ${canConfirm ? "" : "disabled"}>Reset everything</button>
      </div>
    </div>
  </div>`;
}

function renderImportModal(): string {
  const errors = importPreview?.errors ?? [];
  const warnings = importPreview?.warnings ?? [];
  const validCount = importPreview?.problems.length ?? 0;
  const readyToImport = validCount > 0 && errors.length === 0;

  return `<div class="modal-overlay">
    <div class="modal wide">
      <h2>Import a custom problem set</h2>
      <p>Upload a CSV to practice your own list alongside the built-in set. Required columns: <code>Title</code>, <code>URL</code>. Optional: <code>Topic</code>, <code>Difficulty</code> (Easy/Medium/Hard), <code>Week</code>, <code>Weekday #</code>, <code>Rank</code>. Header names are case-insensitive; a few aliases are accepted (e.g. "Problem" for Title, "Link" for URL).</p>
      <button class="btn small" data-action="download-sample-csv">Download sample CSV</button>
      <div style="margin-top:14px"><input type="file" id="import-file-input" accept=".csv,text/csv" /></div>
      ${importFileName ? `<p style="margin-top:0">Selected: <b>${escapeHtml(importFileName)}</b></p>` : ""}
      ${
        errors.length
          ? `<div class="import-errors"><b>${errors.length} error(s) — fix your CSV and re-upload:</b><ul>${errors
              .slice(0, 20)
              .map((e) => `<li>${escapeHtml(e)}</li>`)
              .join("")}</ul></div>`
          : ""
      }
      ${
        warnings.length
          ? `<div class="import-warnings"><b>${warnings.length} warning(s):</b><ul>${warnings
              .slice(0, 20)
              .map((w) => `<li>${escapeHtml(w)}</li>`)
              .join("")}</ul></div>`
          : ""
      }
      ${
        readyToImport
          ? `<p><b>${validCount}</b> problem(s) ready to import.</p>
             <label style="font-size:12px;color:var(--text-muted)">Set name</label>
             <input type="text" id="import-set-name-input" placeholder="e.g. Meta Prep" value="${attr(importSetName)}" />`
          : ""
      }
      <div class="modal-actions">
        <button class="btn" data-action="close-import-modal">Cancel</button>
        <button class="btn primary" data-action="confirm-import" ${readyToImport && importSetName.trim() ? "" : "disabled"}>Import${validCount ? ` ${validCount} problems` : ""}</button>
      </div>
    </div>
  </div>`;
}

// ---------- actions ----------

function startTimer(id: string) {
  const entry = getEntry(id);
  updateEntry(id, {
    status: "in_progress",
    startedAt: Date.now(),
    completedAt: null,
    confidence: null,
    timeSpentSec: null,
    attempts: entry.attempts + 1,
  });
}

function finalizeDone(id: string, level: Confidence) {
  const entry = getEntry(id);
  updateEntry(id, {
    status: "done",
    completedAt: Date.now(),
    confidence: level,
    timeSpentSec: elapsedSec(entry),
  });
  confirmingDone.delete(id);
}

function addTag(id: string, tag: string) {
  const entry = getEntry(id);
  if (entry.tags.includes(tag)) return;
  updateEntry(id, { tags: [...entry.tags, tag] });
}

function removeTag(id: string, tag: string) {
  const entry = getEntry(id);
  updateEntry(id, { tags: entry.tags.filter((t) => t !== tag) });
}

async function copyCode(id: string) {
  const sol = solutions[id];
  if (!sol) return;
  try {
    await navigator.clipboard.writeText(sol.code);
    const btn = root.querySelector<HTMLButtonElement>(`[data-action="copy-code"][data-id="${id.replace(/"/g, "")}"]`);
    if (btn) {
      const original = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => {
        if (btn.isConnected) btn.textContent = original;
      }, 1200);
    }
  } catch {
    // clipboard API unavailable (e.g. insecure context) — fail silently
  }
}

function doReset() {
  resetModalOpen = false;
  resetConfirmText = "";
  resetAllProgress();
}

async function handleImportFile(file: File | undefined) {
  if (!file) return;
  importFileName = file.name;
  const text = await file.text();
  importPreview = parseProblemsCsv(text, "custom");
  if (!importSetName) importSetName = file.name.replace(/\.csv$/i, "");
  render();
}

function doConfirmImport() {
  if (!importPreview || importPreview.problems.length === 0) return;
  const name = importSetName.trim() || importFileName.replace(/\.csv$/i, "") || "Custom Set";
  const set = addCustomSet(name, importPreview.problems);
  setActiveSetId(set.id);
  importModalOpen = false;
  importPreview = null;
  importFileName = "";
  importSetName = "";
  resetEphemeralUiState();
  render();
}

function doDeleteSet(id: string) {
  const set = getSet(id);
  if (!set || set.builtIn) return;
  if (!confirm(`Delete problem set "${set.name}"? Its problems will be removed from your list (progress data for those problems is kept but will no longer be visible).`)) {
    return;
  }
  removeCustomSet(id);
  resetEphemeralUiState();
  render();
}

// ---------- events ----------

function attachEvents() {
  root.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const el = target.closest<HTMLElement>("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    const id = el.dataset.id;

    switch (action) {
      case "start-timer":
      case "retry":
        startTimer(id!);
        break;
      case "mark-done":
        confirmingDone.add(id!);
        render();
        break;
      case "cancel-done":
        confirmingDone.delete(id!);
        render();
        break;
      case "set-confidence":
        finalizeDone(id!, el.dataset.level as Confidence);
        break;
      case "toggle-details":
        expandedRowId = expandedRowId === id ? null : (id ?? null);
        tagInputOpen.clear();
        render();
        break;
      case "toggle-tag-input":
        tagInputOpen.has(id!) ? tagInputOpen.delete(id!) : tagInputOpen.add(id!);
        render();
        break;
      case "remove-tag":
        removeTag(id!, el.dataset.tag!);
        break;
      case "toggle-group": {
        const g = el.dataset.group!;
        collapsedGroups.has(g) ? collapsedGroups.delete(g) : collapsedGroups.add(g);
        render();
        break;
      }
      case "copy-code":
        copyCode(id!);
        break;
      case "export-json":
        exportJson(getActiveProblems());
        break;
      case "export-csv":
        exportCsv(getActiveProblems());
        break;
      case "open-progress-import":
        document.getElementById("progress-import-input")?.click();
        break;
      case "open-reset-modal":
        resetModalOpen = true;
        resetConfirmText = "";
        render();
        break;
      case "close-reset-modal":
        resetModalOpen = false;
        render();
        break;
      case "confirm-reset":
        doReset();
        break;
      case "open-import-modal":
        importModalOpen = true;
        importPreview = null;
        importFileName = "";
        importSetName = "";
        render();
        break;
      case "close-import-modal":
        importModalOpen = false;
        render();
        break;
      case "download-sample-csv":
        downloadSampleCsv();
        break;
      case "confirm-import":
        doConfirmImport();
        break;
      case "switch-set":
        setActiveSetId(el.dataset.setId!);
        resetEphemeralUiState();
        render();
        break;
      case "delete-set":
        doDeleteSet(el.dataset.setId!);
        break;
      case "set-theme":
        setThemePref(el.dataset.themePref as ThemePref);
        render();
        break;
    }
  });

  root.addEventListener("change", (e) => {
    const t = e.target as HTMLInputElement;
    if (t.id === "import-file-input") {
      handleImportFile(t.files?.[0]);
    } else if (t.id === "progress-import-input") {
      const file = t.files?.[0];
      if (file) {
        importJsonFile(file)
          .then((n) => alert(`Imported progress for ${n} problem(s).`))
          .catch((err) => alert(`Import failed: ${err.message}`));
      }
      t.value = "";
    } else if (t.dataset.filter) {
      (filters as any)[t.dataset.filter] = t.value;
      render();
    }
  });

  root.addEventListener("input", (e) => {
    const t = e.target as HTMLElement;
    if (t.id === "search-input") {
      filters.search = (t as HTMLInputElement).value;
      render();
    } else if (t.id === "reset-confirm-input") {
      resetConfirmText = (t as HTMLInputElement).value;
      render();
    } else if (t.id === "import-set-name-input") {
      importSetName = (t as HTMLInputElement).value;
      render();
    } else if (t.dataset.tagInput !== undefined) {
      tagDraft[t.dataset.id!] = (t as HTMLInputElement).value;
    } else if (t.dataset.notes !== undefined) {
      notesDraft[t.dataset.id!] = (t as HTMLTextAreaElement).value;
    }
  });

  root.addEventListener("keydown", (e) => {
    const t = e.target as HTMLElement;
    if (t.dataset.tagInput !== undefined && e.key === "Enter") {
      e.preventDefault();
      const id = t.dataset.id!;
      const value = (t as HTMLInputElement).value.trim();
      if (value) {
        addTag(id, value);
        delete tagDraft[id];
      }
    }
  });

  root.addEventListener("focusout", (e) => {
    const t = e.target as HTMLElement;
    if (t.dataset.notes !== undefined) {
      const id = t.dataset.id!;
      const value = (t as HTMLTextAreaElement).value;
      delete notesDraft[id];
      updateEntry(id, { notes: value });
    }
  });
}

function tick() {
  const progress = getAllProgress();
  let anyInProgress = false;
  for (const id of Object.keys(progress)) {
    const e = progress[id];
    if (e.status === "in_progress") {
      anyInProgress = true;
      if (isExpired(e)) {
        updateEntry(id, {
          status: "failed",
          completedAt: (e.startedAt ?? Date.now() - TIMER_LIMIT_SEC * 1000) + TIMER_LIMIT_SEC * 1000,
          timeSpentSec: TIMER_LIMIT_SEC,
        });
      }
    }
  }
  if (anyInProgress) render();
}

export function initApp() {
  applyThemePref();
  attachEvents();
  onProgressChange(render);
  render();
  setInterval(tick, 1000);
}
