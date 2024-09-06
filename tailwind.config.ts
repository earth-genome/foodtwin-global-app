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
        vegetables: "#198038",
        sugars: "#FA4D56",
        oils: "#B28600",
        fruits: "#EE538B",
        meat: "#9F1853",
        starches: "#6929C4",
        dairy: "#1192E8",
        treenuts: "#8A3800",
        pulses: "#005D5D",
        others: "#667085",
      },
      nutrition: {
        protein: "#B51D14",
        fat: "#DDB310",
        calories: "#4053D3",
        vitamin_a: "#00B25D",
        iron: "#00BEFF",
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
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};
export default config;
