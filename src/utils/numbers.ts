export function formatNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale || "en-US").format(value);
}

/**
 * Format key indicators
 *
 * @param {number} value The value to round
 * @param {string} type The type of indicator. One of: 'metric', 'calories', 'weight'
 * @param {number} decimals Amount of decimals to keep. (Default: 0)
 *
 */
export function formatKeyIndicator(
  value: number,
  type: "metric" | "calories" | "weight",
  decimals: number
) {
  let unit;
  let divider;
  let digits = 1;

  const n = Math.abs(value || 0) || 0;
  const isNeg = value < 0;

  if (n > 1000000000) {
    // 10^9 = gigatonnes, gigacalories, billions
    unit = type === "calories" ? "Gcal" : type === "weight" ? "Gt" : "B";
    divider = 1000000000;
    digits = 1;
  } else if (n > 1000000) {
    // 10^6 = megatonnes, megacalories, millions
    unit = type === "calories" ? "Mcal" : type === "weight" ? "Mt" : "M";
    divider = 1000000;
    digits = 0;
  } else if (n > 1000) {
    // 10^3 = kilotonnes, kilocalories, thousands
    unit = type === "calories" ? "kcal" : type === "weight" ? "kt" : "k";
    divider = 1000;
    digits = 0;
  } else {
    // Less than 10^3 = calories, tonnes, or metric unit
    unit = type === "calories" ? "cal" : type === "weight" ? "t" : "";
    divider = 1;
    digits = 0;
  }

  return `${isNeg ? "-" : ""}${(n / divider).toLocaleString("en-US", {
    minimumFractionDigits: typeof decimals === "number" ? decimals : digits,
    maximumFractionDigits: typeof decimals === "number" ? decimals : digits,
  })} ${unit}`;
}
