/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        oppos: {
          bg: "#000000",
          surface: "#0a0a0a",
          "surface-2": "#111111",
          border: "#1a1a1a",
          muted: "#777777",
          text: "#f0f0f0",
          accent: "#818cf8",
          "accent-dim": "#6366f1",
        },
      },
      fontFamily: {
        serif: ["'STIX Two Text'", "Georgia", "serif"],
        mono: ["'Space Grotesk'", "monospace"],
        sans: ["'Space Grotesk'", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in-up": "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};
