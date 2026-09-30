#!/usr/bin/env node
// Turns a conversation into a browser console script that restores it in the widget.
// Input: conversation-get output (one file per page) or a JSON array of rows.
// Usage: node preview.mjs <input.json>... [--out <file>] [--no-copy]
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KEY = 'just-ai-agent-state';

// Mirrors validCards in packages/api-schema/src/agent/product-presentation/resolve.ts.
const validCards = (list) =>
  (Array.isArray(list) ? list : []).filter(
    (c) => c && typeof c.handle === 'string' && typeof c.title === 'string' && typeof c.price === 'string',
  );

// Mirrors assistantRow in frontend/widget-ui/src/agent/lib/rows.ts, minus
// proposeReplies selection cards, purchase recaps and the add-to-cart button.
export function assistantRow(parts, { autoAddToCart = false } = {}) {
  const hidesCards = autoAddToCart && parts.some((p) => p.type === 'tool-addToCart');
  const seen = new Set();
  const blocks = [];
  let recommendations;
  let links;
  parts.forEach((part, key) => {
    if (part.type === 'text') {
      const text = part.text.trim();
      if (text) blocks.push({ key, kind: 'prose', text });
      return;
    }
    if (part.state !== 'output-available') return;
    if (part.type === 'tool-showProducts' && !hidesCards && !part.output?.purchaseToolCallId) {
      const cards = validCards(part.output?.products).filter((c) => {
        const id = `${c.handle}#${c.variantId ?? ''}`;
        return !seen.has(id) && seen.add(id);
      });
      if (cards.length) {
        recommendations = cards;
        blocks.push({ key, kind: 'cards', recommendations: cards });
      }
    }
    if (part.type === 'tool-showLinks') {
      links = part.output.links;
      blocks.push({ key, kind: 'links', links });
    }
  });
  const text = blocks.filter((b) => b.kind === 'prose').map((b) => b.text).join('\n\n');
  return { role: 'assistant', text, blocks, streamed: true, ...(recommendations && { recommendations }), ...(links && { links }) };
}

// A mock row: {role, text} or {role:'assistant', blocks:[...]} without keys, or {role:'assistant', parts:[...]}.
function fromRow(row) {
  if (row.role === 'assistant' && Array.isArray(row.parts)) return assistantRow(row.parts, row);
  if (row.role === 'assistant' && Array.isArray(row.blocks)) {
    const blocks = row.blocks.map((b, key) => ({ key, ...b }));
    const text = row.text ?? blocks.filter((b) => b.kind === 'prose').map((b) => b.text).join('\n\n');
    const cards = blocks.filter((b) => b.kind === 'cards').flatMap((b) => b.recommendations);
    return { role: 'assistant', text, blocks, streamed: true, ...(cards.length && { recommendations: cards }) };
  }
  return { streamed: row.role === 'assistant' || undefined, ...row };
}

function fromEvent(event) {
  const data = event.data ?? {};
  if (event.eventType === 'user_message') {
    const parts = data.message?.parts ?? [];
    const shortcut = parts.find((p) => p.type === 'data-shortcut');
    return { role: 'user', text: shortcut?.data?.label ?? data.text ?? '' };
  }
  if (event.eventType !== 'assistant_message') return null;
  if (Array.isArray(data.message?.parts)) {
    return assistantRow(data.message.parts, { autoAddToCart: data.message.metadata?.autoAddToCart === true });
  }
  // V0: data.text is the JSON the model answered with.
  let reply = {};
  try {
    reply = JSON.parse(data.text);
  } catch {
    reply = { message: data.text ?? '' };
  }
  const cards = validCards(reply.recommendations);
  return {
    role: 'assistant',
    text: reply.message ?? '',
    streamed: true,
    ...(cards.length && { recommendations: cards }),
    ...(reply.links?.length && { links: reply.links }),
  };
}

export function toRows(inputs) {
  return inputs.flatMap((input) => {
    // Claude Code saves a large MCP result as [{type:'text', text:'<json>'}].
    if (Array.isArray(input) && input[0]?.type === 'text') input = JSON.parse(input[0].text);
    if (Array.isArray(input?.items)) {
      return input.items.filter((i) => i.kind === 'event').map(fromEvent).filter(Boolean);
    }
    if (Array.isArray(input)) return input.map(fromRow);
    throw new Error('Input is neither conversation-get output nor an array of rows.');
  });
}

export function consoleScript(rows) {
  return `(() => {
  const KEY = ${JSON.stringify(KEY)};
  const reset = "sessionStorage.removeItem('${KEY}'); location.reload()";
  let state = null;
  try { state = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch {}
  const s = state && state.session;
  if (!s || !s.expiresAt || !(s.streaming && s.streaming.url) || new Date(s.expiresAt) <= new Date()) {
    console.warn('Pas de session widget valide dans cet onglet. Ouvre le widget une fois sur cette page, puis recolle ce script. Pour revenir à l\\'état normal : ' + reset);
    return;
  }
  state.messages = ${JSON.stringify(rows, null, 2)};
  state.open = true;
  sessionStorage.setItem(KEY, JSON.stringify(state));
  console.info('Conversation injectée. Pour revenir à l\\'état normal : ' + reset);
  location.reload();
})();
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const outAt = args.indexOf('--out');
  const out = outAt >= 0 ? args.splice(outAt, 2)[1] : join(tmpdir(), 'widget-preview.js');
  const noCopy = args.includes('--no-copy');
  const files = args.filter((a) => a !== '--no-copy');
  if (!files.length) {
    console.error('Usage: node preview.mjs <input.json>... [--out <file>] [--no-copy]');
    process.exit(1);
  }
  const rows = toRows(files.map((f) => JSON.parse(readFileSync(f, 'utf8'))));
  const script = consoleScript(rows);
  writeFileSync(out, script);
  const summary = rows.map((r) => (r.blocks ? r.blocks.map((b) => b.kind).join('+') : r.role)).join(' | ');
  console.log(`${rows.length} rows: ${summary}`);
  console.log(`script: ${out}`);
  if (!noCopy) {
    try {
      execFileSync('pbcopy', { input: script });
      console.log('copied to clipboard');
    } catch {
      console.log('pbcopy unavailable: copy the file by hand');
    }
  }
}
