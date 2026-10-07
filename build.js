// Builds docs/index.html (The Satvik Map) from template.html + data/places.json.
// Usage: node build.js   (Node 18+, no dependencies)
// Same rules as The Satvik List: places with a "hide" reason (closed, gone, low rating), no rating, or a
// rating below 3.6 stay in the data but are left off the map. A "keep" reason overrides the rating rule
// for a place asked for by name. Every place shown needs lat/lng for its pin.

const fs = require('fs');
const path = require('path');

const root = __dirname;
const places = JSON.parse(fs.readFileSync(path.join(root, 'data/places.json'), 'utf8'));
const template = fs.readFileSync(path.join(root, 'template.html'), 'utf8');

const UPDATED = 'October 2026';
const MIN_RATING = 3.6;
const LIST_URL = 'https://iteachc.github.io/satvik-list/';
const CITY_ORDER = ['Delhi NCR', 'Bengaluru', 'Mumbai', 'Vadodara'];
const TYPES = { meal: 'Meals', pizza: 'Pizza & Italian', quick: 'Quick bites', sweet: 'Sweets & desserts' };
const SATVIK = ['all', 'sauce', 'ask'];
// Parts of a city that get their own jump button. The map opens on START.
const AREAS = [{ id: 'gurugram', label: 'Gurugram', city: 'Delhi NCR', match: (p) => /Gurugram/.test(p.area) }];
const START = 'gurugram';
// New finds (found: true) came from other guides, not your own list. They stay in the data but are left off
// the map until you've tried them; set this to true to show them, tagged "New find · not tried yet".
const SHOW_NEW_FINDS = false;

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
  if (!SATVIK.includes(p.satvik)) throw new Error(`${p.id}: unknown satvik value "${p.satvik}"`);
}

const waiting = places.filter((p) => p.found && !SHOW_NEW_FINDS);
const listed = places.filter((p) => !waiting.includes(p) && !p.hide && p.rating != null && (p.rating >= MIN_RATING || p.keep));
const noPin = listed.filter((p) => p.lat == null || p.lng == null);
const shown = listed.filter((p) => !noPin.includes(p));

const cities = [...new Set(shown.map((p) => p.city))].sort((a, b) => {
  const ia = CITY_ORDER.indexOf(a), ib = CITY_ORDER.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
});

// A pin far from the rest of its city is almost always a copy-paste slip in the coordinates.
const median = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];
for (const c of cities) {
  const inCity = shown.filter((p) => p.city === c);
  const lat = median(inCity.map((p) => p.lat)), lng = median(inCity.map((p) => p.lng));
  for (const p of inCity) {
    const km = Math.hypot((p.lat - lat) * 111, (p.lng - lng) * 111 * Math.cos(lat * Math.PI / 180));
    if (km > 60) throw new Error(`${p.id}: pin is ${Math.round(km)} km from the rest of ${c}; check lat/lng`);
  }
}

const jumps = [
  { id: 'all', label: 'All India', places: shown },
  ...AREAS.map((a) => ({ id: a.id, label: a.label, places: shown.filter(a.match) })),
  ...cities.map((c) => ({ id: slug(c), label: c, places: shown.filter((p) => p.city === c) })),
].filter((j) => j.places.length);
if (!jumps.some((j) => j.id === START)) throw new Error(`START "${START}" has no places`);

// Only what the page needs. Honesty rules: "Fully satvik" comes only from your own notes (satvik "all"),
// and new finds carry no note and no satvik claim.
const data = shown.map((p) => ({
  id: p.id,
  name: p.name,
  where: p.area ? `${p.area}, ${p.city}` : p.city,
  in: jumps.filter((j) => j.id !== 'all' && j.places.includes(p)).map((j) => j.id),
  lat: p.lat,
  lng: p.lng,
  rating: p.rating,
  reviews: p.reviews,
  price: p.price || '',
  type: p.type,
  kind: `${TYPES[p.type]} · ${p.cuisine}`,
  full: p.satvik === 'all' && !p.found,
  note: p.found ? '' : (p.tip || ''),
  found: !!p.found,
  url: mapsUrl(p),
}));

const PIN_GLYPHS = {
  meal: '<circle cx="14" cy="13.5" r="4.6"/>',
  pizza: '<path d="M8.4 9h11.2L14 19.6z"/>',
  quick: '<path d="M14 7.8l5.7 5.7-5.7 5.7-5.7-5.7z"/>',
  sweet: '<path d="M14 19.4s-5.8-3.5-5.8-7.4c0-1.8 1.3-3.1 3-3.1 1.2 0 2.2.6 2.8 1.6.6-1 1.6-1.6 2.8-1.6 1.7 0 3 1.3 3 3.1 0 3.9-5.8 7.4-5.8 7.4z"/>',
};
const pinSvg = (type) => `<svg class="pin pin-${type}" viewBox="0 0 28 36" aria-hidden="true"><path class="body" d="M14 34.5C11 27.5 2 22 2 13.5a12 12 0 0 1 24 0C26 22 17 27.5 14 34.5z"/><g class="glyph">${PIN_GLYPHS[type]}</g></svg>`;

const chip = (attrs, label, n, on, icon = '') =>
  `<button type="button" class="chip" ${attrs} aria-pressed="${on}">${icon}${esc(label)}${n != null ? `<span class="n">${n}</span>` : ''}</button>`;
const jumpChips = jumps.map((j) => chip(`data-jump="${j.id}"`, j.label, j.places.length, j.id === START)).join('');
const typeChips = chip('data-type="all"', 'All', null, true)
  + Object.entries(TYPES).filter(([k]) => shown.some((p) => p.type === k))
    .map(([k, label]) => chip(`data-type="${k}"`, label, shown.filter((p) => p.type === k).length, false, pinSvg(k))).join('');

const cityNames = cities.length > 1 ? `${cities.slice(0, -1).join(', ')} and ${cities[cities.length - 1]}` : cities[0];
const foundCount = shown.filter((p) => p.found).length;

const html = template
  .replaceAll('{{TOTAL}}', String(shown.length))
  .replaceAll('{{CITY_NAMES}}', esc(cityNames))
  .replace('{{JUMP_CHIPS}}', jumpChips)
  .replace('{{TYPE_CHIPS}}', typeChips)
  .replace('{{FINDS_SWITCH}}', foundCount ? `<button type="button" class="switch" id="finds" role="switch" aria-checked="true"><span class="track" aria-hidden="true"></span>New finds <span class="n">${foundCount}</span></button>` : '')
  .replace('{{FINDS_ABOUT}}', foundCount ? " Places tagged <b>New find</b> were found through other guides and checked on Google Maps, but haven't been tried yet." : '')
  .replaceAll('{{LIST_URL}}', LIST_URL)
  .replace('{{UPDATED}}', UPDATED)
  .replace('{{START}}', START)
  .replace('{{PINS}}', JSON.stringify(Object.fromEntries(Object.keys(TYPES).map((k) => [k, pinSvg(k)]))).replace(/</g, '\\u003c'))
  .replace('{{DATA}}', JSON.stringify(data).replace(/</g, '\\u003c'));

const leftover = html.match(/\{\{[A-Z_]+\}\}/);
if (leftover) throw new Error(`template placeholder ${leftover[0]} was not filled`);

fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
const out = path.join(root, 'docs', 'index.html');
fs.writeFileSync(out, html);

const hidden = places.filter((p) => !listed.includes(p) && !waiting.includes(p));
console.log(`Built ${path.relative(root, out)}: ${shown.length} pins (${jumps.filter((j) => j.id !== 'all').map((j) => `${j.label} ${j.places.length}`).join(', ')}), ${foundCount} of them new finds. ${hidden.length} left off${waiting.length ? `, plus ${waiting.length} new finds waiting to be tried (SHOW_NEW_FINDS)` : ''}.`);
for (const p of listed.filter((p) => p.keep)) console.log(`  + ${p.name} (${p.city}): kept, ${p.keep}`);
for (const p of hidden) console.log(`  - ${p.name} (${p.city}): ${p.hide || (p.rating == null ? 'no rating' : 'rating below ' + MIN_RATING)}`);
for (const p of noPin) console.log(`  ! ${p.name} (${p.city}): no lat/lng, so no pin`);
