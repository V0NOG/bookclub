import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, Users, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-emerald-950/20 pt-24 pb-32">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 mb-8">
          <Sparkles className="h-3.5 w-3.5" />
          Taste-matched reading — now in beta
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight mb-6">
          Find your next favourite book
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
            and the people to read it with.
          </span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Folio matches you with books, readers, and clubs based on your taste — not just genre. Discover more, read together, and never miss a book you'll love.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/sign-up" className={cn(buttonVariants({ variant: "default" }), "bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 h-12 text-base")}>
            Start matching →
          </Link>
          <Link href="/clubs" className={cn(buttonVariants({ variant: "outline" }), "border-border h-12 text-base")}>
            Explore clubs
          </Link>
        </div>

        {/* Social proof */}
        <div className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-500" />
            <span>20,000+ books</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-500" />
            <span>5,000+ readers</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span>Taste matching engine</span>
          </div>
        </div>
      </div>
    </section>
  );
}
