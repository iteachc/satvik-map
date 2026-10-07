# The Satvik Map

Places in India where you can eat food without onion and garlic (satvik food), as a map and as a list.
It started as [The Satvik List](https://github.com/iteachc/satvik-list); that site now forwards here, and this repo's
`data/places.json` is the one to keep up to date.

**Website (GitHub Pages):** https://iteachc.github.io/satvik-map/ (served from `docs/index.html` on `main`).

- It opens on the map, zoomed to Gurgaon. The **Map | List** switch shows every place as a card, grouped by city.
- City buttons: All India, Bangalore, Bombay, Gurgaon, Delhi, Baroda. On the map they zoom to that city; in the list
  they show only that city. Each list card has "Show on map".
- Links: `…/satvik-map/#delhi` opens the map on a city; `#list` opens the list, `#list-bombay` the list for one city.
  City ids: `bangalore`, `bombay`, `gurgaon`, `delhi`, `baroda`, `all`.

`node build.js` writes `docs/index.html`. Commit and push `docs/` to update the website.

## Files
| File | What it is |
|---|---|
| `data/places.json` | Every place: city, area, coordinates, Google rating and review count, price, cuisine, `type` (meal / pizza / quick / sweet), `satvik` level, `tip`, and `hide` with a reason for places left off. |
| `template.html` | Page design, the map (Leaflet 1.9.4 + Leaflet.markercluster 1.5.3 from cdnjs, OpenStreetMap tiles), the list, and the filters. |
| `build.js` | `node build.js` → `docs/index.html`. Prints which places were left off and why, and any place without coordinates. |
| `docs/index.html` | The website (generated, don't edit by hand). |

## Rules
- Only places from your Google Maps list "Satvik food (without onion and garlic)" plus the ones you've asked for by name.
- Places with a `hide` reason, no rating, or a Google rating below 3.6 are left off.
  `keep` (a reason) shows a place anyway: Jumbo King Burgers was asked for by name.
- Every place needs `lat`/`lng`. The build stops if a pin lands more than 60 km from the rest of its city.
- **Fully satvik** shows only for `satvik: "all"` (from your own notes). Everywhere else the card says
  "Ask for no onion, no garlic". A `tip` is your note and shows as "Note:".
- The 15 "new finds" (`found: true`) came from other guides. They stay in the data but are left off until you've
  tried them. Set `SHOW_NEW_FINDS = true` in `build.js` to show them: they get a "New find · not tried yet" tag and
  only facts (rating, reviews, area, price), with no note and no satvik claim.
- City names: the data keeps the official ones (Bengaluru, Mumbai, Delhi NCR, Vadodara); `CITIES` in `build.js`
  turns them into Bangalore, Bombay, Gurgaon, Delhi and Baroda.
- "Open in Google Maps" searches the place's name at its coordinates.

## Data notes
- Added for this site and read from Google Maps on 7 Oct 2026: Om Chole Bhature Delhi Wale, Jumbo King Burgers,
  the Haldiram's at MGF Metropolitan and Ambience Mall, and Benne – Heritage Bangalore Dosa at Cyber Hub (all Gurgaon).
  Coordinates for the new finds were read the same day, ready for when they go on.
