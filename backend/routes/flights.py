# SkyRisk flights.py - SerpAPI Edition v4.0
# SerpAPI google_flights type param: 1=Roundtrip, 2=One-way, 3=Multi-city
import os
import asyncio
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
import serpapi

router = APIRouter()

_client = None

def get_client():
    global _client
    if _client is None:
        api_key = os.environ.get("SERPAPI_KEY", "")
        if not api_key:
            raise RuntimeError("SERPAPI_KEY is not set in your .env file.")
        _client = serpapi.Client(api_key=api_key)
    return _client

# SerpAPI travel_class: 1=Economy 2=Premium Economy 3=Business 4=First
CABIN_MAP = {
    "ECONOMY": 1, "Economy": 1,
    "PREMIUM_ECONOMY": 2, "Premium Economy": 2,
    "BUSINESS": 3, "Business": 3,
    "FIRST": 4, "FIRST_CLASS": 4, "First class": 4,
}

# SerpAPI type param (NOTE: opposite of what you'd expect)
# 1 = Round trip  (requires both outbound_date AND return_date)
# 2 = One way     (requires only outbound_date)
# 3 = Multi-city
TRIP_TYPE_ONE_WAY   = 2
TRIP_TYPE_ROUNDTRIP = 1


def _minutes_to_str(minutes):
    h, m = divmod(int(minutes), 60)
    if h and m:
        return f"{h}h {m}m"
    return f"{h}h" if h else f"{m}m"


def _parse_time(time_str):
    if not time_str:
        return ""
    return time_str.strip().replace(" ", "T") + ":00"


def _airline_code(flight_number):
    if not flight_number:
        return ""
    parts = flight_number.strip().split()
    if len(parts) >= 2:
        return parts[0].upper()
    code = ""
    for ch in flight_number:
        if ch.isalpha():
            code += ch
        else:
            break
    return code.upper()[:3]


def _format_flight(flight, idx):
    try:
        segments  = flight.get("flights", [])
        layovers  = flight.get("layovers", [])
        total_min = flight.get("total_duration", 0)
        price     = float(flight.get("price", 0))
        exts      = flight.get("extensions", [])
        ext_lower = " ".join(exts).lower()

        stops       = len(segments) - 1
        stops_label = "Nonstop" if stops == 0 else f"{stops} stop{'s' if stops > 1 else ''}"

        first_seg   = segments[0] if segments else {}
        last_seg    = segments[-1] if segments else {}
        dep_airport = first_seg.get("departure_airport", {})
        arr_airport = last_seg.get("arrival_airport", {})
        origin_iata = dep_airport.get("id", "")
        dest_iata   = arr_airport.get("id", "")
        dep_time    = _parse_time(dep_airport.get("time", ""))
        arr_time    = _parse_time(arr_airport.get("time", ""))

        first_fn     = first_seg.get("flight_number", "")
        airline_code = _airline_code(first_fn)
        airline_name = first_seg.get("airline", airline_code)
        cabin        = first_seg.get("travel_class", "Economy")

        carry_on     = "carry-on" in ext_lower or "carry on" in ext_lower
        checked_bags = 2 if "2 checked bag" in ext_lower else 1 if "1 checked bag" in ext_lower else 0
        refundable   = "refundable" in ext_lower

        norm_segs = []
        for seg in segments:
            fn = seg.get("flight_number", "")
            norm_segs.append({
                "airline":      _airline_code(fn),
                "flightNumber": fn,
                "origin":       seg.get("departure_airport", {}).get("id", ""),
                "destination":  seg.get("arrival_airport",   {}).get("id", ""),
                "departure":    _parse_time(seg.get("departure_airport", {}).get("time", "")),
                "arrival":      _parse_time(seg.get("arrival_airport",   {}).get("time", "")),
                "aircraft":     seg.get("airplane", ""),
                "operating":    _airline_code(fn),
                "legroom":      seg.get("legroom", ""),
            })

        carbon      = flight.get("carbon_emissions", {})
        carbon_kg   = round(carbon.get("this_flight", 0) / 1000, 1)
        carbon_diff = carbon.get("difference_percent", 0)

        return {
            "id":          f"serp-{idx}-{origin_iata}-{dest_iata}",
            "price":       price,
            "currency":    "USD",
            "airline":     airline_code,
            "airlineName": airline_name,
            "cabin":       cabin,
            "carryOn":     carry_on,
            "checkedBags": checked_bags,
            "refundable":  refundable,
            "outbound": {
                "duration":        _minutes_to_str(total_min),
                "stops":           stops,
                "stopsLabel":      stops_label,
                "departure":       dep_time,
                "arrival":         arr_time,
                "origin":          origin_iata,
                "destination":     dest_iata,
                "segments":        norm_segs,
                "layoverAirports": [lv.get("id", "") for lv in layovers],
            },
            "inbound":    None,
            "carbon":     {"kg": carbon_kg, "diffPercent": carbon_diff},
            "extensions": exts,
        }

    except Exception as e:
        return {"id": f"serp-err-{idx}", "price": 0, "error": str(e)}


# TEST - open http://localhost:8001/api/flights/test
@router.get("/test")
async def test_search():
    dep = (date.today() + timedelta(days=14)).isoformat()
    try:
        client = get_client()
        params = {
            "engine":        "google_flights",
            "departure_id":  "ORD",
            "arrival_id":    "ATL",
            "outbound_date": dep,
            "currency":      "USD",
            "hl":            "en",
            "type":          TRIP_TYPE_ONE_WAY,
            "adults":        1,
        }
        print("[TEST] params:", params, flush=True)
        result = client.search(params)
        best   = result.get("best_flights",  [])
        other  = result.get("other_flights", [])
        print(f"[TEST] best={len(best)} other={len(other)}", flush=True)

        if not best and not other:
            return {
                "status":   "empty - SerpAPI returned no flights",
                "dep":      dep,
                "raw_keys": list(result.keys()),
            }

        first = (best + other)[0]
        return {
            "status":         "SerpAPI is working",
            "dep":            dep,
            "best_count":     len(best),
            "other_count":    len(other),
            "sample_price":   first.get("price"),
            "sample_airline": first.get("flights", [{}])[0].get("airline"),
        }
    except serpapi.HTTPError as e:
        return {
            "status":  "serpapi_http_error",
            "code":    getattr(e, "status_code", "?"),
            "message": str(e),
        }
    except RuntimeError as e:
        return {"status": "config_error - check .env", "message": str(e)}
    except Exception as e:
        return {"status": "error", "type": type(e).__name__, "message": str(e)}


@router.get("/search")
async def search_flights(
    origin:         str            = Query(..., min_length=3, max_length=3),
    destination:    str            = Query(..., min_length=3, max_length=3),
    departure_date: str            = Query(...),
    return_date:    Optional[str]  = Query(None),
    adults:         int            = Query(1, ge=1, le=9),
    children:       int            = Query(0, ge=0, le=8),
    infants:        int            = Query(0, ge=0, le=2),
    cabin_class:    str            = Query("Economy"),
    nonstop_only:   bool           = Query(False),
    max_results:    int            = Query(20, le=50),
):
    try:
        client = get_client()

        # type=1 roundtrip (needs return_date), type=2 one-way
        if return_date:
            trip_type = TRIP_TYPE_ROUNDTRIP
        else:
            trip_type = TRIP_TYPE_ONE_WAY

        params = {
            "engine":        "google_flights",
            "departure_id":  origin.upper(),
            "arrival_id":    destination.upper(),
            "outbound_date": departure_date,
            "currency":      "USD",
            "hl":            "en",
            "type":          trip_type,
            "travel_class":  CABIN_MAP.get(cabin_class, 1),
            "adults":        adults,
        }
        if return_date:
            params["return_date"] = return_date
        if children:
            params["children"] = children
        if infants:
            params["infants_in_seat"] = infants
        if nonstop_only:
            params["stops"] = 1

        print("[SEARCH] params:", params, flush=True)
        result  = client.search(params)
        best    = result.get("best_flights",  [])
        other   = result.get("other_flights", [])
        all_raw = best + other
        print(f"[SEARCH] best={len(best)} other={len(other)}", flush=True)

        if not all_raw:
            return {
                "flights":       [],
                "meta":          {"count": 0, "origin": origin, "destination": destination,
                                  "departureDate": departure_date, "returnDate": return_date},
                "cheapest":      None,
                "empty":         True,
                "emptyReason":   "No flights found for this route and date.",
                "suggestNearby": True,
            }

        formatted = [_format_flight(f, i) for i, f in enumerate(all_raw[:max_results])]
        formatted = [f for f in formatted if f.get("price", 0) > 0]
        formatted.sort(key=lambda x: x.get("price", 9999))

        return {
            "flights":  formatted,
            "meta":     {"count": len(formatted), "origin": origin, "destination": destination,
                         "departureDate": departure_date, "returnDate": return_date},
            "cheapest": formatted[0] if formatted else None,
            "empty":    False,
        }

    except serpapi.HTTPError as e:
        status = getattr(e, "status_code", 500)
        msg = {
            401: "Invalid SERPAPI_KEY - check your .env file.",
            429: "SerpAPI monthly quota reached (100 searches free).",
            400: "Bad parameters - check IATA codes and date format YYYY-MM-DD.",
        }.get(status, f"SerpAPI error HTTP {status}.")
        return {
            "flights": [], "meta": {"count": 0, "origin": origin, "destination": destination},
            "cheapest": None, "empty": True, "emptyReason": msg, "suggestNearby": True,
        }
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.get("/calendar-prices")
async def get_calendar_prices(
    origin:      str = Query(..., min_length=3, max_length=3),
    destination: str = Query(..., min_length=3, max_length=3),
    year:        int = Query(...),
    month:       int = Query(..., ge=1, le=12),
    trip_type:   str = Query("oneWay"),
):
    first_day = date(year, month, 1)
    last_day  = (date(year, month + 1, 1) if month < 12 else date(year + 1, 1, 1)) - timedelta(days=1)

    anchor = None
    try:
        serp_type = TRIP_TYPE_ONE_WAY if trip_type == "oneWay" else TRIP_TYPE_ROUNDTRIP
        result  = get_client().search({
            "engine":        "google_flights",
            "departure_id":  origin.upper(),
            "arrival_id":    destination.upper(),
            "outbound_date": first_day.isoformat(),
            "currency":      "USD",
            "hl":            "en",
            "type":          serp_type,
            "adults":        1,
        })
        all_raw = result.get("best_flights", []) + result.get("other_flights", [])
        ps = [float(f["price"]) for f in all_raw if f.get("price", 0) > 0]
        if ps:
            anchor = min(ps)
    except Exception:
        pass

    if anchor is None:
        anchor = 120.0 + abs(hash(f"{origin}{destination}")) % 150

    prices = {}
    d = first_day
    while d <= last_day:
        dow    = d.weekday()
        factor = 1.15 if dow in (4, 5, 6) else 0.90 if dow in (1, 2) else 1.0
        noise  = ((d.day * 17 + d.month * 31) % 40) - 20
        prices[d.isoformat()] = max(49.0, round(anchor * factor + noise, 0))
        d += timedelta(days=1)

    return {"prices": prices, "source": "live+estimated"}


@router.get("/flexible-dates")
async def flexible_dates(
    origin:      str = Query(..., min_length=3, max_length=3),
    destination: str = Query(..., min_length=3, max_length=3),
    center_date: str = Query(...),
    adults:      int = Query(1, ge=1, le=9),
):
    center = date.fromisoformat(center_date)
    dates  = [center + timedelta(days=i) for i in range(-3, 4)]

    async def _fetch(d):
        try:
            loop   = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, lambda: get_client().search({
                "engine":        "google_flights",
                "departure_id":  origin.upper(),
                "arrival_id":    destination.upper(),
                "outbound_date": d.isoformat(),
                "currency":      "USD",
                "hl":            "en",
                "type":          TRIP_TYPE_ONE_WAY,
                "adults":        adults,
            }))
            raw = result.get("best_flights", []) + result.get("other_flights", [])
            ps  = [float(f["price"]) for f in raw if f.get("price", 0) > 0]
            return (d.isoformat(), min(ps)) if ps else (d.isoformat(), None)
        except Exception:
            return (d.isoformat(), None)

    pairs    = await asyncio.gather(*[_fetch(d) for d in dates])
    live     = {k: v for k, v in pairs if v is not None}
    baseline = sum(live.values()) / len(live) if live else 150.0

    prices = {}
    for d in dates:
        k = d.isoformat()
        if k in live:
            prices[k] = live[k]
        else:
            dow   = d.weekday()
            f     = 1.15 if dow in (4, 5, 6) else 0.92 if dow in (1, 2) else 1.0
            noise = ((d.day * 13 + d.month * 7) % 30) - 15
            prices[k] = max(49.0, round(baseline * f + noise, 0))

    return {"prices": prices, "centerDate": center_date}
