import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { assistantRow, consoleScript, toRows } from './preview.mjs';

const card = (handle, variantId) => ({ handle, title: handle, price: '10,00 €', variantId });
const shelf = (products, extra = {}) => ({ type: 'tool-showProducts', state: 'output-available', output: { products, ...extra } });

test('keeps the part order: prose, cards, links', () => {
  const row = assistantRow([
    { type: 'step-start' },
    { type: 'text', text: '  Voici.\n' },
    { type: 'text', text: '   ' },
    shelf([card('a', '1'), { handle: 'no-price', title: 'x' }]),
    { type: 'tool-showLinks', state: 'output-available', output: { links: [{ label: 'Guide', url: 'https://example.com' }] } },
  ]);
  assert.deepEqual(row.blocks.map((b) => [b.key, b.kind]), [[1, 'prose'], [3, 'cards'], [4, 'links']]);
  assert.equal(row.text, 'Voici.');
  assert.deepEqual(row.recommendations.map((c) => c.handle), ['a']);
});

test('drops a card already shown in the same reply', () => {
  const row = assistantRow([shelf([card('a', '1')]), { type: 'text', text: 'Et' }, shelf([card('a', '1'), card('a', '2')])]);
  assert.deepEqual(row.blocks[2].recommendations.map((c) => c.variantId), ['2']);
});

test('auto add-to-cart hides the cards of that reply', () => {
  const parts = [{ type: 'text', text: 'Ajouté' }, { type: 'tool-addToCart', state: 'input-available' }, shelf([card('a', '1')])];
  assert.deepEqual(assistantRow(parts, { autoAddToCart: true }).blocks.map((b) => b.kind), ['prose']);
  assert.deepEqual(assistantRow(parts).blocks.map((b) => b.kind), ['prose', 'cards']);
});

test('reads conversation-get events, V2 and V0', () => {
  const rows = toRows([{
    items: [
      { kind: 'index', row: {} },
      { kind: 'event', eventType: 'user_message', data: { text: 'salut', message: { parts: [{ type: 'data-shortcut', data: { label: 'Nouveautés' } }] } } },
      { kind: 'event', eventType: 'assistant_message', data: { message: { parts: [{ type: 'text', text: 'V2' }], metadata: {} } } },
      { kind: 'event', eventType: 'assistant_message', data: { text: JSON.stringify({ message: 'V0', recommendations: [card('b')], links: [] }) } },
    ],
  }]);
  assert.deepEqual(rows.map((r) => [r.role, r.text]), [['user', 'Nouveautés'], ['assistant', 'V2'], ['assistant', 'V0']]);
  assert.equal(rows[2].recommendations[0].handle, 'b');
});

test('the committed mock yields a script that parses', () => {
  const rows = toRows([JSON.parse(readFileSync(new URL('./examples/maquette.json', import.meta.url), 'utf8'))]);
  assert.ok(rows[2].blocks.every((b, i) => b.key === i));
  new Function(consoleScript(rows));
});
