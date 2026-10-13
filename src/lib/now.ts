"use client";

import { useSyncExternalStore } from "react";

let now = Date.now();
const subs = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(cb: () => void) {
  subs.add(cb);
  if (!timer) {
    timer = setInterval(() => {
      now = Date.now();
      subs.forEach((f) => f());
    }, 30_000);
  }
  return () => {
    subs.delete(cb);
    if (!subs.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

export function useNow() {
  return useSyncExternalStore(subscribe, () => now, () => now);
}
