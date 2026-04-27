export const colors = {
  background: "#F5F1E8",
  surface: "#ECE6D8",
  primary: "#8B3A2F",
  secondary: "#7A8B6F",
  textPrimary: "#2F2A26",
  textSecondary: "#6B625B",
  border: "#DDD4C5",
  accentMuted: "#C2B8A3",
} as const;

export const typography = {
  fontFamily: {
    serif: "'Source Serif 4', 'Iowan Old Style', serif",
  },
  fontSize: {
    xs: "12px",
    sm: "14px",
    base: "16px",
    lg: "18px",
    xl: "24px",
    display: "32px",
  },
} as const;

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  xxl: "32px",
} as const;

export const radius = {
  sm: "6px",
  md: "10px",
  lg: "16px",
  xl: "20px",
} as const;

export const shadow = {
  soft: "0 2px 8px rgba(0,0,0,0.06)",
} as const;
