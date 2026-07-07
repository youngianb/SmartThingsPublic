# Family Vacation Travel Planner

A small full-stack app that turns 7 "how do I find a cheap family flight"
questions into working features:

1. **Cheapest flights** — searches a route/date range, including nearby
   airports and one-way fares.
2. **Hidden low-cost carriers** — flags carriers on a route that skip major
   OTAs and are only bookable direct (e.g. Southwest, Ryanair, Allegiant).
3. **Layover savings** — suggests 5 hub cities where a self-transfer layover
   could beat the nonstop price.
4. **Error fares & flash deals** — a simulated deals radar for your home
   airport this month, flagging likely error fares vs. ordinary sales.
5. **Cross-site comparison** — compares the same itinerary's price across
   Google Flights, Hopper, Skyscanner, and the airline's own site.
6. **Price alerts** — creates a 3-day price watch that fires when the fare
   drops below your target.
7. **Combo optimizer** — compares round-trip vs. two one-way tickets (same
   carrier or mixed) and recommends the cheapest way to book the same trip.

## Running it

```bash
cd family-vacation-travel-app
npm install
npm start
```

Then open http://localhost:3000. Airport codes only for now — try
`JFK`/`LGA`/`EWR` (New York), `MCO`/`SFB` (Orlando), `LAX`, `ORD`, `LHR`,
`CDG`. The full seed list is in `server/data/airports.js`.

`npm test` runs the fare-engine/service unit tests in `test/`.

## Architecture

```
server/
  data/
    airports.js     curated airports with "nearby group" tagging
    carriers.js      low-cost carriers per route, flagged on/off major OTAs
  services/
    fareEngine.js        deterministic mock pricing (seeded by route+date)
    lowCostCarriers.js   feature 2
    layoverEngine.js     feature 3
    dealFeed.js          feature 4
    siteCompare.js       feature 5
    priceAlertStore.js   feature 6 (in-memory store + simulated day-advance)
    comboOptimizer.js    feature 7
  index.js           Express app wiring all 7 endpoints
public/              single-page vanilla JS/HTML/CSS frontend, one tab per feature
```

## Important: this runs on mock data, not live fares

There's no live flight-shopping API wired in — `fareEngine.js` generates
**deterministic pseudo-random prices** seeded from the route, date, and
carrier, so the same query always returns the same numbers in a given
server run, but they are not real fares. This keeps the whole app runnable
and demoable with zero API keys / cost.

To go live, swap the mock calls in each service for a real provider. Notes
on what's actually available, since some of the 7 prompts name products
without public APIs:

| Feature | Real data source options |
|---|---|
| 1. Cheapest flights, nearby airports, one-way | [Amadeus Self-Service Flight Offers Search](https://developers.amadeus.com/) or [Kiwi.com Tequila API](https://tequila.kiwi.com/) — both support nearby-airport radius search and one-way pricing natively. |
| 2. Low-cost carriers off major OTAs | No API publishes "who refuses to distribute" — this stays a maintained lookup table (`carriers.js`) built from airline distribution policy, cross-checked against what actually returns from an OTA API call. |
| 3. Layover / self-transfer combos | Kiwi Tequila's "virtual interlining" / nomad search is built for exactly this; price two Amadeus one-way searches and sum as a fallback. |
| 4. Error fares / flash deals | No official feed exists. Realistic approach: poll a fare API daily per route, keep a rolling median, and flag outliers — or subscribe to a deals aggregator's own feed (e.g. Airfarewatchdog, Secret Flying, Scott's Cheap Flights) if they offer one commercially. |
| 5. Google Flights / Hopper / Skyscanner / airline compare | Google Flights and Hopper have **no public API** (Google retired QPX Express); realistic options are [SerpApi's Google Flights engine](https://serpapi.com/google-flights-api) (paid, ToS-compliant scrape) for Google Flights, a Hopper partner/white-label integration (enterprise only) for Hopper, and the official [Skyscanner RapidAPI](https://rapidapi.com/skyscanner/api/skyscanner-flight-search) or Travel Partner Program for Skyscanner. Airline-direct prices come from each carrier's own booking API where available (several are reachable via Amadeus for Developers NDC content). |
| 6. Price alerts | Same Amadeus/Kiwi search on a cron (e.g. daily), persisted in a real DB instead of the in-memory `Map` here, notifying via email/SMS/webhook instead of the "simulate next day" button in the UI. |
| 7. Round-trip vs. one-way combo | Straightforward once you have a real one-way and round-trip pricing call — no special API needed beyond #1. |

None of this involves hidden-city/skiplagging ticketing (booking a
connecting itinerary and skipping the last leg) — that's a different, much
riskier trick that can violate airline contracts of carriage and get
frequent-flyer accounts closed. Feature 7 only ever compares tickets you
actually intend to fly in full.

## API reference

All endpoints are under `/api`. Airport codes are IATA 3-letter codes.

- `GET /api/flights/cheapest?origin=&destination=&startDate=&endDate=&oneWay=&includeNearby=`
- `GET /api/carriers/hidden?origin=&destination=`
- `GET /api/layovers/suggest?origin=&destination=&date=`
- `GET /api/deals?origin=&month=YYYY-MM` (month optional, defaults to current month)
- `GET /api/compare-sites?origin=&destination=&date=&oneWay=`
- `POST /api/alerts` `{ origin, destination, date, threshold, watchDays }`
- `GET /api/alerts` / `GET /api/alerts/:id`
- `POST /api/alerts/:id/check` — advances the simulated watch by one day
- `GET /api/combo-optimize?origin=&destination=&departDate=&returnDate=`
