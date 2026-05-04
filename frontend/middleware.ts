import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/signin", "/auth"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  const cookieHeader = req.headers.get("cookie") ?? "";
  
  // Match Supabase cookies - project ref can contain letters AND numbers
  // sb-xboknigiqqvhwpogudaq-auth-token or chunked .0 .1 etc
  const hasAuthCookie =
    /sb-[a-zA-Z0-9]+-auth-token/.test(cookieHeader) ||
    cookieHeader.includes("supabase-auth-token");

  if (!hasAuthCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack|favicon.ico|logo.png|data/|icons/|api/).*)",
  ],
};
