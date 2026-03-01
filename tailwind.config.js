/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0F172A",
          primary: "#1E293B",
          secondary: "#334155",
          cta: "#22C55E",
          text: "#F8FAFC"
        }
      },
      fontFamily: {
        display: ["Russo One", "system-ui", "sans-serif"],
        body: ["Chakra Petch", "system-ui", "sans-serif"]
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(34,197,94,0.35), 0 0 20px rgba(34,197,94,0.15)"
      }
    }
  },
  plugins: []
};

