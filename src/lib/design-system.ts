export const designTokens = {
  colors: {
    primary: "#0F172A",
    secondary: "#475569",
    accent: "#0EA5E9",
    background: "#F8FAFC",
    card: "#FFFFFF",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    dark: {
      background: "#020617",
      card: "#0F172A",
      border: "#334155",
      text: "#E2E8F0",
      accent: "#38BDF8",
    },
  },
  spacing: {
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
  },
  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
  },
  font: {
    heading: "Inter",
    body: "Inter",
  },
} as const;

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb | null {
  const normalized = hex.trim().replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function luminance({ r, g, b }: Rgb) {
  const channel = [r, g, b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
}

export function contrastRatio(foreground: string, background: string) {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  if (!fg || !bg) return 0;
  const lighter = Math.max(luminance(fg), luminance(bg));
  const darker = Math.min(luminance(fg), luminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
}

export function validateWorkspaceAccent(accentColor: string, backgroundColor = designTokens.colors.card) {
  const accent = hexToRgb(accentColor);
  const background = hexToRgb(backgroundColor);
  if (!accent || !background) {
    return { valid: false, reason: "Use a six-digit hex color." };
  }

  const againstWhite = contrastRatio(accentColor, backgroundColor);
  const againstNavy = contrastRatio(accentColor, designTokens.colors.primary);
  if (againstWhite < 3 && againstNavy < 3) {
    return { valid: false, reason: "Accent color does not meet minimum UI contrast." };
  }

  return { valid: true, reason: "Accent color is readable for workspace branding." };
}
