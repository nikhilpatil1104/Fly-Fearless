"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/navbar/Navbar";
import { Clock, Plane, ArrowRight, Search } from "lucide-react";
import type { UserSearch } from "@/lib/supabase";
import { format, parseISO } from "date-fns";

export default function SearchHistoryPage() {
  const [searches, setSearches] = useState<UserSearch[]>([]);
  const [loading, setLoading]   = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/signin"); return; }

      const { data, error } = await supabase
        .from("user_searches")
        .select("*")
        .eq("user_id", user.id)
        .order("searched_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("History load error:", error.message);
        // Table may not exist yet - show empty state
        setSearches([]);
      } else {
        setSearches(data ?? []);
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const repeatSearch = (s: UserSearch) => {
    const params = new URLSearchParams({
      origin:      s.origin,
      destination: s.destination,
      tripType:    s.trip_type,
      adults:      String(s.adults),
      cabin:       s.cabin,
      dep:         s.dep_date,
      ...(s.ret_date ? { ret: s.ret_date } : {}),
    });
    router.push(`/flights/search?${params}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F1117]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Clock className="w-6 h-6 text-[var(--sky-primary)]" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search History</h1>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="h-20 bg-white dark:bg-[#1C1F26] rounded-2xl animate-pulse border border-gray-200 dark:border-gray-800" />
            ))}
          </div>
        )}

        {!loading && searches.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No searches yet</p>
            <p className="text-sm text-gray-400 mt-1">Your flight searches will appear here</p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 px-6 py-2.5 bg-[var(--sky-primary)] text-white rounded-full text-sm font-bold hover:bg-[var(--sky-primary-hover)] transition-colors"
            >
              Search flights
            </button>
          </div>
        )}

        {!loading && searches.length > 0 && (
          <div className="space-y-3">
            {searches.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl p-5
                           hover:border-[var(--sky-primary)] hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                      <Plane className="w-5 h-5 text-[var(--sky-primary)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{s.origin}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{s.destination}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          s.trip_type === "Roundtrip"
                            ? "bg-blue-50 dark:bg-blue-950/40 text-[var(--sky-primary)]"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}>
                          {s.trip_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>{format(parseISO(s.dep_date), "MMM d, yyyy")}</span>
                        {s.ret_date && (
                          <>
                            <span>→</span>
                            <span>{format(parseISO(s.ret_date), "MMM d, yyyy")}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>{s.adults} traveler{s.adults > 1 ? "s" : ""}</span>
                        <span>·</span>
                        <span>{s.cabin}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-gray-400">
                      {s.searched_at ? format(parseISO(s.searched_at), "MMM d, h:mm a") : ""}
                    </span>
                    <button
                      onClick={() => repeatSearch(s)}
                      className="px-4 py-1.5 text-xs font-bold text-[var(--sky-primary)]
                                 border border-[var(--sky-primary)] rounded-full
                                 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                    >
                      Search again
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
