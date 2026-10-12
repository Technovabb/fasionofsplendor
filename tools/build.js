#!/usr/bin/env node
/*
 * Builds the Fashion of Splendor site from src/ into plain HTML at the top of the folder.
 *
 *   node tools/build.js      build every page, then check links/images
 *
 * Never edit the top-level *.html — the build overwrites them. Edit src/pages/*.html,
 * src/partials/*.html, src/layout.html, assets/css/site.css or assets/js/site.js.
 *
 * PREVIEW = true adds a "design preview" bar and keeps search engines out. Flip to
 * false at launch.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PREVIEW = true;
const SITE_NAME = 'Fashion of Splendor';
const TAGLINE = 'Foreday Morning Band · Barbados';
const FEEDBACK = 'mailto:JuwanPrescod@Technovabb.com?subject=Feedback%3A%20Fashion%20of%20Splendor%20website%20preview';

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const PAGES = path.join(SRC, 'pages');
const PARTIALS = path.join(SRC, 'partials');

function includes(html, seen = []) {
  return html.replace(/<!--\s*include\s+([\w-]+)\s*-->/g, (m, name) => {
    if (seen.includes(name)) throw new Error('include loop: ' + seen.concat(name).join(' > '));
    const f = path.join(PARTIALS, name + '.html');
    if (!fs.existsSync(f)) throw new Error('missing partial: src/partials/' + name + '.html');
    return includes(fs.readFileSync(f, 'utf8'), seen.concat(name));
  });
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

const layout = fs.readFileSync(path.join(SRC, 'layout.html'), 'utf8');
const version = crypto.createHash('md5')
  .update(fs.readFileSync(path.join(ROOT, 'assets/css/site.css')))
  .update(fs.readFileSync(path.join(ROOT, 'assets/js/site.js')))
  .digest('hex').slice(0, 8);

const built = [];
for (const rel of fs.readdirSync(PAGES).filter(f => f.endsWith('.html'))) {
  const raw = fs.readFileSync(path.join(PAGES, rel), 'utf8');
  const m = raw.match(/^\s*<!--meta\s*([\s\S]*?)-->/);
  if (!m) throw new Error(rel + ': missing <!--meta {...} --> header');
  let meta;
  try { meta = JSON.parse(m[1]); } catch (e) { throw new Error(rel + ': bad meta JSON (' + e.message + ')'); }

  const body = includes(raw.slice(m[0].length));
  const scripts = (meta.scripts || []).map(s => `<script src="${s}?v=${version}"></script>`).join('\n');
  const preload = (meta.preload || []).map(p => `<link rel="preload" as="image" href="${p}">`).join('\n');

  let html = includes(layout).replace('{{content}}', () => body);
  html = html
    .replace(/\{\{title\}\}/g, esc(meta.title ? `${meta.title} | ${SITE_NAME}` : `${SITE_NAME} — ${TAGLINE}`))
    .replace(/\{\{description\}\}/g, esc(meta.description || ''))
    .replace(/\{\{bodyClass\}\}/g, meta.bodyClass || '')
    .replace(/\{\{active:(\w+)\}\}/g, (x, key) => (meta.nav === key ? ' is-active' : ''))
    .replace(/\{\{scripts\}\}/g, () => scripts)
    .replace(/\{\{preload\}\}/g, () => preload)
    .replace(/\{\{robots\}\}/g, PREVIEW ? '<meta name="robots" content="noindex, nofollow">' : '')
    .replace(/\{\{previewBar\}\}/g, PREVIEW
      ? `<div class="preview-bar">Design preview for Fashion of Splendor — not the live site. <span class="ph">Bracketed</span> items are details still to confirm for 2027. <a href="${FEEDBACK}">Send feedback</a></div>`
      : '')
    .replace(/\{\{version\}\}/g, version);

  const left = html.match(/\{\{[^}]+\}\}/g);
  if (left) throw new Error(rel + ': unresolved ' + [...new Set(left)].join(', '));
  fs.writeFileSync(path.join(ROOT, rel), html);
  built.push(rel);
}
console.log(`built ${built.length} page(s): ${built.join(', ')}  [v${version}]`);

// checks
const problems = [];
const placeholders = new Map();
for (const rel of built) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(x => x[1]));
  for (const [, attr, url] of html.matchAll(/\s(href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:|#)/.test(url)) {
      if (url.startsWith('#') && url.length > 1 && !ids.has(url.slice(1))) problems.push(`${rel}: ${attr} ${url} (no such id)`);
      continue;
    }
    const target = path.join(ROOT, url.split('#')[0].split('?')[0]);
    if (!fs.existsSync(target)) problems.push(`${rel}: ${attr} ${url} (file missing)`);
  }
  for (const [ph] of html.matchAll(/\[[A-Z][A-Z0-9 .,'&/’-]+\]/g)) placeholders.set(ph, (placeholders.get(ph) || 0) + 1);
}
if (problems.length) { console.log(`\n${problems.length} problem(s):\n  ` + problems.join('\n  ')); process.exitCode = 1; }
else console.log('links and images: all OK');
if (placeholders.size) console.log('\nplaceholders still to fill: ' + [...placeholders.keys()].sort().join(', '));
