// ── Airport ─────────────────────────────────────────────────────────────────
export interface Airport {
  iata: string;
  city: string;
  state: string;
  name: string;
  country: string;
  lat?: number;
  lon?: number;
}

// ── Search ───────────────────────────────────────────────────────────────────
export type TripType = "Roundtrip" | "One-way" | "Multi-city";
export type CabinClass = "Economy" | "Premium Economy" | "Business" | "First class";

export interface TravelerCounts {
  adults: number;
  children: number;
  infants: number;
  cabin: CabinClass;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface SearchState {
  tripType: TripType;
  origin: Airport | null;
  destination: Airport | null;
  dates: DateRange;
  travelers: TravelerCounts;
}

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabinClass?: string;
  nonstopOnly?: boolean;
}

// ── Flights ──────────────────────────────────────────────────────────────────
export interface FlightSegment {
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  aircraft: string;
  operating: string;
}

export interface FlightItinerary {
  duration: string;
  stops: number;
  stopsLabel: string;
  departure: string;
  arrival: string;
  origin: string;
  destination: string;
  segments: FlightSegment[];
  layoverAirports: string[];
}

export interface FlightOffer {
  id: string;
  price: number;
  currency: string;
  airline: string;       // IATA code e.g. "DL"
  airlineName?: string;  // Full name e.g. "Delta" — populated by SerpAPI
  cabin: string;
  carryOn: boolean;
  checkedBags: number;
  outbound: FlightItinerary;
  inbound: FlightItinerary | null;
  refundable: boolean;
  raw?: unknown;
}

export interface SearchResponse {
  flights: FlightOffer[];
  meta: {
    count: number;
    origin: string;
    destination: string;
    departureDate?: string;
    returnDate?: string;
  };
  cheapest: FlightOffer | null;
  empty: boolean;
  emptyReason?: string;
  suggestNearby?: boolean;
}

// ── Calendar Prices ──────────────────────────────────────────────────────────
export interface CalendarPrices {
  prices: Record<string, number>; // "YYYY-MM-DD" → price
  source: "live" | "estimated";
}

export interface FlexibleDatePrice {
  prices: Record<string, number>;
  centerDate: string;
}

// ── Deals ────────────────────────────────────────────────────────────────────
export interface FeaturedDeal {
  price: number;
  airline: string;
  code: string;
  orig: string;
  origIATA: string;
  dest: string;
  destIATA: string;
  date: string;
  type: "Roundtrip" | "One-way";
}

// ── Analytics ────────────────────────────────────────────────────────────────
export interface AirlineReliability {
  code: string;
  name: string;
  onTimePercent: number;
  cancellationRate: number;
  avgDelayMinutes: number;
  logoUrl: string;
}

export interface HourlyDelay {
  hour: number;
  label: string;
  avgDelayMinutes: number;
  onTimePercent: number;
}

export interface WeatherMonth {
  month: string;
  monthIndex: number;
  riskScore: number;
  level: "low" | "medium" | "high";
  disruptionPercent: number;
  factors: string[];
}

// ── Chat ─────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ── Upload ───────────────────────────────────────────────────────────────────
export interface ParsedDocument {
  documentType: string;
  passengerName: string | null;
  airline: string | null;
  airlineCode: string | null;
  flightNumber: string | null;
  origin: { iata: string | null; city: string | null; airport: string | null };
  destination: { iata: string | null; city: string | null; airport: string | null };
  departureDate: string | null;
  departureTime: string | null;
  arrivalDate: string | null;
  arrivalTime: string | null;
  seat: string | null;
  gate: string | null;
  boardingTime: string | null;
  bookingReference: string | null;
  cabinClass: string | null;
  baggage: string | null;
  terminal: string | null;
  aircraft: string | null;
  additionalInfo: string | null;
}
