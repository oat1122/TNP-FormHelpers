import { useMemo } from "react";

/**
 * Hook สำหรับคำนวณสรุปการเงินทั้งหมด
 * @param {Array} items - รายการสินค้า (ที่ถูก flatten มาแล้ว)
 * @param {Object} financials - state การเงิน (vat, discount, deposit)
 */
export const useFinancialCalculations = (items = [], financials) => {
  // คำนวณ subtotal จาก items
  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const gross = (item.unit_price || 0) * (item.quantity || 0);
      const discount = item.discount_amount || 0;
      return sum + Math.max(0, gross - discount);
    }, 0);
  }, [items]);

  // คำนวณส่วนลดพิเศษ
  const specialDiscountAmount = useMemo(() => {
    if (financials.special_discount_amount > 0) {
      return financials.special_discount_amount;
    }
    return (itemsSubtotal * (financials.special_discount_percentage || 0)) / 100;
  }, [itemsSubtotal, financials.special_discount_percentage, financials.special_discount_amount]);

  // ยอดหลังหักส่วนลดพิเศษ
  const subtotalAfterDiscount = useMemo(() => {
    return Math.max(0, itemsSubtotal - specialDiscountAmount);
  }, [itemsSubtotal, specialDiscountAmount]);

  // คำนวณ VAT
  const vatAmount = useMemo(() => {
    if (!financials.has_vat) return 0;
    return (subtotalAfterDiscount * (financials.vat_percentage || 7)) / 100;
  }, [subtotalAfterDiscount, financials.has_vat, financials.vat_percentage]);

  // คำนวณ total_amount
  const totalAmount = useMemo(() => {
    return subtotalAfterDiscount + vatAmount;
  }, [subtotalAfterDiscount, vatAmount]);

  // คำนวณภาษีหัก ณ ที่จ่าย
  const withholdingTaxAmount = useMemo(() => {
    if (!financials.has_withholding_tax) return 0;
    return (subtotalAfterDiscount * (financials.withholding_tax_percentage || 0)) / 100;
  }, [
    subtotalAfterDiscount,
    financials.has_withholding_tax,
    financials.withholding_tax_percentage,
  ]);

  // คำนวณยอดสุทธิสุดท้าย
  const finalTotalAmount = useMemo(() => {
    return totalAmount - withholdingTaxAmount;
  }, [totalAmount, withholdingTaxAmount]);

  // คำนวณเงินมัดจำ
  const depositAmount = useMemo(() => {
    if (financials.deposit_mode === "amount") {
      return financials.deposit_amount || 0;
    }
    return (subtotalAfterDiscount * (financials.deposit_percentage || 0)) / 100;
  }, [
    subtotalAfterDiscount,
    financials.deposit_mode,
    financials.deposit_percentage,
    financials.deposit_amount,
  ]);

  return {
    itemsSubtotal,
    specialDiscountAmount,
    subtotalAfterDiscount,
    vatAmount,
    totalAmount,
    withholdingTaxAmount,
    finalTotalAmount,
    depositAmount,
  };
};
