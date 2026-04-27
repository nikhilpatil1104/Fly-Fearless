/**
 * lib/searchHistory.ts
 *
 * Call `saveSearchToHistory(...)` right before you navigate to /flights/search.
 * The history page (/history) reads from the same localStorage key.
 *
 * Usage example in HeroSection:
 *
 *   import { saveSearchToHistory } from "@/lib/searchHistory";
 *
 *   const handleSearch = () => {
 *     saveSearchToHistory({
 *       origin,
 *       originCity: originAirport?.city ?? origin,
 *       destination,
 *       destinationCity: destAirport?.city ?? destination,
 *       tripType,
 *       depDate: departureDate,
 *       retDate: returnDate || undefined,
 *       adults,
 *       cabin,
 *     });
 *     router.push(`/flights/search?...`);
 *   };
 */

export const HISTORY_KEY  = "skyrisk_search_history";
export const MAX_HISTORY  = 8;

export interface SearchHistoryEntry {
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  tripType: string;
  depDate: string;
  retDate?: string;
  adults: number;
  cabin: string;
  /** Optional — shown as the risk badge colour in the history card */
  riskLabel?: "Low Risk" | "Medium Risk" | "High Risk";
  /** ISO timestamp — added automatically by saveSearchToHistory */
  searchedAt: string;
}

/**
 * Prepend a new search entry to localStorage history.
 * Deduplicates by (origin, destination, tripType) — same route just
 * moves to the top rather than creating a duplicate.
 */
export function saveSearchToHistory(
  entry: Omit<SearchHistoryEntry, "searchedAt">
): void {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const existing: SearchHistoryEntry[] = raw ? JSON.parse(raw) : [];

    // Remove exact duplicate (same route + tripType)
    const deduped = existing.filter(
      (e) =>
        !(
          e.origin      === entry.origin &&
          e.destination === entry.destination &&
          e.tripType    === entry.tripType
        )
    );

    const updated: SearchHistoryEntry[] = [
      { ...entry, searchedAt: new Date().toISOString() },
      ...deduped,
    ].slice(0, MAX_HISTORY);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Fails silently in SSR or private browsing
  }
}

export function getSearchHistory(): SearchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
}
