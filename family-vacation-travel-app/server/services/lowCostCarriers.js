'use strict';

const { findAirport } = require('../data/airports');
const { carriersForRoute } = require('../data/carriers');

function lowCostCarriersForRoute({ origin, destination }) {
  const o = findAirport(origin);
  const d = findAirport(destination);
  if (!o || !d) return { error: 'Unknown origin or destination airport code.' };

  const all = carriersForRoute(o.group, d.group);
  const hidden = all.filter((c) => !c.onMajorOTAs);
  const listed = all.filter((c) => c.onMajorOTAs);

  return {
    origin: o.code,
    destination: d.code,
    hiddenFromMajorOTAs: hidden.map(({ code, name, notes }) => ({ code, name, notes })),
    onMajorOTAs: listed.map(({ code, name, notes }) => ({ code, name, notes })),
  };
}

module.exports = { lowCostCarriersForRoute };
