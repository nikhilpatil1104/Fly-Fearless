import random
from fastapi import APIRouter, Query

router = APIRouter()

# ── Seeded mock data (replace with real BTS/NOAA data CSVs in production) ─────

AIRLINES = [
    {"code": "DL", "name": "Delta Air Lines"},
    {"code": "AA", "name": "American Airlines"},
    {"code": "UA", "name": "United Airlines"},
    {"code": "WN", "name": "Southwest Airlines"},
    {"code": "B6", "name": "JetBlue Airways"},
    {"code": "AS", "name": "Alaska Airlines"},
    {"code": "NK", "name": "Spirit Airlines"},
    {"code": "F9", "name": "Frontier Airlines"},
    {"code": "G4", "name": "Allegiant Air"},
    {"code": "SY", "name": "Sun Country Airlines"},
]

AIRLINE_STATS = {
    "DL": {"onTime": 85.3, "cancellation": 1.2, "avgDelay": 12.4},
    "AA": {"onTime": 79.8, "cancellation": 1.9, "avgDelay": 18.7},
    "UA": {"onTime": 81.2, "cancellation": 1.6, "avgDelay": 16.1},
    "WN": {"onTime": 77.4, "cancellation": 2.3, "avgDelay": 22.3},
    "B6": {"onTime": 73.1, "cancellation": 2.8, "avgDelay": 25.9},
    "AS": {"onTime": 83.7, "cancellation": 1.4, "avgDelay": 14.2},
    "NK": {"onTime": 68.4, "cancellation": 3.4, "avgDelay": 31.2},
    "F9": {"onTime": 70.2, "cancellation": 3.1, "avgDelay": 28.7},
    "G4": {"onTime": 74.6, "cancellation": 2.5, "avgDelay": 24.1},
    "SY": {"onTime": 82.1, "cancellation": 1.7, "avgDelay": 15.8},
}

AIRPORTS = [
    {"iata": "ATL", "name": "Atlanta Hartsfield-Jackson", "city": "Atlanta"},
    {"iata": "ORD", "name": "Chicago O'Hare", "city": "Chicago"},
    {"iata": "LAX", "name": "Los Angeles Intl.", "city": "Los Angeles"},
    {"iata": "DFW", "name": "Dallas/Fort Worth", "city": "Dallas"},
    {"iata": "DEN", "name": "Denver Intl.", "city": "Denver"},
    {"iata": "JFK", "name": "New York JFK", "city": "New York"},
    {"iata": "SFO", "name": "San Francisco Intl.", "city": "San Francisco"},
    {"iata": "SEA", "name": "Seattle-Tacoma", "city": "Seattle"},
    {"iata": "LAS", "name": "Harry Reid Intl.", "city": "Las Vegas"},
    {"iata": "MCO", "name": "Orlando Intl.", "city": "Orlando"},
]

CONGESTION_BASE = {
    "ATL": 94, "ORD": 91, "LAX": 89, "DFW": 86, "DEN": 83,
    "JFK": 88, "SFO": 81, "SEA": 78, "LAS": 75, "MCO": 72,
}


@router.get("/airline-reliability")
async def airline_reliability():
    """On-time %, cancellation rate, and avg delay by airline — sortable."""
    data = []
    for airline in AIRLINES:
        stats = AIRLINE_STATS.get(airline["code"], {"onTime": 75.0, "cancellation": 2.5, "avgDelay": 20.0})
        data.append({
            "code": airline["code"],
            "name": airline["name"],
            "onTimePercent": stats["onTime"],
            "cancellationRate": stats["cancellation"],
            "avgDelayMinutes": stats["avgDelay"],
            "logoUrl": f"https://www.gstatic.com/flights/airline_logos/70px/{airline['code']}.png",
        })
    data.sort(key=lambda x: x["onTimePercent"], reverse=True)
    return {"airlines": data}


@router.get("/time-recommendation")
async def time_recommendation(
    origin: str = Query("ORD"),
    destination: str = Query("ATL"),
):
    """Best/worst hours to fly, and best booking window."""
    rng = random.Random(hash(origin + destination))

    hourly = []
    for hour in range(24):
        # Early morning and midday are typically better
        if hour < 7:
            delay_factor = 0.7 + rng.uniform(0, 0.2)
        elif hour < 11:
            delay_factor = 0.5 + rng.uniform(0, 0.2)  # best window
        elif hour < 15:
            delay_factor = 0.6 + rng.uniform(0, 0.3)
        elif hour < 19:
            delay_factor = 0.9 + rng.uniform(0, 0.4)  # evening rush worst
        else:
            delay_factor = 0.7 + rng.uniform(0, 0.3)

        hourly.append({
            "hour": hour,
            "label": f"{hour % 12 or 12}{'am' if hour < 12 else 'pm'}",
            "avgDelayMinutes": round(delay_factor * 25, 1),
            "onTimePercent": round((1 - delay_factor * 0.4) * 100, 1),
        })

    # Weekly pattern
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    day_factors = [0.75, 0.65, 0.70, 0.80, 1.0, 0.85, 0.75]
    weekly = [
        {"day": d, "avgDelayMinutes": round(f * 22 + rng.uniform(-3, 3), 1)}
        for d, f in zip(days, day_factors)
    ]

    return {
        "hourly": hourly,
        "weekly": weekly,
        "bookingInsight": {
            "bestDayToBook": "Sunday",
            "bestAdvanceDays": "34-86 days",
            "bestTimeOfDay": "6am-11am departures",
            "insight": "Flights departing before 11am are 23% less likely to be delayed than evening flights.",
        },
    }


@router.get("/airport-congestion")
async def airport_congestion():
    """Congestion ranking and peak hours by airport."""
    data = []
    for airport in AIRPORTS:
        base = CONGESTION_BASE.get(airport["iata"], 70)
        rng = random.Random(hash(airport["iata"]))
        peak_hours = sorted(rng.sample(range(6, 23), 3))
        data.append({
            "iata": airport["iata"],
            "name": airport["name"],
            "city": airport["city"],
            "congestionScore": base,
            "level": "high" if base >= 90 else "medium" if base >= 80 else "low",
            "peakHours": peak_hours,
            "avgSecurityMinutes": round(10 + (base - 70) * 0.7, 0),
            "gatesOpen": round(80 + (base - 70) * 0.8),
        })
    data.sort(key=lambda x: x["congestionScore"], reverse=True)
    return {"airports": data}


@router.get("/weather-severity")
async def weather_severity(
    origin: str = Query("ORD"),
    destination: str = Query("ATL"),
):
    """12-month weather disruption risk heatmap for origin/destination."""
    months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ]

    # Risk profiles per airport (higher = more disruptions)
    risk_profiles: dict[str, list[float]] = {
        "ORD": [0.9, 0.85, 0.7, 0.4, 0.3, 0.25, 0.2, 0.2, 0.3, 0.45, 0.65, 0.85],
        "ATL": [0.4, 0.35, 0.3, 0.25, 0.4, 0.55, 0.6, 0.65, 0.45, 0.2, 0.25, 0.35],
        "JFK": [0.85, 0.8, 0.65, 0.35, 0.25, 0.2, 0.2, 0.2, 0.25, 0.4, 0.6, 0.8],
        "LAX": [0.3, 0.25, 0.2, 0.15, 0.15, 0.1, 0.1, 0.1, 0.15, 0.2, 0.25, 0.3],
        "MIA": [0.2, 0.2, 0.3, 0.4, 0.5, 0.7, 0.75, 0.8, 0.65, 0.4, 0.25, 0.2],
        "DEN": [0.85, 0.8, 0.7, 0.5, 0.35, 0.2, 0.15, 0.2, 0.35, 0.5, 0.7, 0.85],
        "SEA": [0.6, 0.55, 0.45, 0.35, 0.25, 0.2, 0.1, 0.1, 0.25, 0.45, 0.6, 0.65],
    }
    factors_map = {
        "ORD": ["snow", "ice", "thunderstorms"],
        "ATL": ["thunderstorms", "fog", "ice"],
        "JFK": ["snow", "wind", "fog"],
        "LAX": ["fog", "wind"],
        "MIA": ["hurricanes", "thunderstorms"],
        "DEN": ["snow", "wind", "ice"],
        "SEA": ["rain", "fog", "wind"],
        "DEFAULT": ["weather"],
    }

    orig_risk = risk_profiles.get(origin.upper(), [0.4] * 12)
    dest_risk = risk_profiles.get(destination.upper(), [0.35] * 12)
    combined = [(o + d) / 2 for o, d in zip(orig_risk, dest_risk)]

    rng = random.Random(hash(origin + destination))
    data = []
    for i, month in enumerate(months):
        score = combined[i]
        data.append({
            "month": month,
            "monthIndex": i + 1,
            "riskScore": round(score, 2),
            "level": "high" if score >= 0.65 else "medium" if score >= 0.4 else "low",
            "disruptionPercent": round(score * 20, 1),
            "factors": factors_map.get(origin.upper(), factors_map["DEFAULT"]) if score > 0.5 else [],
        })

    return {"months": data, "origin": origin, "destination": destination}
