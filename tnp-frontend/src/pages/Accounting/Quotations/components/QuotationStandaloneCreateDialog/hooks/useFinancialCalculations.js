import { useMemo } from "react";

/**
 * Hook สำหรับคำนวณสรุปการเงินทั้งหมด
 * @param {Array} items - รายการสินค้า (ที่ถูก flatten มาแล้ว)
 * @param {Object} financials - state การเงิน (vat, discount, deposit, pricingMode)
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

  // คำนวณ VAT และ netSubtotal ตาม pricing mode
  const { vatAmount, netSubtotal, totalAmount } = useMemo(() => {
    const pricingMode = financials.pricing_mode || "net";
    const hasVat = financials.has_vat ?? true;
    const vatPercentage = financials.vat_percentage || 7;

    let vat = 0;
    let net = subtotalAfterDiscount;
    let total = 0;

    if (pricingMode === "vat_included" && hasVat) {
      // Reverse calculation: extract VAT from included price
      // Formula: netPrice = totalPrice / (1 + vatRate)
      const vatRate = vatPercentage / 100;
      const vatMultiplier = 1 + vatRate;
      net = subtotalAfterDiscount / vatMultiplier;
      vat = subtotalAfterDiscount - net;
      total = subtotalAfterDiscount; // Already includes VAT
    } else {
      // Standard: net price + VAT
      const vatRate = hasVat ? vatPercentage / 100 : 0;
      vat = subtotalAfterDiscount * vatRate;
      total = subtotalAfterDiscount + vat;
    }

    return {
      vatAmount: +vat.toFixed(2),
      netSubtotal: +net.toFixed(2),
      totalAmount: +total.toFixed(2),
    };
  }, [
    subtotalAfterDiscount,
    financials.pricing_mode,
    financials.has_vat,
    financials.vat_percentage,
  ]);

  // คำนวณภาษีหัก ณ ที่จ่าย (ใช้ netSubtotal เสมอ)
  const withholdingTaxAmount = useMemo(() => {
    if (!financials.has_withholding_tax) return 0;
    return (netSubtotal * (financials.withholding_tax_percentage || 0)) / 100;
  }, [netSubtotal, financials.has_withholding_tax, financials.withholding_tax_percentage]);

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
    netSubtotal, // NEW: Actual net amount
    vatAmount,
    totalAmount,
    withholdingTaxAmount,
    finalTotalAmount,
    depositAmount,
  };
};
