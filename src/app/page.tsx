import { Suspense } from "react";
import { BrowserOnly } from "@/components/browser-only";
import { SignIn } from "@/components/sign-in";

export const instant = false;

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-bg" />}>
      <BrowserOnly>
        <SignIn />
      </BrowserOnly>
    </Suspense>
  );
}
