'use strict';

const { findAirport } = require('../data/airports');
const { carriersForRoute, CARRIERS } = require('../data/carriers');
const { baseFareFor } = require('./fareEngine');

/**
 * Compares three ways to book the same trip:
 *  1. Standard round trip on one carrier.
 *  2. Two separately-booked one-way tickets on the SAME carrier (sometimes
 *     cheaper than that carrier's own round trip fare, since some airlines
 *     price one-ways as exactly half of round trip while others don't).
 *  3. "Mixed" combo: cheapest one-way out (any carrier) + cheapest one-way
 *     back (any carrier), i.e. an open-jaw-style booking across carriers.
 */
function optimizeCombo({ origin, destination, departDate, returnDate }) {
  const o = findAirport(origin);
  const d = findAirport(destination);
  if (!o || !d) return { error: 'Unknown origin or destination airport code.' };
  if (!departDate || !returnDate) return { error: 'departDate and returnDate are required.' };

  const carriers = carriersForRoute(o.group, d.group);
  const pool = carriers.length ? carriers : CARRIERS.slice(0, 3);

  const perCarrier = pool.map((carrier) => {
    const roundTrip = baseFareFor(o.code, d.code, departDate, { oneWay: false, carrierCode: carrier.code });
    const outOneWay = baseFareFor(o.code, d.code, departDate, { oneWay: true, carrierCode: carrier.code });
    const backOneWay = baseFareFor(d.code, o.code, returnDate, { oneWay: true, carrierCode: carrier.code });
    return {
      carrier: carrier.name,
      carrierCode: carrier.code,
      roundTrip,
      twoOneWays: outOneWay + backOneWay,
      outOneWay,
      backOneWay,
    };
  });

  const bestRoundTrip = perCarrier.reduce((best, c) => (c.roundTrip < (best?.roundTrip ?? Infinity) ? c : best), null);
  const bestSameCarrierOneWays = perCarrier.reduce((best, c) => (c.twoOneWays < (best?.twoOneWays ?? Infinity) ? c : best), null);

  const bestOut = perCarrier.reduce((best, c) => (c.outOneWay < (best?.outOneWay ?? Infinity) ? c : best), null);
  const bestBack = perCarrier.reduce((best, c) => (c.backOneWay < (best?.backOneWay ?? Infinity) ? c : best), null);
  const mixedCombo = {
    outCarrier: bestOut.carrier,
    outPrice: bestOut.outOneWay,
    backCarrier: bestBack.carrier,
    backPrice: bestBack.backOneWay,
    total: bestOut.outOneWay + bestBack.backOneWay,
  };

  const options = [
    { type: 'round-trip (single carrier)', carrier: bestRoundTrip.carrier, total: bestRoundTrip.roundTrip },
    { type: 'two one-ways (same carrier)', carrier: bestSameCarrierOneWays.carrier, total: bestSameCarrierOneWays.twoOneWays },
    { type: 'mixed one-ways (best of each direction)', carrier: `${mixedCombo.outCarrier} out / ${mixedCombo.backCarrier} back`, total: mixedCombo.total },
  ];
  options.sort((a, b) => a.total - b.total);
  const best = options[0];
  const worst = options[options.length - 1];

  return {
    origin: o.code,
    destination: d.code,
    departDate,
    returnDate,
    perCarrier,
    options,
    recommended: best,
    maxSavingsVsWorst: worst.total - best.total,
  };
}

module.exports = { optimizeCombo };
