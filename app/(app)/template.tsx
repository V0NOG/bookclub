import type { ReactNode } from "react";

export default function AppTemplate({ children }: { children: ReactNode }) {
  return (
    <div className="folio-soft-enter flex w-full justify-center">
      {children}
    </div>
  );
}
