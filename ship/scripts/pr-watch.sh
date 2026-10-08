#!/usr/bin/env bash
# Poll a PR until its head, checks, threads, reviews or comments change, then exit.
# JSON lines: snapshot, then changed | timeout | error. Exit 0 on change/timeout, 1 on error.
# Bodies never leave this script: each surface is reduced to a sha256, so a background run stays quiet.
# --settled: exit only when every required check has settled, on feedback, head or PR state change, or on timeout.
set -euo pipefail

repo="" pr="" seconds=1800 interval=30 settled=false
while [ $# -gt 0 ]; do
  case "$1" in
    --repo) repo="$2"; shift 2 ;;
    --pr) pr="$2"; shift 2 ;;
    --seconds) seconds="$2"; shift 2 ;;
    --interval) interval="$2"; shift 2 ;;
    --settled) settled=true; shift ;;
    *) echo "{\"event\":\"error\",\"message\":\"unknown argument $1\"}"; exit 1 ;;
  esac
done
case "$repo" in */*) ;; *) echo '{"event":"error","message":"--repo OWNER/REPO and --pr N are required"}'; exit 1 ;; esac
[[ "$pr" =~ ^[0-9]+$ ]] || { echo '{"event":"error","message":"--repo OWNER/REPO and --pr N are required"}'; exit 1; }

sha() { shasum -a 256 | cut -c1-16; }

threads_query='query($owner:String!,$name:String!,$number:Int!,$endCursor:String){
 repository(owner:$owner,name:$name){pullRequest(number:$number){
 reviewThreads(first:100,after:$endCursor){pageInfo{hasNextPage endCursor}
 nodes{id isResolved isOutdated comments(first:100){totalCount nodes{id updatedAt}}}}}}}'

# One snapshot: a summary object plus one hash per feedback surface.
read_state() {
  local view inline threads required=""
  view=$(gh pr view "$pr" --repo "$repo" --json headRefOid,state,reviewDecision,mergeStateStatus,statusCheckRollup,reviews,comments)
  inline=$(gh api --paginate "repos/$repo/pulls/$pr/comments?per_page=100")
  threads=$(gh api graphql --paginate -f query="$threads_query" -f owner="${repo%/*}" -f name="${repo#*/}" -F number="$pr")
  # gh exits 1 on a failed check and 8 while one is pending; the JSON is what counts.
  # No required check reported, or a failed read, counts as unsettled: it never wakes the agent.
  if $settled; then required=$(gh pr checks "$pr" --repo "$repo" --required --json name,bucket 2>/dev/null) || true; fi
  jq -c --argjson settled "$settled" --arg required "$required" --arg inline "$(printf %s "$inline" | sha)" --arg threads "$(printf %s "$threads" | sha)" \
     --arg reviews "$(printf %s "$view" | jq -c .reviews | sha)" --arg comments "$(printf %s "$view" | jq -c .comments | sha)" '
    {head: .headRefOid, state, reviewDecision, mergeStateStatus,
     checks: [.statusCheckRollup[]? | "\(.name // .context): \([.conclusion, .state, .status] | map(strings | select(length > 0)) | first)"] | sort | unique,
     inline: $inline, threads: $threads, reviews: $reviews, conversation_comments: $comments}
    + if $settled then {required_checks: ($required | try fromjson catch null
        | if type != "array" or length == 0 or any(.[]; .bucket == "pending") then "unsettled"
          else map("\(.name): \(.bucket)") | sort end)} else {} end' <<<"$view"
}

# ponytail: 3 flat retries cover a gh hiccup; a real outage still ends the run.
read_with_retry() {
  local n
  for n in 1 2 3; do read_state && return 0; sleep 5; done
  return 1
}

previous=$(read_with_retry) || { echo '{"event":"error","message":"gh read failed 3 times"}'; exit 1; }
echo "{\"event\":\"snapshot\",\"state\":$previous}"

deadline=$((SECONDS + seconds))
while [ "$SECONDS" -lt "$deadline" ]; do
  sleep "$interval"
  current=$(read_with_retry) || { echo '{"event":"error","message":"gh read failed 3 times"}'; exit 1; }
  if [ "$current" != "$previous" ]; then
    changed=$(jq -nc --argjson a "$previous" --argjson b "$current" --argjson settled "$settled" '
      [$b | keys[] | select($a[.] != $b[.])]
      | if $settled then map(select(IN("head", "state", "inline", "threads", "reviews", "conversation_comments")
          or (. == "required_checks" and $b.required_checks != "unsettled"))) else . end')
    if [ "$changed" != "[]" ]; then
      echo "{\"event\":\"changed\",\"changed_fields\":$changed,\"state\":$current}"
      exit 0
    fi
    # Only --settled reaches here: a silent move becomes the new baseline, so a rerun that settles again still wakes.
    previous=$current
  fi
done
echo '{"event":"timeout","message":"No observed change; run again to keep watching."}'
