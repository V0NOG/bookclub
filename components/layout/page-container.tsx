import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  maxWidth?: "default" | "narrow" | "none";
};

export function PageContainer({ children, className, maxWidth = "default" }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 pt-8 pb-[calc(var(--mini-player-height)+2rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8",
        maxWidth === "default" && "max-w-7xl",
        maxWidth === "narrow" && "max-w-3xl",
        maxWidth === "none" && "max-w-none",
        className
      )}
    >
      {children}
    </div>
  );
}
