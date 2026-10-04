// Builds dist/satvik-list.html from template.html + data/places.json.
// Usage: node build.js   (Node 18+, no dependencies)
// Places with a "hide" reason (closed, gone, low rating) stay in the data but are left off the page.

const fs = require('fs');
const path = require('path');

const root = __dirname;
const places = JSON.parse(fs.readFileSync(path.join(root, 'data/places.json'), 'utf8'));
const template = fs.readFileSync(path.join(root, 'template.html'), 'utf8');

const UPDATED = 'October 2026';
const MIN_RATING = 3.6;
const CITY_ORDER = ['Delhi NCR', 'Bengaluru', 'Mumbai', 'Vadodara'];
const TYPES = { meal: 'Meals', pizza: 'Pizza & Italian', quick: 'Quick bites', sweet: 'Sweets & desserts' };
const SATVIK = {
  all: 'Fully satvik: no onion or garlic in anything',
  sauce: 'Pizza sauce has no onion or garlic',
  ask: 'Ask for no onion, no garlic',
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const mapsUrl = (p) => p.lat != null
  ? `https://www.google.com/maps/search/${encodeURIComponent(p.name)}/@${p.lat},${p.lng},17z`
  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.maps || `${p.name} ${p.area}`)}`;

const ids = new Set();
for (const p of places) {
  if (ids.has(p.id)) throw new Error(`Duplicate id ${p.id}`);
  ids.add(p.id);
  if (!TYPES[p.type]) throw new Error(`${p.id}: unknown type "${p.type}"`);
  if (!SATVIK[p.satvik]) throw new Error(`${p.id}: unknown satvik value "${p.satvik}"`);
}

const shown = places.filter((p) => !p.hide && p.rating != null && p.rating >= MIN_RATING);
const byCity = new Map();
for (const p of shown) {
  if (!byCity.has(p.city)) byCity.set(p.city, []);
  byCity.get(p.city).push(p);
}
const cities = [...byCity.keys()].sort((a, b) => {
  const ia = CITY_ORDER.indexOf(a), ib = CITY_ORDER.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
});
// Best first: fully satvik, then rating, then number of reviews.
const rank = (p) => (p.satvik === 'all' ? 2 : p.satvik === 'sauce' ? 1 : 0);
for (const list of byCity.values()) list.sort((a, b) => rank(b) - rank(a) || b.rating - a.rating || b.reviews - a.reviews);

function card(p) {
  const stats = [
    `<span><span class="star">★ ${p.rating.toFixed(1)}</span> · ${p.reviews.toLocaleString('en-IN')} Google reviews</span>`,
    p.price ? `<span>${esc(p.price)} per person</span>` : '',
  ].join('');
  return `
      <article class="place" data-city="${slug(p.city)}" data-type="${p.type}">
        ${p.found ? '<span class="found">New find · not tried yet</span>' : ''}
        <span class="kind">${esc(TYPES[p.type])} · ${esc(p.cuisine)}</span>
        <h3>${esc(p.name)}</h3>
        <p class="where">${esc(p.area ? `${p.area}, ${p.city}` : p.city)}</p>
        <p class="stats">${stats}</p>
        <span class="badge ${p.satvik}">${esc(SATVIK[p.satvik])}</span>
        ${p.tip ? `<p class="tip"><b>Note:</b> ${esc(p.tip)}</p>` : ''}
        <a class="maps" href="${esc(mapsUrl(p))}" target="_blank" rel="noopener">Open in Google Maps →</a>
      </article>`;
}

const sections = cities.map((c) => {
  const list = byCity.get(c);
  return `
    <section class="city" id="${slug(c)}" aria-labelledby="h-${slug(c)}">
      <h2 id="h-${slug(c)}">${esc(c)} <small>${list.length} place${list.length === 1 ? '' : 's'}</small></h2>
      <div class="grid">${list.map(card).join('')}
      </div>
    </section>`;
}).join('');

const chip = (key, value, label, n, on) =>
  `<button type="button" class="chip" data-key="${key}" data-value="${value}" aria-pressed="${on}">${esc(label)}${n != null ? `<span class="n">${n}</span>` : ''}</button>`;

const cityChips = chip('city', 'all', 'All', shown.length, true)
  + cities.map((c) => chip('city', slug(c), c, byCity.get(c).length, false)).join('');
const typeChips = chip('type', 'all', 'All', null, true)
  + Object.entries(TYPES).filter(([k]) => shown.some((p) => p.type === k))
    .map(([k, label]) => chip('type', k, label, shown.filter((p) => p.type === k).length, false)).join('');

const cityNames = cities.length > 1 ? `${cities.slice(0, -1).join(', ')} and ${cities[cities.length - 1]}` : cities[0];

const html = template
  .replaceAll('{{TOTAL}}', String(shown.length))
  .replace('{{CITY_NAMES}}', esc(cityNames))
  .replace('{{CITY_CHIPS}}', cityChips)
  .replace('{{TYPE_CHIPS}}', typeChips)
  .replace('{{SECTIONS}}', sections)
  .replace('{{UPDATED}}', UPDATED);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist', 'satvik-list.html');
fs.writeFileSync(out, html);

// Standalone copy for GitHub Pages (docs/index.html). The artifact host wraps the page in a
// document skeleton; here we add our own, moving the <title>/fonts/<style> into <head>.
const split = html.indexOf('<div class="wrap">');
const standalone = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
  + '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  + '<meta name="description" content="Places in Delhi NCR, Bengaluru, Mumbai and Vadodara where you can eat well without onion and garlic.">\n'
  + '<style>body{margin:0}[hidden]{display:none!important}img{max-width:100%}</style>\n'
  + html.slice(0, split) + '\n</head>\n<body>\n' + html.slice(split) + '\n</body>\n</html>\n';
fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs', 'index.html'), standalone);

const hidden = places.filter((p) => !shown.includes(p));
console.log(`Built ${path.relative(root, out)}: ${shown.length} places shown (${cities.map((c) => `${c} ${byCity.get(c).length}`).join(', ')}), ${hidden.length} left off.`);
for (const p of hidden) console.log(`  - ${p.name} (${p.city}): ${p.hide || 'rating below ' + MIN_RATING}`);
