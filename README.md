# The Satvik Map

An interactive map of places in India where you can eat food without onion and garlic (satvik food).
A fork of [The Satvik List](https://github.com/iteachc/satvik-list), built from the same data.

**Website (GitHub Pages):** https://iteachc.github.io/satvik-map/ (served from `docs/index.html` on `main`).
It opens on Gurugram. A link like `…/satvik-map/#bengaluru` opens on another area
(`all`, `gurugram`, `delhi-ncr`, `bengaluru`, `mumbai`, `vadodara`).

`node build.js` writes `docs/index.html`. Commit and push `docs/` to update the website.

## Files
| File | What it is |
|---|---|
| `data/places.json` | Every place: city, area, coordinates, Google rating and review count, price, cuisine, `type` (meal / pizza / quick / sweet), `satvik` level, `tip`, and `hide` with a reason for places left off. |
| `template.html` | Page design, the map (Leaflet 1.9.4 + Leaflet.markercluster 1.5.3 from cdnjs, OpenStreetMap tiles), jump buttons and filters. |
| `build.js` | `node build.js` → `docs/index.html`. Prints which places were left off and why, and any place without coordinates. |
| `docs/index.html` | The website (generated, don't edit by hand). |

## Rules (same as the list)
- Places with a `hide` reason, no rating, or a Google rating below 3.6 are left off.
  `keep` (a reason) shows a place anyway: Jumbo King Burgers was asked for by name.
- Every place shown needs `lat`/`lng`. The build stops if a pin lands more than 60 km from the rest of its city.
- **Fully satvik** shows only for `satvik: "all"` (from your own notes). Everywhere else the card says
  "Ask for no onion, no garlic". A `tip` is your note and shows as "Note:".
- Places tagged "New find" (`found: true`) come from other guides. They show only facts (rating, reviews, area,
  price) with no note and no satvik claim until they've been tried.
- "Open in Google Maps" searches the place's name at its coordinates, the same link the list uses.

## Data notes
- Coordinates for the 15 new finds, and the four Gurugram places added for the map (Om Chole Bhature Delhi Wale,
  Jumbo King Burgers, and the Haldiram's at MGF Metropolitan and Ambience Mall), were read from Google Maps on 7 Oct 2026.
- These additions are only in this repo; The Satvik List's `data/places.json` doesn't have them yet.
