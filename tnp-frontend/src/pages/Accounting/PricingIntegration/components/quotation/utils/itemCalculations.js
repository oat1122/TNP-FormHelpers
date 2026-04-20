const toNumber = (v) => (typeof v === "string" ? parseFloat(v || "0") : Number(v || 0));

const safeNumber = (v) => {
  const n = toNumber(v);
  return isNaN(n) ? 0 : n;
};

export const sumSizeRowsTotal = (sizeRows = []) =>
  sizeRows.reduce((acc, r) => {
    const q = safeNumber(r.quantity);
    const p = safeNumber(r.unitPrice);
    return acc + q * p;
  }, 0);

export const sumSizeRowsQuantity = (sizeRows = []) =>
  sizeRows.reduce((acc, r) => acc + safeNumber(r.quantity), 0);

export const computeItemTotalsFromSizeRows = (sizeRows = []) => ({
  total: sumSizeRowsTotal(sizeRows),
  quantity: sumSizeRowsQuantity(sizeRows),
});

export const computeItemTotalFallback = (item, patch = {}) => {
  const unitPrice = patch.unitPrice ?? item.unitPrice ?? 0;
  const quantity = patch.quantity ?? item.quantity ?? 0;
  return safeNumber(unitPrice) * safeNumber(quantity);
};
