import { useMemo } from "react";

import { collectManualJobErrors } from "../../QuotationDetailDialog/utils/manualJobValidator";

/**
 * Compute proactive validation issues for QuotationDuplicateDialog (Phase 4).
 *
 * Surfaces issues in real-time so user sees them BEFORE clicking save.
 * Same `collectManualJobErrors` util that `useQuotationDuplicateSave` uses
 * on submit — this hook just runs it earlier and adds soft warnings.
 *
 * Returns:
 *   issues[]               — array of { id, severity: 'error'|'warning', message }
 *   hasBlockingErrors      — true if any 'error' severity → disables Save button
 *   blockingReason         — first error message (used as Save tooltip)
 */
export function useQuotationDuplicateValidation({ groups, financials }) {
  return useMemo(() => {
    const list = [];

    // 1. Manual job missing required fields (e.g. "ชื่องาน")
    const manualJobValidation = collectManualJobErrors(groups || []);
    if (manualJobValidation.hasErrors) {
      list.push({
        id: "manual-job-required",
        severity: "error",
        message: manualJobValidation.message || "งานที่สร้างใหม่ขาดข้อมูลจำเป็น",
      });
    }

    // 2. No items at all
    if (!groups || groups.length === 0) {
      list.push({
        id: "no-items",
        severity: "error",
        message: "ยังไม่มีรายการงาน — เพิ่มจาก PR หรือสร้างงานใหม่",
      });
    } else if (financials?.finalTotal === 0) {
      // 3. Items present but final total = 0 (warning, not error)
      list.push({
        id: "zero-total",
        severity: "warning",
        message: "ยอดรวมเป็น ฿0.00 — ตรวจสอบจำนวน/ราคาในแต่ละงาน",
      });
    }

    // 4. Deposit exceeds final total (soft warning)
    const depositAmount = financials?.depositAmount ?? 0;
    const finalTotal = financials?.finalTotal ?? 0;
    if (depositAmount > finalTotal && finalTotal > 0) {
      list.push({
        id: "deposit-exceeds-total",
        severity: "warning",
        message: `จำนวนมัดจำ (${depositAmount.toLocaleString()}) มากกว่ายอดรวม (${finalTotal.toLocaleString()})`,
      });
    }

    const errors = list.filter((i) => i.severity === "error");
    return {
      issues: list,
      hasBlockingErrors: errors.length > 0,
      blockingReason: errors[0]?.message || "",
    };
  }, [groups, financials]);
}
