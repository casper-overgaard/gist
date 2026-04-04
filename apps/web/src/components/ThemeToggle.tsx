"use client";

import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="px-3 py-2 bg-sb-surface-1 text-sb-text-muted border border-sb-border rounded hover:border-sb-border-hover hover:text-sb-text-primary transition-colors text-[9px] tracking-[0.10em] uppercase"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? "☼ Light" : "◑ Dark"}
    </button>
  );
}
