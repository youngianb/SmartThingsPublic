'use strict';

const { findAirport, nearbyAirports } = require('../data/airports');
const { carriersForRoute, CARRIERS } = require('../data/carriers');

/**
 * Deterministic pseudo-random generator seeded from a string, so the same
 * route/date/airport combination always returns the same "fares" within a
 * given server run. This stands in for a real GDS/metasearch call - swap
 * `baseFareFor` and friends for calls to Amadeus Flight Offers Search, Kiwi
 * Tequila, or a Skyscanner/RapidAPI provider to go live.
 */
function seededRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function next() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

const BASE_FARE_PER_KM = 0.09;
const MIN_FARE = 39;

function baseFareFor(originCode, destCode, dateStr, { oneWay = false, carrierCode } = {}) {
  const origin = findAirport(originCode);
  const dest = findAirport(destCode);
  if (!origin || !dest) return null;

  const km = distanceKm(origin, dest);
  const seedKey = `${originCode}-${destCode}-${dateStr}-${carrierCode || 'X'}`;
  const rand = seededRandom(seedKey);

  const base = Math.max(MIN_FARE, km * BASE_FARE_PER_KM);
  const demandNoise = 0.75 + rand() * 0.65; // 0.75x - 1.40x
  let fare = base * demandNoise;

  if (oneWay) {
    // One-ways often carry a premium vs. half of a round trip, except on ULCCs.
    fare *= 1.15 + rand() * 0.2;
  } else {
    fare *= 1.7 + rand() * 0.3; // round trip ~= 1.7-2.0x one-way base
  }

  const carrier = CARRIERS.find((c) => c.code === carrierCode);
  if (carrier && !carrier.onMajorOTAs) {
    fare *= 0.82 + rand() * 0.1; // book-direct-only carriers skew cheaper
  }

  return Math.round(fare);
}

function cheapestFlights({ origin, destination, startDate, endDate, oneWay, includeNearby }) {
  const originAirports = includeNearby ? nearbyAirports(origin) : [findAirport(origin)].filter(Boolean);
  const destAirports = includeNearby ? nearbyAirports(destination) : [findAirport(destination)].filter(Boolean);

  if (!originAirports.length || !destAirports.length) {
    return { error: `Unknown airport code. Try one of: ${CARRIERS.length ? 'JFK, LAX, ORD, MCO, MIA, SFO, DCA, LHR, CDG...' : ''}` };
  }

  const dates = enumerateDates(startDate, endDate);
  const results = [];

  for (const o of originAirports) {
    for (const d of destAirports) {
      if (o.code === d.code) continue;
      const carriers = carriersForRoute(o.group, d.group);
      const pool = carriers.length ? carriers : CARRIERS.slice(0, 3);
      for (const date of dates) {
        for (const carrier of pool) {
          const price = baseFareFor(o.code, d.code, date, { oneWay, carrierCode: carrier.code });
          if (price == null) continue;
          results.push({
            origin: o.code,
            originCity: o.city,
            destination: d.code,
            destinationCity: d.city,
            date,
            carrier: carrier.name,
            carrierCode: carrier.code,
            onMajorOTAs: carrier.onMajorOTAs,
            tripType: oneWay ? 'one-way' : 'round-trip',
            price,
          });
        }
      }
    }
  }

  results.sort((a, b) => a.price - b.price);
  return { results: results.slice(0, 25), searched: { originAirports: originAirports.map(a => a.code), destAirports: destAirports.map(a => a.code), dates } };
}

function enumerateDates(startDate, endDate) {
  const dates = [];
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : start;
  if (isNaN(start) || isNaN(end)) return [startDate].filter(Boolean);
  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard < 45) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }
  return dates.length ? dates : [startDate];
}

module.exports = { baseFareFor, cheapestFlights, distanceKm, seededRandom, enumerateDates };
