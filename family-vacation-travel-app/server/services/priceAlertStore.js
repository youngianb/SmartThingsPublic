'use strict';

const { findAirport } = require('../data/airports');
const { baseFareFor } = require('./fareEngine');

/**
 * In-memory price-alert store with a simulated multi-day watch. A real
 * deployment would persist alerts (DB) and run a daily cron hitting a live
 * fare API, then push via email/SMS/webhook when the threshold is crossed.
 * Here, `checkAlert` advances a virtual "day" each time it's called so the
 * demo can show a 3-day watch settling on a trigger without waiting 3 days.
 */
let nextId = 1;
const alerts = new Map();

function createAlert({ origin, destination, date, threshold, watchDays = 3 }) {
  const o = findAirport(origin);
  const d = findAirport(destination);
  if (!o || !d) return { error: 'Unknown origin or destination airport code.' };
  if (!threshold || threshold <= 0) return { error: 'threshold must be a positive number.' };

  const id = String(nextId++);
  const alert = {
    id,
    origin: o.code,
    destination: d.code,
    date,
    threshold,
    watchDays,
    daysChecked: 0,
    history: [],
    status: 'watching',
    createdAt: new Date().toISOString(),
  };
  alerts.set(id, alert);
  return { alert };
}

function checkAlert(id) {
  const alert = alerts.get(id);
  if (!alert) return { error: 'Alert not found.' };
  if (alert.status !== 'watching') return { alert };

  alert.daysChecked += 1;
  // Vary the seed per simulated day so price drifts day-to-day like a real watch.
  const price = baseFareFor(alert.origin, alert.destination, `${alert.date}-day${alert.daysChecked}`, { oneWay: false });
  alert.history.push({ day: alert.daysChecked, checkedAt: new Date().toISOString(), price });

  if (price <= alert.threshold) {
    alert.status = 'triggered';
    alert.triggeredPrice = price;
  } else if (alert.daysChecked >= alert.watchDays) {
    alert.status = 'expired';
  }

  return { alert };
}

function listAlerts() {
  return Array.from(alerts.values());
}

function getAlert(id) {
  return alerts.get(id);
}

module.exports = { createAlert, checkAlert, listAlerts, getAlert };
