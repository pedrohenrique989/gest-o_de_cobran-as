import type { Config } from "tailwindcss";
// Identidade Innovatis: navy institucional, branco, cinza divisões; verde/azul/vermelho/laranja com significado.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {
    fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
    colors: {
      navy: { DEFAULT: "#0F1E3D", 800: "#1B2A4A", 700: "#24365E" },
      canvas: "#F5F6F8", line: "#E1E4E9",
      ink: { DEFAULT: "#111827", muted: "#5B6472", faint: "#8A93A2" },
      action: { DEFAULT: "#1F4FA3", hover: "#193F82", soft: "#E8EFFA" },
      ok: { DEFAULT: "#1E7A46", soft: "#E6F3EB" },
      info: { DEFAULT: "#1F4FA3", soft: "#E8EFFA" },
      danger: { DEFAULT: "#B42323", soft: "#FBEAEA" },
      warn: { DEFAULT: "#B25E09", soft: "#FCEFE3" },
    },
    borderRadius: { DEFAULT: "3px", md: "4px", lg: "6px" },
    boxShadow: { panel: "0 1px 2px rgba(15,30,61,.06)" },
  } },
  plugins: [],
};
export default config;
