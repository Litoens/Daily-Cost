// Performance budget: fails if shipped files grow past these limits (bytes, uncompressed).
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const TOTAL_LIMIT = 700 * 1024; // all shipped files together (includes a ~200 KB vendored supabase bundle)
const FILE_LIMIT = 300 * 1024; // any single file
const ENTRIES = ['index.html', '404.html', 'sw.js', 'css', 'js', 'icons', 'icon.svg', 'manifest.webmanifest'];

function walk(p) {
  if (statSync(p).isDirectory()) return readdirSync(p).flatMap((n) => walk(join(p, n)));
  return [[p.split('\\').join('/'), statSync(p).size]];
}

const files = ENTRIES.filter(existsSync).flatMap(walk);
const total = files.reduce((s, [, n]) => s + n, 0);
const kb = (n) => (n / 1024).toFixed(1) + ' KB';
let failed = false;

for (const [f, n] of files.sort((a, b) => b[1] - a[1])) {
  const over = n > FILE_LIMIT;
  if (over) failed = true;
  console.log(`${over ? 'FAIL' : '    '} ${kb(n).padStart(10)}  ${f}`);
}
console.log(`Total: ${kb(total)} (limit ${kb(TOTAL_LIMIT)}), per file limit ${kb(FILE_LIMIT)}`);
if (total > TOTAL_LIMIT) { console.error('Total size over budget'); failed = true; }
if (failed) process.exit(1);
console.log('OK: within performance budget');
