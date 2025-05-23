import { FoodGroupColors } from "../../tailwind.config";

export const hexToRgba = (
  hex: string,
  alpha = 1
): [number, number, number, number] => {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return [r, g, b, Math.round(alpha * 255)];
};

// --- Helper: Get RGBA color for a food group ---
export function getFoodGroupColor(
  slug: string
): [number, number, number, number] {
  const colorHex =
    FoodGroupColors[slug as keyof typeof FoodGroupColors] || "#BAB0AC";
  return hexToRgba(colorHex, 1);
}
