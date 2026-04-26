# Folio Phase 2: Landing Page, App Shell & Onboarding

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public landing page, Spotify-style app shell (sidebar + layout), sign-in/up pages, and the multi-step onboarding flow.

**Architecture:** Three distinct layout groups: `(public)` for landing/auth, `(app)` for authenticated shell. Onboarding is a standalone route that intercepts after sign-up. All pages use seeded data and server components where possible.

**Tech Stack:** Next.js 14 App Router, server actions for forms, NextAuth session hooks, Tailwind, shadcn/ui, lucide-react

**Prerequisite:** Phase 1 complete, dev server runs, database seeded.

---

## File Map

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout (font, theme provider, session provider) |
| `app/page.tsx` | Public landing page |
| `app/(auth)/sign-in/page.tsx` | Sign-in form |
| `app/(auth)/sign-up/page.tsx` | Sign-up form |
| `app/(auth)/layout.tsx` | Auth layout (centred card) |
| `app/(app)/layout.tsx` | App shell layout (sidebar + main area) |
| `app/(app)/home/page.tsx` | Home dashboard (placeholder carousels) |
| `app/onboarding/page.tsx` | Multi-step onboarding |
| `app/onboarding/actions.ts` | Server action: save onboarding |
| `app/(auth)/sign-up/actions.ts` | Server action: register user |
| `app/(auth)/sign-in/actions.ts` | Server action: sign in |
| `components/layout/sidebar.tsx` | Left sidebar navigation |
| `components/layout/top-bar.tsx` | Top bar with search + user menu |
| `components/layout/currently-reading-bar.tsx` | Sticky bottom bar |
| `components/layout/session-provider.tsx` | NextAuth client provider |
| `components/onboarding/onboarding-wizard.tsx` | Multi-step wizard UI |
| `components/landing/hero.tsx` | Hero section |
| `components/landing/feature-section.tsx` | Feature cards |

---

### Task 1: Root layout and providers

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/layout/session-provider.tsx`

- [ ] **Step 1: Create `components/layout/session-provider.tsx`**

```typescript
"use client";

import { SessionProvider } from "next-auth/react";

export function AppSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 2: Replace `app/layout.tsx`**

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx components/layout/session-provider.tsx
git commit -m "feat: root layout with session provider and dark mode"
```

---

### Task 2: Landing page

**Files:**
- Modify: `app/page.tsx`
- Create: `components/landing/hero.tsx`
- Create: `components/landing/feature-section.tsx`
- Create: `components/landing/cta-section.tsx`

- [ ] **Step 1: Create `components/landing/hero.tsx`**

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
          <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 h-12 text-base">
            <Link href="/sign-up">Start matching →</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-border h-12 text-base">
            <Link href="/clubs">Explore clubs</Link>
          </Button>
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
```

- [ ] **Step 2: Create `components/landing/feature-section.tsx`**

```typescript
import { BookOpen, Users, Target, Trophy, Vote, BarChart3 } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Taste-based recommendations",
    description: "We analyse your ratings, abandoned books, preferred themes, and reading patterns to surface books you'll actually love — not just popular titles.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    icon: Users,
    title: "Taste-matched readers",
    description: "Find readers whose taste mirrors yours. See exactly why you're compatible: shared loves, matching styles, overlapping dislikes.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Target,
    title: "Discover book clubs",
    description: "Get matched to clubs based on your taste profile — not just genre. Know your compatibility score and top reasons before you even apply.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: BarChart3,
    title: "Reading tracker",
    description: "Log sessions, track progress, see your reading streaks, and get estimated finish dates. Your reading history at a glance.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    icon: Trophy,
    title: "Reading challenges",
    description: "Compete with friends and club members. Who read the most pages this month? Fastest to finish the club book? Leaderboards make it fun.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: Vote,
    title: "Democratic book voting",
    description: "Clubs vote on what to read next. Every option shows its taste match score so members can make informed choices — not just popularity contests.",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
];

export function FeatureSection() {
  return (
    <section className="py-24 bg-card/30">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything a reader needs
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Taste matching powers every feature — from recommendations to club discovery to book voting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-border bg-card p-6 hover:border-border/80 transition-colors">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${feature.bg} mb-4`}>
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `components/landing/cta-section.tsx`**

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to find your next favourite book?
        </h2>
        <p className="text-muted-foreground text-lg mb-8">
          Join thousands of readers discovering books, clubs, and communities that match their taste.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 h-12 text-base">
            <Link href="/sign-up">Get started free →</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 text-base">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Replace `app/page.tsx`**

```typescript
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
```

- [ ] **Step 5: Verify in browser**

```bash
# Server should already be running. Visit:
open http://localhost:3000
```

Expected: Dark landing page with hero, feature cards, footer.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx components/landing/
git commit -m "feat: landing page with hero, features, and CTA sections"
```

---

### Task 3: Auth layout and sign-up page

**Files:**
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/sign-up/page.tsx`
- Create: `app/(auth)/sign-up/actions.ts`

- [ ] **Step 1: Create `app/(auth)/layout.tsx`**

```typescript
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white mb-8">
        <BookOpen className="h-6 w-6 text-emerald-500" />
        Folio
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/(auth)/sign-up/actions.ts`**

```typescript
"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signUpAction(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = signUpSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Validation failed" };
  }

  const { name, email, password } = result.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const username = email.split("@")[0]!.toLowerCase().replace(/[^a-z0-9]/g, "") + Math.floor(Math.random() * 1000);

  await db.user.create({
    data: {
      name,
      email,
      username,
      passwordHash,
      onboarded: false,
    },
  });

  redirect("/sign-in?registered=true");
}
```

- [ ] **Step 3: Create `app/(auth)/sign-up/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signUpAction } from "./actions";

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signUpAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-white">Create your account</CardTitle>
        <CardDescription>Join thousands of readers discovering their next favourite book.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" placeholder="Your name" required className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="At least 8 characters" required className="bg-background" />
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}
          <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" disabled={loading}>
            {loading ? "Creating account..." : "Create account →"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-emerald-400 hover:underline">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat: auth layout and sign-up page with server action"
```

---

### Task 4: Sign-in page

**Files:**
- Create: `app/(auth)/sign-in/page.tsx`

- [ ] **Step 1: Create `app/(auth)/sign-in/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const registered = params.get("registered");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: form.get("email") as string,
      password: form.get("password") as string,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Try sarah@folio.dev / password123 for the demo.");
      setLoading(false);
    } else {
      router.push("/home");
      router.refresh();
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-white">Welcome back</CardTitle>
        <CardDescription>
          {registered
            ? "Account created! Sign in to continue."
            : "Sign in to your Folio account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {registered && (
          <div className="mb-4 text-sm text-emerald-400 bg-emerald-400/10 rounded-md px-3 py-2">
            Account created successfully! Sign in below.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required defaultValue="stormbreaker128@gmail.com" className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="Password" required defaultValue="password123" className="bg-background" />
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}
          <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" disabled={loading}>
            {loading ? "Signing in..." : "Sign in →"}
          </Button>
        </form>
        <div className="mt-4 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Demo accounts:</p>
          <p>sarah@folio.dev — fantasy/dark academia organiser</p>
          <p>marcus@folio.dev — literary fiction reader</p>
          <p>priya@folio.dev — romance enthusiast</p>
          <p className="italic mt-1">All passwords: password123</p>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Don't have an account?{" "}
          <Link href="/sign-up" className="text-emerald-400 hover:underline">Sign up free</Link>
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(auth\)/sign-in/
git commit -m "feat: sign-in page with demo account hints"
```

---

### Task 5: App shell — sidebar navigation

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `components/layout/sidebar.tsx`
- Create: `components/layout/top-bar.tsx`
- Create: `components/layout/currently-reading-bar.tsx`

- [ ] **Step 1: Create `components/layout/sidebar.tsx`**

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen, Home, Compass, Users, Library, Activity,
  Trophy, Rss, User, Settings, LogOut
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/clubs", icon: Users, label: "Clubs" },
  { href: "/library", icon: Library, label: "My Library" },
  { href: "/tracker", icon: Activity, label: "Tracker" },
  { href: "/challenges", icon: Trophy, label: "Challenges" },
  { href: "/feed", icon: Rss, label: "Feed" },
];

const bottomNavItems = [
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-border bg-card flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/home" className="flex items-center gap-2 font-bold text-lg text-white">
          <BookOpen className="h-5 w-5 text-emerald-500" />
          Folio
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-muted-foreground hover:text-white hover:bg-accent"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="px-3 pb-4 border-t border-border pt-4 space-y-1">
        {bottomNavItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-muted-foreground hover:text-white hover:bg-accent"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full justify-start gap-3 px-3 text-muted-foreground hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create `components/layout/top-bar.tsx`**

```typescript
import { getSession } from "@/lib/auth-helpers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export async function TopBar() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur flex items-center px-6 gap-4">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search books, clubs, readers..."
          className="pl-9 bg-muted/50 border-border focus:bg-background"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Bell className="h-5 w-5 text-muted-foreground hover:text-white cursor-pointer transition-colors" />
        <Link href="/profile">
          <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-emerald-500 transition-all">
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">
              {session?.user?.name?.[0] ?? "U"}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create `components/layout/currently-reading-bar.tsx`**

```typescript
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { BookOpen, ChevronUp } from "lucide-react";
import Link from "next/link";

export async function CurrentlyReadingBar() {
  const session = await getSession();
  if (!session) return null;

  const currentBook = await db.userBook.findFirst({
    where: { userId: session.user.id, status: "CURRENTLY_READING" },
    include: { book: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!currentBook) return null;

  const percent = currentBook.book.pageCount
    ? Math.round((currentBook.progress / currentBook.book.pageCount) * 100)
    : 0;

  return (
    <div className="fixed bottom-0 left-60 right-0 z-30 border-t border-border bg-card/95 backdrop-blur h-16 flex items-center px-6 gap-4">
      <div className="flex items-center gap-3 flex-1">
        {currentBook.book.cover ? (
          <img src={currentBook.book.cover} alt="" className="h-8 w-6 object-cover rounded-sm" />
        ) : (
          <BookOpen className="h-5 w-5 text-emerald-500" />
        )}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Currently reading</p>
          <p className="text-sm font-medium text-white truncate">{currentBook.book.title}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground w-8">{percent}%</span>
      </div>

      <Link href="/tracker" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
        <ChevronUp className="h-3 w-3" />
        Log session
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Create `app/(app)/layout.tsx`**

```typescript
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { CurrentlyReadingBar } from "@/components/layout/currently-reading-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) redirect("/sign-in");
  if (!session.user.onboarded) redirect("/onboarding");

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-60 min-h-screen">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-16">
          {children}
        </main>
        <CurrentlyReadingBar />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create placeholder home page `app/(app)/home/page.tsx`**

```typescript
import { requireOnboarding } from "@/lib/auth-helpers";

export default async function HomePage() {
  const session = await requireOnboarding();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-2">
        Good reading, {session.user.name?.split(" ")[0]} 👋
      </h1>
      <p className="text-muted-foreground">Your personalised reading dashboard is coming in Phase 5.</p>
    </div>
  );
}
```

- [ ] **Step 6: Verify shell in browser**

```bash
open http://localhost:3000/sign-in
```

Sign in with `stormbreaker128@gmail.com` / `password123`. Expected: redirected to `/home` with sidebar, top bar, and bottom currently-reading bar.

- [ ] **Step 7: Commit**

```bash
git add app/\(app\)/ components/layout/
git commit -m "feat: Spotify-style app shell with sidebar, top bar, and reading bar"
```

---

### Task 6: Onboarding wizard

**Files:**
- Create: `app/onboarding/page.tsx`
- Create: `app/onboarding/actions.ts`
- Create: `components/onboarding/onboarding-wizard.tsx`

- [ ] **Step 1: Create `app/onboarding/actions.ts`**

```typescript
"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

type OnboardingPayload = {
  favoriteGenres: string[];
  favoriteAuthors: string[];
  preferredMoods: string[];
  preferredThemes: string[];
  readingGoalBooksPerYear: number;
  clubPreference: string;
  interestedInClubs: boolean;
  interestedInChallenges: boolean;
  userType: "READER" | "ORGANISER" | "MEMBER" | "INFLUENCER";
};

export async function saveOnboardingAction(payload: OnboardingPayload) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const userId = session.user.id;

  await db.onboardingData.upsert({
    where: { userId },
    update: { ...payload, completedAt: new Date() },
    create: { userId, ...payload, completedAt: new Date() },
  });

  // Create initial taste profile from onboarding data
  await db.tasteProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      topGenres: payload.favoriteGenres,
      topAuthors: payload.favoriteAuthors,
      topThemes: payload.preferredThemes,
      topMoods: payload.preferredMoods,
      dislikedGenres: [],
      dislikedThemes: [],
      dislikedAuthors: [],
      confidence: "LOW",
      lastCalculated: new Date(),
    },
  });

  // Create default reading goal
  await db.readingGoal.upsert({
    where: { userId_type_year: { userId, type: "BOOKS_PER_YEAR", year: new Date().getFullYear() } },
    update: {},
    create: { userId, type: "BOOKS_PER_YEAR", target: payload.readingGoalBooksPerYear, year: new Date().getFullYear() },
  });

  // Create user score record
  await db.userScore.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  // Mark user as onboarded
  await db.user.update({ where: { id: userId }, data: { onboarded: true, userType: payload.userType } });

  redirect("/home");
}
```

- [ ] **Step 2: Create `components/onboarding/onboarding-wizard.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { saveOnboardingAction } from "@/app/onboarding/actions";

const GENRES = ["Fantasy", "Science Fiction", "Literary Fiction", "Historical Fiction", "Mystery", "Romance", "Thriller", "Horror", "Contemporary Fiction", "Non-fiction", "Biography", "Dark Academia", "Cozy Fantasy", "Romantasy"];
const MOODS = ["Immersive", "Fast-paced", "Character-driven", "Atmospheric", "Feel-good", "Thought-provoking", "Emotional", "Adventurous", "Dark", "Witty"];
const THEMES = ["Magic & Fantasy", "Romance & Love", "Family & Identity", "War & Conflict", "Mystery & Secrets", "Science & Technology", "Coming of Age", "Mythology", "Academia", "Social Justice"];
const AUTHORS = ["Patrick Rothfuss", "Leigh Bardugo", "Hanya Yanagihara", "Taylor Jenkins Reid", "Andy Weir", "Min Jin Lee", "Susanna Clarke", "Olivie Blake", "Sally Rooney", "Rebecca Yarros", "Emily Henry", "Matt Haig", "Richard Osman", "Silvia Moreno-Garcia", "RF Kuang"];
const GOALS = [6, 12, 24, 36, 52];
const USER_TYPES = [
  { value: "READER", label: "Reader", desc: "I want to discover books and track my reading" },
  { value: "ORGANISER", label: "Club Organiser", desc: "I run or want to start a book club" },
  { value: "MEMBER", label: "Club Member", desc: "I want to join existing book clubs" },
  { value: "INFLUENCER", label: "Booktoker / Influencer", desc: "I share book content with an audience" },
] as const;

type Step = "genres" | "authors" | "moods" | "goals" | "clubs" | "type";
const STEPS: Step[] = ["genres", "authors", "moods", "goals", "clubs", "type"];

export function OnboardingWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [favoriteAuthors, setFavoriteAuthors] = useState<string[]>([]);
  const [preferredMoods, setPreferredMoods] = useState<string[]>([]);
  const [preferredThemes] = useState<string[]>([]);
  const [readingGoal, setReadingGoal] = useState(12);
  const [clubPreference, setClubPreference] = useState("online");
  const [interestedInClubs, setInterestedInClubs] = useState(true);
  const [interestedInChallenges, setInterestedInChallenges] = useState(true);
  const [userType, setUserType] = useState<"READER" | "ORGANISER" | "MEMBER" | "INFLUENCER">("READER");

  const currentStep = STEPS[stepIndex]!;
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  function toggle<T>(arr: T[], item: T, setter: (v: T[]) => void) {
    setter(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  }

  async function handleFinish() {
    setLoading(true);
    await saveOnboardingAction({
      favoriteGenres,
      favoriteAuthors,
      preferredMoods,
      preferredThemes,
      readingGoalBooksPerYear: readingGoal,
      clubPreference,
      interestedInClubs,
      interestedInChallenges,
      userType,
    });
  }

  const canProceed =
    (currentStep === "genres" && favoriteGenres.length >= 2) ||
    (currentStep === "authors" && favoriteAuthors.length >= 1) ||
    (currentStep === "moods" && preferredMoods.length >= 2) ||
    currentStep === "goals" ||
    currentStep === "clubs" ||
    currentStep === "type";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Building your taste profile</span>
            <span>{stepIndex + 1} / {STEPS.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-card border border-border rounded-2xl p-8 min-h-[400px] flex flex-col">
          {currentStep === "genres" && (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">What genres do you love?</h2>
              <p className="text-muted-foreground mb-6">Pick at least 2. This shapes your taste profile.</p>
              <div className="flex flex-wrap gap-2 flex-1">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => toggle(favoriteGenres, g, setFavoriteGenres)}
                    className={cn(
                      "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                      favoriteGenres.includes(g)
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-border text-muted-foreground hover:border-emerald-500/50 hover:text-white"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStep === "authors" && (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Any favourite authors?</h2>
              <p className="text-muted-foreground mb-6">Select any you love. Helps us find readers who read like you.</p>
              <div className="flex flex-wrap gap-2 flex-1">
                {AUTHORS.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggle(favoriteAuthors, a, setFavoriteAuthors)}
                    className={cn(
                      "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                      favoriteAuthors.includes(a)
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-border text-muted-foreground hover:border-emerald-500/50 hover:text-white"
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStep === "moods" && (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">What moods do you read for?</h2>
              <p className="text-muted-foreground mb-6">Pick at least 2 reading vibes.</p>
              <div className="flex flex-wrap gap-2 flex-1">
                {MOODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => toggle(preferredMoods, m, setPreferredMoods)}
                    className={cn(
                      "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                      preferredMoods.includes(m)
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-border text-muted-foreground hover:border-emerald-500/50 hover:text-white"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStep === "goals" && (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">How many books this year?</h2>
              <p className="text-muted-foreground mb-6">Set a reading goal. You can change this any time.</p>
              <div className="grid grid-cols-5 gap-3 flex-1 content-start">
                {GOALS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setReadingGoal(g)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl border text-sm font-medium transition-all aspect-square",
                      readingGoal === g
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-border text-muted-foreground hover:border-emerald-500/50 hover:text-white"
                    )}
                  >
                    <span className="text-2xl font-bold">{g}</span>
                    <span className="text-xs mt-1">books</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStep === "clubs" && (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Clubs and challenges?</h2>
              <p className="text-muted-foreground mb-6">Help us personalise your discovery feed.</p>
              <div className="space-y-4 flex-1">
                <div>
                  <p className="text-sm font-medium text-white mb-2">Club preference</p>
                  <div className="flex gap-3">
                    {["online", "local", "both"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setClubPreference(p)}
                        className={cn(
                          "flex-1 py-3 rounded-lg border text-sm font-medium transition-all capitalize",
                          clubPreference === p
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-border text-muted-foreground hover:border-emerald-500/50"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setInterestedInClubs(!interestedInClubs)}
                    className={cn(
                      "flex-1 flex items-center gap-3 p-4 rounded-xl border text-sm transition-all",
                      interestedInClubs ? "bg-emerald-500/10 border-emerald-500" : "border-border"
                    )}
                  >
                    {interestedInClubs && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    <span className={interestedInClubs ? "text-emerald-400" : "text-muted-foreground"}>I'm interested in book clubs</span>
                  </button>
                  <button
                    onClick={() => setInterestedInChallenges(!interestedInChallenges)}
                    className={cn(
                      "flex-1 flex items-center gap-3 p-4 rounded-xl border text-sm transition-all",
                      interestedInChallenges ? "bg-emerald-500/10 border-emerald-500" : "border-border"
                    )}
                  >
                    {interestedInChallenges && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    <span className={interestedInChallenges ? "text-emerald-400" : "text-muted-foreground"}>I'm interested in challenges</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {currentStep === "type" && (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">How do you describe yourself?</h2>
              <p className="text-muted-foreground mb-6">This helps us tailor your experience.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 content-start">
                {USER_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setUserType(t.value)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all",
                      userType === t.value
                        ? "bg-emerald-500/10 border-emerald-500"
                        : "border-border hover:border-emerald-500/50"
                    )}
                  >
                    <p className={cn("font-medium mb-1", userType === t.value ? "text-emerald-400" : "text-white")}>{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0}
              className="text-muted-foreground"
            >
              Back
            </Button>
            {stepIndex < STEPS.length - 1 ? (
              <Button
                onClick={() => setStepIndex((i) => i + 1)}
                disabled={!canProceed}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8"
              >
                {loading ? "Setting up your profile..." : "Start reading →"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `app/onboarding/page.tsx`**

```typescript
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.onboarded) redirect("/home");

  return <OnboardingWizard />;
}
```

- [ ] **Step 4: Test full sign-up → onboarding → home flow**

```bash
open http://localhost:3000/sign-up
```

1. Create a test account with a new email
2. Sign in
3. Complete the onboarding wizard (6 steps)
4. Confirm redirect to `/home` with sidebar visible

- [ ] **Step 5: Commit**

```bash
git add app/onboarding/ components/onboarding/
git commit -m "feat: 6-step onboarding wizard with taste profile initialisation"
```

---

## Phase 2 Complete

**What's working:**
- Public landing page with hero, feature grid, CTA
- Sign-up with server action + validation
- Sign-in with NextAuth credentials
- Spotify-style sidebar shell (60px sidebar, top bar, reading bar)
- 6-step onboarding wizard that creates initial taste profile
- Route guards: unauthenticated → `/sign-in`, unboarded → `/onboarding`

**Next:** Phase 3 — Personal library and reading tracker.
