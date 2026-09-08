#!/usr/bin/env bash
# Offline check: a fake gh flips one review thread on the second read; the watcher must report it and stop.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
fake=$(mktemp -d)
trap 'rm -rf "$fake"' EXIT
cat > "$fake/gh" <<'GH'
#!/usr/bin/env bash
count_file="$FAKE_DIR/calls"; n=$(( $(cat "$count_file" 2>/dev/null || echo 0) + 1 )); echo "$n" > "$count_file"
case "$*" in
  "pr view"*) echo '{"headRefOid":"abc","state":"OPEN","reviewDecision":null,"mergeStateStatus":"BLOCKED","statusCheckRollup":[{"name":"tests","status":"IN_PROGRESS","conclusion":""},{"context":"vercel","state":"SUCCESS"}],"reviews":[],"comments":[]}' ;;
  "api --paginate repos/"*) echo '[]' ;;
  "api graphql"*) if [ "$n" -gt 3 ]; then echo '{"data":{"isResolved":true}}'; else echo '{"data":{"isResolved":false}}'; fi ;;
  *) echo "unexpected gh $*" >&2; exit 1 ;;
esac
GH
chmod +x "$fake/gh"
out=$(FAKE_DIR="$fake" PATH="$fake:$PATH" bash "$here/../pr-watch.sh" --repo o/r --pr 1 --seconds 30 --interval 1)
echo "$out"
[ "$(echo "$out" | wc -l | tr -d ' ')" = 2 ]
echo "$out" | sed -n 1p | jq -e '.event == "snapshot" and .state.checks == ["tests: IN_PROGRESS", "vercel: SUCCESS"]' >/dev/null
echo "$out" | sed -n 2p | jq -e '.event == "changed" and .changed_fields == ["threads"]' >/dev/null
! echo "$out" | grep -q isResolved
echo PASS
