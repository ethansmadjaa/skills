#!/usr/bin/env node
// Lists the ternaries (conditional spreads included) and the type assertions a change adds,
// read from the TypeScript AST so `?.`, `??` and optional `?:` members never count.
// Only lines the change adds are judged: the existing code keeps its own style.
//
// Usage: node added-style.mjs --cwd <repo> --base <ref>
// Judges committed, staged, unstaged and untracked .ts/.tsx content against <ref>.
// `as const` is allowed; test files (__tests__/, *.test.*, *.spec.*) may keep `as`.
// Exit 0: nothing found. Exit 1: findings printed as `path:line kind | source line`.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;

  return process.argv[index + 1];
}

const cwd = path.resolve(argValue("--cwd") ?? ".");

const base = argValue("--base") ?? "origin/main";

const ts = createRequire(path.join(cwd, "package.json"))("typescript");

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

function isTestFile(file) {
  return /(^|\/)__tests__\/|\.(test|spec)\.tsx?$/.test(file);
}

function findingKind(node, file) {
  if (ts.isConditionalExpression(node)) return "ternary";

  const isAssertion =
    ts.isAsExpression(node) || ts.isTypeAssertionExpression(node);
  if (!isAssertion || isTestFile(file)) return undefined;

  const isAsConst =
    ts.isTypeReferenceNode(node.type) &&
    node.type.typeName.getText() === "const";
  if (isAsConst) return undefined;

  return "type assertion";
}

const findings = [];

for (const [file, lines] of addedLines()) {
  let source;
  try {
    source = readFileSync(path.join(cwd, file), "utf8");
  } catch {
    continue;
  }

  let kind = ts.ScriptKind.TS;
  if (file.endsWith(".tsx")) kind = ts.ScriptKind.TSX;

  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );

  const sourceLines = source.split("\n");

  const visit = (node) => {
    const found = findingKind(node, file);
    if (found) {
      const line =
        sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
          .line + 1;
      if (lines === null || lines.has(line)) {
        findings.push(
          `${file}:${line} ${found} | ${sourceLines[line - 1].trim()}`,
        );
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
}

for (const finding of findings) console.log(finding);

if (findings.length > 0) process.exit(1);
