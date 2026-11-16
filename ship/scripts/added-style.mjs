#!/usr/bin/env node
// Lists what a change adds against the style rules: ternaries (conditional spreads included),
// `if` bodies without braces, type assertions, swallowed errors (an empty `catch {}` or `.catch(() => {})`), disabled tests
// and fallbacks on an environment variable. Read from the TypeScript AST, so `?.`, `??` on
// other values and optional `?:` members never count.
// Only lines the change adds are judged: the existing code keeps its own style.
//
// Usage: node added-style.mjs --cwd <repo> --base <ref>
// Judges committed, staged, unstaged and untracked .ts/.tsx content against <ref>.
// `as const` is allowed; test files (__tests__/, *.test.*, *.spec.*) may keep `as` and env
// fallbacks. Playwright's `test.skip(condition, reason)` is a conditional skip and passes.
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

// The script's own TypeScript 6, never the repo's: TS 7 ships no JavaScript API
// (https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0).
const scriptDir = path.dirname(new URL(import.meta.url).pathname);

let ts;
try {
  ts = createRequire(path.join(scriptDir, "package.json"))("typescript");
} catch {
  console.error(
    `added-style: no TypeScript next to the script. Run: npm install --prefix ${scriptDir}`,
  );
  process.exit(2);
}

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

const TEST_RUNNERS = new Set(["it", "test", "describe"]);

const DISABLED_TEST_CALLS = new Set(["xit", "xtest", "xdescribe"]);

function isEmptyFunction(node) {
  if (!node) return false;

  const isFunction = ts.isArrowFunction(node) || ts.isFunctionExpression(node);
  if (!isFunction || !ts.isBlock(node.body)) return false;

  return node.body.statements.length === 0;
}

function isSwallowedError(node) {
  if (ts.isCatchClause(node)) return node.block.statements.length === 0;

  if (!ts.isCallExpression(node)) return false;

  const callee = node.expression;
  if (!ts.isPropertyAccessExpression(callee) || callee.name.text !== "catch")
    return false;

  return isEmptyFunction(node.arguments[0]);
}

// `xit(...)`, `it.skip("name", ...)` or a bare `test.skip()`. Playwright's
// `test.skip(condition, reason)` skips only where the condition holds
// (https://playwright.dev/docs/api/class-test#test-skip).
function isDisabledTest(node) {
  if (!ts.isCallExpression(node)) return false;

  const callee = node.expression;
  if (ts.isIdentifier(callee)) return DISABLED_TEST_CALLS.has(callee.text);

  if (!ts.isPropertyAccessExpression(callee) || callee.name.text !== "skip")
    return false;

  if (!ts.isIdentifier(callee.expression)) return false;

  if (!TEST_RUNNERS.has(callee.expression.text)) return false;

  const first = node.arguments[0];
  if (!first) return true;

  return ts.isStringLiteralLike(first) || ts.isTemplateExpression(first);
}

// `process.env.X`, `process.env["X"]`, `import.meta.env.X` or `secretEnv("X")`.
function isEnvRead(node) {
  if (ts.isCallExpression(node)) {
    return (
      ts.isIdentifier(node.expression) && node.expression.text === "secretEnv"
    );
  }

  const isAccess =
    ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node);
  if (!isAccess) return false;

  const env = node.expression;
  if (!ts.isPropertyAccessExpression(env) || env.name.text !== "env")
    return false;

  if (ts.isIdentifier(env.expression)) return env.expression.text === "process";

  return ts.isMetaProperty(env.expression);
}

function isEnvFallback(node) {
  if (!ts.isBinaryExpression(node)) return false;

  const operator = node.operatorToken.kind;
  const isFallback =
    operator === ts.SyntaxKind.QuestionQuestionToken ||
    operator === ts.SyntaxKind.BarBarToken;
  if (!isFallback) return false;

  return isEnvRead(node.left);
}

// An `if` whose body, or `else` body, is a bare statement: `if (!x) return;`.
// `else if` chains pass; each `if` in them is judged on its own.
function isUnbracedIf(node) {
  if (!ts.isIfStatement(node)) return false;

  if (!ts.isBlock(node.thenStatement)) return true;

  const otherwise = node.elseStatement;
  if (!otherwise) return false;

  return !ts.isBlock(otherwise) && !ts.isIfStatement(otherwise);
}

function findingKind(node, file) {
  if (ts.isConditionalExpression(node)) return "ternary";

  if (isUnbracedIf(node)) return "unbraced if";

  if (isSwallowedError(node)) return "swallowed error";

  if (isDisabledTest(node)) return "disabled test";

  if (!isTestFile(file) && isEnvFallback(node)) return "env fallback";

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
