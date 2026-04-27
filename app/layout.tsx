import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppSessionProvider } from "@/components/layout/session-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Folio — Find your next favourite book",
  description: "Find your next favourite book — and the people to read it with. Taste-matched recommendations, book clubs, reading challenges.",
  openGraph: {
    title: "Folio",
    description: "Spotify-style social reading platform",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppSessionProvider>{children}</AppSessionProvider>
      </body>
    </html>
  );
}
