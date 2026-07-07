'use strict';

const { AIRPORTS, findAirport } = require('../data/airports');
const { baseFareFor } = require('./fareEngine');

/**
 * Suggests hub cities where routing origin -> hub -> destination (booked as
 * two separate legs, or a self-transfer / "virtual interlining") could beat
 * the nonstop/direct-routing fare. This is the same trick sites like
 * Kiwi.com's "nomad" search and virtual-interline OTAs (Kiwi, Levart) exploit.
 */
function layoverSuggestions({ origin, destination, date }) {
  const o = findAirport(origin);
  const d = findAirport(destination);
  if (!o || !d) return { error: 'Unknown origin or destination airport code.' };

  const directPrice = baseFareFor(o.code, d.code, date, { oneWay: false });

  const candidates = AIRPORTS.filter(
    (a) => a.group !== o.group && a.group !== d.group
  );

  const scored = candidates.map((hub) => {
    const leg1 = baseFareFor(o.code, hub.code, date, { oneWay: true });
    const leg2 = baseFareFor(hub.code, d.code, date, { oneWay: true });
    const comboPrice = leg1 != null && leg2 != null ? leg1 + leg2 : null;
    const savings = comboPrice != null && directPrice != null ? directPrice - comboPrice : null;
    return {
      hubCode: hub.code,
      hubCity: hub.city,
      leg1Price: leg1,
      leg2Price: leg2,
      comboPrice,
      directPrice,
      estimatedSavings: savings,
    };
  });

  scored.sort((a, b) => (b.estimatedSavings ?? -Infinity) - (a.estimatedSavings ?? -Infinity));

  return {
    directPrice,
    suggestions: scored.slice(0, 5),
    note:
      'Combo pricing assumes separately-ticketed self-transfer legs (own risk on missed connections/baggage) — verify minimum connection time and re-check-in requirements before booking.',
  };
}

module.exports = { layoverSuggestions };
