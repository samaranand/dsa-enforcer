// Regenerates src/data/problems.json from scripts/source-data/problems.csv.
// Re-run with `npm run import-csv` after editing/replacing the source CSV
// (e.g. to add a new batch of problems) to refresh the app's catalog.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.join(__dirname, "source-data", "problems.csv");
const outPath = path.join(__dirname, "..", "src", "data", "problems.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || r[0] !== "");
}

function slugFromUrl(url) {
  const m = url.match(/\/problems\/([^/]+)\/?/);
  return m ? m[1] : url.trim().toLowerCase().replace(/\s+/g, "-");
}

const raw = readFileSync(csvPath, "utf8");
const rows = parseCsv(raw);
const header = rows[0].map((h) => h.trim());
const idx = (name) => header.indexOf(name);

const iWeek = idx("Week");
const iWeekday = idx("Weekday #");
const iRank = idx("Rank");
const iTitle = idx("Problem");
const iUrl = idx("URL");
const iTopic = idx("Topic");
const iDifficulty = idx("Difficulty");

const problems = rows
  .slice(1)
  .filter((r) => r[iTitle] && r[iTitle].trim() !== "")
  .map((r) => {
    const url = r[iUrl].trim();
    return {
      id: slugFromUrl(url),
      rank: Number(r[iRank]) || 0,
      week: Number(r[iWeek]) || 0,
      weekday: Number(r[iWeekday]) || 0,
      title: r[iTitle].trim(),
      url,
      topic: r[iTopic].trim(),
      difficulty: (r[iDifficulty] || "").trim(),
    };
  })
  .sort((a, b) => a.week - b.week || a.weekday - b.weekday || a.rank - b.rank);

const dupes = new Set();
const seen = new Set();
for (const p of problems) {
  if (seen.has(p.id)) dupes.add(p.id);
  seen.add(p.id);
}
if (dupes.size > 0) {
  console.warn("Warning: duplicate problem ids:", [...dupes]);
}

writeFileSync(outPath, JSON.stringify(problems, null, 2) + "\n");
console.log(`Wrote ${problems.length} problems to ${path.relative(process.cwd(), outPath)}`);
