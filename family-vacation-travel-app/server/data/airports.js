'use strict';

/**
 * Small curated airport dataset with nearby-airport groupings.
 * Real deployments would replace this with a geo lookup (e.g. OurAirports data
 * or the Amadeus Airport & City Search API) driven by lat/lon radius.
 */
const AIRPORTS = [
  { code: 'JFK', city: 'New York', country: 'US', group: 'NYC', lat: 40.6413, lon: -73.7781 },
  { code: 'LGA', city: 'New York', country: 'US', group: 'NYC', lat: 40.7769, lon: -73.8740 },
  { code: 'EWR', city: 'Newark', country: 'US', group: 'NYC', lat: 40.6895, lon: -74.1745 },

  { code: 'LAX', city: 'Los Angeles', country: 'US', group: 'LA', lat: 33.9416, lon: -118.4085 },
  { code: 'BUR', city: 'Burbank', country: 'US', group: 'LA', lat: 34.2007, lon: -118.3590 },
  { code: 'LGB', city: 'Long Beach', country: 'US', group: 'LA', lat: 33.8177, lon: -118.1516 },
  { code: 'SNA', city: 'Santa Ana', country: 'US', group: 'LA', lat: 33.6757, lon: -117.8682 },
  { code: 'ONT', city: 'Ontario', country: 'US', group: 'LA', lat: 34.0560, lon: -117.6012 },

  { code: 'ORD', city: 'Chicago', country: 'US', group: 'CHI', lat: 41.9742, lon: -87.9073 },
  { code: 'MDW', city: 'Chicago', country: 'US', group: 'CHI', lat: 41.7868, lon: -87.7522 },

  { code: 'MCO', city: 'Orlando', country: 'US', group: 'ORL', lat: 28.4312, lon: -81.3081 },
  { code: 'SFB', city: 'Sanford', country: 'US', group: 'ORL', lat: 28.7776, lon: -81.2375 },

  { code: 'MIA', city: 'Miami', country: 'US', group: 'MIA', lat: 25.7959, lon: -80.2871 },
  { code: 'FLL', city: 'Fort Lauderdale', country: 'US', group: 'MIA', lat: 26.0726, lon: -80.1527 },
  { code: 'PBI', city: 'West Palm Beach', country: 'US', group: 'MIA', lat: 26.6832, lon: -80.0956 },

  { code: 'SFO', city: 'San Francisco', country: 'US', group: 'SF', lat: 37.6213, lon: -122.3790 },
  { code: 'OAK', city: 'Oakland', country: 'US', group: 'SF', lat: 37.7126, lon: -122.2197 },
  { code: 'SJC', city: 'San Jose', country: 'US', group: 'SF', lat: 37.3639, lon: -121.9289 },

  { code: 'DCA', city: 'Washington', country: 'US', group: 'DC', lat: 38.8512, lon: -77.0402 },
  { code: 'IAD', city: 'Washington', country: 'US', group: 'DC', lat: 38.9531, lon: -77.4565 },
  { code: 'BWI', city: 'Baltimore', country: 'US', group: 'DC', lat: 39.1774, lon: -76.6684 },

  { code: 'LHR', city: 'London', country: 'GB', group: 'LON', lat: 51.4700, lon: -0.4543 },
  { code: 'LGW', city: 'London', country: 'GB', group: 'LON', lat: 51.1537, lon: -0.1821 },
  { code: 'STN', city: 'London', country: 'GB', group: 'LON', lat: 51.8860, lon: 0.2389 },
  { code: 'LTN', city: 'London', country: 'GB', group: 'LON', lat: 51.8747, lon: -0.3683 },

  { code: 'CDG', city: 'Paris', country: 'FR', group: 'PAR', lat: 49.0097, lon: 2.5479 },
  { code: 'ORY', city: 'Paris', country: 'FR', group: 'PAR', lat: 48.7262, lon: 2.3652 },
  { code: 'BVA', city: 'Beauvais', country: 'FR', group: 'PAR', lat: 49.4544, lon: 2.1128 },

  { code: 'CUN', city: 'Cancun', country: 'MX', group: 'CUN', lat: 21.0365, lon: -86.8771 },
  { code: 'DEN', city: 'Denver', country: 'US', group: 'DEN', lat: 39.8561, lon: -104.6737 },
  { code: 'SEA', city: 'Seattle', country: 'US', group: 'SEA', lat: 47.4502, lon: -122.3088 },
  { code: 'ATL', city: 'Atlanta', country: 'US', group: 'ATL', lat: 33.6407, lon: -84.4277 },
  { code: 'BOS', city: 'Boston', country: 'US', group: 'BOS', lat: 42.3656, lon: -71.0096 },
  { code: 'PVD', city: 'Providence', country: 'US', group: 'BOS', lat: 41.7240, lon: -71.4283 },
];

function findAirport(code) {
  return AIRPORTS.find((a) => a.code.toUpperCase() === String(code).toUpperCase());
}

function nearbyAirports(code, { excludeSelf = false } = {}) {
  const origin = findAirport(code);
  if (!origin) return [];
  return AIRPORTS.filter((a) => a.group === origin.group && (!excludeSelf || a.code !== origin.code));
}

module.exports = { AIRPORTS, findAirport, nearbyAirports };
