import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl text-foreground mb-8">
        <BookOpen className="h-6 w-6 text-primary" />
        Folio
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
