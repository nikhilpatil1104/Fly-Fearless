"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const search = window.location.search;
      const hash   = window.location.hash;

      console.log("Callback search:", search);
      console.log("Callback hash:", hash);

      // PKCE flow — exchange code for session
      if (search.includes("code=")) {
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );
        if (error) {
          console.error("Exchange error:", error.message);
          router.replace("/signin");
          return;
        }
        router.replace("/");
        return;
      }

      // Implicit flow — session already set via hash
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/");
      } else {
        router.replace("/signin");
      }
    };

    handleCallback();
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
