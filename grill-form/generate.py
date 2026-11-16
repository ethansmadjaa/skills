#!/usr/bin/env python3
"""Generate a grill-form HTML page from a questions JSON config.

usage: python3 generate.py <config.json> <output.html>

Config shape (all keys required except "multi"):
{
  "title": "browser-tab and visual title",
  "eyebrow": "Wayfinder XXX · Ticket TN (XXX-000) · Grill round 1",
  "heading": "Ticket / decision title",
  "lede": "N décisions… + what the copy button produces",
  "storeKey": "new for every ticket and round, e.g. abc123-grill-r1",
  "questions": [
    { "id": "Q1", "title": "…", "body": "…", "reco": "…", "multi": true,
      "options": [ { "v": "a", "label": "(a) …", "reco": true },
                   { "v": "b", "label": "(b) …" } ] }
  ]
}
Exactly one option per question carries "reco": true, "multi" included.
Optional "multi": true renders checkboxes instead of radios (several answers).
"""

import json
import sys
from html import escape as html_escape
from pathlib import Path

REQUIRED = {"title", "eyebrow", "heading", "lede", "storeKey", "questions"}


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit("usage: generate.py <config.json> <output.html>")

    config_path, out_path = Path(sys.argv[1]), Path(sys.argv[2])
    config = json.loads(config_path.read_text())

    missing = REQUIRED - config.keys()
    if missing:
        sys.exit(f"config missing keys: {', '.join(sorted(missing))}")

    for q in config["questions"]:
        for key in ("id", "title", "body", "reco", "options"):
            if key not in q:
                sys.exit(f"question {q.get('id', '?')}: missing '{key}'")
        recos = [o for o in q["options"] if o.get("reco")]
        if len(recos) != 1:
            sys.exit(f"{q['id']}: exactly one option must carry \"reco\": true")

    # "</" escaped so a "</script>" inside a string cannot close the script block.
    config_json = json.dumps(config, ensure_ascii=False, indent=2).replace("</", "<\\/")
    template = (Path(__file__).parent / "template.html").read_text()
    html = template.replace("__TITLE__", html_escape(config["title"])).replace(
        '"__CONFIG_JSON__"', config_json
    )
    out_path.write_text(html)
    print(f"wrote {out_path} ({len(html)} bytes)")


main()
