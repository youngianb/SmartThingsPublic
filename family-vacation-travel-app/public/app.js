'use strict';

function tripInputs() {
  return {
    origin: document.getElementById('origin').value.trim().toUpperCase(),
    destination: document.getElementById('destination').value.trim().toUpperCase(),
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
  };
}

function requireTrip(needDates = true) {
  const t = tripInputs();
  if (!t.origin || !t.destination) {
    alert('Enter both an origin and destination airport code first.');
    return null;
  }
  if (needDates && !t.startDate) {
    alert('Pick a depart date first.');
    return null;
  }
  return t;
}

async function getJSON(url) {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Request failed');
  return body;
}

async function postJSON(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Request failed');
  return body;
}

function el(html) {
  const div = document.createElement('div');
  div.innerHTML = html.trim();
  return div.firstElementChild;
}

function renderError(container, err) {
  container.innerHTML = '';
  container.appendChild(el(`<p class="error">${err.message}</p>`));
}

function money(n) {
  return typeof n === 'number' ? `$${n}` : '—';
}

// ---- Tabs ----
document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`panel-${btn.dataset.tab}`).classList.add('active');
  });
});

// ---- 1. Cheapest flights ----
document.getElementById('cheapest-run').addEventListener('click', async () => {
  const trip = requireTrip();
  if (!trip) return;
  const container = document.getElementById('cheapest-results');
  container.innerHTML = '<p class="empty">Searching…</p>';
  const oneWay = document.getElementById('cheapest-oneway').checked;
  const includeNearby = document.getElementById('cheapest-nearby').checked;
  const params = new URLSearchParams({
    origin: trip.origin,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate || trip.startDate,
    oneWay,
    includeNearby,
  });
  try {
    const data = await getJSON(`/api/flights/cheapest?${params}`);
    container.innerHTML = '';
    if (!data.results.length) {
      container.appendChild(el('<p class="empty">No fares found for that route/date range.</p>'));
      return;
    }
    data.results.forEach((r, i) => {
      container.appendChild(el(`
        <div class="card ${i === 0 ? 'best' : ''}">
          <div>
            <strong>${r.originCity} (${r.origin}) → ${r.destinationCity} (${r.destination})</strong>
            <div class="meta">${r.date} · ${r.carrier} · ${r.tripType}${!r.onMajorOTAs ? ' · <span class="tag hidden">book direct</span>' : ''}</div>
          </div>
          <div class="price">${money(r.price)}</div>
        </div>
      `));
    });
  } catch (err) {
    renderError(container, err);
  }
});

// ---- 2. Hidden low-cost carriers ----
document.getElementById('carriers-run').addEventListener('click', async () => {
  const trip = requireTrip(false);
  if (!trip) return;
  const container = document.getElementById('carriers-results');
  container.innerHTML = '<p class="empty">Checking…</p>';
  try {
    const data = await getJSON(`/api/carriers/hidden?origin=${trip.origin}&destination=${trip.destination}`);
    container.innerHTML = '';
    if (data.hiddenFromMajorOTAs.length) {
      container.appendChild(el('<p class="note"><strong>Not reliably on major OTAs — book direct:</strong></p>'));
      data.hiddenFromMajorOTAs.forEach((c) => {
        container.appendChild(el(`
          <div class="card">
            <div><strong>${c.name}</strong> <span class="tag hidden">${c.code}</span><div class="meta">${c.notes}</div></div>
          </div>
        `));
      });
    } else {
      container.appendChild(el('<p class="empty">No book-direct-only carriers found on this route.</p>'));
    }
    if (data.onMajorOTAs.length) {
      container.appendChild(el('<p class="note"><strong>Also on major OTAs:</strong></p>'));
      data.onMajorOTAs.forEach((c) => {
        container.appendChild(el(`
          <div class="card"><div><strong>${c.name}</strong> <span class="tag">${c.code}</span><div class="meta">${c.notes}</div></div></div>
        `));
      });
    }
  } catch (err) {
    renderError(container, err);
  }
});

// ---- 3. Layover savings ----
document.getElementById('layovers-run').addEventListener('click', async () => {
  const trip = requireTrip();
  if (!trip) return;
  const container = document.getElementById('layovers-results');
  container.innerHTML = '<p class="empty">Crunching combinations…</p>';
  try {
    const data = await getJSON(`/api/layovers/suggest?origin=${trip.origin}&destination=${trip.destination}&date=${trip.startDate}`);
    container.innerHTML = '';
    container.appendChild(el(`<p class="note">Nonstop reference price: <strong>${money(data.directPrice)}</strong></p>`));
    data.suggestions.forEach((s) => {
      const better = s.estimatedSavings > 0;
      container.appendChild(el(`
        <div class="card ${better ? 'best' : ''}">
          <div>
            <strong>via ${s.hubCity} (${s.hubCode})</strong>
            <div class="meta">${money(s.leg1Price)} + ${money(s.leg2Price)} legs</div>
          </div>
          <div class="price" style="color:${better ? '' : '#b3261e'}">${better ? '−' : '+'}${money(Math.abs(s.estimatedSavings))}</div>
        </div>
      `));
    });
    container.appendChild(el(`<p class="note">${data.note}</p>`));
  } catch (err) {
    renderError(container, err);
  }
});

// ---- 4. Deals / error fares ----
document.getElementById('deals-run').addEventListener('click', async () => {
  const trip = requireTrip(false);
  if (!trip || !trip.origin) { alert('Enter an origin airport code first.'); return; }
  const container = document.getElementById('deals-results');
  container.innerHTML = '<p class="empty">Scanning…</p>';
  try {
    const data = await getJSON(`/api/deals?origin=${trip.origin}`);
    container.innerHTML = '';
    if (!data.deals.length) {
      container.appendChild(el('<p class="empty">No notable deals detected from this airport this month.</p>'));
      return;
    }
    data.deals.forEach((d) => {
      const isError = d.classification === 'possible error fare';
      container.appendChild(el(`
        <div class="card ${isError ? 'best' : ''}">
          <div>
            <strong>${data.origin} → ${d.destinationCity} (${d.destination})</strong>
            <div class="meta">${d.date} · ${d.source} · expires in ~${d.expiresInHours}h
              <span class="tag ${isError ? 'hidden' : 'warn'}">${d.classification}</span>
            </div>
            ${d.caution ? `<div class="note">${d.caution}</div>` : ''}
          </div>
          <div class="price">${money(d.dealPrice)} <span class="meta">(was ${money(d.normalPrice)}, −${d.percentOff}%)</span></div>
        </div>
      `));
    });
  } catch (err) {
    renderError(container, err);
  }
});

// ---- 5. Compare sites ----
document.getElementById('compare-run').addEventListener('click', async () => {
  const trip = requireTrip();
  if (!trip) return;
  const container = document.getElementById('compare-results');
  container.innerHTML = '<p class="empty">Comparing…</p>';
  try {
    const data = await getJSON(`/api/compare-sites?origin=${trip.origin}&destination=${trip.destination}&date=${trip.startDate}`);
    const rows = data.quotes.map((q) => `
      <tr class="${q.site === data.cheapest.site ? 'best-row' : ''}">
        <td>${q.label}${q.site === data.cheapest.site ? ' 🏆' : ''}</td>
        <td>${money(q.price)}</td>
      </tr>
    `).join('');
    container.innerHTML = `
      <table class="compare-table">
        <thead><tr><th>Site</th><th>Price</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="note">Spread across sites: ${money(data.spreadAbsolute)}. Cheapest: <strong>${data.cheapest.label}</strong> at ${money(data.cheapest.price)}.</p>
    `;
  } catch (err) {
    renderError(container, err);
  }
});

// ---- 6. Price alerts ----
async function refreshAlerts() {
  const container = document.getElementById('alerts-list');
  try {
    const data = await getJSON('/api/alerts');
    container.innerHTML = '';
    if (!data.alerts.length) {
      container.appendChild(el('<p class="empty">No alerts yet. Create one above.</p>'));
      return;
    }
    data.alerts.slice().reverse().forEach((a) => {
      const statusTag = a.status === 'triggered' ? 'tag' : a.status === 'expired' ? 'tag warn' : 'tag hidden';
      const lastPrice = a.history.length ? a.history[a.history.length - 1].price : null;
      container.appendChild(el(`
        <div class="card">
          <div>
            <strong>${a.origin} → ${a.destination}</strong>
            <div class="meta">Target &lt; ${money(a.threshold)} · Day ${a.daysChecked}/${a.watchDays} · <span class="${statusTag}">${a.status}</span></div>
            <div class="note">${a.history.map(h => `day ${h.day}: ${money(h.price)}`).join(' · ') || 'not checked yet'}</div>
          </div>
          <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
            <div class="price">${lastPrice != null ? money(lastPrice) : '—'}</div>
            ${a.status === 'watching' ? `<button data-check="${a.id}">Simulate next day</button>` : ''}
          </div>
        </div>
      `));
    });
    container.querySelectorAll('[data-check]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await postJSON(`/api/alerts/${btn.dataset.check}/check`, {});
        refreshAlerts();
      });
    });
  } catch (err) {
    renderError(container, err);
  }
}

document.getElementById('alert-create').addEventListener('click', async () => {
  const trip = requireTrip();
  if (!trip) return;
  const threshold = Number(document.getElementById('alert-threshold').value);
  try {
    await postJSON('/api/alerts', {
      origin: trip.origin,
      destination: trip.destination,
      date: trip.startDate,
      threshold,
      watchDays: 3,
    });
    refreshAlerts();
  } catch (err) {
    renderError(document.getElementById('alerts-list'), err);
  }
});

document.querySelector('[data-tab="alerts"]').addEventListener('click', refreshAlerts);

// ---- 7. Combo optimizer ----
document.getElementById('combo-run').addEventListener('click', async () => {
  const trip = requireTrip();
  if (!trip || !trip.endDate) { alert('Pick both a Depart date and a Return / range end date first.'); return; }
  const container = document.getElementById('combo-results');
  container.innerHTML = '<p class="empty">Optimizing…</p>';
  try {
    const params = new URLSearchParams({
      origin: trip.origin,
      destination: trip.destination,
      departDate: trip.startDate,
      returnDate: trip.endDate,
    });
    const data = await getJSON(`/api/combo-optimize?${params}`);
    container.innerHTML = '';
    data.options.forEach((o, i) => {
      container.appendChild(el(`
        <div class="card ${i === 0 ? 'best' : ''}">
          <div><strong>${o.type}</strong><div class="meta">${o.carrier}</div></div>
          <div class="price">${money(o.total)}</div>
        </div>
      `));
    });
    container.appendChild(el(`<p class="note">Best option saves up to ${money(data.maxSavingsVsWorst)} vs. the priciest way to book the same trip.</p>`));
  } catch (err) {
    renderError(container, err);
  }
});

// ---- Sensible defaults ----
(function setDefaultDates() {
  const today = new Date();
  const depart = new Date(today);
  depart.setDate(depart.getDate() + 30);
  const back = new Date(depart);
  back.setDate(back.getDate() + 5);
  document.getElementById('startDate').value = depart.toISOString().slice(0, 10);
  document.getElementById('endDate').value = back.toISOString().slice(0, 10);
  document.getElementById('origin').value = 'JFK';
  document.getElementById('destination').value = 'MCO';
})();
