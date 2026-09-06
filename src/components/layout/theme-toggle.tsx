"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("majestic-theme", next);
      localStorage.setItem("admin-theme", next);
    } catch {}
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "majestic-theme", theme: next }, "*");
    }
  }

  return (
    <button
      onClick={toggle}
      className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to white + blue" : "Switch to black + lime"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-[#b6ff2a]" />
      ) : (
        <Moon className="h-5 w-5 text-[#156cdd]" />
      )}
    </button>
  );
}
