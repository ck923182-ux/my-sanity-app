"use client";

import { useTheme, resolveToken } from "@/app/context/ThemeContext";
import type { SectionStyle } from "@/app/types/pageBuilder";

// ─── Padding map ──────────────────────────────────────────────────────────────

const paddingMap: Record<string, string> = {
  none: "py-0",
  sm:   "py-8",
  md:   "py-16",
  lg:   "py-24",
  xl:   "py-32",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface SectionWrapperProps {
  style?: SectionStyle;
  children: React.ReactNode;
  className?: string;
}

export default function SectionWrapper({
  style,
  children,
  className = "",
}: SectionWrapperProps) {
  const palette  = useTheme();
  const bg       = resolveToken(palette, style?.bgColorToken);
  const text     = resolveToken(palette, style?.textColorToken);
  const padding  = paddingMap[style?.paddingY ?? "md"];

  return (
    <div
      className={`transition-colors duration-300 ${padding} ${className}`}
      style={{
        ...(bg   ? { backgroundColor: bg }  : {}),
        ...(text ? { color: text }          : {}),
      }}
    >
      {children}
    </div>
  );
}
