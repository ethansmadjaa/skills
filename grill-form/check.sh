#!/usr/bin/env bash
# Proves the form survives the Orca inline frame (storage and clipboard denied)
# and that the generator refuses a config without exactly one reco.
# usage: ./check.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cat >"$tmp/ok.json" <<'JSON'
{
  "title": "Check", "eyebrow": "Check", "heading": "Check", "lede": "Check",
  "storeKey": "grill-form-check-r1",
  "questions": [
    { "id": "Q1", "title": "Storage", "body": "Where? </script>", "reco": "a",
      "options": [ { "v": "a", "label": "(a) Dynamo", "reco": true }, { "v": "b", "label": "(b) Aurora" } ] }
  ]
}
JSON
python3 "$here/generate.py" "$tmp/ok.json" "$tmp/ok.html" >/dev/null

node -e '
const script = require("fs").readFileSync(process.argv[1], "utf8").match(/<script>([\s\S]*)<\/script>/)[1];
const listeners = {};
let selected, copied;
const el = (id) => ({
  value: "",
  addEventListener(type, fn) { listeners[`${id} ${type}`] = fn; },
  appendChild() {},
  select() { selected = this.value; },
  remove() {},
});
globalThis.document = { getElementById: el, createElement: () => el(), querySelector: () => null, body: el(), execCommand() { copied = selected; } };
const denied = (name) => { throw new DOMException("denied", name); };
Object.defineProperty(globalThis, "localStorage", { get: () => denied("SecurityError") });
Object.defineProperty(globalThis, "navigator", { value: { clipboard: { writeText: async () => denied("NotAllowedError") } } });
new Function(script)();
listeners["copyBtn click"]().then(() => require("assert").match(copied, /^- Q1 \(Storage\): - no option selected -$/));
' "$tmp/ok.html"
echo "ok: copy works with storage and clipboard denied"

sed 's/"reco": true/"reco": false/' "$tmp/ok.json" >"$tmp/bad.json"
if python3 "$here/generate.py" "$tmp/bad.json" "$tmp/bad.html" 2>/dev/null; then
  echo "FAIL: generator accepted a question with no reco" >&2
  exit 1
fi
if [ -e "$tmp/bad.html" ]; then
  echo "FAIL: generator wrote output for an invalid config" >&2
  exit 1
fi
echo "ok: no-reco config refused, nothing written"
