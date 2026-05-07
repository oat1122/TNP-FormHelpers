import { useMemo } from "react";

/**
 * Proactive validation for InvoiceCreateDialog (Phase 4 of redesign).
 *
 * Surfaces issues in real-time so user sees them BEFORE clicking save —
 * pairs with `<ValidationBanner>` at top of dialog content + Save button
 * tooltip when blocked.
 *
 * Returns:
 *   issues[]            — array of { id, severity: 'error'|'warning', message }
 *   hasBlockingErrors   — true if any 'error' severity → Save disabled
 *   blockingReason      — first error message (Save button tooltip)
 */
export function useInvoiceCreateValidation({ groups, formState, financials, sourceQuotation }) {
  return useMemo(() => {
    const list = [];

    // 0. Signature evidence required before invoice can be created
    const hasSignature =
      Array.isArray(sourceQuotation?.signature_images) &&
      sourceQuotation.signature_images.length > 0;
    if (!hasSignature) {
      list.push({
        id: "missing-signature",
        severity: "error",
        message: "ต้องอัพโหลดหลักฐานการเซ็นในใบเสนอราคาก่อน — เปิดการแก้ไข แท็บ 'หลักฐาน'",
      });
    }

    // 1. No items at all (shouldn't happen for invoice — inherited from quotation
    //    — but guard anyway)
    const totalRows = (groups || []).reduce((sum, g) => sum + (g.sizeRows?.length || 0), 0);
    if (totalRows === 0) {
      list.push({
        id: "no-items",
        severity: "error",
        message: "ไม่มีรายการในใบเสนอราคาต้นทาง — สร้างใบแจ้งหนี้ไม่ได้",
      });
    } else {
      // 2. Items present but no row has both quantity > 0 AND unit_price > 0
      const hasValidRow = (groups || []).some((g) =>
        (g.sizeRows || []).some((r) => {
          const qty = Number(r.quantity || 0);
          const price = Number(r.unitPrice || 0);
          return qty > 0 && price > 0;
        })
      );
      if (!hasValidRow) {
        list.push({
          id: "no-valid-row",
          severity: "error",
          message: "ทุกรายการมีจำนวนหรือราคา = 0 — ปรับให้ทั้งสองมากกว่า 0 อย่างน้อย 1 รายการ",
        });
      }
    }

    // 3. Final total = 0 (warning — covered by error #2 if items have qty=0/price=0)
    if (financials?.finalTotal === 0 && totalRows > 0) {
      list.push({
        id: "zero-total",
        severity: "warning",
        message: "ยอดรวมสุทธิเป็น ฿0.00 — ตรวจสอบจำนวน/ราคา/ส่วนลด",
      });
    }

    // 4. Credit terms require due_date
    const isCredit =
      formState?.payment?.type === "credit_30" || formState?.payment?.type === "credit_60";
    if (isCredit && !formState?.dueDate) {
      list.push({
        id: "missing-due-date",
        severity: "error",
        message: "เครดิต ต้องระบุวันครบกำหนดในแท็บ มัดจำ / ก่อน-หลัง",
      });
    }

    // 5. Other payment terms requires custom text
    if (formState?.payment?.type === "other" && !(formState?.payment?.custom || "").trim()) {
      list.push({
        id: "missing-payment-custom",
        severity: "error",
        message: "เลือกเงื่อนไขชำระ 'อื่นๆ' แล้ว — กรอกรายละเอียดในแท็บ มัดจำ / ก่อน-หลัง",
      });
    }

    // 6. Document header type "อื่นๆ" requires custom value
    if (
      formState?.documentHeader?.type === "อื่นๆ" &&
      !(formState?.documentHeader?.custom || "").trim()
    ) {
      list.push({
        id: "missing-header-custom",
        severity: "error",
        message: "เลือกหัวกระดาษ 'อื่นๆ' แล้ว — ระบุประเภทในแท็บ ลูกค้า",
      });
    }

    // 7. Address override requires non-empty value
    if (formState?.billing?.isEditing && !(formState?.billing?.customAddress || "").trim()) {
      list.push({
        id: "missing-billing-address",
        severity: "error",
        message: "เปิดแก้ไขที่อยู่แล้ว — กรอกที่อยู่ใหม่ในแท็บ ลูกค้า",
      });
    }

    // 8. Deposit > final total (soft warning)
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
  }, [groups, formState, financials, sourceQuotation]);
}
