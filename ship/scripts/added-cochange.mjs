#!/usr/bin/env node
// Lists the files that usually change with the files a change touches, yet are not in it:
// over the base's last 180 days of history, a partner that moved in at least half of a
// touched file's commits (and at least 3 of them). Each line is a question for the reviewer:
// a forgotten edit, or a hidden link the code does not show.
//
// Usage: node added-cochange.mjs --cwd <repo> --base <ref>
// The change is committed, staged, unstaged and untracked content against <ref>.
// Always exits 0: the list is review input, not a gate.
import { execFileSync } from "node:child_process";
import path from "node:path";

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;

  return process.argv[index + 1];
}

const cwd = path.resolve(argValue("--cwd") ?? ".");

const base = argValue("--base") ?? "origin/main";

const MIN_SHARE = 0.5;

const MIN_TOGETHER = 3;

// A commit that touches this many files is a sweep (formatting, renames, a version bump):
// every pair in it would look coupled.
const MAX_FILES_PER_COMMIT = 40;

const NOISE = [
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)CHANGELOG\.md$/,
  /^\.changeset\//,
];

function git(...args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
}

function lines(text) {
  return text.split("\n").filter(Boolean);
}

const touched = new Set([
  ...lines(git("diff", "--name-only", base)),
  ...lines(git("ls-files", "--others", "--exclude-standard")),
]);

const commits = git(
  "log",
  "--since=180.days",
  "--format=%x00",
  "--name-only",
  base,
)
  .split("\0")
  .map((block) =>
    lines(block).filter((file) => !NOISE.some((rule) => rule.test(file))),
  )
  .filter((files) => files.length > 1 && files.length <= MAX_FILES_PER_COMMIT);

const findings = [];

for (const file of touched) {
  const withFile = commits.filter((files) => files.includes(file));
  if (withFile.length < MIN_TOGETHER) continue;

  const together = new Map();
  for (const files of withFile) {
    for (const partner of files) {
      if (touched.has(partner)) continue;

      together.set(partner, (together.get(partner) ?? 0) + 1);
    }
  }

  for (const [partner, count] of together) {
    const share = count / withFile.length;
    if (count < MIN_TOGETHER || share < MIN_SHARE) continue;

    findings.push({ file, partner, count, total: withFile.length, share });
  }
}

findings.sort(
  (left, right) => right.share - left.share || right.count - left.count,
);

for (const { file, partner, count, total, share } of findings.slice(0, 20)) {
  console.log(
    `${file} changed with ${partner} in ${count} of its ${total} commits (${Math.round(share * 100)}%)`,
  );
}
