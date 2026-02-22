import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        th: {
          bg: "rgb(var(--th-bg) / <alpha-value>)",
          card: "rgb(var(--th-card) / <alpha-value>)",
          input: "rgb(var(--th-input) / <alpha-value>)",
          hover: "rgb(var(--th-hover) / <alpha-value>)",
          border: "rgb(var(--th-border) / <alpha-value>)",
          "border-input": "rgb(var(--th-border-input) / <alpha-value>)",
          text: "rgb(var(--th-text) / <alpha-value>)",
          "text-secondary": "rgb(var(--th-text-secondary) / <alpha-value>)",
          "text-label": "rgb(var(--th-text-label) / <alpha-value>)",
          "text-muted": "rgb(var(--th-text-muted) / <alpha-value>)",
          toolbar: "rgb(var(--th-toolbar) / <alpha-value>)",
          "table-row-hover": "rgb(var(--th-table-row-hover) / <alpha-value>)",
          divider: "rgb(var(--th-divider) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
