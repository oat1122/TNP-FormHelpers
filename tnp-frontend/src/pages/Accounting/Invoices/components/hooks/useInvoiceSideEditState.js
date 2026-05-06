import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Per-side edit state for InvoiceDetailDialog (มัดจำก่อน / มัดจำหลัง).
 *
 * Splits the legacy single formData into 3 logical groups:
 *   - sharedFormData  — fields atomic to the whole invoice (customer, items, vat, etc.)
 *   - beforeFormData  — fields specific to "มัดจำก่อน" (status, due_date_before, paid_amount_before, notes_before)
 *   - afterFormData   — fields specific to "มัดจำหลัง" (status, due_date_after, paid_amount_after, notes_after)
 *
 * Toggle ก่อน/หลัง ผ่าน UI ไม่ทิ้ง edits — ทุก side ถือ state อิสระจนกว่า save หรือ reset
 *
 * Per audit invoice-side-edit Phase 2.
 */

/** Date stored as YYYY-MM-DD string (or "") to match TextField type="date" pattern in dialog */
const normalizeDate = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.split("T")[0];
  try {
    return new Date(value).toISOString().split("T")[0];
  } catch {
    return "";
  }
};

const numberOrZero = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Build initial side state from invoice — falls back to derived per-side amount when override is null.
 *
 * Per-side amount semantics (per user UX requirement):
 *   - ก่อน amount = deposit_amount (มัดจำ)
 *   - หลัง amount = final_total_amount - deposit_amount (ส่วนคงเหลือ)
 *   - Default sum = total → no mismatch warning by default
 *   - User edit → may trigger soft warning if sum diverges from total
 *
 * Notes intentionally do NOT fall back to shared notes — per-side is an override field.
 * Shared notes รือ context display แยก (ดู InvoiceSidePanel).
 */
const buildBeforeState = (invoice) => {
  const depositAmount = numberOrZero(invoice?.deposit_amount);
  return {
    status_before: invoice?.status_before || "draft",
    due_date_before: normalizeDate(invoice?.due_date_before ?? invoice?.due_date),
    paid_amount_before: numberOrZero(invoice?.paid_amount_before ?? depositAmount),
    notes_before: invoice?.notes_before ?? "",
  };
};

const buildAfterState = (invoice) => {
  const finalTotal = numberOrZero(invoice?.final_total_amount);
  const depositAmount = numberOrZero(invoice?.deposit_amount);
  const remaining = Math.max(0, finalTotal - depositAmount);
  return {
    status_after: invoice?.status_after || "draft",
    due_date_after: normalizeDate(invoice?.due_date_after ?? invoice?.due_date),
    paid_amount_after: numberOrZero(invoice?.paid_amount_after ?? remaining),
    notes_after: invoice?.notes_after ?? "",
  };
};

/** Shallow equality on flat string/number/boolean field maps. Sufficient for our simple field types. */
const shallowEqual = (a, b) => {
  if (a === b) return true;
  const ak = Object.keys(a);
  if (ak.length !== Object.keys(b).length) return false;
  return ak.every((k) => a[k] === b[k]);
};

export const useInvoiceSideEditState = (invoice) => {
  const initialBefore = useMemo(() => buildBeforeState(invoice), [invoice]);
  const initialAfter = useMemo(() => buildAfterState(invoice), [invoice]);

  const [beforeFormData, setBeforeFormData] = useState(initialBefore);
  const [afterFormData, setAfterFormData] = useState(initialAfter);

  // Re-init when a different invoice is loaded into the dialog
  useEffect(() => {
    setBeforeFormData(initialBefore);
    setAfterFormData(initialAfter);
  }, [initialBefore, initialAfter]);

  const setBeforeField = useCallback((field, value) => {
    setBeforeFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setAfterField = useCallback((field, value) => {
    setAfterFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const dirtyBefore = useMemo(
    () => !shallowEqual(beforeFormData, initialBefore),
    [beforeFormData, initialBefore]
  );
  const dirtyAfter = useMemo(
    () => !shallowEqual(afterFormData, initialAfter),
    [afterFormData, initialAfter]
  );

  /** Build the side-fields slice of the API payload. Atomic shared fields are merged at the call site. */
  const getSidePayload = useCallback(
    () => ({
      // Status (existing per-side fields — backward-compat)
      status_before: beforeFormData.status_before,
      status_after: afterFormData.status_after,
      // New per-side override fields (Phase 1 BE migration)
      due_date_before: beforeFormData.due_date_before || null,
      due_date_after: afterFormData.due_date_after || null,
      paid_amount_before: beforeFormData.paid_amount_before,
      paid_amount_after: afterFormData.paid_amount_after,
      notes_before: beforeFormData.notes_before,
      notes_after: afterFormData.notes_after,
    }),
    [beforeFormData, afterFormData]
  );

  /** Reset both sides to the latest invoice values (call after successful save) */
  const resetAll = useCallback(() => {
    setBeforeFormData(initialBefore);
    setAfterFormData(initialAfter);
  }, [initialBefore, initialAfter]);

  /** List of changed field labels (Thai) per side — used in UnsavedChangesDialog */
  const dirtyFieldLabels = useMemo(() => {
    const FIELD_LABEL = {
      status_before: "สถานะ",
      due_date_before: "ครบกำหนด",
      paid_amount_before: "ยอดชำระ",
      notes_before: "หมายเหตุ",
      status_after: "สถานะ",
      due_date_after: "ครบกำหนด",
      paid_amount_after: "ยอดชำระ",
      notes_after: "หมายเหตุ",
    };
    const before = Object.keys(beforeFormData)
      .filter((k) => beforeFormData[k] !== initialBefore[k])
      .map((k) => FIELD_LABEL[k] || k);
    const after = Object.keys(afterFormData)
      .filter((k) => afterFormData[k] !== initialAfter[k])
      .map((k) => FIELD_LABEL[k] || k);
    return { before, after };
  }, [beforeFormData, afterFormData, initialBefore, initialAfter]);

  return {
    beforeFormData,
    afterFormData,
    setBeforeField,
    setAfterField,
    dirtyBefore,
    dirtyAfter,
    dirtyAny: dirtyBefore || dirtyAfter,
    dirtyFieldLabels,
    getSidePayload,
    resetAll,
  };
};
