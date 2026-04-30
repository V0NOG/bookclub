import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { AppSessionProvider } from "@/components/layout/session-provider";
import { Toaster } from "@/components/ui/sonner";

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Folio — Find your next favourite book",
  description: "Find your next favourite book — and the people to read it with. Taste-matched recommendations, book clubs, reading challenges.",
  openGraph: {
    title: "Folio",
    description: "Social reading platform powered by taste matching",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sourceSerif4.variable}>
      <body className="font-serif antialiased">
        <AppSessionProvider>{children}</AppSessionProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
