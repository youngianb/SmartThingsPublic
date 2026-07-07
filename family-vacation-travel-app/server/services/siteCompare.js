'use strict';

const { findAirport } = require('../data/airports');
const { baseFareFor, seededRandom } = require('./fareEngine');

/**
 * Simulates fare variance across shopping channels for the same itinerary.
 * Real fares genuinely differ site to site because of OTA markups, hidden
 * resort/booking fees, currency display, and which GDS caches each site reads
 * from. A production build would call each provider's real API/affiliate feed:
 *   - Google Flights: no public API; QPX Express is retired -> scrape via
 *     SerpApi's Google Flights engine or Google's internal partner feed.
 *   - Hopper: no public API; partner/white-label integration only.
 *   - Skyscanner: RapidAPI "Skyscanner Flight Search" or the official
 *     Travel Partner Program feed.
 *   - Airline direct: each carrier's own booking API (e.g. Amadeus for
 *     Developers self-service NDC feeds cover many airlines directly).
 */
const SITES = [
  { key: 'google_flights', label: 'Google Flights', bias: -0.02, spread: 0.05 },
  { key: 'hopper', label: 'Hopper', bias: 0.01, spread: 0.07 },
  { key: 'skyscanner', label: 'Skyscanner', bias: -0.01, spread: 0.06 },
  { key: 'airline_direct', label: 'Airline direct', bias: 0.03, spread: 0.08 },
];

function compareSites({ origin, destination, date, oneWay }) {
  const o = findAirport(origin);
  const d = findAirport(destination);
  if (!o || !d) return { error: 'Unknown origin or destination airport code.' };

  const basePrice = baseFareFor(o.code, d.code, date, { oneWay });
  if (basePrice == null) return { error: 'Could not price this route/date.' };

  const rand = seededRandom(`${o.code}-${d.code}-${date}-sites`);
  const quotes = SITES.map((site) => {
    const noise = (rand() - 0.5) * 2 * site.spread;
    const price = Math.max(1, Math.round(basePrice * (1 + site.bias + noise)));
    return { site: site.key, label: site.label, price };
  });

  quotes.sort((a, b) => a.price - b.price);
  const cheapest = quotes[0];

  return {
    origin: o.code,
    destination: d.code,
    date,
    quotes,
    cheapest,
    spreadAbsolute: quotes[quotes.length - 1].price - quotes[0].price,
  };
}

module.exports = { compareSites, SITES };
