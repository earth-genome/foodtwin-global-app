export function formatNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale || "en-US").format(value);
}
