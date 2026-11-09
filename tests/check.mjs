// Smoke checks for the static site: every element id that js/app.js looks up must exist in index.html.
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const js = readFileSync('js/app.js', 'utf8');
const validateJs = readFileSync('js/validate.js', 'utf8');

const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
const used = [...js.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]);

const missing = [...new Set(used)].filter((id) => !htmlIds.has(id));
if (missing.length) {
  console.error('app.js references ids missing from index.html:', missing.join(', '));
  process.exit(1);
}

const dupes = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]).filter((id, i, a) => a.indexOf(id) !== i);
if (dupes.length) {
  console.error('Duplicate ids in index.html:', [...new Set(dupes)].join(', '));
  process.exit(1);
}

console.log(`OK: ${new Set(used).size} ids found, no duplicates`);

const forbidden = [
  [/onclick=/, 'inline onclick handler'],
  [/window\.deleteCost/, 'global deleteCost'],
  [/\balert\(/, 'alert()']
];
const hits = forbidden.filter(([re]) => re.test(js) || re.test(html)).map(([, why]) => why);
if (hits.length) { console.error('Forbidden patterns:', hits.join(', ')); process.exit(1); }

// i18n: both dictionaries have the same keys, and every key used in index.html / app.js exists.
const { DICT } = await import('../js/i18n.js');
const enKeys = Object.keys(DICT.en);
const esKeys = Object.keys(DICT.es);
const diff = [...enKeys.filter((k) => !esKeys.includes(k)), ...esKeys.filter((k) => !enKeys.includes(k))];
if (diff.length) {
  console.error('i18n keys not in both languages:', diff.join(', '));
  process.exit(1);
}
const usedKeys = [
  ...[...html.matchAll(/data-i18n(?:-placeholder|-aria)?="([^"]+)"/g)].map((m) => m[1]),
  ...[...js.matchAll(/\bt\('([^']+)'[,)]/g)].map((m) => m[1]),
  ...[...js.matchAll(/dataset\.i18n = '([^']+)'/g)].map((m) => m[1]),
  ...[...validateJs.matchAll(/'((?:err|auth|pw)\.[A-Za-z]+)'/g)].map((m) => m[1])
];
const unknown = [...new Set(usedKeys)].filter((k) => !enKeys.includes(k));
if (unknown.length) {
  console.error('i18n keys used but not defined:', unknown.join(', '));
  process.exit(1);
}
console.log(`OK: ${enKeys.length} i18n keys in en and es`);
