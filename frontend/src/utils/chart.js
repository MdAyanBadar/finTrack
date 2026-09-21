// Round axis steps to 1 / 2 / 2.5 / 5 x 10^n so ticks land on even amounts
export const niceTicks = (max, count = 4) => {
  if (max <= 0) return [0];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
};

export const shortRupees = (v) => (v >= 1000 ? `₹${+(v / 1000).toFixed(1)}k` : `₹${v}`);
