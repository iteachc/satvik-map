# The Satvik List

A guide to places where you can eat well without onion and garlic (satvik food).
Started from the Google Maps list "Satvik food (without onion and garlic)".
Built the same way as the Delhi Outings page (`../Dad events`): JSON data + template + build script.

**Page:** https://claude.ai/artifact/RUHuQEfMaef8mzs9NQsrCb (private until shared from its Share menu)

## Files
| File | What it is |
|---|---|
| `data/places.json` | All 70 places from the Maps list: city, area, coordinates, Google rating and review count, price, cuisine, `type` (meal / pizza / quick / sweet), `satvik` level, `tip`, and `hide` with a reason for places left off the page. |
| `template.html` | Page design and the city/food filters. |
| `build.js` | `node build.js` → `dist/satvik-list.html`. Prints which places were left off and why. |

## How places are labelled
- `satvik: "all"` — the list says nothing there has onion or garlic (e.g. Satvik Kitchen, Bengaluru).
- `satvik: "sauce"` — pizza sauce has no onion or garlic (Brik Oven, Koramangala).
- `satvik: "ask"` — on the list, but you need to ask for no onion, no garlic.
- `tip` — the list's own note, shown on the card.
- Places marked closed, gone, unrated, or rated below 3.6 on Google Maps have a `hide` reason and don't appear.

Ratings and review counts were read from Google Maps on 4 Oct 2026.

## Ideas to brainstorm
- Your own short reviews per place (add a `review` field), photos, "what to order" for every place.
- Let visitors suggest places or leave reviews.
- More cities; refresh ratings from the Maps list on a schedule.
- A proper name and domain, and a GitHub repo if this goes public.
