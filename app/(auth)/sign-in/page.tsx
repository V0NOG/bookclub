"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function SignInPageInner() {
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
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/home");
      router.refresh();
    }
  }

  async function handleDemo() {
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      email: "sarah@folio.dev",
      password: "password123",
      redirect: false,
    });
    if (result?.error) {
      setError("Demo sign-in failed. Please try again.");
      setLoading(false);
    } else {
      router.push("/home");
      router.refresh();
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-foreground">Welcome back</CardTitle>
        <CardDescription>
          {registered
            ? "Account created! Sign in to continue."
            : "Sign in to your Folio account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <button
          type="button"
          onClick={handleDemo}
          disabled={loading}
          className="w-full mb-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : "Try Demo — sign in as Sarah"}
        </button>
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or sign in with email</span>
          </div>
        </div>
        {registered && (
          <div className="mb-4 text-sm text-primary bg-primary/10 rounded-md px-3 py-2">
            Account created successfully! Sign in below.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required defaultValue="sarah@folio.dev" className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="Password" required defaultValue="password123" className="bg-background" />
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in →"}
          </button>
        </form>
        <div className="mt-4 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Demo accounts:</p>
          <p>sarah@folio.dev — fantasy/dark academia organiser</p>
          <p>marcus@folio.dev — literary fiction reader</p>
          <p>priya@folio.dev — romance enthusiast</p>
          <p className="italic mt-1">All passwords: password123</p>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-primary hover:underline">Sign up free</Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInPageInner />
    </Suspense>
  );
}
