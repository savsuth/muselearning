"use client";

import type { Notification } from "./types";

const KEY = "muse-notify";
const DEFAULTS = { grades: true, announcements: true, replies: true, due: true, messages: true };
export type NotifyPrefs = typeof DEFAULTS;

const kindToPref: Record<Notification["kind"], keyof NotifyPrefs> = {
  grade: "grades",
  announcement: "announcements",
  reply: "replies",
  due: "due",
  message: "messages",
};

export function loadNotify(): NotifyPrefs {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return DEFAULTS;
  }
}

export function saveNotify(p: NotifyPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
    window.dispatchEvent(new Event("muse-notify"));
  } catch {
    // Storage unavailable (private mode): the choice still applies until the page reloads.
  }
}

export function wants(p: NotifyPrefs, n: Notification) {
  return p[kindToPref[n.kind]];
}
