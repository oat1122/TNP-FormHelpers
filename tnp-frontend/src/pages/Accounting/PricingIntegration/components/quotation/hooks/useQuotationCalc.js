import { useMemo } from 'react';

export default function useQuotationCalc(items, depositPercentage, customDepositPercentage) {
  return useMemo(() => {
    const warnings = {};
    const normalizedItems = (items || []).map((it) => {
      // ถ้ามี sizeRows ให้ใช้คำนวณแทน unitPrice/quantity เดี่ยว
      if (Array.isArray(it.sizeRows) && it.sizeRows.length > 0) {
        const rowSubtotal = it.sizeRows.reduce(
          (s, r) => s + Number(r.quantity || 0) * Number(r.unitPrice || 0),
          0
        );
        const rowQty = it.sizeRows.reduce((s, r) => s + Number(r.quantity || 0), 0);

        // ตรวจสอบกับจำนวนที่ขอไว้ใน PR
        const requestedQty = parseInt(it.originalData?.pr_quantity || it.quantity || 0, 10) || 0;
        if (requestedQty > 0 && rowQty !== requestedQty) {
          warnings[it.id] = {
            type: rowQty > requestedQty ? 'warning' : 'info',
            message: `จำนวนรวมตามขนาด (${rowQty}) ${rowQty > requestedQty ? 'มากกว่า' : 'น้อยกว่า'} จำนวนที่ขอไว้ (${requestedQty})`,
          };
        }

        return { ...it, _computedSubtotal: rowSubtotal };
      }
      return {
        ...it,
        _computedSubtotal: Number(it.quantity || 0) * Number(it.unitPrice || 0),
      };
    });

    const subtotal = normalizedItems.reduce((s, it) => s + Number(it._computedSubtotal || 0), 0);
    const vat = subtotal * 0.07;
    const total = subtotal + vat;
    const pct =
      depositPercentage === 'custom'
        ? Number(customDepositPercentage || 0)
        : Number(depositPercentage || 0);
    const depositAmount = total * (pct / 100);
    const remainingAmount = total - depositAmount;
    return { subtotal, vat, total, depositAmount, remainingAmount, warnings };
  }, [items, depositPercentage, customDepositPercentage]);
}
