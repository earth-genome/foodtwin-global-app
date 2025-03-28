import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";

export const FoodGroupColors = {
  "dairy-and-eggs": "#76B7B2",
  "oils-and-oilseed": "#EDC948",
  "starchy-roots": "#4E79A7",
  fruits: "#FF9DA7",
  grains: "#F28E2B",
  pulses: "#B07AA1",
  vegetables: "#59A14F",
  treenuts: "#9C755F",
  "meat-and-fish": "#E15759",
  other: "#BAB0AC",
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    "text-category-area",
    "text-category-route",
    "text-category-node",
    "bg-food-oils-and-oilseed",
    "bg-food-dairy-and-eggs",
    "bg-food-starchy-roots",
    "bg-food-fruits",
    "bg-food-grains",
    "bg-food-pulses",
    "bg-food-vegetables",
    "bg-food-treenuts",
    "bg-food-meat-and-fish",
    "bg-food-other",
  ],
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
      ink: "#171412",
      category: {
        area: "#C1ED96",
        route: "#99E2EE",
        node: "#FFD27A",
      },
      food: FoodGroupColors,
      neutral: {
        50: "#FAFAF9",
        100: "#F5F5F4",
        200: "#E7E5E4",
        300: "#D7D3D0",
        400: "#A9A29D",
        500: "#79716B",
        600: "#57534E",
        700: "#44403C",
        800: "#292524",
        900: "#1C1917",
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
        50: "#EEF5FF",
        100: "#D9E7FF",
        200: "#BCD6FF",
        300: "#8EBDFF",
        400: "#5999FF",
        500: "#2E6FFF",
        600: "#1B50F5",
        700: "#143CE1",
        800: "#1731B6",
        900: "#192F8F",
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
