#!/usr/bin/env bash
# Link every root skill (a directory holding a SKILL.md) into ~/.claude/skills (Claude Code)
# and ~/.agents/skills (Codex and the other agents). Idempotent; never writes inside the repo.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
skipped=0

for target_dir in "$HOME/.claude/skills" "$HOME/.agents/skills"; do
  mkdir -p "$target_dir"
  for skill_md in "$repo_root"/*/SKILL.md; do
    skill_dir="$(dirname "$skill_md")"
    name="$(basename "$skill_dir")"
    link="$target_dir/$name"
    if [ -L "$link" ] || [ ! -e "$link" ]; then
      ln -sfn "$skill_dir" "$link"
      echo "link    $link"
    else
      echo "SKIP    $link exists and is not a symlink; resolve it manually" >&2
      skipped=$((skipped + 1))
    fi
  done
done

[ "$skipped" -eq 0 ]
