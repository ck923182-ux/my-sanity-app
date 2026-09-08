"use client";

import { createContext, useContext } from "react";
import type { ThemeColor } from "@/app/types/pageBuilder";

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeColor[]>([]);

export function ThemeProvider({
  palette,
  children,
}: {
  palette: ThemeColor[];
  children: React.ReactNode;
}) {
  return (
    <ThemeContext.Provider value={palette}>{children}</ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Resolves a color token label (e.g. "Brand Red") to its CSS value.
 * Falls back to the raw string itself so plain hex values still work.
 */
export function resolveToken(
  palette: ThemeColor[],
  token?: string
): string | undefined {
  if (!token) return undefined;

  const entry = palette.find(
    (c) => c.label.toLowerCase() === token.toLowerCase()
  );

  if (entry?.value) {
    const { rgb, hex } = entry.value;
    if (rgb) return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a ?? 1})`;
    return hex;
  }

  // If the token doesn't match any label, treat it as a raw CSS value
  return token;
}
