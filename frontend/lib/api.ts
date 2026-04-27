import type {
  SearchResponse,
  CalendarPrices,
  FlexibleDatePrice,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

// ── Flights ──────────────────────────────────────────────────────────────────

export interface FlightSearchOptions {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: string;
  nonstopOnly?: boolean;
  maxResults?: number;
}

export async function searchFlights(opts: FlightSearchOptions): Promise<SearchResponse> {
  const params = new URLSearchParams({
    origin: opts.origin,
    destination: opts.destination,
    departure_date: opts.departureDate,
    adults: String(opts.adults ?? 1),
    cabin_class: opts.cabinClass ?? "ECONOMY",
    max_results: String(opts.maxResults ?? 20),
  });
  if (opts.returnDate) params.set("return_date", opts.returnDate);
  if (opts.children) params.set("children", String(opts.children));
  if (opts.infants) params.set("infants", String(opts.infants));
  if (opts.nonstopOnly) params.set("nonstop_only", "true");
  return request<SearchResponse>(`/flights/search?${params}`);
}

export async function getCalendarPrices(
  origin: string,
  destination: string,
  year: number,
  month: number,
  tripType: "oneWay" | "roundtrip" = "oneWay"
): Promise<CalendarPrices> {
  const params = new URLSearchParams({
    origin,
    destination,
    year: String(year),
    month: String(month),
    trip_type: tripType,
  });
  return request<CalendarPrices>(`/flights/calendar-prices?${params}`);
}

export async function getFlexibleDates(
  origin: string,
  destination: string,
  centerDate: string,
  adults = 1
): Promise<FlexibleDatePrice> {
  const params = new URLSearchParams({
    origin,
    destination,
    center_date: centerDate,
    adults: String(adults),
  });
  return request<FlexibleDatePrice>(`/flights/flexible-dates?${params}`);
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessagePayload {
  role: "user" | "assistant";
  content: string;
}

export async function* streamChat(
  messages: ChatMessagePayload[]
): AsyncGenerator<string> {
  const res = await fetch(`${BASE}/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, stream: true }),
  });

  if (!res.ok || !res.body) throw new Error("Chat stream failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    for (const line of chunk.split("\n")) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        if (data.startsWith("[ERROR]")) throw new Error(data);
        yield data;
      }
    }
  }
}

// ── Upload ───────────────────────────────────────────────────────────────────

export async function analyzeDocument(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/upload/analyze`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Upload failed");
  }
  return res.json();
}

// ── Analytics ────────────────────────────────────────────────────────────────

export async function getAirlineReliability() {
  return request<{ airlines: unknown[] }>("/analytics/airline-reliability");
}

export async function getTimeRecommendation(origin = "ORD", destination = "ATL") {
  return request<unknown>(`/analytics/time-recommendation?origin=${origin}&destination=${destination}`);
}

export async function getAirportCongestion() {
  return request<{ airports: unknown[] }>("/analytics/airport-congestion");
}

export async function getWeatherSeverity(origin = "ORD", destination = "ATL") {
  return request<unknown>(`/analytics/weather-severity?origin=${origin}&destination=${destination}`);
}
