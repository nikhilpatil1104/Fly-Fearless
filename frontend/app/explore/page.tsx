"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/navbar/Navbar";
import ChatBubble from "@/components/chat-bubble/ChatBubble";
import AirlineReliabilityChart from "@/components/explore/AirlineReliability";
import TimeRecommendation from "@/components/explore/TimeRecommendation";
import { AirportCongestion, WeatherSeverity } from "@/components/explore/WeatherAndCongestion";
import { getAirlineReliability, getTimeRecommendation, getAirportCongestion, getWeatherSeverity } from "@/lib/api";
import { CURATED_AIRPORTS } from "@/lib/airports";
import type { AirlineReliability } from "@/lib/types";

function PanelSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6" />
      <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl" />
    </div>
  );
}

export default function ExplorePage() {
  const [origin, setOrigin] = useState("ORD");
  const [destination, setDestination] = useState("ATL");

  const [airlineData, setAirlineData] = useState<AirlineReliability[] | null>(null);
  const [timeData, setTimeData] = useState<{ hourly: unknown[]; weekly: unknown[]; bookingInsight: unknown } | null>(null);
  const [congestionData, setCongestionData] = useState<{ airports: unknown[] } | null>(null);
  const [weatherData, setWeatherData] = useState<{ months: unknown[]; origin: string; destination: string } | null>(null);

  useEffect(() => {
    getAirlineReliability().then((d) => setAirlineData(d.airlines as AirlineReliability[])).catch(() => {});
    getAirportCongestion().then(setCongestionData).catch(() => {});
  }, []);

  useEffect(() => {
    setTimeData(null);
    setWeatherData(null);
    getTimeRecommendation(origin, destination).then((d) => setTimeData(d as typeof timeData)).catch(() => {});
    getWeatherSeverity(origin, destination).then((d) => setWeatherData(d as typeof weatherData)).catch(() => {});
  }, [origin, destination]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F1117]">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Explore Data</h1>
          <p className="text-gray-500">Live analytics on airline reliability, travel times, airport congestion, and weather risk.</p>
        </div>

        {/* Route selector (affects time + weather panels) */}
        <div className="flex items-center gap-3 mb-8 bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 w-fit">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Route:</span>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-700 dark:bg-[#0F1117] dark:text-white rounded-lg px-3 py-1.5 focus:outline-none"
          >
            {CURATED_AIRPORTS.slice(0, 20).map((a) => (
              <option key={a.iata} value={a.iata}>{a.iata} – {a.city}</option>
            ))}
          </select>
          <span className="text-gray-400">→</span>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-700 dark:bg-[#0F1117] dark:text-white rounded-lg px-3 py-1.5 focus:outline-none"
          >
            {CURATED_AIRPORTS.slice(0, 20).map((a) => (
              <option key={a.iata} value={a.iata}>{a.iata} – {a.city}</option>
            ))}
          </select>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Panel 1: Airline reliability */}
          {airlineData ? (
            <AirlineReliabilityChart data={airlineData} />
          ) : (
            <PanelSkeleton />
          )}

          {/* Panel 2: Time recommendation */}
          {timeData ? (
            <TimeRecommendation
              hourly={timeData.hourly as Parameters<typeof TimeRecommendation>[0]["hourly"]}
              weekly={timeData.weekly as Parameters<typeof TimeRecommendation>[0]["weekly"]}
              insight={timeData.bookingInsight as Parameters<typeof TimeRecommendation>[0]["insight"]}
            />
          ) : (
            <PanelSkeleton />
          )}

          {/* Panel 3: Airport congestion */}
          {congestionData ? (
            <AirportCongestion airports={congestionData.airports as Parameters<typeof AirportCongestion>[0]["airports"]} />
          ) : (
            <PanelSkeleton />
          )}

          {/* Panel 4: Weather severity */}
          {weatherData ? (
            <WeatherSeverity
              months={weatherData.months as Parameters<typeof WeatherSeverity>[0]["months"]}
              origin={weatherData.origin}
              destination={weatherData.destination}
            />
          ) : (
            <PanelSkeleton />
          )}
        </div>
      </div>

      <ChatBubble />
    </div>
  );
}
