#!/usr/bin/env bash
# Offline check with a fake gh, one read per `pr view` call.
# Default: a review thread flips on the second read; the watcher must report it and stop.
# --settled: check moves (queued, in progress, a skipped job) stay silent; the run stops when the required check settles,
# or on the thread flip while the required check is still pending.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
fake=$(mktemp -d)
trap 'rm -rf "$fake"' EXIT
cat > "$fake/gh" <<'GH'
#!/usr/bin/env bash
read_file="$FAKE_DIR/reads"; n=$(cat "$read_file" 2>/dev/null || echo 0)
case "$*" in
  "pr view"*)
    n=$((n + 1)); echo "$n" > "$read_file"
    if [ "$SCENARIO" = checks ] && [ "$n" -ge 3 ]; then rollup='{"name":"tests","status":"COMPLETED","conclusion":"SUCCESS"},{"name":"lint","status":"COMPLETED","conclusion":"SKIPPED"}'
    elif [ "$SCENARIO" = checks ] && [ "$n" = 2 ]; then rollup='{"name":"tests","status":"IN_PROGRESS","conclusion":""},{"name":"lint","status":"COMPLETED","conclusion":"SKIPPED"}'
    elif [ "$SCENARIO" = checks ]; then rollup='{"name":"tests","status":"QUEUED","conclusion":""}'
    else rollup='{"name":"tests","status":"IN_PROGRESS","conclusion":""},{"context":"vercel","state":"SUCCESS"}'; fi
    echo "{\"headRefOid\":\"abc\",\"state\":\"OPEN\",\"reviewDecision\":null,\"mergeStateStatus\":\"BLOCKED\",\"statusCheckRollup\":[$rollup],\"reviews\":[],\"comments\":[]}" ;;
  "api --paginate repos/"*) echo '[]' ;;
  "api graphql"*) if [ "$SCENARIO" = threads ] && [ "$n" -ge 2 ]; then echo '{"data":{"isResolved":true}}'; else echo '{"data":{"isResolved":false}}'; fi ;;
  "pr checks"*"--required"*)
    if [ "$SCENARIO" = checks ] && [ "$n" -ge 3 ]; then echo '[{"name":"tests","bucket":"pass"}]'
    else echo '[{"name":"tests","bucket":"pending"}]'; exit 8; fi ;;
  *) echo "unexpected gh $*" >&2; exit 1 ;;
esac
GH
chmod +x "$fake/gh"

watch() {
  rm -f "$fake/reads"
  FAKE_DIR="$fake" SCENARIO="$1" PATH="$fake:$PATH" bash "$here/../pr-watch.sh" --repo o/r --pr 1 --seconds 30 --interval 1 "${@:2}"
}

out=$(watch threads)
echo "$out"
[ "$(echo "$out" | wc -l | tr -d ' ')" = 2 ]
echo "$out" | sed -n 1p | jq -e '.event == "snapshot" and .state.checks == ["tests: IN_PROGRESS", "vercel: SUCCESS"] and (.state | has("required_checks") | not)' >/dev/null
echo "$out" | sed -n 2p | jq -e '.event == "changed" and .changed_fields == ["threads"]' >/dev/null
! echo "$out" | grep -q isResolved

out=$(watch checks)
echo "$out" | sed -n 2p | jq -e '.event == "changed" and .changed_fields == ["checks"]' >/dev/null
[ "$(cat "$fake/reads")" = 2 ]

out=$(watch checks --settled)
echo "$out"
[ "$(echo "$out" | wc -l | tr -d ' ')" = 2 ]
[ "$(cat "$fake/reads")" = 3 ]
echo "$out" | sed -n 1p | jq -e '.event == "snapshot" and .state.required_checks == "unsettled"' >/dev/null
echo "$out" | sed -n 2p | jq -e '.event == "changed" and .changed_fields == ["required_checks"] and .state.required_checks == ["tests: pass"]' >/dev/null

out=$(watch threads --settled)
echo "$out"
echo "$out" | sed -n 2p | jq -e '.event == "changed" and .changed_fields == ["threads"] and .state.required_checks == "unsettled"' >/dev/null
echo PASS
