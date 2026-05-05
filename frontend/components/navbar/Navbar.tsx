"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sun, Moon, MessageSquare, UploadCloud, BarChart2, User, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close user menu when clicking anywhere outside it
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showUserMenu]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/signin";
  };

  return (
    <header className="sticky top-0 z-[60] w-full bg-white dark:bg-[#0F1117] border-b border-[var(--sky-border)]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-4">

         {/* Logo */}
        <div className="relative z-10 p-8 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="SkyRisk" className="w-9 h-9 object-contain" />
          <span className="text-2xl font-bold text-white tracking-tight">
            Sky<span className="text-[#60b3ff]">Risk</span>
          </span>
        </div>

        {/* Right — functional links only */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link href="/explore"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100 hover:text-[var(--sky-primary)] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors">
            <BarChart2 className="w-4 h-4" /> Explore
          </Link>

          
          <Link href="/chat"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100 hover:text-[var(--sky-primary)] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors">
            <MessageSquare className="w-4 h-4" /> AI Chat
          </Link>

          <Link href="/upload"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100 hover:text-[var(--sky-primary)] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors">
            <UploadCloud className="w-4 h-4" /> Scan Ticket
          </Link>

          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark"
                ? <Sun className="w-4 h-4 text-gray-300" />
                : <Moon className="w-4 h-4 text-gray-700" />}
            </button>
          )}

          {user ? (
            <div className="relative ml-2" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full
                           bg-gray-100 dark:bg-gray-800
                           hover:bg-gray-200 dark:hover:bg-gray-700
                           transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--sky-primary)] flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white max-w-[120px] truncate">
                  {user.user_metadata?.full_name?.split(" ")[0] ?? user.email?.split("@")[0]}
                </span>
              </button>
              <div
                className={`absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1c1f26]
                            rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700
                            overflow-hidden z-[200] transition-all duration-150
                            ${showUserMenu ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
              >
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium
                             text-red-600 dark:text-red-400
                             hover:bg-red-50 dark:hover:bg-red-950/30
                             transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <Link href="/signin" className="ml-2 px-4 py-1.5 text-sm font-semibold text-white bg-[var(--sky-primary)] hover:bg-[var(--sky-primary-hover)] rounded-full transition-colors">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
