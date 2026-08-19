import type { SectionStyle } from "@/app/types/pageBuilder";

// ─── Padding map ─────────────────────────────────────────────────────────────

const paddingMap: Record<string, string> = {
  none: "py-0",
  sm: "py-8",
  md: "py-16",
  lg: "py-24",
  xl: "py-32",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Converts a Sanity color object to an rgba() CSS string.
 * Falls back to the hex value if rgb channels aren't available.
 */
function toCSS(color?: SectionStyle["bgColor"]): string | undefined {
  if (!color) return undefined;
  if (color.rgb) {
    const { r, g, b, a } = color.rgb;
    return `rgba(${r}, ${g}, ${b}, ${a ?? 1})`;
  }
  return color.hex;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface SectionWrapperProps {
  style?: SectionStyle;
  children: React.ReactNode;
  /** Extra class names to merge in (e.g. the block's own px/py defaults) */
  className?: string;
}

export default function SectionWrapper({
  style,
  children,
  className = "",
}: SectionWrapperProps) {
  const bg = toCSS(style?.bgColor);
  const text = toCSS(style?.textColor);
  const paddingClass = paddingMap[style?.paddingY ?? "md"];

  return (
    <div
      className={`transition-colors duration-300 ${paddingClass} ${className}`}
      style={{
        ...(bg ? { backgroundColor: bg } : {}),
        ...(text ? { color: text } : {}),
      }}
    >
      {children}
    </div>
  );
}
