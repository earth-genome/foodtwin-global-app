import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: ["text-category-area", "text-category-route", "text-category-node"],
  theme: {
    extend: {
      fontFamily: {
        header: ["var(--font-lexend)"],
        body: ["var(--font-merriweather)"],
      },
      fontSize: {
        xxs: "0.625rem",
      },
      spacing: {
        128: "32rem",
      },
    },
    colors: {
      white: "#fff",
      ink: "#0C111D",
      category: {
        area: "#C1ED96",
        route: "#99E2EE",
        node: "#FFD27A",
      },
      food: {
        "dairy-and-eggs": "#76B7B2",
        "oils-and-oilseeds": "#EDC948",
        starches: "#4E79A7",
        fruits: "#FF9DA7",
        grains: "#F28E2B",
        pulses: "#B07AA1",
        vegetables: "#59A14F",
        treenuts: "#9C755F",
        "meat-and-fish": "#E15759",
        other: "#BAB0AC",
      },
      neutral: {
        50: "#F9FAFB",
        100: "#F2F4F7",
        200: "#E4E7EC",
        300: "#D0D5DD",
        400: "#98A2B3",
        500: "#667085",
        600: "#667085",
        700: "#344054",
        800: "#182230",
        900: "#101828",
      },
      brand: {
        50: "#FEF0C8",
        100: "#FFE396",
        200: "#FFBE2E",
        300: "#E5A000",
        400: "#C2850C",
        500: "#936D38",
        600: "#724F18",
        700: "#533809",
        800: "#3B2B15",
        900: "#22190C",
      },
      accent: {
        50: "#DEE5F9",
        100: "#C5D3F6",
        200: "#9DB4F0",
        300: "#6D8EE8",
        400: "#476BE1",
        500: "#294CD4",
        600: "#223FC3",
        700: "#23359E",
        800: "#23307E",
        900: "#1A204C",
      },
      "accent-warm": {
        50: "#FFF2ED",
        100: "#FFE2D4",
        200: "#FFC0A8",
        300: "#FF9571",
        400: "#FF562E",
        500: "#FE3511",
        600: "#EF1B07",
        700: "#C60E08",
        800: "#7E1010",
        900: "#440609",
      },
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};
export default config;
