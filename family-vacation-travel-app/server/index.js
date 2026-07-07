'use strict';

const path = require('path');
const express = require('express');

const { AIRPORTS } = require('./data/airports');
const { cheapestFlights } = require('./services/fareEngine');
const { lowCostCarriersForRoute } = require('./services/lowCostCarriers');
const { layoverSuggestions } = require('./services/layoverEngine');
const { monthlyDealsForAirport } = require('./services/dealFeed');
const { compareSites } = require('./services/siteCompare');
const { createAlert, checkAlert, listAlerts, getAlert } = require('./services/priceAlertStore');
const { optimizeCombo } = require('./services/comboOptimizer');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/airports', (req, res) => {
  res.json({ airports: AIRPORTS });
});

// 1. Cheapest flights, including nearby airports and one-way tickets.
app.get('/api/flights/cheapest', (req, res) => {
  const { origin, destination, startDate, endDate, oneWay, includeNearby } = req.query;
  if (!origin || !destination || !startDate) {
    return res.status(400).json({ error: 'origin, destination and startDate are required.' });
  }
  const result = cheapestFlights({
    origin,
    destination,
    startDate,
    endDate: endDate || startDate,
    oneWay: oneWay === 'true',
    includeNearby: includeNearby !== 'false',
  });
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// 2. Low-cost carriers that don't appear on major travel sites.
app.get('/api/carriers/hidden', (req, res) => {
  const { origin, destination } = req.query;
  if (!origin || !destination) return res.status(400).json({ error: 'origin and destination are required.' });
  const result = lowCostCarriersForRoute({ origin, destination });
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// 3. Cities where adding a layover might reduce overall cost.
app.get('/api/layovers/suggest', (req, res) => {
  const { origin, destination, date } = req.query;
  if (!origin || !destination || !date) return res.status(400).json({ error: 'origin, destination and date are required.' });
  const result = layoverSuggestions({ origin, destination, date });
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// 4. Error fares / flash deals leaving from an airport this month.
app.get('/api/deals', (req, res) => {
  const { origin, month } = req.query;
  if (!origin) return res.status(400).json({ error: 'origin is required.' });
  const monthDate = month ? new Date(`${month}-01`) : new Date();
  const result = monthlyDealsForAirport(origin, monthDate);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// 5. Compare fares across Google Flights, Hopper, Skyscanner, airline pages.
app.get('/api/compare-sites', (req, res) => {
  const { origin, destination, date, oneWay } = req.query;
  if (!origin || !destination || !date) return res.status(400).json({ error: 'origin, destination and date are required.' });
  const result = compareSites({ origin, destination, date, oneWay: oneWay === 'true' });
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// 6. Price alerts: create a multi-day watch, and manually advance/check it.
app.post('/api/alerts', (req, res) => {
  const { origin, destination, date, threshold, watchDays } = req.body || {};
  const result = createAlert({ origin, destination, date, threshold: Number(threshold), watchDays: watchDays ? Number(watchDays) : 3 });
  if (result.error) return res.status(400).json(result);
  res.status(201).json(result);
});

app.get('/api/alerts', (req, res) => {
  res.json({ alerts: listAlerts() });
});

app.get('/api/alerts/:id', (req, res) => {
  const alert = getAlert(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found.' });
  res.json({ alert });
});

app.post('/api/alerts/:id/check', (req, res) => {
  const result = checkAlert(req.params.id);
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

// 7. Optimal combo of round-trip vs one-way tickets.
app.get('/api/combo-optimize', (req, res) => {
  const { origin, destination, departDate, returnDate } = req.query;
  const result = optimizeCombo({ origin, destination, departDate, returnDate });
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Family Vacation Travel App listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
