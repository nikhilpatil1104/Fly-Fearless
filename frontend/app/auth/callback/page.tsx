"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Supabase handles the token exchange from the URL hash
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.replace("/");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#0070cc] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-sm font-medium">Signing you in…</p>
      </div>
    </div>
  );
}
