#!/usr/bin/env node
// Lists the copy-pasted blocks a change adds: clones (found by jscpd over the whole repo)
// where at least one side overlaps a line the change adds. Old clones stay out.
//
// Usage: node added-clones.mjs --cwd <repo> --base <ref>
// Judges committed, staged, unstaged and untracked .ts/.tsx content against <ref>; test files are ignored.
// Exit 0: nothing found. Exit 1: findings printed as `path:start-end duplicates path:start-end`.
// jscpd only sees copied text. A function that exists elsewhere in another shape is the reviewer's job.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;

  return process.argv[index + 1];
}

const cwd = path.resolve(argValue("--cwd") ?? ".");

const base = argValue("--base") ?? "origin/main";

function git(...args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
}

const TS_FILES = ["*.ts", "*.tsx"];

/** path → set of added line numbers; `null` means every line (an untracked file). */
function addedLines() {
  const added = new Map();

  let current;
  for (const line of git(
    "diff",
    "-U0",
    "-w",
    "--no-color",
    base,
    "--",
    ...TS_FILES,
  ).split("\n")) {
    if (line.startsWith("+++ ")) {
      current = undefined;
      if (line.startsWith("+++ b/")) current = line.slice(6);

      if (current) added.set(current, new Set());

      continue;
    }

    const hunk = /^@@ -\S+ \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (!hunk || !current) continue;

    const start = Number(hunk[1]);

    let count = 1;
    if (hunk[2] !== undefined) count = Number(hunk[2]);

    for (let offset = 0; offset < count; offset += 1)
      added.get(current).add(start + offset);
  }

  for (const file of git(
    "ls-files",
    "--others",
    "--exclude-standard",
    "--",
    ...TS_FILES,
  ).split("\n")) {
    if (file) added.set(file, null);
  }

  return added;
}

const added = addedLines();

function touchesAddedLines({ name, start, end }) {
  const file = path.relative(cwd, path.resolve(cwd, name));
  if (!added.has(file)) return false;

  const lines = added.get(file);
  if (lines === null) return true;

  for (let line = start; line <= end; line += 1) {
    if (lines.has(line)) return true;
  }

  return false;
}

function describe({ name, start, end }) {
  return `${path.relative(cwd, path.resolve(cwd, name))}:${start}-${end}`;
}

if (added.size === 0) process.exit(0);

const output = mkdtempSync(path.join(tmpdir(), "jscpd-"));

execFileSync(
  "npx",
  [
    "--yes",
    "jscpd@4",
    cwd,
    "--reporters",
    "json",
    "--output",
    output,
    "--format",
    "typescript,tsx",
    "--min-lines",
    "6",
    "--min-tokens",
    "60",
    "--ignore",
    "**/node_modules/**,**/dist/**,**/build/**,**/.next/**,**/.sst/**,**/.turbo/**,**/__tests__/**,**/*.test.*,**/*.spec.*",
    "--silent",
  ],
  { cwd, stdio: "ignore", maxBuffer: 256 * 1024 * 1024 },
);

const report = JSON.parse(
  readFileSync(path.join(output, "jscpd-report.json"), "utf8"),
);

const sides = ({ firstFile, secondFile }) => [
  {
    name: firstFile.name,
    start: firstFile.startLoc.line,
    end: firstFile.endLoc.line,
  },
  {
    name: secondFile.name,
    start: secondFile.startLoc.line,
    end: secondFile.endLoc.line,
  },
];

const findings = [];

for (const clone of report.duplicates) {
  const [first, second] = sides(clone);
  if (touchesAddedLines(first) || touchesAddedLines(second))
    findings.push(`${describe(first)} duplicates ${describe(second)}`);
}

for (const finding of findings) console.log(finding);

if (findings.length > 0) process.exit(1);
