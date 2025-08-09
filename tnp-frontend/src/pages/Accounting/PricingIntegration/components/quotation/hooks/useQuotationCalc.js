import { useMemo } from 'react';

export default function useQuotationCalc(items, depositPercentage, customDepositPercentage) {
  return useMemo(() => {
    const subtotal = (items || []).reduce(
      (s, it) => s + (Number(it.quantity || 0) * Number(it.unitPrice || 0)),
      0
    );
    const vat = subtotal * 0.07;
    const total = subtotal + vat;
    const pct = depositPercentage === 'custom'
      ? Number(customDepositPercentage || 0)
      : Number(depositPercentage || 0);
    const depositAmount = total * (pct / 100);
    const remainingAmount = total - depositAmount;
    return { subtotal, vat, total, depositAmount, remainingAmount };
  }, [items, depositPercentage, customDepositPercentage]);
}
