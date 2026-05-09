"use client";

import { useEffect, useState } from "react";

import { ONBOARDING_STORAGE_KEY } from "@/lib/storageKeys";

// null  = not yet resolved (server render + first paint — avoids hydration mismatch)
// true  = show onboarding
// false = go straight to the app
//
// IMPORTANT: localStorage reads must be guarded because server render has no window.
export function useOnboardingGate() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      const done = localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1";
      setShowOnboarding(!done);
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return {
    showOnboarding,
    dismissOnboarding: () => setShowOnboarding(false),
  };
}
