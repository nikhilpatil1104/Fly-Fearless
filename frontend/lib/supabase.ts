import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnon);

// ── Types ──────────────────────────────────────────────────────────────────────
export interface UserSearch {
  id?:          string;
  user_id?:     string;
  origin:       string;
  destination:  string;
  trip_type:    string;
  dep_date:     string;
  ret_date?:    string | null;
  cabin:        string;
  adults:       number;
  searched_at?: string;
}

// ── Save last search ───────────────────────────────────────────────────────────
export async function saveSearch(search: UserSearch) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("user_searches").insert({
      ...search,
      user_id: user.id,
    });
    if (error) console.error("saveSearch error:", error.message);
  } catch (e) {
    console.error("saveSearch exception:", e);
  }
}

// ── Get last search ────────────────────────────────────────────────────────────
export async function getLastSearch(): Promise<UserSearch | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_searches")
    .select("*")
    .eq("user_id", user.id)
    .order("searched_at", { ascending: false })
    .limit(1)
    .single();

  return data ?? null;
}
