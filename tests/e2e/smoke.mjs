// Browser smoke + accessibility test for the sign-in page. No login (no test account).
// Requires: playwright and @axe-core/playwright resolvable (CI installs them; see ci.yml).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const ROOT = resolve(import.meta.dirname, '../..');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.json': 'application/json'
};

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = join(ROOT, normalize(p));
    if (!file.startsWith(ROOT)) throw new Error('outside root');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

// PW_CHANNEL=chrome uses an installed Chrome instead of the downloaded Chromium (handy locally).
const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
let failed = false;
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  await page.goto(base, { waitUntil: 'networkidle' });
  const title = await page.title();
  if (!title.includes('Daily Cost Tracker')) { console.error('Unexpected title:', title); failed = true; }
  if (!(await page.locator('#auth-form').isVisible())) { console.error('Sign-in form not visible'); failed = true; }
  if (errors.length) { console.error('Console errors:\n' + errors.join('\n')); failed = true; }

  const { violations } = await new AxeBuilder({ page }).analyze();
  for (const v of violations) {
    console.log(`axe [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`);
  }
  // Serious and critical violations fail the build; moderate and minor ones are only printed.
  const blocking = violations.filter((v) => ['serious', 'critical'].includes(v.impact));
  if (blocking.length) { console.error('Blocking axe violations:', blocking.map((v) => v.id).join(', ')); failed = true; }
} finally {
  await browser.close();
  server.close();
}
if (failed) process.exit(1);
console.log('OK: e2e smoke passed');
