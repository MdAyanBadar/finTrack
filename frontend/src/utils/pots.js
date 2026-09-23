/* =========================
   SAVINGS POT MATHS (BC / chit)
   You pay in monthly (₹7,000 × 12 = ₹84,000). You can take the full amount
   out whenever you like; after that the remaining months are you settling up.
========================= */
export const potTarget = (pot) =>
  pot?.monthlyAmount > 0 && pot?.months > 0 ? pot.monthlyAmount * pot.months : 0;

export const potStats = (pot) => {
  const target = potTarget(pot);
  const paidIn = pot?.paidIn ?? 0;
  const takenOut = pot?.received ?? 0;

  // Before a withdrawal: what's saved. After one: what's left to pay.
  const toPay = target > 0 ? Math.max(0, target - paidIn) : Math.max(0, takenOut - paidIn);
  const canWithdraw = Math.max(0, (target || paidIn) - takenOut);
  const settling = takenOut > 0 && toPay > 0;
  const settled = takenOut > 0 && toPay === 0;
  const monthsLeft = pot?.monthlyAmount > 0 ? Math.ceil(toPay / pot.monthlyAmount) : 0;

  return {
    target,
    paidIn,
    takenOut,
    toPay,
    canWithdraw,
    settling,
    settled,
    monthsLeft,
    progress: target > 0 ? Math.min(100, (paidIn / target) * 100) : 0,
  };
};
