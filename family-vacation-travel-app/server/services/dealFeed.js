'use strict';

const { AIRPORTS, findAirport } = require('../data/airports');
const { baseFareFor, seededRandom } = require('./fareEngine');

const SOURCES = ['Secret Flying', 'Scott\'s Cheap Flights', 'Airfarewatchdog', 'Airline flash sale', 'Fare Detective bot'];

/**
 * Simulates a "deals radar" feed for a home airport. Real error-fare/flash-deal
 * discovery works by diffing today's scraped fares against a rolling baseline
 * and flagging outliers - this mirrors that shape with mock data. A production
 * version would poll a fare-cache (e.g. Amadeus/Kiwi) daily per route and diff.
 */
function monthlyDealsForAirport(originCode, monthDate = new Date()) {
  const origin = findAirport(originCode);
  if (!origin) return { error: 'Unknown origin airport code.' };

  const destinations = AIRPORTS.filter((a) => a.group !== origin.group);
  const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`;
  const rand = seededRandom(`${origin.code}-deals-${monthKey}`);

  const deals = [];
  for (const dest of destinations) {
    const roll = rand();
    if (roll > 0.22) continue; // most routes have no notable deal this month

    const day = 1 + Math.floor(rand() * 27);
    const date = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const normalPrice = baseFareFor(origin.code, dest.code, date, { oneWay: false });
    if (normalPrice == null) continue;

    const isErrorFare = roll < 0.05;
    const discountFactor = isErrorFare ? 0.15 + rand() * 0.15 : 0.45 + rand() * 0.25;
    const dealPrice = Math.round(normalPrice * discountFactor);
    const source = SOURCES[Math.floor(rand() * SOURCES.length)];
    const hoursLeft = isErrorFare ? Math.round(2 + rand() * 10) : Math.round(12 + rand() * 60);

    deals.push({
      destination: dest.code,
      destinationCity: dest.city,
      date,
      normalPrice,
      dealPrice,
      percentOff: Math.round((1 - dealPrice / normalPrice) * 100),
      classification: isErrorFare ? 'possible error fare' : 'flash deal',
      source,
      expiresInHours: hoursLeft,
      caution: isErrorFare
        ? 'Error fares can be cancelled by the airline under DOT/EU261 rules in some cases but not always honored - book only what you can afford to lose, and avoid adding hotels/other bookings until the airline confirms the ticket.'
        : undefined,
    });
  }

  deals.sort((a, b) => b.percentOff - a.percentOff);
  return { origin: origin.code, month: monthKey, deals };
}

module.exports = { monthlyDealsForAirport };
