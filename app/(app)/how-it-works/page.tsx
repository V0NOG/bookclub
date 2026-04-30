import Link from "next/link";
import { BookOpen, Star, Users, Sparkles, ThumbsUp } from "lucide-react";

const steps = [
  {
    icon: Star,
    number: "01",
    title: "You rate books",
    description:
      "Star the books you've read. The more you rate, the more accurately Folio understands what you love — and what you don't.",
    detail: "Even a few ratings unlock meaningful recommendations. High ratings signal strong preference; low ratings are just as useful.",
  },
  {
    icon: BookOpen,
    number: "02",
    title: "We build your taste profile",
    description:
      "Behind the scenes, Folio maps your preferences across multiple dimensions: your preferred pace, tone, emotional depth, genre clusters, and favourite authors.",
    detail: "This isn't just genre overlap. Two readers who both love Fantasy can have completely different tastes — one prefers slow, character-driven stories while the other loves fast-paced plots.",
  },
  {
    icon: Users,
    number: "03",
    title: "We match you with books, people, and clubs",
    description:
      "Your taste profile is compared against every book, reader, and club on Folio. Matches are scored across multiple signals and ranked by confidence.",
    detail: "A match score of 85+ means strong alignment across genres, reading style, and rated books. Lower scores show emerging or exploratory matches worth discovering.",
  },
  {
    icon: ThumbsUp,
    number: "04",
    title: "The system learns from your feedback",
    description:
      "Clicking \"More like this\" or \"Not for me\" tunes your recommendations immediately. Folio adjusts scores and re-ranks based on your explicit feedback.",
    detail: "Feedback is combined with your rating history so the system improves over time — not just in the current session.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How Folio works</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Recommendations that actually get you
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Folio doesn&apos;t just match on genre. It builds a detailed picture of your reading personality and uses that to surface books, readers, and clubs that genuinely fit your taste.
        </p>
      </div>

      <div className="space-y-8">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="flex gap-5">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Icon className="h-4.5 w-4.5 text-primary" size={18} />
                </div>
                <div className="w-px flex-1 bg-border mt-2 mb-0" />
              </div>
              <div className="pb-8">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{step.number}</span>
                  <h2 className="text-base font-semibold text-foreground">{step.title}</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{step.description}</p>
                <p className="text-xs text-muted-foreground/70 leading-relaxed">{step.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-card border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-1">What makes a strong match?</h3>
        <ul className="text-xs text-muted-foreground space-y-1.5 mt-2">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span><strong className="text-foreground/80">Shared highly-rated books</strong> — the strongest signal. If you both loved the same books, your taste is genuinely aligned.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span><strong className="text-foreground/80">Genre overlap</strong> — but weighted against books you actively dislike, not just genres you haven&apos;t tried.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span><strong className="text-foreground/80">Reading style dimensions</strong> — pace, tone, complexity, emotional intensity, and more. Two fantasy fans can read very differently.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span><strong className="text-foreground/80">Negative alignment</strong> — if you both avoid certain genres or tropes, that shared taste counts too.</span>
          </li>
        </ul>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/home" className="text-sm text-primary hover:underline">
          Back to recommendations
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link href="/library" className="text-sm text-primary hover:underline">
          Rate more books
        </Link>
      </div>
    </div>
  );
}
