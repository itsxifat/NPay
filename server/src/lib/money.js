// All money is stored as integer poisha (1 Taka = 100 poisha) to avoid
// floating-point drift during balance reconciliation.

/** "3,000.00" | "3000" | 3000.5  ->  300000 (poisha) */
export function toPoisha(value) {
  if (typeof value === 'number') return Math.round(value * 100);
  const cleaned = String(value).replace(/[,\s]/g, '');
  const n = Number.parseFloat(cleaned);
  if (Number.isNaN(n)) throw new Error(`Invalid money value: ${value}`);
  return Math.round(n * 100);
}

/** 300000 (poisha) -> 3000 (Taka, number) */
export function toTaka(poisha) {
  return poisha / 100;
}

/** 300000 -> "3,000.00" */
export function formatTaka(poisha) {
  return toTaka(poisha).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
