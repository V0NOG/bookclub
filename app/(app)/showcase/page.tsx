import Link from "next/link";
import {
  Star, BookOpen, ThumbsUp, Sparkles,
  Brain, MessageSquare, Compass, GitMerge,
  ArrowRight, Code2, Database, Layers, Cpu,
} from "lucide-react";

// ── Section: Hero ─────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="pt-12 pb-14 border-b border-border">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
          Portfolio Project
        </span>
      </div>
      <h1 className="text-4xl font-bold text-foreground leading-tight mb-4 max-w-2xl">
        Intelligent Book Recommendation System
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
        A taste-matching engine that learns your reading personality and surfaces books, readers, and clubs that genuinely fit — with every recommendation explained.
      </p>
      <div className="flex gap-3 flex-wrap">
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          Try Demo
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/how-it-works"
          className="inline-flex items-center gap-2 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          How It Works
        </Link>
      </div>
    </section>
  );
}

// ── Section: Problem → Solution ───────────────────────────────────────────────

function ProblemSolution() {
  return (
    <section className="py-12 border-b border-border">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8">
        The Problem
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-wide mb-4">
            Most recommendation systems
          </h3>
          <ul className="space-y-3">
            {[
              "Match on genre alone — ignoring reading style, pace, or tone",
              "Ignore negative preferences — what you actively dislike",
              "Never explain why something was recommended",
              "Don't learn from how you interact with suggestions",
              "Treat all signals equally regardless of confidence",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">
            Folio&apos;s approach
          </h3>
          <ul className="space-y-3">
            {[
              "Models taste across 8 dimensions: pace, tone, complexity, emotional intensity, and more",
              "Incorporates negative signals — low ratings and avoided genres lower compatibility",
              "Every match includes plain-language reasons, scored by confidence",
              "Feedback (like / dismiss) immediately adjusts scores in the next session",
              "Controlled exploration surfaces adjacent content outside your comfort zone",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ── Section: Feature cards ────────────────────────────────────────────────────

const features = [
  {
    icon: Brain,
    title: "Multi-dimensional taste modelling",
    description:
      "Builds a profile across 8 dimensions from your ratings. Two fantasy fans can read very differently — Folio tells the difference.",
  },
  {
    icon: MessageSquare,
    title: "Explainable recommendations",
    description:
      "Every match shows why. Reasons are score-banded: strong matches get confident phrasing, emerging matches get softer language.",
  },
  {
    icon: Compass,
    title: "Controlled exploration",
    description:
      "One slot per carousel is reserved for an adjacent suggestion outside your top genres — gated by shared dimensions, not random.",
  },
  {
    icon: GitMerge,
    title: "Multi-entity matching",
    description:
      "Matches users to books, users to readers, and users to clubs. Club matching uses average member compatibility as a signal.",
  },
  {
    icon: ThumbsUp,
    title: "Feedback-driven learning",
    description:
      "Dismiss or like a card and the system re-weights scores in your next session. Feedback blends into your taste profile over time.",
  },
];

function Features() {
  return (
    <section className="py-12 border-b border-border">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8">
        System capabilities
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="bg-card border border-border rounded-xl p-5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-4 ${i % 2 === 0 ? "bg-primary/10" : "bg-secondary/10"}`}>
                <Icon className={`h-4 w-4 ${i % 2 === 0 ? "text-primary" : "text-secondary"}`} />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Section: How it works (flow) ──────────────────────────────────────────────

const flowSteps = [
  { icon: Star, label: "Rate books", detail: "5★ = strong signal, 1★ = negative" },
  { icon: BookOpen, label: "Build taste profile", detail: "Genres, authors, 8 dimensions" },
  { icon: Sparkles, label: "Match across entities", detail: "Books, readers, and clubs" },
  { icon: ThumbsUp, label: "Learn from feedback", detail: "Scores adjust each session" },
];

function HowItWorks() {
  return (
    <section className="py-12 border-b border-border">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8">
        How it works
      </h2>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-0">
        {flowSteps.map((step, i) => {
          const Icon = step.icon;
          const isLast = i === flowSteps.length - 1;
          return (
            <div key={step.label} className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-0 flex-1">
              <div className="flex items-center gap-3 sm:gap-0 sm:flex-col sm:items-start w-full">
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  {!isLast && (
                    <div className="hidden sm:block h-px flex-1 bg-border" style={{ width: "100%" }} />
                  )}
                </div>
                <div className="sm:mt-4">
                  <p className="text-sm font-semibold text-foreground">{step.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6">
        <Link href="/how-it-works" className="text-sm text-primary hover:underline">
          Read full explanation →
        </Link>
      </div>
    </section>
  );
}

// ── Section: Demo walkthrough ─────────────────────────────────────────────────

function DemoWalkthrough() {
  const steps = [
    {
      n: "1",
      title: "Sign in as the demo user",
      body: "One click signs you in as Sarah — a fantasy and dark academia reader with 10+ rated books and a rich taste profile already built.",
    },
    {
      n: "2",
      title: "Explore your recommendations",
      body: "The home page shows personalised book picks, readers, and clubs. Each card shows the match score, confidence level, and a plain-language reason.",
    },
    {
      n: "3",
      title: "Interact with the system",
      body: "Dismiss cards to tell the system what you don't want. Like cards to reinforce your taste. Watch the feedback message confirm the system has registered your preference.",
    },
    {
      n: "4",
      title: "Notice the exploratory picks",
      body: "Look for cards labelled \"Try something different\" — these are adjacency-gated suggestions outside Sarah's top genres, selected because they share her reading style.",
    },
  ];

  return (
    <section className="py-12 border-b border-border">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Demo walkthrough
        </h2>
        <Link href="/sign-in" className="text-xs text-primary hover:underline">
          Try it now →
        </Link>
      </div>
      <div className="space-y-5">
        {steps.map((s) => (
          <div key={s.n} className="flex gap-4">
            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">{s.n}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">{s.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Section: Key differentiators ─────────────────────────────────────────────

const differentiators = [
  {
    label: "Feedback loop",
    description:
      "Not just a static model. Explicit feedback (like / dismiss) is stored and blended into the taste profile, adjusting scores in future sessions.",
  },
  {
    label: "Confidence-aware explanations",
    description:
      "Match reasons change their phrasing based on score strength. A 90% match says \"You both enjoy Fantasy\"; a 55% match says \"Some overlap in Fantasy preferences\".",
  },
  {
    label: "Controlled exploration",
    description:
      "The system allocates one slot per section to an adjacent recommendation. It must share a taste dimension with the user, have a score ≥ 45, and not contain a disliked genre.",
  },
  {
    label: "Multi-entity matching",
    description:
      "The same taste engine powers three match types. Club matching averages member compatibility; book matching uses trigger books from your reading history.",
  },
];

function Differentiators() {
  return (
    <section className="py-12 border-b border-border">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8">
        What makes this different
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {differentiators.map((d) => (
          <div key={d.label} className="border-l-2 border-primary/40 pl-4">
            <p className="text-sm font-semibold text-foreground mb-1">{d.label}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{d.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Section: Tech stack ───────────────────────────────────────────────────────

const techStack = [
  { icon: Layers, name: "Next.js 14 App Router", detail: "Server components, Suspense, server actions" },
  { icon: Code2, name: "TypeScript", detail: "End-to-end type safety including Prisma client" },
  { icon: Cpu, name: "Custom recommendation engine", detail: "Pure TypeScript, no ML libraries — fully explainable" },
  { icon: Database, name: "PostgreSQL + Prisma", detail: "Relational data model with taste dimensions and feedback" },
  { icon: Sparkles, name: "Tailwind CSS + shadcn/ui", detail: "Warm editorial design system with Stacks palette" },
];

function TechStack() {
  return (
    <section className="py-12">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8">
        Tech stack
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {techStack.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.name} className="flex items-start gap-3 bg-card border border-border rounded-lg px-4 py-3">
              <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ShowcasePage() {
  return (
    <div className="p-6 max-w-3xl">
      <Hero />
      <ProblemSolution />
      <Features />
      <HowItWorks />
      <DemoWalkthrough />
      <Differentiators />
      <TechStack />
    </div>
  );
}
