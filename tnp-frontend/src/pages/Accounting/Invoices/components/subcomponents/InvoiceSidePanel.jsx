import { Box, Chip, Stack, TextField, Typography } from "@mui/material";

import InvoiceSideMismatchAlert from "./InvoiceSideMismatchAlert";

/**
 * Form panel for one side of an invoice (มัดจำก่อน OR มัดจำหลัง).
 *
 * Editable fields: due_date, paid_amount (per-side amount), notes
 * Read-only display: number, status (chip), side amount context, shared notes
 *   — status changes go through useInvoiceApproval / useInvoiceStatusReversal
 *     elsewhere in the dialog (avoid bypassing approval workflow)
 *
 * Per-side amount semantics:
 *   - ก่อน amount = deposit_amount (มัดจำ)
 *   - หลัง amount = final_total_amount - deposit_amount (ส่วนคงเหลือ)
 *   - Field defaults to derived amount; user can override → may trigger mismatch warning
 *
 * Per audit invoice-side-edit Phase 3 + post-feedback adjustments.
 */

const STATUS_LABEL = {
  draft: "แบบร่าง",
  pending: "รอตรวจสอบ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
};

const STATUS_COLOR = {
  draft: "default",
  pending: "warning",
  approved: "success",
  rejected: "error",
};

const fmtTHB = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return "฿0.00";
  return `฿${num.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
};

const InvoiceSidePanel = ({
  side,
  sideData,
  onChange,
  invoice,
  warnings = [],
  readOnly = false,
}) => {
  const handleChange = (key, value) => {
    if (readOnly) return;
    onChange?.(key, value);
  };
  const isBefore = side === "before";
  const numberKey = isBefore ? "number_before" : "number_after";
  const dueDateKey = isBefore ? "due_date_before" : "due_date_after";
  const paidAmountKey = isBefore ? "paid_amount_before" : "paid_amount_after";
  const notesKey = isBefore ? "notes_before" : "notes_after";
  const statusKey = isBefore ? "status_before" : "status_after";

  const docNumber = invoice?.[numberKey] || "-";
  const status = sideData?.[statusKey] || "draft";

  // Derive expected per-side amount จาก invoice หลัก — ใช้แสดง context ใต้ field
  const finalTotal = Number(invoice?.final_total_amount) || 0;
  const depositAmount = Number(invoice?.deposit_amount) || 0;
  const derivedAmount = isBefore ? depositAmount : Math.max(0, finalTotal - depositAmount);
  const sideLabel = isBefore ? "มัดจำ" : "ส่วนคงเหลือ";
  const sharedNotes = invoice?.notes ?? "";

  return (
    <Box sx={{ pt: 2 }}>
      <Stack spacing={2}>
        {/* Read-only header — number + status + side amount */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              เลขที่
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
              {docNumber}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
              สถานะ
            </Typography>
            <Chip
              label={STATUS_LABEL[status] || status}
              color={STATUS_COLOR[status] || "default"}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
              ยอด {sideLabel} (จาก invoice หลัก)
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
              {fmtTHB(derivedAmount)}
            </Typography>
          </Box>
        </Box>

        {/* Editable: due date */}
        <TextField
          label="ครบกำหนด"
          type="date"
          value={sideData?.[dueDateKey] || ""}
          onChange={(e) => handleChange(dueDateKey, e.target.value)}
          fullWidth
          size="small"
          disabled={readOnly}
          InputLabelProps={{ shrink: true }}
          helperText="วันที่ครบกำหนดสำหรับ side นี้ — ว่างได้ (ใช้ค่าจาก invoice หลัก)"
        />

        {/* Editable: per-side amount (defaults to derived deposit/remaining) */}
        <TextField
          label={`ยอดของ side นี้ (${sideLabel})`}
          type="number"
          value={sideData?.[paidAmountKey] ?? 0}
          onChange={(e) => handleChange(paidAmountKey, e.target.value)}
          fullWidth
          size="small"
          disabled={readOnly}
          inputProps={{ min: 0, step: 0.01 }}
          InputProps={{ endAdornment: <Typography variant="body2">บาท</Typography> }}
          helperText={`ค่าเริ่มต้น: ${fmtTHB(derivedAmount)} (จาก invoice หลัก) — แก้ไขได้ ระบบจะเตือนถ้า ก่อน + หลัง ≠ ยอดรวม`}
        />

        {/* Editable: per-side notes (override) — show shared notes as context if present */}
        <Box>
          <TextField
            label="หมายเหตุเฉพาะ side นี้"
            value={sideData?.[notesKey] || ""}
            onChange={(e) => handleChange(notesKey, e.target.value)}
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            size="small"
            disabled={readOnly}
            inputProps={{ maxLength: 5000 }}
            placeholder="ว่างได้ (ใช้หมายเหตุจาก invoice หลัก)"
          />
          {sharedNotes && (
            <Box
              sx={{
                mt: 1,
                p: 1.5,
                bgcolor: "grey.50",
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block", mb: 0.5, fontWeight: 600 }}
              >
                หมายเหตุร่วม (จาก invoice หลัก)
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", whiteSpace: "pre-line", fontSize: "0.85rem" }}
              >
                {sharedNotes}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Mismatch warnings for this side */}
        <InvoiceSideMismatchAlert warnings={warnings} />
      </Stack>
    </Box>
  );
};

export default InvoiceSidePanel;
