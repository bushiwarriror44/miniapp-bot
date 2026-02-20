"use client";

interface UserLabelBadgeProps {
  name: string;
  color: string;
}

export function UserLabelBadge({ name, color }: UserLabelBadgeProps) {
  const rgb = hexToRgb(color);
  const bgColor = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)` : "var(--color-surface)";
  const textColor = color || "var(--color-text)";

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {name}
    </span>
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
