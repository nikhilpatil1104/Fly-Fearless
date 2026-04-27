# ✈ SkyRisk — Production Flight Booking Platform

> Pixel-for-pixel Expedia clone powered by **SerpAPI Google Flights** + **OpenAI GPT-4o** + **Next.js 14** + **FastAPI**

---

## 🗂 Project Structure

```
skyrisk/
├── frontend/          ← Next.js 14 App Router (deploy → Vercel)
│   ├── app/
│   │   ├── page.tsx               # Homepage: hero + search + deals + FAQ
│   │   ├── flights/
│   │   │   ├── search/page.tsx    # Results: sticky search + sidebar + cards
│   │   │   └── deals/page.tsx     # Deals page: dynamic heading + alt airports
│   │   ├── explore/page.tsx       # Analytics dashboard (4 Recharts panels)
│   │   ├── chat/page.tsx          # Full-page AI chat (GPT-4o streaming)
│   │   └── upload/page.tsx        # Boarding pass OCR (GPT-4o Vision)
│   ├── components/
│   │   ├── navbar/Navbar.tsx
│   │   ├── hero/
│   │   │   ├── HeroSection.tsx    # Unsplash city skyline + overlay
│   │   │   └── DynamicHeading.tsx # Animated live deal heading
│   │   ├── search-bar/
│   │   │   ├── SearchBar.tsx      # Sticky-aware wrapper
│   │   │   ├── StickySearchBar.tsx# IntersectionObserver sticky bar
│   │   │   ├── AirportInput.tsx   # Worldwide fuzzy autocomplete
│   │   │   ├── DatePicker.tsx     # Dual-month + live per-date prices
│   │   │   └── TravelersPanel.tsx
│   │   ├── flight-card/FlightCard.tsx
│   │   ├── filters-panel/FiltersPanel.tsx
│   │   ├── chat-bubble/ChatBubble.tsx
│   │   └── explore/               # 4 analytics Recharts panels
│   └── lib/
│       ├── api.ts                 # All backend API calls
│       ├── types.ts               # TypeScript types
│       ├── deals.ts               # useDealHeading hook + static deals
│       ├── hooks.ts               # useStickyObserver + cn utility
│       └── airports.ts            # 90+ curated airports + OurAirports loader
│
└── backend/           ← FastAPI Python (deploy → Railway or Render)
    ├── main.py                    # FastAPI app + CORS
    └── routes/
        ├── flights.py             # SerpAPI Google Flights: search + calendar + flex-dates
        ├── chat.py                # OpenAI GPT-4o streaming chat
        ├── upload.py              # GPT-4o Vision boarding pass OCR
        └── analytics.py          # Airline reliability, weather, congestion
```

---

## ⚡ Quick Start (Local Dev)

### 1. Clone & navigate

```bash
git clone https://github.com/nikhilpatil1104/SkyRisk.git
cd SkyRisk
```

### 2. Backend setup

```bash
cd backend

# Create virtualenv
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt

# Configure env vars
cp .env.example .env
# Edit .env — add your SERPAPI_KEY and OPENAI_API_KEY

# Start dev server
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`  
API docs at: `http://localhost:8000/docs`

### 3. Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 🔑 API Keys — All Free

| Service | Where to get | Cost | Used for |
|---------|-------------|------|----------|
| **SerpAPI** | [serpapi.com/users/sign_up](https://serpapi.com/users/sign_up?plan=free) | 100 searches/month free | Live flight search, calendar prices, flexible dates |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/api-keys) | ~$0.005/chat message | GPT-4o chat + Vision OCR |
| **Unsplash** | No key needed | Free | City skyline hero images |
| **OurAirports** | Bundled JSON | Free | Worldwide airport search |

### Get SerpAPI Free Key (replaces Amadeus)

1. Go to [serpapi.com/users/sign_up?plan=free](https://serpapi.com/users/sign_up?plan=free)
2. Sign up — no credit card required
3. Go to [serpapi.com/manage-api-key](https://serpapi.com/manage-api-key)
4. Copy your API key
5. Add to `backend/.env`:
   ```
   SERPAPI_KEY=your_key_here
   ```

**Free tier:** 100 searches/month. Every `/search` call = 1 search. `/flexible-dates` = 7 searches (one per day in the strip). `/calendar-prices` = 1 search (anchor price only).

---

## 🚀 Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel deploy

# In Vercel dashboard → Settings → Environment Variables:
# NEXT_PUBLIC_API_URL = https://your-railway-backend.railway.app
```

### Backend → Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Root directory: `backend`
3. Add environment variables:
   - `SERPAPI_KEY` = your SerpAPI key
   - `OPENAI_API_KEY` = your OpenAI key
   - `FRONTEND_URL` = your Vercel URL
4. Railway uses `Procfile` automatically: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Backend → Render (alternative)

1. [render.com](https://render.com) → New Web Service → connect GitHub
2. Root directory: `backend`
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add the same 3 env vars

---

## 🌐 API Reference

### Flights

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/flights/search` | Live search via SerpAPI Google Flights |
| GET | `/api/flights/calendar-prices` | Per-date prices for DatePicker calendar |
| GET | `/api/flights/flexible-dates` | ±3 day price strip on results page |

**Search example:**
```
GET /api/flights/search?origin=ORD&destination=ATL
  &departure_date=2026-05-06&return_date=2026-05-13
  &adults=1&cabin_class=Economy&nonstop_only=false
```

**SerpAPI parameters used:**
- `engine=google_flights`
- `departure_id` / `arrival_id` — IATA codes (ORD, ATL, BOM, NRT — all routes work)
- `outbound_date` / `return_date` — YYYY-MM-DD
- `type` — 2=roundtrip, 3=one-way
- `travel_class` — 1=Economy, 2=Premium Economy, 3=Business, 4=First
- `stops` — 1=nonstop only (omit for all)

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/` | GPT-4o streaming SSE chat |

### Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/analyze` | GPT-4o Vision boarding pass OCR |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/airline-reliability` | On-time % by carrier |
| GET | `/api/analytics/time-recommendation` | Best hours/days to fly |
| GET | `/api/analytics/airport-congestion` | Congestion ranking |
| GET | `/api/analytics/weather-severity` | 12-month weather risk |

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts |
| Theme | next-themes (light/dark, no flash) |
| Backend framework | FastAPI + Uvicorn |
| Flight data | SerpAPI Google Flights engine (free tier) |
| AI Chat | OpenAI Python SDK (GPT-4o streaming) |
| Vision OCR | OpenAI GPT-4o Vision |
| Airport data | OurAirports.com bundled JSON (9,000 airports) |
| Deploy frontend | Vercel |
| Deploy backend | Railway / Render |

---

## 📐 Key Architecture Decisions

### Why SerpAPI instead of Amadeus
Amadeus Self-Service (free sandbox) was deprecated in early 2026. SerpAPI's Google Flights engine is a clean replacement — real prices for every airport pair worldwide, 100 free searches/month (no credit card), instant signup. Unlike Amadeus's test environment which was limited to ~20 major US routes, SerpAPI works for ORD→ATL, BOM→NRT, SYD→LHR — any valid IATA pair.

### Sticky Search Bar
Uses `IntersectionObserver` on a 1px sentinel element placed after the hero section. When the sentinel leaves the viewport, `StickySearchBar` animates in via Framer Motion. Zero scroll event listeners.

### Live Calendar Prices
`DatePicker` fetches `/api/flights/calendar-prices` when origin + destination are set. The backend makes one real SerpAPI call (1 search) to get an anchor price for the month, then generates realistic day-level variation (weekday/weekend patterns, deterministic noise). This keeps the calendar populated while conserving free tier quota.

### Flexible Dates Strip
`/flexible-dates` fires 7 concurrent SerpAPI calls (one per day, ±3 around the selected date) using `asyncio.gather`. Results are cached in the response — the frontend doesn't re-fetch unless the date changes.

### GPT-4o Streaming
Chat uses SSE from FastAPI. `streamChat()` in `lib/api.ts` is an async generator that yields chunks and appends them to the last message in real time.

---

## ⚠️ SerpAPI Quota Management

Free tier gives 100 searches/month. Budget breakdown per typical demo session:

| Action | Searches used |
|--------|--------------|
| One flight search | 1 |
| Flexible dates strip | 7 |
| Calendar month view | 1 |
| Full demo (search + calendar + flex) | ~9 |

**Tips to stretch the free tier:**
- Cache `/calendar-prices` responses in `localStorage` keyed by `${origin}-${destination}-${year}-${month}`
- Cache `/flexible-dates` responses keyed by `${origin}-${destination}-${date}`
- Only fetch calendar prices when the DatePicker is actually opened

---

## 👤 Author

**Nikhil Patil** · M.S. Data Science, UMBC  
AI Intern @ Plymouth Rock Assurance  
[GitHub](https://github.com/nikhilpatil1104) · [LinkedIn](https://linkedin.com/in/nikhilpatil1104)
