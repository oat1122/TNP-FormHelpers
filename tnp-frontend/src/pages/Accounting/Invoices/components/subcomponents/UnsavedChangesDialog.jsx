import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

/**
 * Confirm-on-close guard for InvoiceDetailDialog edit mode.
 * Shown when user tries to close while either ก่อน or หลัง side has unsaved edits.
 *
 * Props:
 *   - open: boolean
 *   - dirtyFieldLabels: { before: string[], after: string[] }
 *   - onDiscard: () => void   — close dialog and lose edits
 *   - onCancel: () => void    — go back and continue editing
 *
 * Per audit invoice-side-edit Phase 2.
 */
const UnsavedChangesDialog = ({ open, dirtyFieldLabels, onDiscard, onCancel }) => {
  const before = dirtyFieldLabels?.before ?? [];
  const after = dirtyFieldLabels?.after ?? [];

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      aria-labelledby="invoice-unsaved-changes-title"
    >
      <DialogTitle
        id="invoice-unsaved-changes-title"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <WarningAmberIcon color="warning" />
        มีการแก้ไขที่ยังไม่ได้บันทึก
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          การแก้ไขต่อไปนี้จะหายไปถ้าปิด dialog
        </Typography>

        <Stack spacing={1.5}>
          {before.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ color: "warning.main", fontWeight: 700 }}>
                💰 มัดจำก่อน
              </Typography>
              <Typography variant="body2" sx={{ pl: 2, color: "text.secondary" }}>
                {before.join(", ")}
              </Typography>
            </Box>
          )}
          {after.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ color: "error.main", fontWeight: 700 }}>
                📋 มัดจำหลัง
              </Typography>
              <Typography variant="body2" sx={{ pl: 2, color: "text.secondary" }}>
                {after.join(", ")}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="outlined" color="primary">
          กลับไปแก้ต่อ
        </Button>
        <Button onClick={onDiscard} variant="contained" color="warning">
          ทิ้งการแก้ไข
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnsavedChangesDialog;
