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
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.5rem",
  },
  shadow: {
    card: "0 1px 2px rgb(15 23 42 / 0.05)",
    raised: "0 16px 40px rgb(15 23 42 / 0.08)",
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

export type WorkspaceBrandingInput = {
  logo?: string;
  candidatePhoto?: string;
  campaignBanner?: string;
  slogan?: string;
  campaignColors?: string[];
};

export type WorkspaceBrandingCheck = {
  color: string;
  valid: boolean;
  contrastOnWhite: number;
  contrastOnNavy: number;
  reason: string;
};

export function validateWorkspaceBranding(branding: WorkspaceBrandingInput) {
  const colors = branding.campaignColors?.length ? branding.campaignColors : [designTokens.colors.accent];
  const colorChecks: WorkspaceBrandingCheck[] = colors.map((color) => {
    const validation = validateWorkspaceAccent(color);
    return {
      color,
      valid: validation.valid,
      contrastOnWhite: Math.round(contrastRatio(color, designTokens.colors.card) * 100) / 100,
      contrastOnNavy: Math.round(contrastRatio(color, designTokens.colors.primary) * 100) / 100,
      reason: validation.reason,
    };
  });

  return {
    valid: colorChecks.every((check) => check.valid),
    colorChecks,
    protectedShell: true,
    rule: "Campaign branding may appear in workspace banners and candidate profile areas, but the JUKWAA navigation, actions, forms, and system messages keep the neutral core palette.",
  };
}

export function accessibleTextColor(backgroundColor: string) {
  return contrastRatio("#FFFFFF", backgroundColor) >= 4.5 ? "#FFFFFF" : designTokens.colors.primary;
}
