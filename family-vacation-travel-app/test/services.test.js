'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { cheapestFlights } = require('../server/services/fareEngine');
const { lowCostCarriersForRoute } = require('../server/services/lowCostCarriers');
const { layoverSuggestions } = require('../server/services/layoverEngine');
const { monthlyDealsForAirport } = require('../server/services/dealFeed');
const { compareSites } = require('../server/services/siteCompare');
const { createAlert, checkAlert } = require('../server/services/priceAlertStore');
const { optimizeCombo } = require('../server/services/comboOptimizer');

test('cheapestFlights returns sorted, positively priced results including nearby airports', () => {
  const result = cheapestFlights({ origin: 'JFK', destination: 'MCO', startDate: '2026-08-01', endDate: '2026-08-01', oneWay: false, includeNearby: true });
  assert.ok(result.results.length > 0);
  assert.ok(result.searched.originAirports.includes('LGA'));
  for (const r of result.results) assert.ok(r.price > 0);
  for (let i = 1; i < result.results.length; i++) {
    assert.ok(result.results[i].price >= result.results[i - 1].price);
  }
});

test('cheapestFlights rejects unknown airport codes', () => {
  const result = cheapestFlights({ origin: 'ZZZ', destination: 'MCO', startDate: '2026-08-01' });
  assert.ok(result.error);
});

test('lowCostCarriersForRoute splits hidden vs listed carriers', () => {
  const result = lowCostCarriersForRoute({ origin: 'JFK', destination: 'MCO' });
  assert.ok(Array.isArray(result.hiddenFromMajorOTAs));
  assert.ok(Array.isArray(result.onMajorOTAs));
  assert.ok(result.hiddenFromMajorOTAs.some((c) => c.code === 'WN'));
});

test('layoverSuggestions returns 5 ranked suggestions with savings', () => {
  const result = layoverSuggestions({ origin: 'JFK', destination: 'LHR', date: '2026-08-01' });
  assert.equal(result.suggestions.length, 5);
  for (let i = 1; i < result.suggestions.length; i++) {
    assert.ok(result.suggestions[i - 1].estimatedSavings >= result.suggestions[i].estimatedSavings);
  }
});

test('monthlyDealsForAirport produces deterministic deals for a given month', () => {
  const a = monthlyDealsForAirport('JFK', new Date('2026-08-15'));
  const b = monthlyDealsForAirport('JFK', new Date('2026-08-20'));
  assert.deepEqual(a.deals, b.deals);
});

test('compareSites returns 4 site quotes with a cheapest pick', () => {
  const result = compareSites({ origin: 'JFK', destination: 'MCO', date: '2026-08-01', oneWay: false });
  assert.equal(result.quotes.length, 4);
  assert.equal(result.cheapest.price, Math.min(...result.quotes.map((q) => q.price)));
});

test('price alert watches for watchDays and can trigger or expire', () => {
  const { alert } = createAlert({ origin: 'JFK', destination: 'MCO', date: '2026-08-01', threshold: 100000, watchDays: 3 });
  let current = alert;
  for (let i = 0; i < 3 && current.status === 'watching'; i++) {
    current = checkAlert(alert.id).alert;
  }
  assert.equal(current.status, 'triggered'); // absurdly high threshold always triggers
});

test('optimizeCombo returns three ranked booking options', () => {
  const result = optimizeCombo({ origin: 'JFK', destination: 'MCO', departDate: '2026-08-01', returnDate: '2026-08-08' });
  assert.equal(result.options.length, 3);
  assert.ok(result.options[0].total <= result.options[1].total);
  assert.ok(result.options[1].total <= result.options[2].total);
});
