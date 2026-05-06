import { useMemo } from "react";

/**
 * Soft-validation warnings for per-side edits in InvoiceDetailDialog.
 *
 * Returns a per-side list of warnings — each side can have 0+ warnings.
 * Validation is "soft" — warnings are shown but do NOT block save (per audit
 * decision). Save handler shows a confirm modal if any warning exists.
 *
 * Rules:
 *   1. paid_amount_before + paid_amount_after > final_total_amount
 *      → "ยอดชำระรวมเกินยอด invoice"
 *   2. due_date_after < due_date_before
 *      → "กำหนดส่งหลังมาก่อนหน้า"
 *
 * Per audit invoice-side-edit Phase 3.
 */

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** Format ฿ amount with 2 decimals + thousand separators */
const fmtTHB = (n) => `฿${toNumber(n).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;

const fmtDate = (s) => {
  if (!s) return "-";
  // Already YYYY-MM-DD from form state — display as-is for warning text
  return s;
};

export const useInvoiceSideValidation = ({ invoice, beforeFormData, afterFormData }) => {
  return useMemo(() => {
    const warnings = { before: [], after: [] };

    const finalTotal = toNumber(invoice?.final_total_amount);
    const amountBefore = toNumber(beforeFormData?.paid_amount_before);
    const amountAfter = toNumber(afterFormData?.paid_amount_after);
    const sumSides = amountBefore + amountAfter;

    // Rule 1: sum of side amounts diverges from invoice total
    // Soft warning either direction (over OR under) — user requirement: "100 = 60 + 40 → 60 + 60" mismatch flagged
    if (finalTotal > 0 && Math.abs(sumSides - finalTotal) > 0.01) {
      const diff = sumSides - finalTotal;
      const sign = diff > 0 ? "เกิน" : "ขาด";
      const msg = {
        title: `ยอดรวมของ side ทั้ง 2 ไม่ตรงกับยอด invoice`,
        detail: `ก่อน ${fmtTHB(amountBefore)} + หลัง ${fmtTHB(amountAfter)} = ${fmtTHB(sumSides)} ${sign} ${fmtTHB(finalTotal)} อยู่ ${fmtTHB(Math.abs(diff))}`,
      };
      warnings.before.push(msg);
      warnings.after.push(msg);
    }

    // Rule 2: due_date_after < due_date_before
    const dueBefore = beforeFormData?.due_date_before;
    const dueAfter = afterFormData?.due_date_after;
    if (dueBefore && dueAfter && dueAfter < dueBefore) {
      const msg = {
        title: "กำหนดส่งหลังมาก่อนหน้า",
        detail: `กำหนดส่ง 'หลัง' (${fmtDate(dueAfter)}) มาก่อน 'ก่อน' (${fmtDate(dueBefore)})`,
      };
      warnings.before.push(msg);
      warnings.after.push(msg);
    }

    const hasAnyWarning = warnings.before.length > 0 || warnings.after.length > 0;

    return { warnings, hasAnyWarning };
  }, [invoice, beforeFormData, afterFormData]);
};
