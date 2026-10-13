"use client";

import { useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

export function useIsDark() {
  return useSyncExternalStore(subscribe, () => document.documentElement.classList.contains("dark"), () => false);
}

export function setTheme(mode: "light" | "dark" | "system") {
  try {
    if (mode === "system") localStorage.removeItem("muse-theme");
    else localStorage.setItem("muse-theme", mode);
  } catch {
    // Storage unavailable (private mode): the theme still applies until the page reloads.
  }
  const dark = mode === "system" ? matchMedia("(prefers-color-scheme: dark)").matches : mode === "dark";
  document.documentElement.classList.toggle("dark", dark);
}

export function toggleTheme() {
  setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark");
}

export function themePreference(): "light" | "dark" | "system" {
  try {
    const t = localStorage.getItem("muse-theme");
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}
