import type { Config } from "tailwindcss";

// Tokens extraídos directo del archivo de Figma (página Design System)
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kinetic: {
          ember: "#FF906D",      // Ember Core — naranja primario
          magenta: "#FF66B6",    // Pulse Magenta — rosa primario
          graphite: "#1F1F22",   // Graphite Void — superficie oscura
          obsidian: "#0A0A0A",   // Obsidiana — fondo base
        },
      },
      backgroundImage: {
        "kinetic-gradient": "linear-gradient(135deg, #FF906D 0%, #FF66B6 100%)",
      },
      fontFamily: {
        heading: ["var(--font-montserrat)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
