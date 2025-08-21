import { useMemo } from 'react';

export default function useQuotationCalc(
  items, 
  depositPercentage, 
  customDepositPercentage,
  specialDiscountType = 'percentage', // 'percentage' | 'amount'
  specialDiscountValue = 0,
  hasWithholdingTax = false,
  withholdingTaxPercentage = 0
) {
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

    // คำนวณยอดพื้นฐาน
    const subtotal = normalizedItems.reduce((s, it) => s + Number(it._computedSubtotal || 0), 0);
    const vat = subtotal * 0.07;
    const total = subtotal + vat;

    // คำนวณส่วนลดพิเศษ
    const specialDiscountAmount = specialDiscountType === 'percentage' 
      ? total * (Number(specialDiscountValue || 0) / 100)
      : Number(specialDiscountValue || 0);
    
    const netAfterDiscount = total - specialDiscountAmount;

    // คำนวณภาษีหัก ณ ที่จ่าย (คำนวณจากยอดก่อนภาษี - subtotal)
    const withholdingTaxAmount = hasWithholdingTax 
      ? subtotal * (Number(withholdingTaxPercentage || 0) / 100)
      : 0;

    // ยอดสุทธิสุดท้าย = ยอดหลังหักส่วนลดพิเศษ - ภาษีหัก ณ ที่จ่าย
    const finalTotal = netAfterDiscount - withholdingTaxAmount;

    // คำนวณเงินมัดจำ (จากยอดสุทธิสุดท้าย)
    const pct = depositPercentage === 'custom'
      ? Number(customDepositPercentage || 0)
      : Number(depositPercentage || 0);
    
    const depositAmount = finalTotal * (pct / 100);
    const remainingAmount = finalTotal - depositAmount;

    return { 
      subtotal, 
      vat, 
      total,
      specialDiscountAmount,
      netAfterDiscount,
      withholdingTaxAmount,
      finalTotal,
      depositAmount, 
      remainingAmount, 
      warnings 
    };
  }, [
    items, 
    depositPercentage, 
    customDepositPercentage,
    specialDiscountType,
    specialDiscountValue,
    hasWithholdingTax,
    withholdingTaxPercentage
  ]);
}
