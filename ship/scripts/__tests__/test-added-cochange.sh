#!/usr/bin/env bash
# Runs added-cochange.mjs on a throwaway repo: schema.ts and fixture.ts always change
# together, other.ts once with them. A change to schema.ts alone lists fixture.ts only; a
# change that already holds fixture.ts lists nothing.
set -euo pipefail

script="$(cd "$(dirname "$0")/.." && pwd)/added-cochange.mjs"
repo="$(mktemp -d)"
trap 'rm -rf "$repo"' EXIT

cd "$repo"
git init -q
git config user.email test@example.com
git config user.name test

for round in 1 2 3 4; do
  echo "$round" >> schema.ts
  echo "$round" >> fixture.ts
  if [ "$round" = 1 ]; then echo "$round" >> other.ts; fi
  if [ "$round" -le 2 ]; then
    echo "$round" >> pair.ts
    echo "$round" >> mate.ts
  fi
  git add . && git commit -qm "round $round"
done

fail() {
  printf 'FAIL: %s\n--- got\n%s\n' "$1" "$2"
  exit 1
}

echo change >> schema.ts
output="$(node "$script" --cwd "$repo" --base HEAD)"
expected='schema.ts changed with fixture.ts in 4 of its 4 commits (100%)'
[ "$output" = "$expected" ] || fail "schema.ts alone" "$output"

echo change >> fixture.ts
output="$(node "$script" --cwd "$repo" --base HEAD)"
[ -z "$output" ] || fail "schema.ts with fixture.ts" "$output"

# Two commits together are too few to call a link.
git checkout -q -- .
echo change >> pair.ts
output="$(node "$script" --cwd "$repo" --base HEAD)"
[ -z "$output" ] || fail "pair.ts with only two shared commits" "$output"

echo PASS
