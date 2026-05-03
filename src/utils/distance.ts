export const KM_PER_AU = 149_597_870.7;
export const AU_PER_LY = 63_241.077;

export function auToKm(au: number): number {
  return au * KM_PER_AU;
}

const SUPERSCRIPTS = "⁰¹²³⁴⁵⁶⁷⁸⁹";

function toSuperscript(n: number): string {
  return String(n)
    .split("")
    .map((c) => (c === "-" ? "⁻" : SUPERSCRIPTS[+c]))
    .join("");
}

export function formatKm(km: number): string {
  if (!km) return "—";
  if (km < 10_000) return `${Math.round(km).toLocaleString()} km`;
  const exp = Math.floor(Math.log10(km));
  const mantissa = km / Math.pow(10, exp);
  return `${mantissa.toFixed(2)} × 10${toSuperscript(exp)} km`;
}

export function formatAU(au: number): string {
  if (!au) return "—";
  const exp = Math.floor(Math.log10(Math.abs(au)));
  const decimals = Math.max(0, 3 - exp);
  return `${au.toFixed(decimals)} AU`;
}

export function lyToAU(ly: number): number {
  return ly * AU_PER_LY;
}

export function formatLY(ly: number): string {
  if (!ly) return "—";
  if (ly < 0.1) return `${ly.toFixed(4)} ly`;
  if (ly < 10) return `${ly.toFixed(2)} ly`;
  if (ly < 1_000) return `${ly.toFixed(1)} ly`;
  if (ly < 1_000_000) return `${Math.round(ly).toLocaleString()} ly`;
  const exp = Math.floor(Math.log10(ly));
  const mantissa = ly / Math.pow(10, exp);
  return `${mantissa.toFixed(2)} × 10${toSuperscript(exp)} ly`;
}
