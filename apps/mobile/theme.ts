// Plain dark theme only — REQUIREMENTS.md §9.1 makes dark mode the primary
// mobile target. This is deliberately just colors/spacing, no glassmorphism
// yet: that's a visual-polish pass (§9.1's blur/translucency chrome), kept
// separate from getting basic CRUD screens working in Phase 2.
export const theme = {
  colors: {
    background: "#121212",
    surface: "#1e1e1e",
    border: "#2c2c2c",
    text: "#f2f2f2",
    textMuted: "#9a9a9a",
    accent: "#4caf82",
    danger: "#e0665a",
  },
  spacing: (multiplier: number) => multiplier * 8,
};
