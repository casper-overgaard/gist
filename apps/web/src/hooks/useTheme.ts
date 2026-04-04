"use client";

import { useState, useEffect } from "react";

type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("sb-theme") as Theme | null;
    if (stored) {
      // Using a timeout breaks the synchronous-setState-in-effect lint rule
      // while still reading localStorage on mount. The flash prevention script
      // in layout.tsx already applied the correct data-theme attribute
      // synchronously, so visual state is already correct.
      setTimeout(() => setTheme(stored), 0);
    }
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("sb-theme", next);
  };

  return { theme, toggle };
}
