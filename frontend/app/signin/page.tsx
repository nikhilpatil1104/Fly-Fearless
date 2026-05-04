"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Mail, ArrowRight, Plane } from "lucide-react";

// ── Airline images that rotate on the left panel ───────────────────────────────
const SLIDES = [
  {
    img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=85",
    headline: "Find your next adventure",
    sub: "Real prices. Every airport. Worldwide.",
  },
  {
    img: "https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?w=1200&q=85",
    headline: "AI-powered travel planning",
    sub: "Chat with SkyRisk AI to build your perfect trip.",
  },
  {
    img: "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=1200&q=85",
    headline: "Prices that move with you",
    sub: "Live calendar pricing on every date, every route.",
  },
  {
    img: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=1200&q=85",
    headline: "From any gate to any destination",
    sub: "545 airports across 117 countries.",
  },
];

// ── Google icon SVG ────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// ── Apple icon ─────────────────────────────────────────────────────────────────
function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

// ── Facebook icon ──────────────────────────────────────────────────────────────
function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

type Mode = "signin" | "register" | "forgot";

export default function AuthPage() {
  const [slide, setSlide]         = useState(0);
  const [mode, setMode]           = useState<Mode>("signin");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [name, setName]           = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [oauthLoading, setOAuthLoading] = useState<string | null>(null);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const clearMessages = () => { setError(""); setSuccess(""); };

  // ── OAuth ──────────────────────────────────────────────────────────────────
  const signInWith = async (provider: "google" | "apple" | "facebook") => {
    setOAuthLoading(provider);
    clearMessages();
    const redirectTo = `${window.location.origin}/auth/callback`;
    console.log("OAuth redirectTo:", redirectTo);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: false,
        queryParams: provider === "google" ? {
          access_type: "offline",
          prompt: "select_account",
        } : undefined,
      },
    });
    if (error) { setError(error.message); setOAuthLoading(null); }
  };

  // ── Email sign in ──────────────────────────────────────────────────────────
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError("Please fill in all fields.");
    setLoading(true);
    clearMessages();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else window.location.href = "/";
  };

  // ── Email register ─────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return setError("Please fill in all fields.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true);
    clearMessages();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSuccess("Account created! Check your email to confirm, then sign in.");
  };

  // ── Forgot password ────────────────────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Enter your email address.");
    setLoading(true);
    clearMessages();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSuccess("Password reset email sent! Check your inbox.");
  };

  const currentSlide = SLIDES[slide];

  return (
    <div className="min-h-screen flex">
      {/* ── Left: Image panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col">
        {/* Slide images */}
        {/* Stack all images, crossfade via opacity — no white flash */}
        {SLIDES.map((s, i) => (
          <motion.div
            key={s.img}
            className="absolute inset-0"
            animate={{ opacity: i === slide ? 1 : 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ backgroundImage: `url(${s.img})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        ))}
        {/* Permanent overlay — never transparent, prevents white flash */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Logo */}
        <div className="relative z-10 p-8 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="SkyRisk" className="w-9 h-9 object-contain" />
          <span className="text-2xl font-bold text-white tracking-tight">
            Sky<span className="text-[#60b3ff]">Risk</span>
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 mt-auto p-10 pb-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-4xl font-bold text-white leading-tight mb-3">
                {currentSlide.headline}
              </h2>
              <p className="text-white/70 text-lg">{currentSlide.sub}</p>
            </motion.div>
          </AnimatePresence>

          {/* Slide dots */}
          <div className="flex gap-2 mt-8">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === slide ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Floating plane decoration */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-12 z-10 opacity-20"
        >
          <Plane className="w-24 h-24 text-white rotate-45" />
        </motion.div>
      </div>

      {/* ── Right: Auth panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center
                      bg-white dark:bg-[#0f1117]
                      px-6 py-12 overflow-y-auto">

        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="SkyRisk" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Sky<span className="text-[#0070cc]">Risk</span>
          </span>
        </div>

        <div className="w-full max-w-[420px]">
          <AnimatePresence mode="wait">
            {/* ── Sign In ────────────────────────────────────────────────── */}
            {mode === "signin" && (
              <motion.div
                key="signin"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-[28px] font-bold text-gray-900 dark:text-white mb-1">
                  Sign in or create an account
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                  Unlock member prices and save your trips with SkyRisk.
                </p>

                {/* OAuth buttons */}
                <button
                  onClick={() => signInWith("google")}
                  disabled={!!oauthLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4
                             bg-[#0070cc] hover:bg-[#005ba8]
                             text-white font-semibold text-sm rounded-full
                             transition-colors mb-3 disabled:opacity-60"
                >
                  {oauthLoading === "google"
                    ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <GoogleIcon />}
                  Sign in with Google
                </button>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-[#0f1117] px-3 text-xs text-gray-400 uppercase tracking-wider">
                      or
                    </span>
                  </div>
                </div>

                {/* Email form */}
                <form onSubmit={handleEmailSignIn} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700
                               bg-white dark:bg-[#1c1f26] text-gray-900 dark:text-white
                               placeholder:text-gray-400 text-sm
                               focus:outline-none focus:border-[#0070cc] focus:ring-2 focus:ring-[#0070cc]/20
                               transition-all"
                  />
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700
                                 bg-white dark:bg-[#1c1f26] text-gray-900 dark:text-white
                                 placeholder:text-gray-400 text-sm pr-12
                                 focus:outline-none focus:border-[#0070cc] focus:ring-2 focus:ring-[#0070cc]/20
                                 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {error && (
                    <p className="text-red-500 text-xs bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}
                  {success && (
                    <p className="text-green-600 text-xs bg-green-50 dark:bg-green-950/30 rounded-lg px-3 py-2">
                      {success}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#0070cc] hover:bg-[#005ba8]
                               text-white font-bold text-sm rounded-full
                               transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <>Continue <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                <button
                  onClick={() => { setMode("forgot"); clearMessages(); }}
                  className="text-xs text-[#0070cc] hover:underline mt-3 block"
                >
                  Forgot password?
                </button>

                <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-500 text-center mb-3">Other ways to sign in</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => signInWith("apple")}
                      disabled={!!oauthLoading}
                      className="flex items-center justify-center gap-2 py-2.5 px-3
                                 border border-gray-300 dark:border-gray-700
                                 rounded-full text-sm font-medium
                                 text-gray-900 dark:text-white
                                 hover:border-gray-400 dark:hover:border-gray-500
                                 transition-colors disabled:opacity-60"
                    >
                      {oauthLoading === "apple"
                        ? <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                        : <AppleIcon />}
                      Apple
                    </button>
                    <button
                      onClick={() => signInWith("facebook")}
                      disabled={!!oauthLoading}
                      className="flex items-center justify-center gap-2 py-2.5 px-3
                                 border border-gray-300 dark:border-gray-700
                                 rounded-full text-sm font-medium
                                 text-gray-900 dark:text-white
                                 hover:border-gray-400 dark:hover:border-gray-500
                                 transition-colors disabled:opacity-60"
                    >
                      {oauthLoading === "facebook"
                        ? <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                        : <FacebookIcon />}
                      Facebook
                    </button>
                  </div>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => { setMode("register"); clearMessages(); }}
                    className="text-[#0070cc] font-semibold hover:underline"
                  >
                    Create one
                  </button>
                </p>

                <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed">
                  By continuing, you agree to our{" "}
                  <a href="#" className="underline hover:text-gray-600">Terms</a>{" "}
                  and{" "}
                  <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>.
                </p>
              </motion.div>
            )}

            {/* ── Register ───────────────────────────────────────────────── */}
            {mode === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-[28px] font-bold text-gray-900 dark:text-white mb-1">
                  Create your account
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                  Join SkyRisk to unlock member prices and save your searches.
                </p>

                {/* Google signup */}
                <button
                  onClick={() => signInWith("google")}
                  disabled={!!oauthLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4
                             bg-[#0070cc] hover:bg-[#005ba8]
                             text-white font-semibold text-sm rounded-full
                             transition-colors mb-5 disabled:opacity-60"
                >
                  {oauthLoading === "google"
                    ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <GoogleIcon />}
                  Continue with Google
                </button>

                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-[#0f1117] px-3 text-xs text-gray-400 uppercase tracking-wider">
                      or register with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700
                               bg-white dark:bg-[#1c1f26] text-gray-900 dark:text-white
                               placeholder:text-gray-400 text-sm
                               focus:outline-none focus:border-[#0070cc] focus:ring-2 focus:ring-[#0070cc]/20
                               transition-all"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700
                               bg-white dark:bg-[#1c1f26] text-gray-900 dark:text-white
                               placeholder:text-gray-400 text-sm
                               focus:outline-none focus:border-[#0070cc] focus:ring-2 focus:ring-[#0070cc]/20
                               transition-all"
                  />
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password (min. 8 characters)"
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700
                                 bg-white dark:bg-[#1c1f26] text-gray-900 dark:text-white
                                 placeholder:text-gray-400 text-sm pr-12
                                 focus:outline-none focus:border-[#0070cc] focus:ring-2 focus:ring-[#0070cc]/20
                                 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {error && (
                    <p className="text-red-500 text-xs bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}
                  {success && (
                    <p className="text-green-600 text-xs bg-green-50 dark:bg-green-950/30 rounded-lg px-3 py-2">
                      {success}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#0070cc] hover:bg-[#005ba8]
                               text-white font-bold text-sm rounded-full
                               transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <>Create account <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed">
                  By creating an account, you agree to our{" "}
                  <a href="#" className="underline hover:text-gray-600">Terms</a>{" "}
                  and{" "}
                  <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>.
                </p>

                <p className="text-center text-sm text-gray-500 mt-5">
                  Already have an account?{" "}
                  <button
                    onClick={() => { setMode("signin"); clearMessages(); }}
                    className="text-[#0070cc] font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </motion.div>
            )}

            {/* ── Forgot password ────────────────────────────────────────── */}
            {mode === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  onClick={() => { setMode("signin"); clearMessages(); }}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                >
                  ← Back to sign in
                </button>
                <h1 className="text-[28px] font-bold text-gray-900 dark:text-white mb-1">
                  Reset your password
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                  Enter your email and we&apos;ll send you a reset link.
                </p>

                <form onSubmit={handleForgot} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700
                                 bg-white dark:bg-[#1c1f26] text-gray-900 dark:text-white
                                 placeholder:text-gray-400 text-sm
                                 focus:outline-none focus:border-[#0070cc] focus:ring-2 focus:ring-[#0070cc]/20
                                 transition-all"
                    />
                  </div>

                  {error && (
                    <p className="text-red-500 text-xs bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}
                  {success && (
                    <p className="text-green-600 text-xs bg-green-50 dark:bg-green-950/30 rounded-lg px-3 py-2">
                      {success}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#0070cc] hover:bg-[#005ba8]
                               text-white font-bold text-sm rounded-full
                               transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : "Send reset link"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
