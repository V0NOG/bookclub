import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Hero } from "@/components/landing/hero";
import { FeatureSection } from "@/components/landing/feature-section";
import { CtaSection } from "@/components/landing/cta-section";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
            <BookOpen className="h-6 w-6 text-emerald-500" />
            Folio
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main>
        <Hero />
        <FeatureSection />
        <CtaSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold text-white">Folio</span>
          </div>
          <p>Find your next favourite book — and the people to read it with.</p>
        </div>
      </footer>
    </div>
  );
}
