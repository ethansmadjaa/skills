#!/usr/bin/env bash
# Runs added-style.mjs on a throwaway repo: only added lines are judged, `?.`/`??`/`?:` never
# count, `as const` passes, a test file keeps its `as`. Needs a TypeScript install to borrow:
# TS_REPO=<a repo with node_modules/typescript> (default: the commerce-agent checkout).
set -euo pipefail

script="$(cd "$(dirname "$0")/.." && pwd)/added-style.mjs"
ts_repo="${TS_REPO:-$HOME/github/commerce-agent}"
repo="$(mktemp -d)"
trap 'rm -rf "$repo"' EXIT

cd "$repo"
git init -q
git config user.email test@example.com
git config user.name test
ln -s "$ts_repo/node_modules" node_modules
echo '{}' > package.json
printf 'node_modules\n' > .gitignore
printf 'export const old = true ? 1 : 2;\n' > kept.ts
printf 'export function label(on: boolean) {\n  return (\n    on ? "yes" : "no"\n  );\n}\n' > moved.ts
git add . && git commit -qm base

# Only re-indented inside a new wrapper line: the old ternary is not added code.
printf 'export function label(on: boolean) {\n  return (\n    [\n      on ? "yes" : "no"\n    ]\n  );\n}\n' > moved.ts

printf 'export const old = true ? 1 : 2;\nexport const a = (x?: { y?: number }) => x?.y ?? 0;\nexport const b = [1] as const;\n' > kept.ts
mkdir -p src/__tests__
printf 'export const c = 1 > 0 ? "a" : "b";\nexport const d = { ...(1 > 0 ? { e: 1 } : {}) };\nexport const f = JSON.parse("1") as number;\n' > src/new.ts
printf 'export const g = JSON.parse("1") as number;\n' > src/__tests__/new.test.ts

set +e
output="$(node "$script" --cwd "$repo" --base HEAD)"
status=$?
set -e

expected='src/new.ts:1 ternary | export const c = 1 > 0 ? "a" : "b";
src/new.ts:2 ternary | export const d = { ...(1 > 0 ? { e: 1 } : {}) };
src/new.ts:3 type assertion | export const f = JSON.parse("1") as number;'

if [ "$status" -ne 1 ] || [ "$(printf '%s\n' "$output" | sort)" != "$(printf '%s\n' "$expected" | sort)" ]; then
  printf 'FAIL (exit %s)\n--- got\n%s\n--- expected\n%s\n' "$status" "$output" "$expected"
  exit 1
fi

echo PASS
