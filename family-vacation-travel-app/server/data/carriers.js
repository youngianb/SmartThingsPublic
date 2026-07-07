'use strict';

/**
 * Curated set of low-cost / ultra-low-cost carriers, tagged with whether they
 * typically publish fares through the big-3 OTAs (Google Flights, Expedia,
 * Kayak, Skyscanner). Carriers that block themselves from GDS/OTA distribution
 * (book-direct-only) are exactly the ones worth surfacing to a traveler who
 * only ever checks the major aggregators.
 *
 * `routes` lists group codes (see airports.js `group`) the carrier serves,
 * so lookups can key off either endpoint's airport group.
 */
const CARRIERS = [
  { code: 'WN', name: 'Southwest Airlines', region: 'US', onMajorOTAs: false, notes: 'Never distributes through OTAs or GDS; only bookable on southwest.com or its app.', routes: ['NYC', 'CHI', 'LA', 'ORL', 'MIA', 'DEN', 'SEA', 'ATL', 'BOS', 'DC', 'SF'] },
  { code: 'F9', name: 'Frontier Airlines', region: 'US', onMajorOTAs: true, notes: 'Listed on some OTAs but base fares (no bag/seat) usually cheaper booked direct.', routes: ['DEN', 'ORL', 'MIA', 'LA', 'CHI', 'ATL'] },
  { code: 'NK', name: 'Spirit Airlines', region: 'US', onMajorOTAs: true, notes: 'Appears on Google Flights/Kayak; direct site often has fare-club-only deals.', routes: ['ORL', 'MIA', 'LA', 'ATL', 'CHI'] },
  { code: 'B6', name: 'JetBlue', region: 'US', onMajorOTAs: true, notes: 'Fully distributed; included for comparison baseline.', routes: ['NYC', 'BOS', 'ORL', 'LA', 'SF'] },
  { code: 'SY', name: 'Sun Country Airlines', region: 'US', onMajorOTAs: false, notes: 'Limited OTA presence; best fares usually direct on suncountry.com.', routes: ['SEA', 'DEN', 'ORL', 'MIA', 'CHI'] },
  { code: 'G4', name: 'Allegiant Air', region: 'US', onMajorOTAs: false, notes: 'Almost never on major OTAs — serves secondary airports and books direct only.', routes: ['ORL', 'LA', 'DEN', 'ATL'] },
  { code: 'FR', name: 'Ryanair', region: 'EU', onMajorOTAs: false, notes: 'Actively blocks OTA scraping/resale; book only via ryanair.com or the app.', routes: ['LON', 'PAR'] },
  { code: 'W6', name: 'Wizz Air', region: 'EU', onMajorOTAs: false, notes: 'Sparse OTA listings; direct-site fares are typically 15-30% lower.', routes: ['LON', 'PAR'] },
  { code: 'U2', name: 'easyJet', region: 'EU', onMajorOTAs: true, notes: 'Distributed on Skyscanner/Google Flights but not classic GDS/Expedia.', routes: ['LON', 'PAR'] },
  { code: 'VY', name: 'Vueling', region: 'EU', onMajorOTAs: true, notes: 'Generally visible on the major aggregators.', routes: ['PAR', 'LON'] },
  { code: 'AC', name: 'Air Canada Rouge', region: 'CA', onMajorOTAs: true, notes: 'Full distribution baseline carrier.', routes: ['NYC', 'BOS'] },
];

function carriersForRoute(originGroup, destGroup) {
  return CARRIERS.filter((c) => c.routes.includes(originGroup) && c.routes.includes(destGroup));
}

module.exports = { CARRIERS, carriersForRoute };
