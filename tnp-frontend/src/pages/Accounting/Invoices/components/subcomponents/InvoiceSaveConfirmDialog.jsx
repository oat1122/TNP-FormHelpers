import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useMemo } from "react";

/**
 * Confirm-before-save guard for InvoiceDetailDialog edit mode.
 *
 * Shown when soft-validation warnings exist at save time. User can:
 *   - Cancel (กลับไปแก้)
 *   - Confirm (บันทึกต่อ — accept warnings)
 *
 * Props:
 *   - open: boolean
 *   - warnings: { before: [...], after: [...] } from useInvoiceSideValidation
 *   - loading: boolean (mutation in flight)
 *   - onCancel: () => void
 *   - onConfirm: () => void
 *
 * Per audit invoice-side-edit Phase 4.
 */
const InvoiceSaveConfirmDialog = ({ open, warnings, loading = false, onCancel, onConfirm }) => {
  // De-duplicate warnings (same warning may be flagged on both sides)
  const uniqueWarnings = useMemo(() => {
    const seen = new Set();
    const out = [];
    [...(warnings?.before ?? []), ...(warnings?.after ?? [])].forEach((w) => {
      const key = `${w.title}|${w.detail}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(w);
      }
    });
    return out;
  }, [warnings]);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
      aria-labelledby="invoice-save-confirm-title"
    >
      <DialogTitle
        id="invoice-save-confirm-title"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <WarningAmberIcon color="warning" />
        พบความไม่สอดคล้อง
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          ระบบตรวจพบข้อมูลที่อาจไม่สอดคล้องกัน ({uniqueWarnings.length} รายการ):
        </Typography>

        <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
          {uniqueWarnings.map((w, idx) => (
            <Box component="li" key={idx} sx={{ mb: idx < uniqueWarnings.length - 1 ? 1.5 : 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {w.title}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                {w.detail}
              </Typography>
            </Box>
          ))}
        </Box>

        <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
          ต้องการบันทึกต่อหรือกลับไปแก้?
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading} variant="outlined" color="primary">
          ยกเลิก (กลับไปแก้)
        </Button>
        <Button onClick={onConfirm} disabled={loading} variant="contained" color="warning">
          {loading ? "กำลังบันทึก..." : "บันทึกต่อ"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceSaveConfirmDialog;
