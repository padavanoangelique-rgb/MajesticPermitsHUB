"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

const KEY = "majestic-theme";

export function ThemeSync() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    function apply(next: string) {
      if (next !== "light" && next !== "dark") return;
      setTheme(next);
      try {
        localStorage.setItem(KEY, next);
      } catch {}
    }

    function onMessage(e: MessageEvent) {
      const data = e.data;
      if (!data || data.type !== "majestic-theme") return;
      apply(String(data.theme));
    }

    window.addEventListener("message", onMessage);

    try {
      const saved = localStorage.getItem(KEY) || localStorage.getItem("admin-theme");
      if (saved === "light" || saved === "dark") apply(saved);
    } catch {}

    return () => window.removeEventListener("message", onMessage);
  }, [setTheme]);

  useEffect(() => {
    if (theme !== "light" && theme !== "dark") return;
    try {
      localStorage.setItem(KEY, theme);
    } catch {}
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "majestic-theme", theme }, "*");
    }
  }, [theme]);

  return null;
}
