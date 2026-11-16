#!/usr/bin/env bash
# Runs added-style.mjs on a throwaway repo: only added lines are judged, `?.`/`??`/`?:` never
# count, `as const` passes, a test file keeps its `as`. The script parses with its own
# TypeScript (`npm install --prefix ship/scripts`), so the throwaway repo has none.
set -euo pipefail

script="$(cd "$(dirname "$0")/.." && pwd)/added-style.mjs"
repo="$(mktemp -d)"
trap 'rm -rf "$repo"' EXIT

cd "$repo"
git init -q
git config user.email test@example.com
git config user.name test
echo '{}' > package.json
printf 'export const old = true ? 1 : 2;\n' > kept.ts
printf 'export function label(on: boolean) {\n  return (\n    on ? "yes" : "no"\n  );\n}\n' > moved.ts
git add . && git commit -qm base

# Only re-indented inside a new wrapper line: the old ternary is not added code.
printf 'export function label(on: boolean) {\n  return (\n    [\n      on ? "yes" : "no"\n    ]\n  );\n}\n' > moved.ts

printf 'export const old = true ? 1 : 2;\nexport const a = (x?: { y?: number }) => x?.y ?? 0;\nexport const b = [1] as const;\n' > kept.ts
mkdir -p src/__tests__
printf 'export const c = 1 > 0 ? "a" : "b";\nexport const d = { ...(1 > 0 ? { e: 1 } : {}) };\nexport const f = JSON.parse("1") as number;\n' > src/new.ts
printf 'export const g = JSON.parse("1") as number;\nexport const h = process.env.H ?? "";\nit.skip("i", () => {});\ntest("j", () => { test.skip(!process.env.URL, "needs the dashboard"); });\n' > src/__tests__/new.test.ts
printf 'export function m(x?: number) {\n  if (!x) return 0;\n  if (x > 1) {\n    return 2;\n  }\n  if (x > 2) {\n    return 3;\n  } else return 4;\n  if (x > 3) {\n    return 5;\n  } else if (x > 4) {\n    return 6;\n  }\n  return x;\n}\n' > src/branches.ts
printf 'try { run(); } catch {}\nvoid run().catch(() => {});\nvoid run().catch((error) => { log(error); });\nexport const k = process.env.K ?? "value";\nexport const l = options.timeout ?? 1000;\n' > src/errors.ts

set +e
output="$(node "$script" --cwd "$repo" --base HEAD)"
status=$?
set -e

expected='src/new.ts:1 ternary | export const c = 1 > 0 ? "a" : "b";
src/new.ts:2 ternary | export const d = { ...(1 > 0 ? { e: 1 } : {}) };
src/new.ts:3 type assertion | export const f = JSON.parse("1") as number;
src/__tests__/new.test.ts:3 disabled test | it.skip("i", () => {});
src/errors.ts:1 swallowed error | try { run(); } catch {}
src/errors.ts:2 swallowed error | void run().catch(() => {});
src/errors.ts:4 env fallback | export const k = process.env.K ?? "value";
src/branches.ts:2 unbraced if | if (!x) return 0;
src/branches.ts:6 unbraced if | if (x > 2) {'

if [ "$status" -ne 1 ] || [ "$(printf '%s\n' "$output" | sort)" != "$(printf '%s\n' "$expected" | sort)" ]; then
  printf 'FAIL (exit %s)\n--- got\n%s\n--- expected\n%s\n' "$status" "$output" "$expected"
  exit 1
fi

echo PASS
