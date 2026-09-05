export const semanticPalette = {
  primary: {
    label: "Primary",
    shades: {
      light: { hex: "#60A5FA", className: "bg-primary-light" },
      default: { hex: "#2563EB", className: "bg-primary" },
      dark: { hex: "#1D4ED8", className: "bg-primary-dark" },
    },
  },
  secondary: {
    label: "Secondary",
    shades: {
      light: { hex: "#5EEAD4", className: "bg-secondary-light" },
      default: { hex: "#0F766E", className: "bg-secondary" },
      dark: { hex: "#115E59", className: "bg-secondary-dark" },
    },
  },
  success: {
    label: "Success",
    shades: {
      light: { hex: "#6EE7B7", className: "bg-success-light" },
      default: { hex: "#16A34A", className: "bg-success" },
      dark: { hex: "#15803D", className: "bg-success-dark" },
    },
  },
  warning: {
    label: "Warning",
    shades: {
      light: { hex: "#FCD34D", className: "bg-warning-light" },
      default: { hex: "#D97706", className: "bg-warning" },
      dark: { hex: "#B45309", className: "bg-warning-dark" },
    },
  },
  danger: {
    label: "Danger",
    shades: {
      light: { hex: "#FCA5A5", className: "bg-danger-light" },
      default: { hex: "#DC2626", className: "bg-danger" },
      dark: { hex: "#B91C1C", className: "bg-danger-dark" },
    },
  },
  neutral: {
    label: "Neutral",
    shades: {
      light: { hex: "#CBD5E1", className: "bg-neutral-light" },
      default: { hex: "#475569", className: "bg-neutral" },
      dark: { hex: "#0F172A", className: "bg-neutral-dark" },
    },
  },
  background: {
    label: "Background",
    shades: {
      light: { hex: "#F8FAFC", className: "bg-background" },
      default: { hex: "#F1F5F9", className: "bg-surface-muted" },
      dark: { hex: "#020617", className: "bg-neutral-dark" },
    },
  },
  surface: {
    label: "Surface",
    shades: {
      light: { hex: "#FFFFFF", className: "bg-surface" },
      default: { hex: "#E2E8F0", className: "bg-surface-muted" },
      dark: { hex: "#0F172A", className: "bg-neutral-dark" },
    },
  },
} as const;
