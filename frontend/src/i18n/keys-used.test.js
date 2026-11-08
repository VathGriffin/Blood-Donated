// Every literal key passed to t('…') / rich('…') in the source exists in the English messages,
// so no screen can show a raw key. (Keys built at runtime, like `status.${value}`, are covered
// by the message files' own structure.)
import fs from 'fs';
import path from 'path';
import { translate } from './translate';

const ROOT = path.join(__dirname, '..');
const files = [];
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); } else if (/\.(jsx?|mjs)$/.test(e.name) && !/\.test\./.test(e.name)) files.push(p);
});
walk(ROOT);

const used = new Map();
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/\b(?:t|rich|translate\([^,]+,)\s*\(?\s*'([a-zA-Z]+\.[A-Za-z0-9_.]+)'/g)) {
    if (!used.has(m[1])) used.set(m[1], path.relative(ROOT, file));
  }
}

test('finds the keys used in the app', () => {
  expect(used.size).toBeGreaterThan(1000);
});

test.each([...used.entries()])('%s exists (used in %s)', (key) => {
  const text = translate('en', key, { count: 1 });
  expect(text).not.toBe(key);
});
