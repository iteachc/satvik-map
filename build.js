// Builds docs/index.html (The Satvik Map, with its Map and List views) from template.html + data/places.json.
// Usage: node build.js   (Node 18+, no dependencies)
// Places with a "hide" reason (closed, gone, low rating), no rating, or a rating below 3.6 stay in the data but are
// left off. A "keep" reason overrides the rating rule (low or no rating) for a place asked for by name. Every place needs lat/lng.

const fs = require('fs');
const path = require('path');

const root = __dirname;
const places = JSON.parse(fs.readFileSync(path.join(root, 'data/places.json'), 'utf8'));
const template = fs.readFileSync(path.join(root, 'template.html'), 'utf8');

const MIN_RATING = 3.6;
const TYPES = { meal: 'Meals', pizza: 'Pizza & Italian', quick: 'Quick bites', sweet: 'Sweets & desserts' };
// The city buttons and list sections, in this order, with the names people use; Gurgaon and Delhi split the
// data's "Delhi NCR". `trim` drops the end of an area that the city name already says
// ("Cyber Hub, Gurugram" → "Cyber Hub, Gurgaon").
const CITIES = [
  { id: 'bangalore', label: 'Bangalore', match: (p) => p.city === 'Bengaluru' },
  { id: 'bombay', label: 'Bombay', match: (p) => p.city === 'Mumbai' },
  { id: 'gurgaon', label: 'Gurgaon', match: (p) => p.city === 'Delhi NCR' && /Gurugram/.test(p.area), trim: /,\s*Gurugram$/ },
  { id: 'delhi', label: 'Delhi', match: (p) => p.city === 'Delhi NCR' && !/Gurugram/.test(p.area), trim: /,\s*New Delhi$/ },
  { id: 'baroda', label: 'Baroda', match: (p) => p.city === 'Vadodara' },
];
const START = 'gurgaon'; // where the map opens
const SITE = 'https://iteachc.github.io/satvik-map/'; // for link previews
// New finds (found: true) came from other guides, not your own list. They stay in the data but are left off
// until you've tried them; set this to true to show them, tagged "New find · not tried yet".
const SHOW_NEW_FINDS = false;
// Your links, under "About these places". Discord has no link for a username, so the page copies it on tap.
const GITHUB = 'https://github.com/iteachc';
const DISCORD = 'iteachchem';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// "₹1–200" reads better as "Under ₹200".
const priceText = (s) => `${s.replace(/^₹1–/, 'Under ₹')} per person`;
// "link": a Google Maps share link from Ashish, used as is.
const mapsUrl = (p) => p.link ? p.link : p.lat != null
  ? `https://www.google.com/maps/search/${encodeURIComponent(p.name)}/@${p.lat},${p.lng},17z`
  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.maps || `${p.name} ${p.area}`)}`;

const ids = new Set();
for (const p of places) {
  if (ids.has(p.id)) throw new Error(`Duplicate id ${p.id}`);
  ids.add(p.id);
  if (!TYPES[p.type]) throw new Error(`${p.id}: unknown type "${p.type}"`);
  if (p.note != null && typeof p.note !== 'string') throw new Error(`${p.id}: note must be text`);
  for (const k of ['fullySatvik', 'pureVeg']) if (p[k] != null && typeof p[k] !== 'boolean') throw new Error(`${p.id}: ${k} must be true or false`);
}

const waiting = places.filter((p) => p.found && !SHOW_NEW_FINDS);
const listed = places.filter((p) => !waiting.includes(p) && !p.hide && (p.keep || (p.rating != null && p.rating >= MIN_RATING)));
const noPin = listed.filter((p) => p.lat == null || p.lng == null);
const shown = listed.filter((p) => !noPin.includes(p));

const cityOf = (p) => {
  const c = CITIES.find((c) => c.match(p));
  if (!c) throw new Error(`${p.id}: no city button for "${p.city}"; add it to CITIES`);
  return c;
};
// Best first: fully satvik, then rating, then number of reviews.
const rank = (p) => (p.fullySatvik && !p.found ? 1 : 0);
const cities = CITIES.map((c) => ({
  ...c,
  places: shown.filter(c.match).sort((a, b) => rank(b) - rank(a) || (b.rating ?? 0) - (a.rating ?? 0) || b.reviews - a.reviews),
})).filter((c) => c.places.length);
if (!cities.some((c) => c.id === START)) throw new Error(`START "${START}" has no places`);

// A pin far from the rest of its city is almost always a copy-paste slip in the coordinates.
const median = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];
for (const c of cities) {
  const lat = median(c.places.map((p) => p.lat)), lng = median(c.places.map((p) => p.lng));
  for (const p of c.places) {
    const km = Math.hypot((p.lat - lat) * 111, (p.lng - lng) * 111 * Math.cos(lat * Math.PI / 180));
    if (km > 60) throw new Error(`${p.id}: pin is ${Math.round(km)} km from the rest of ${c.label}; check lat/lng`);
  }
}

// The area without the part the city name already says, and the full "area, city" line.
const areaOf = (p) => { const c = cityOf(p); return c.trim ? p.area.replace(c.trim, '') : p.area; };
const where = (p) => (areaOf(p) ? `${areaOf(p)}, ${cityOf(p).label}` : cityOf(p).label);

// Cards always read: category line (with any badges), name, area, note, price, actions.
// Honesty rules: "Fully satvik" comes only from your own notes (fullySatvik: true), `note` is your note, and new finds
// carry no note and no satvik claim.
const badgesOf = (p) => (p.found ? '<span class="found">New find · not tried yet</span>' : '')
  + (p.fullySatvik && !p.found ? '<span class="badge all">Fully satvik</span>' : '')
  + (p.pureVeg ? '<span class="badge veg">Pure veg</span>' : '');
const noteOf = (p) => (p.found ? '' : p.note || '');
const kindOf = (p) => `${esc(TYPES[p.type])} · ${esc(p.cuisine)}`;
const actions = (p, onMap) => `<div class="actions">
            <a class="maps" href="${esc(mapsUrl(p))}" target="_blank" rel="noopener">Open in Google Maps →</a>${onMap ? `
            <button type="button" class="onmap" data-show="${p.id}">Show on map</button>` : ''}
          </div>`;

// One place: its list card (with "Show on map"), or the map's popup card (without it).
function card(p, popup) {
  const note = noteOf(p);
  return `
        <article class="place"${popup ? ` id="p-${p.id}"` : ` data-ids="${p.id}"`}>
          <p class="head"><span class="kind">${kindOf(p)}</span>${badgesOf(p)}</p>
          <h3>${esc(p.name)}</h3>
          <p class="where">${esc(where(p))}</p>
          ${note ? `<p class="note"><span class="by">From my visit</span> ${esc(note)}</p>` : ''}
          ${p.price ? `<p class="price">${esc(priceText(p.price))}</p>` : ''}
          ${actions(p, !popup)}
        </article>`;
}

// Branches of one chain in the same city share a list card: "4 locations in Bangalore", then each branch's area,
// note, price and its own "Show on map". Badges every branch shares go on the category line, others on the branch.
function groupCard(ps, city) {
  const shared = badgesOf(ps[0]);
  const same = ps.every((p) => badgesOf(p) === shared);
  return `
        <article class="place group" data-ids="${ps.map((p) => p.id).join(' ')}">
          <p class="head"><span class="kind">${kindOf(ps[0])}</span>${same ? shared : ''}</p>
          <h3>${esc(ps[0].name)}</h3>
          <p class="where">${ps.length} locations in ${esc(city.label)}</p>
          <ul class="branches">${ps.map((p) => {
    const note = noteOf(p);
    return `
            <li data-id="${p.id}">
              <p class="branch">${esc(areaOf(p) || city.label)}${same ? '' : badgesOf(p)}</p>
              ${note ? `<p class="note"><span class="by">From my visit</span> ${esc(note)}</p>` : ''}
              ${p.price ? `<p class="price">${esc(priceText(p.price))}</p>` : ''}
              ${actions(p, true)}
            </li>`;
  }).join('')}
          </ul>
        </article>`;
}

// A city's list: places with the same name become one group card, placed where its best branch would be.
function cityCards(c) {
  const groups = [];
  for (const p of c.places) {
    const g = groups.find((g) => g[0].name === p.name);
    if (g) g.push(p); else groups.push([p]);
  }
  return groups.map((g) => (g.length === 1 ? card(g[0], false) : groupCard(g, c))).join('');
}

const sections = cities.map((c) => `
      <section class="city" id="list-${c.id}" data-city="${c.id}" aria-labelledby="h-${c.id}">
        <h2 id="h-${c.id}">${esc(c.label)} <small>${c.places.length} place${c.places.length === 1 ? '' : 's'}</small></h2>
        <div class="grid">${cityCards(c)}
        </div>
      </section>`).join('');
const popups = shown.map((p) => card(p, true)).join('');

// What the pins need; everything else is in the cards.
const data = cities.flatMap((c) => c.places.map((p) => ({
  id: p.id,
  title: `${p.name}, ${where(p)}`,
  in: c.id,
  lat: p.lat,
  lng: p.lng,
  type: p.type,
  full: !!p.fullySatvik && !p.found,
  found: !!p.found,
})));

const PIN_GLYPHS = {
  meal: '<circle cx="14" cy="13.5" r="4.6"/>',
  pizza: '<path d="M8.4 9h11.2L14 19.6z"/>',
  quick: '<path d="M14 7.8l5.7 5.7-5.7 5.7-5.7-5.7z"/>',
  sweet: '<path d="M14 19.4s-5.8-3.5-5.8-7.4c0-1.8 1.3-3.1 3-3.1 1.2 0 2.2.6 2.8 1.6.6-1 1.6-1.6 2.8-1.6 1.7 0 3 1.3 3 3.1 0 3.9-5.8 7.4-5.8 7.4z"/>',
};
const pinSvg = (type) => `<svg class="pin pin-${type}" viewBox="0 0 28 36" aria-hidden="true"><path class="body" d="M14 34.5C11 27.5 2 22 2 13.5a12 12 0 0 1 24 0C26 22 17 27.5 14 34.5z"/><g class="glyph">${PIN_GLYPHS[type]}</g></svg>`;

const chip = (attrs, label, n, on, icon = '') =>
  `<button type="button" class="chip" ${attrs} aria-pressed="${on}">${icon}${esc(label)}${n != null ? `<span class="n">${n}</span>` : ''}</button>`;
const jumpChips = chip('data-jump="all" data-label="India"', 'All India', shown.length, false)
  + cities.map((c) => chip(`data-jump="${c.id}" data-label="${esc(c.label)}"`, c.label, c.places.length, c.id === START)).join('');
const typeChips = chip('data-type="all"', 'All', null, true)
  + Object.entries(TYPES).filter(([k]) => shown.some((p) => p.type === k))
    .map(([k, label]) => chip(`data-type="${k}"`, label, shown.filter((p) => p.type === k).length, false, pinSvg(k))).join('');

const names = cities.map((c) => c.label);
const cityNames = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
const foundCount = shown.filter((p) => p.found).length;
const tried = shown.length - foundCount;
// Say plainly that these are places you've eaten at (New finds, when shown, are the exception).
const eaten = foundCount
  ? `I've eaten at ${tried} of these ${shown.length} places in ${cityNames}; the rest are marked <b>New find</b>.`
  : `I've eaten at every one of these ${shown.length} places, in ${cityNames}.`;

const description = `Satvik food: no onion, no garlic, no caffeine. ${tried} places I've eaten at in ${cityNames}, on a map and as a list.`;

const html = template
  .replaceAll('{{SITE}}', SITE)
  .replaceAll('{{DESCRIPTION}}', esc(description))
  .replaceAll('{{TOTAL}}', String(shown.length))
  .replaceAll('{{CITY_NAMES}}', esc(cityNames))
  .replaceAll('{{ASK}}', shown.some((p) => p.fullySatvik && !p.found)
    ? 'Unless marked <b>Fully satvik</b>, ask for no onion, no garlic when you order.'
    : 'Ask for no onion, no garlic when you order.')
  .replaceAll('{{EATEN}}', eaten.replace(cityNames, esc(cityNames)))
  .replace('{{JUMP_CHIPS}}', jumpChips)
  .replace('{{TYPE_CHIPS}}', typeChips)
  .replace('{{FINDS_SWITCH}}', foundCount ? `<button type="button" class="switch" id="finds" role="switch" aria-checked="true"><span class="track" aria-hidden="true"></span>New finds <span class="n">${foundCount}</span></button>` : '')
  .replace('{{FINDS_ABOUT}}', foundCount ? "<p>Places tagged <b>New find</b> were found through other guides and checked on Google Maps, but haven't been tried yet.</p>" : '')
  .replaceAll('{{LINKS}}', `<p class="links">Made by iteachc: <a href="${esc(GITHUB)}" target="_blank" rel="me noopener">GitHub</a> · `
    + `<button type="button" class="copy" data-copy="${esc(DISCORD)}" title="Copy Discord username">Discord: ${esc(DISCORD)}</button></p>`)
  .replace('{{START}}', START)
  .replace('{{SECTIONS}}', sections)
  .replace('{{POPUPS}}', popups)
  .replace('{{PINS}}', JSON.stringify(Object.fromEntries(Object.keys(TYPES).map((k) => [k, pinSvg(k)]))).replace(/</g, '\\u003c'))
  .replace('{{DATA}}', JSON.stringify(data).replace(/</g, '\\u003c'));

const leftover = html.match(/\{\{[A-Z_]+\}\}/);
if (leftover) throw new Error(`template placeholder ${leftover[0]} was not filled`);

fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
const out = path.join(root, 'docs', 'index.html');
fs.writeFileSync(out, html);

// Share pages: WhatsApp and other apps never see the part of a link after "#", so …/satvik-map/#gurgaon can't have
// its own preview. …/satvik-map/gurgaon/ can: it carries the preview tags and then opens the map on that city.
for (const c of cities) {
  const url = `${SITE}${c.id}/`;
  const title = `Satvik food in ${c.label}`;
  const n = c.places.filter((p) => !p.found).length;
  const desc = `${n} place${n === 1 ? '' : 's'} in ${c.label} where I've eaten food without onion and garlic. On The Satvik Map.`;
  fs.mkdirSync(path.join(root, 'docs', c.id), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', c.id, 'index.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — The Satvik Map</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Satvik Map">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script>location.replace('../#${c.id}');</script>
<noscript><meta http-equiv="refresh" content="0; url=../#${c.id}"></noscript>
<style>body { margin: 0; padding: 40px 16px; font: 17px/1.5 system-ui, sans-serif; background: #f3f6ee; color: #17221a; } a { color: #2d6a38; font-weight: 700; }
@media (prefers-color-scheme: dark) { body { background: #0f1511; color: #edf2ea; } a { color: #8ccf98; } }</style>
</head>
<body>
<p>Opening <a href="../#${c.id}">The Satvik Map: ${esc(c.label)}</a>…</p>
</body>
</html>
`);
}

const hidden = places.filter((p) => !listed.includes(p) && !waiting.includes(p));
console.log(`Built ${path.relative(root, out)}: ${shown.length} places (${cities.map((c) => `${c.label} ${c.places.length}`).join(', ')}), ${foundCount} of them new finds. ${hidden.length} left off${waiting.length ? `, plus ${waiting.length} new finds waiting to be tried (SHOW_NEW_FINDS)` : ''}.`);
for (const p of listed.filter((p) => p.keep)) console.log(`  + ${p.name} (${p.city}): kept, ${p.keep}`);
for (const p of hidden) console.log(`  - ${p.name} (${p.city}): ${p.hide || (p.rating == null ? 'no rating' : 'rating below ' + MIN_RATING)}`);
for (const p of noPin) console.log(`  ! ${p.name} (${p.city}): no lat/lng, so no pin`);
const noNote = shown.filter((p) => !p.found && !p.note);
if (noNote.length) console.log(`${noNote.length} of ${shown.length} places have no note yet (see the TODO list in README.md).`);
