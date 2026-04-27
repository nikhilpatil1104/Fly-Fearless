import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SkyRisk – Cheap Flights, AI Travel Assistant",
    template: "%s | SkyRisk",
  },
  description:
    "Book cheap flights with live price calendars, AI-powered recommendations, and real-time data analytics. Powered by SerpAPI Google Flights and GPT-4o.",
  keywords: ["cheap flights", "flight booking", "travel", "flight deals", "AI travel"],
  authors: [{ name: "Nikhil Patil" }],
  openGraph: {
    type: "website",
    title: "SkyRisk – Cheap Flights & AI Travel",
    description: "Live prices on every calendar date. AI chat. Analytics. Zero restrictions.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="skyrisk-theme"
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
