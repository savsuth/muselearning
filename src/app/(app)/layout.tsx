import { Suspense } from "react";
import { BrowserOnly } from "@/components/browser-only";
import { AppShell } from "@/components/shell";

// All app data lives in localStorage, so this segment renders in the browser by design.
export const instant = false;

function ShellSkeleton() {
  return (
    <div className="min-h-[100dvh]">
      <div className="fixed inset-y-0 left-0 hidden w-[84px] bg-nav md:block" />
      <div className="mx-auto max-w-[1200px] px-5 py-10 md:pl-[124px]">
        <div className="h-8 w-56 animate-pulse rounded-[10px] bg-surface-2" />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-[230px] animate-pulse rounded-[14px] bg-surface-2" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <BrowserOnly>
        <AppShell>{children}</AppShell>
      </BrowserOnly>
    </Suspense>
  );
}
