"use client";

import { create } from "zustand";

export interface Toast {
  id: number;
  title: string;
  body?: string;
  tone: "success" | "info" | "danger";
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let seq = 0;

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = ++seq;
    set({ toasts: [...get().toasts.slice(-2), { ...t, id }] });
    setTimeout(() => get().dismiss(id), 4200);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = (title: string, body?: string, tone: Toast["tone"] = "success") => useToasts.getState().push({ title, body, tone });
