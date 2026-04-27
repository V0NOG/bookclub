import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
          <Link href="/sign-up" className={cn(buttonVariants({ variant: "default" }), "bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 h-12 text-base")}>
            Get started free →
          </Link>
          <Link href="/sign-in" className={cn(buttonVariants({ variant: "outline" }), "h-12 text-base")}>
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
