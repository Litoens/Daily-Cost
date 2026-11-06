// Smoke checks for the static site: every element id that js/app.js looks up must exist in index.html.
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const js = readFileSync('js/app.js', 'utf8');

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
