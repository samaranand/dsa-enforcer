// Syntax-checks every C++ snippet in src/data/solutions.ts by compiling it
// (with -fsyntax-only) against a standard set of includes. Run via
// `npm run check-solutions`. Not part of the app build.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(__dirname, "..", "src", "data", "solutions.ts");

const result = await esbuild.build({
  entryPoints: [srcPath],
  bundle: false,
  write: false,
  format: "esm",
  loader: { ".ts": "ts" },
});
const js = result.outputFiles[0].text;
const tmpMod = path.join(__dirname, "_solutions_tmp.mjs");
writeFileSync(tmpMod, js);
const { solutions } = await import(`file://${tmpMod}?t=${Date.now()}`);
unlinkSync(tmpMod);

const ids = Object.keys(solutions);
console.log(`Checking ${ids.length} solutions...`);

const header = `
#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <stack>
#include <queue>
#include <deque>
#include <algorithm>
#include <numeric>
#include <climits>
#include <cmath>
#include <cctype>
using namespace std;
`;

let failed = 0;
for (const id of ids) {
  const { code } = solutions[id];
  const cpp = `${header}\n${code}\n\nint main() { return 0; }\n`;
  const tmpFile = path.join(__dirname, `_check_${id}.cpp`);
  writeFileSync(tmpFile, cpp);
  try {
    execSync(`g++ -std=c++17 -fsyntax-only "${tmpFile}"`, { stdio: "pipe" });
    console.log(`  ok    ${id}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL  ${id}`);
    console.log(e.stderr.toString().split("\n").slice(0, 15).join("\n"));
  } finally {
    unlinkSync(tmpFile);
  }
}

console.log(`\n${ids.length - failed}/${ids.length} compiled cleanly.`);
if (failed > 0) process.exit(1);
