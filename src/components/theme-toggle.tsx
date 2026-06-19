"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.dataset.theme = mode;
  localStorage.setItem("jukwaa-theme", mode);
}

export function ThemeToggle({ variant = "default" }: { variant?: "default" | "topbar" }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("jukwaa-theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  function toggleTheme() {
    const nextMode = mode === "dark" ? "light" : "dark";
    setMode(nextMode);
  }

  return (
    <button
      aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
      className={`j-theme-toggle ${variant === "topbar" ? "j-theme-toggle--topbar" : ""}`}
      onClick={toggleTheme}
      title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
      type="button"
    >
      {mode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
