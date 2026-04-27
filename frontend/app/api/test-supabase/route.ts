import { NextResponse } from "next/server";

export async function GET() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return NextResponse.json({
    url_set:      !!url,
    anon_set:     !!anon,
    url_preview:  url  ? url.substring(0, 35) + "..." : "MISSING",
    anon_preview: anon ? anon.substring(0, 20) + "..." : "MISSING",
  });
}
