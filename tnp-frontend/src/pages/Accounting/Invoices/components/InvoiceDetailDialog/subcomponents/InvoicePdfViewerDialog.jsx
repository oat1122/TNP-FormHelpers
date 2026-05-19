import {
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import { SecondaryButton } from "../../../../PricingIntegration/components/styles/quotationFormStyles";

/**
 * Modal แสดง PDF preview ใน iframe.
 * เดิม inline เป็น <Dialog> ตัวที่ 2 ใน shell.
 *
 * NOTE: ปัจจุบัน pdfUrl ใน shell เป็น const "" (ใช้แท็บใหม่แทน) — เก็บ component
 * ไว้เผื่อในอนาคต restore in-app viewer.
 */
const InvoicePdfViewerDialog = ({ open, onClose, pdfUrl }) => (
  <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
    <DialogTitle>ดูตัวอย่าง PDF ใบแจ้งหนี้</DialogTitle>
    <DialogContent dividers sx={{ p: 0 }}>
      {pdfUrl ? (
        <iframe
          title="invoice-pdf"
          src={pdfUrl}
          style={{ width: "100%", height: "80vh", border: 0 }}
        />
      ) : (
        <Box display="flex" alignItems="center" gap={1} p={2}>
          <CircularProgress size={22} />
          <Typography variant="body2">กำลังโหลดตัวอย่าง PDF…</Typography>
        </Box>
      )}
    </DialogContent>
    <DialogActions>
      {pdfUrl && (
        <SecondaryButton onClick={() => window.open(pdfUrl, "_blank")}>
          เปิดในแท็บใหม่
        </SecondaryButton>
      )}
      <SecondaryButton onClick={onClose}>ปิด</SecondaryButton>
    </DialogActions>
  </Dialog>
);

export default InvoicePdfViewerDialog;
