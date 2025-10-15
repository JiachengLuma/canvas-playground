/**
 * Color Theme Hook
 * Manages the selection/hover color theme (blue vs black)
 */

import { useState, useEffect } from "react";

export type ColorTheme = "blue" | "black";

const THEME_COLORS = {
  blue: {
    selection: "rgb(59 130 246)", // blue-500
    hover: "rgb(147 197 253)", // blue-300
  },
  black: {
    selection: "rgb(0 0 0)", // black
    hover: "rgba(0, 0, 0, 0.3)", // transparent black
  },
} as const;

const STORAGE_KEY = "canvas-color-theme";

export function useColorTheme() {
  // Initialize from localStorage or default to black
  const [theme, setTheme] = useState<ColorTheme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as ColorTheme) || "black";
  });

  // Save to localStorage when theme changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "blue" ? "black" : "blue"));
  };

  const colors = THEME_COLORS[theme];

  return {
    theme,
    setTheme,
    toggleTheme,
    selectionColor: colors.selection,
    hoverColor: colors.hover,
  };
}

