/**
 * Airport search utility — 545 airports, 117 countries.
 * Loads from /public/data/airports.json on first use.
 */

import type { Airport } from "./types";

// Curated fallback for immediate render
export const CURATED_AIRPORTS: Airport[] = [
  { iata:"ORD", city:"Chicago",        state:"IL", name:"O'Hare Intl.",                  country:"US" },
  { iata:"ATL", city:"Atlanta",        state:"GA", name:"Hartsfield-Jackson Intl.",       country:"US" },
  { iata:"JFK", city:"New York",       state:"NY", name:"John F. Kennedy Intl.",          country:"US" },
  { iata:"LGA", city:"New York",       state:"NY", name:"LaGuardia",                      country:"US" },
  { iata:"EWR", city:"Newark",         state:"NJ", name:"Newark Liberty Intl.",           country:"US" },
  { iata:"LAX", city:"Los Angeles",    state:"CA", name:"Los Angeles Intl.",              country:"US" },
  { iata:"SFO", city:"San Francisco",  state:"CA", name:"San Francisco Intl.",            country:"US" },
  { iata:"SEA", city:"Seattle",        state:"WA", name:"Seattle-Tacoma Intl.",           country:"US" },
  { iata:"DFW", city:"Dallas",         state:"TX", name:"Dallas/Fort Worth Intl.",        country:"US" },
  { iata:"DEN", city:"Denver",         state:"CO", name:"Denver Intl.",                   country:"US" },
  { iata:"BOS", city:"Boston",         state:"MA", name:"Logan Intl.",                    country:"US" },
  { iata:"MIA", city:"Miami",          state:"FL", name:"Miami Intl.",                    country:"US" },
  { iata:"MCO", city:"Orlando",        state:"FL", name:"Orlando Intl.",                  country:"US" },
  { iata:"LAS", city:"Las Vegas",      state:"NV", name:"Harry Reid Intl.",               country:"US" },
  { iata:"PHX", city:"Phoenix",        state:"AZ", name:"Sky Harbor Intl.",               country:"US" },
  { iata:"IAH", city:"Houston",        state:"TX", name:"George Bush Intercontinental",   country:"US" },
  { iata:"MSP", city:"Minneapolis",    state:"MN", name:"Minneapolis-St. Paul Intl.",     country:"US" },
  { iata:"DTW", city:"Detroit",        state:"MI", name:"Detroit Metropolitan",           country:"US" },
  { iata:"PHL", city:"Philadelphia",   state:"PA", name:"Philadelphia Intl.",             country:"US" },
  { iata:"CLT", city:"Charlotte",      state:"NC", name:"Charlotte Douglas Intl.",        country:"US" },
  { iata:"BWI", city:"Baltimore",      state:"MD", name:"Baltimore/Washington Intl.",     country:"US" },
  { iata:"DCA", city:"Washington",     state:"VA", name:"Ronald Reagan National",         country:"US" },
  { iata:"IAD", city:"Washington",     state:"VA", name:"Washington Dulles Intl.",        country:"US" },
  { iata:"MDW", city:"Chicago",        state:"IL", name:"Midway Intl.",                   country:"US" },
  { iata:"BOM", city:"Mumbai",         state:"",   name:"Chhatrapati Shivaji Maharaj Intl.", country:"IN" },
  { iata:"DEL", city:"New Delhi",      state:"",   name:"Indira Gandhi Intl.",            country:"IN" },
  { iata:"LHR", city:"London",         state:"",   name:"Heathrow",                       country:"GB" },
  { iata:"CDG", city:"Paris",          state:"",   name:"Charles de Gaulle",              country:"FR" },
  { iata:"DXB", city:"Dubai",          state:"",   name:"Dubai Intl.",                    country:"AE" },
  { iata:"NRT", city:"Tokyo",          state:"",   name:"Narita Intl.",                   country:"JP" },
  { iata:"SYD", city:"Sydney",         state:"",   name:"Kingsford Smith Intl.",          country:"AU" },
  { iata:"SIN", city:"Singapore",      state:"",   name:"Changi Airport",                 country:"SG" },
];

// Full dataset cache
let _cache: Airport[] | null = null;

export async function loadAirports(): Promise<Airport[]> {
  if (_cache) return _cache;
  try {
    const res = await fetch("/data/airports.json");
    if (!res.ok) throw new Error("not found");
    const raw = await res.json() as Array<{
      iata: string; name: string; city: string;
      state: string; country: string; lat?: number; lon?: number;
    }>;
    _cache = raw.map((a) => ({
      iata:    a.iata,
      city:    a.city,
      state:   a.state ?? "",
      name:    a.name,
      country: a.country,
      lat:     a.lat,
      lon:     a.lon,
    }));
    return _cache;
  } catch {
    _cache = CURATED_AIRPORTS;
    return _cache;
  }
}

/**
 * Smart search — handles:
 * - "boston" → all airports whose city contains "boston" OR name contains "boston"
 * - "BOS"    → exact IATA match first
 * - "india"  → country matches
 * - "new york" → city contains "new york" (JFK + LGA)
 * Sorts: exact IATA > city starts-with > city contains > name contains > country
 */
export function searchAirports(query: string, airports: Airport[], limit = 8): Airport[] {
  const q = query.toLowerCase().trim();
  if (!q) return airports.slice(0, limit);

  const scored: { airport: Airport; score: number }[] = [];

  for (const a of airports) {
    const iata    = a.iata.toLowerCase();
    const city    = a.city.toLowerCase();
    const name    = a.name.toLowerCase();
    const country = a.country.toLowerCase();
    const state   = (a.state ?? "").toLowerCase();

    let score = -1;

    if (iata === q)                     score = 0;   // exact IATA
    else if (iata.startsWith(q))        score = 1;   // IATA prefix
    else if (city === q)                score = 2;   // exact city
    else if (city.startsWith(q))        score = 3;   // city starts with
    else if (city.includes(q))          score = 4;   // city contains
    else if (name.toLowerCase().split(/[\s\-()]/g).some(w => w.startsWith(q))) score = 5; // word in name starts
    else if (name.includes(q))          score = 6;   // name contains
    else if (state === q)               score = 7;   // exact state
    else if (state.startsWith(q))       score = 8;   // state starts
    else if (country.includes(q))       score = 9;   // country

    if (score >= 0) scored.push({ airport: a, score });
  }

  scored.sort((a, b) => a.score - b.score || a.airport.city.localeCompare(b.airport.city));
  return scored.slice(0, limit).map((s) => s.airport);
}

export function formatAirportLabel(a: Airport): string {
  const region = a.country === "US" ? a.state : a.country;
  return `${a.city}${region ? `, ${region}` : ""} (${a.iata})`;
}
