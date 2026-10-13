"use client";

import { use, type ReactNode } from "react";
import { browser } from "react-dom";

export function BrowserOnly({ children }: { children: ReactNode }) {
  use(browser("muselearning keeps all of its data in this browser's localStorage."));
  return children;
}
