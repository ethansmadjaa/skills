#!/usr/bin/env bash
# Usage: merge-watch.sh <pr> [interval-seconds]
# Prints one line when the PR ends, then exits: "MERGED <sha>" or "CLOSED".
# Run it with Monitor; the line is the event.
set -u
pr="$1"
interval="${2:-30}"
while true; do
  out=$(gh pr view "$pr" --json state,mergeCommit --jq '"\(.state) \(.mergeCommit.oid // "")"' 2>/dev/null) || out=""
  case "$out" in
    MERGED*) echo "$out"; exit 0 ;;
    CLOSED*) echo "CLOSED"; exit 0 ;;
  esac
  sleep "$interval"
done
