"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileImage, Check, X, Loader2, Plane, User, Calendar, MapPin, Tag, Briefcase } from "lucide-react";
import Navbar from "@/components/navbar/Navbar";
import ChatBubble from "@/components/chat-bubble/ChatBubble";
import { analyzeDocument } from "@/lib/api";
import type { ParsedDocument } from "@/lib/types";

// react-dropzone isn't in our package.json — implement a simple version
function useSimpleDropzone(onFile: (f: File) => void) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onFile(e.target.files[0]);
  };
  return { handleChange };
}

function FieldRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0 text-[var(--sky-primary)]">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const { handleChange } = useSimpleDropzone(handleFile);

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeDocument(file);
      if (res.success) setResult(res.data as ParsedDocument);
      else setError("Could not extract data from this document.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const routeStr = result?.origin?.iata && result?.destination?.iata
    ? `${result.origin.iata} → ${result.destination.iata}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F1117]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Scan Your Ticket</h1>
          <p className="text-gray-500">
            Upload a boarding pass, e-ticket, or itinerary. GPT-4o Vision will extract all flight details instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload side */}
          <div className="space-y-4">
            {/* Drop zone */}
            <label
              htmlFor="file-upload"
              className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                ${file
                  ? "border-[var(--sky-primary)] bg-blue-50 dark:bg-blue-950/20"
                  : "border-gray-300 dark:border-gray-700 hover:border-[var(--sky-primary)] hover:bg-blue-50/30 dark:hover:bg-blue-950/10"
                }`}
            >
              <input
                id="file-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleChange}
              />
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
              ) : (
                <>
                  <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Drop your boarding pass here</p>
                  <p className="text-sm text-gray-400">or click to browse · JPG, PNG, WebP up to 10 MB</p>
                </>
              )}
            </label>

            {file && (
              <div className="flex items-center gap-3 bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-xl p-3">
                <FileImage className="w-5 h-5 text-[var(--sky-primary)] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <button onClick={() => { setFile(null); setPreview(null); setResult(null); }}>
                  <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            )}

            <button
              onClick={analyze}
              disabled={!file || loading}
              className="w-full py-3 bg-[var(--sky-primary)] hover:bg-[var(--sky-primary-hover)]
                         disabled:bg-gray-300 dark:disabled:bg-gray-700
                         text-white font-bold rounded-full transition-colors
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with GPT-4o…</>
              ) : (
                <><Plane className="w-4 h-4" /> Extract Flight Details</>
              )}
            </button>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">What gets extracted:</p>
              {["Passenger name & seat", "Flight number & airline", "Origin → destination", "Departure & arrival times", "Gate, terminal & boarding time", "Booking reference & class"].map((i) => (
                <p key={i} className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[var(--sky-green)]" /> {i}</p>
              ))}
            </div>
          </div>

          {/* Results side */}
          <div>
            {!result && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl">
                <Plane className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4 -rotate-45" />
                <p className="text-gray-400 text-sm">Upload a boarding pass or e-ticket to extract flight information</p>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-[var(--sky-primary)] animate-spin" />
                </div>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Analyzing document…</p>
                <p className="text-sm text-gray-400">GPT-4o Vision is reading your ticket</p>
              </div>
            )}

            {result && (
              <div className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                {/* Header bar */}
                <div className="bg-[var(--sky-primary)] px-6 py-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Plane className="w-5 h-5 -rotate-45" />
                    <span className="font-bold">{result.airline ?? "Flight"} {result.flightNumber ?? ""}</span>
                  </div>
                  {routeStr && <p className="text-xl font-black">{routeStr}</p>}
                  <p className="text-blue-100 text-sm capitalize">{result.documentType?.replace(/_/g, " ")}</p>
                </div>

                <div className="px-6 py-2">
                  <FieldRow icon={<User className="w-4 h-4" />} label="Passenger" value={result.passengerName} />
                  <FieldRow icon={<MapPin className="w-4 h-4" />} label="From" value={result.origin?.iata ? `${result.origin.iata}${result.origin.city ? ` – ${result.origin.city}` : ""}` : null} />
                  <FieldRow icon={<MapPin className="w-4 h-4" />} label="To" value={result.destination?.iata ? `${result.destination.iata}${result.destination.city ? ` – ${result.destination.city}` : ""}` : null} />
                  <FieldRow icon={<Calendar className="w-4 h-4" />} label="Departure" value={result.departureDate ? `${result.departureDate}${result.departureTime ? ` at ${result.departureTime}` : ""}` : null} />
                  <FieldRow icon={<Calendar className="w-4 h-4" />} label="Arrival" value={result.arrivalDate ? `${result.arrivalDate}${result.arrivalTime ? ` at ${result.arrivalTime}` : ""}` : null} />
                  <FieldRow icon={<Tag className="w-4 h-4" />} label="Seat" value={result.seat} />
                  <FieldRow icon={<Tag className="w-4 h-4" />} label="Gate" value={result.gate ? `Gate ${result.gate}${result.terminal ? ` · Terminal ${result.terminal}` : ""}` : null} />
                  <FieldRow icon={<Tag className="w-4 h-4" />} label="Boarding" value={result.boardingTime} />
                  <FieldRow icon={<Tag className="w-4 h-4" />} label="Booking ref" value={result.bookingReference} />
                  <FieldRow icon={<Briefcase className="w-4 h-4" />} label="Class" value={result.cabinClass} />
                  <FieldRow icon={<Briefcase className="w-4 h-4" />} label="Baggage" value={result.baggage} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ChatBubble />
    </div>
  );
}
