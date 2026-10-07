# The Satvik Map

Places in India where you can eat food without onion and garlic (satvik food), as a map and as a list.
It started as [The Satvik List](https://github.com/iteachc/satvik-list); that site now forwards here, and this repo's
`data/places.json` is the one to keep up to date.

**Website (GitHub Pages):** https://iteachc.github.io/satvik-map/ (served from `docs/index.html` on `main`).

- It opens on the map, zoomed to Gurgaon. The **Map | List** switch shows every place as a card, grouped by city.
- City buttons: All India, Bangalore, Bombay, Gurgaon, Delhi, Baroda. They show only that city's places, on the map
  (fitted to its pins) and in the list, and the count reads e.g. "16 places in Gurgaon". Each list card has "Show on map".
- Links: `…/satvik-map/#delhi` opens the map on a city; `#list` opens the list, `#list-bombay` the list for one city.
  City ids: `bangalore`, `bombay`, `gurgaon`, `delhi`, `baroda`, `all`.

`node build.js` writes `docs/index.html`. Commit and push `docs/` to update the website.

**Sharing on WhatsApp:** apps never see the part of a link after `#`, so for a city preview share
`…/satvik-map/gurgaon/` (or `bangalore/`, `bombay/`, `delhi/`, `baroda/`). It previews as "Satvik food in Gurgaon" and opens the
map on that city. The build writes these pages too. The preview picture is `docs/og.jpg` (1200×630), a screenshot
of the map you can swap for any picture.

## Files
| File | What it is |
|---|---|
| `data/places.json` | Every place: city, area, coordinates, Google rating and review count, price, cuisine, `type` (meal / pizza / quick / sweet), `fullySatvik`, `pureVeg`, your `note`, and `hide` with a reason for places left off. |
| `template.html` | Page design, the map (Leaflet 1.9.4 + Leaflet.markercluster 1.5.3 from cdnjs, OpenStreetMap tiles), the list, and the filters. |
| `build.js` | `node build.js` → `docs/index.html`. Prints which places were left off and why, and any place without coordinates. |
| `docs/index.html` | The website (generated, don't edit by hand). |

## Rules
- Only places from your Google Maps list "Satvik food (without onion and garlic)" plus the ones you've asked for by name.
- Google ratings aren't shown on the site. They stay in the data for two jobs: places with no rating or a rating
  below 3.6 are left off, and within a city places are ordered best-rated first. Places with a `hide` reason are left off too.
  `keep` (a reason) shows a place anyway: Jumbo King Burgers and Koolchas were asked for by name.
- Every place needs `lat`/`lng`. The build stops if a pin lands more than 60 km from the rest of its city.
- Badges only mark exceptions: **Fully satvik** for `"fullySatvik": true` (from your own notes) and **Pure veg** for
  `"pureVeg": true`. The intro says once: unless marked Fully satvik, ask for no onion, no garlic when you order.
- The 15 "new finds" (`found: true`) came from other guides. They stay in the data but are left off until you've
  tried them. Set `SHOW_NEW_FINDS = true` in `build.js` to show them: they get a "New find · not tried yet" tag and
  only facts (area, price), with no note and no satvik claim.
- City names: the data keeps the official ones (Bengaluru, Mumbai, Delhi NCR, Vadodara); `CITIES` in `build.js`
  turns them into Bangalore, Bombay, Gurgaon, Delhi and Baroda.
- "Open in Google Maps" searches the place's name at its coordinates.
- In the list, branches of one chain in the same city (same `name`, e.g. Kailash Parbat ×4 in Bangalore) share one card:
  "4 locations in Bangalore", then each branch with its own note, price and "Show on map". On the map each branch keeps its own pin.

## Adding a note
A note is what to order, or why the place is on your list. It shows on the card right under the name and area.
Every place in `data/places.json` already has a `"note"` field, so adding one is a single edit between the quotes,
then `node build.js` and push. Places without a note just don't show the line.

One place per line. An example entry:

```json
{"id":"kulcha-kulture-ln","name":"Kulcha Kulture","city":"Delhi NCR","area":"Lajpat Nagar II, New Delhi","lat":28.5702,"lng":77.23747,"rating":4.8,"reviews":8135,"price":"₹200–400","cuisine":"Amritsari kulcha","type":"meal","note":"What to order, or why it's here.","pureVeg":true}
```

| Field | What it is |
|---|---|
| `id` | Unique, lowercase-with-dashes. Used in links and "Show on map". |
| `name`, `area`, `city` | Shown on the card. `city` is the official name: Delhi NCR, Bengaluru, Mumbai or Vadodara (Gurgaon is Delhi NCR with "Gurugram" in the area). |
| `lat`, `lng` | Where the pin goes. |
| `rating`, `reviews` | From Google Maps. Not shown; used for the 3.6 cut-off and ordering. |
| `price` | Price per person from Google Maps, e.g. `₹200–400`. Leave `""` if unknown. |
| `cuisine`, `type` | The card's small heading. `type` is `meal`, `pizza`, `quick` or `sweet` and sets the pin. |
| `fullySatvik` | Optional. `true` shows the **Fully satvik** badge: nothing there has onion or garlic. |
| `pureVeg` | Optional. `true` shows a **Pure veg** badge. Not set on any place yet. |
| `note` | Your note. |
| `hide` | Optional: a reason to leave the place off (closed, gone…). |
| `keep` | Optional: a reason to show it even though it's rated below 3.6. |

## TODO: places without a note
**Bangalore**
- [ ] Taaza Thindi (`taaza-thindi`)
- [ ] Brik Oven — Forum Falcon City, Kanakapura Road (`brik-oven-kanakapura`)
- [ ] Anand Sweets & Savouries — Jayanagar (`anand-sweets-jayanagar`)
- [ ] Gramin — Koramangala (`gramin`)
- [ ] Anand Sweets & Savouries — Koramangala (`anand-sweets-koramangala`)
- [ ] Kailash Parbat — Indiranagar (`kailash-parbat-indiranagar`)
- [ ] The Soya Chaap Co. — Arakere, Bannerghatta Road (`soya-chaap-co`)
- [ ] Kota Kachori — Koramangala (`kota-kachori`)
- [ ] Kapoor's Cafe — Jayanagar (`kapoors-cafe`)
- [ ] Sterlings Mac Hotel — Old Airport Road (`sterlings-mac`)
- [ ] MTR (`mtr`)
- [ ] Kailash Parbat — Jayanagar (`kailash-parbat-jayanagar`)
- [ ] Kesariya — Sadashivanagar (`kesariya-north`)
- [ ] Bhartiya Jalpan (`bhartiya-jalpan`)
- [ ] Kesariya — JP Nagar 2nd Phase (`kesariya-south`)
- [ ] Kailash Parbat — Vega City Mall, BTM Layout (`kailash-parbat-vega`)
- [ ] ParkView Vegetarian (`parkview`)

**Bombay**
- [ ] Ram Ashraya — Matunga East (`ram-ashraya`)
- [ ] Joey's Pizza — D.N. Nagar, Andheri West (`joeys-pizza`)
- [ ] Soam — Babulnath, Chowpatty (`soam`)
- [ ] Udupi Shree Krishna — JP Road, Andheri West (`usk`)
- [ ] Vithal's Family Restaurant — Fort, near CST (`vithals`)
- [ ] Guru Da Dhaba — Lokhandwala, Andheri West (`guru-da-dhaba`)

**Gurgaon**
- [ ] Haldiram's — MGF Metropolitan Mall (`haldirams-mgf`)
- [ ] Kulcha Kulture — AIPL Joy Street, Sector 66 (`kulcha-kulture-ggn`)
- [ ] Copper Chimney — Cyber Hub (`copper-chimney-cyberhub`)
- [ ] Pizzeria da Susy — Crosspoint Mall, DLF City IV (`pizzeria-da-susy`)
- [ ] PizzaExpress — Ambience Mall (`pizzaexpress-ambience`)
- [ ] Gulati — DT Mega Mall, Golf Course Road (`gulati-gurgaon`)
- [ ] Sagar Ratna — Ambience Island (`sagar-ratna-ambience`)
- [ ] Naivedyam — Vipul Square, Sushant Lok (`naivedyam-sushant-lok`)
- [ ] Naivedyam — Suncity, Sector 54 (`naivedyam-suncity`)
- [ ] Haldiram's — Ambience Mall (`haldirams-ambience`)
- [ ] Kulcha Lal Parantha Das — Huda Market, Sector 46 (`kulcha-lal-parantha-das`)
- [ ] Punjabi Angithi — DLF Phase 3 (`punjabi-angithi`)
- [ ] Benne – Heritage Bangalore Dosa — Cyber Hub (`benne-cyberhub`)
- [ ] Jay Bhavani Vadapav — DLF Phase IV (`jay-bhavani-vadapav`)
- [ ] Om Chole Bhature Delhi Wale — Vyapar Kendra, Sushant Lok Phase I (`om-chole-bhature`)
- [ ] Prem Bhature Wala — Sushant Lok (`prem-bhature-wala`)
- [ ] Chaat Ka Chaska — MGF Metropolitan Mall (`chaat-ka-chaska-mgf`)

**Delhi**
- [ ] Kulcha Kulture — Lajpat Nagar II (`kulcha-kulture-ln`)
- [ ] Sattvik — Select Citywalk, Saket (`sattvik-saket`)
- [ ] Toscano — Select Citywalk, Saket (`toscano-saket`)
- [ ] Karnataka Food Centre — Sector 12, RK Puram (`karnataka-food-centre`)
- [ ] Veg Gulati — Pandara Road (`veg-gulati`)
- [ ] Gulati — Pandara Road (`gulati-pandara`)
- [ ] Veg Gulati — Green Park Market (`veg-gulati-green-park`)
- [ ] A2B – Adyar Ananda Bhavan — Green Park Market (`a2b-green-park`)
- [ ] Moolchand Parantha — Moolchand, Lajpat Nagar (`moolchand-parantha`)
- [ ] Kake Di Hatti — Chandni Chowk (`kake-di-hatti`)
- [ ] Bengali Sweet Centre — South Extension I (`bengali-sweet-centre`)
- [ ] Old Famous Jalebi Wala — Dariba Kalan, Chandni Chowk (`old-famous-jalebi-wala`)
- [ ] Krishna Di Kulfi — Pandara Market (`krishna-di-kulfi`)
- [ ] Shri Hanuman Kachori — Hanuman Mandir, Connaught Place (`shri-hanuman-kachori`)
- [ ] Softyboy Ice Cream — Central Market, Lajpat Nagar II (`softyboy`)

**Baroda**
- [ ] Pizza On The Rock — Old Padra Road (`pizza-on-the-rock`)
- [ ] Sawan's Gravies — Race Course Road (`sawans-gravies`)

## Data notes
- Added for this site and read from Google Maps on 7 Oct 2026: Om Chole Bhature Delhi Wale, Jumbo King Burgers,
  the Haldiram's at MGF Metropolitan and Ambience Mall, and Benne – Heritage Bangalore Dosa at Cyber Hub (all Gurgaon).
- Added on 8 Oct 2026, read from Google Maps: Sagar Ratna (Ambience Island) and Gulati (DT Mega Mall) in Gurgaon; Gulati
  (Pandara Road), Veg Gulati and A2B (both Green Park Market) in Delhi. Koolchas (Ambience Mall) is back on with your note.
  Coordinates for the new finds were read the same day, ready for when they go on.
