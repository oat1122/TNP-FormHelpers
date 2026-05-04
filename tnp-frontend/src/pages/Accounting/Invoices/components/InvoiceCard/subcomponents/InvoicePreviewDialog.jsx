import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

const InvoicePreviewDialog = ({ open, pdfUrl, onClose, onOpenInNewTab }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="lg"
    fullWidth
    PaperProps={{ sx: { height: "90vh", maxHeight: "90vh" } }}
  >
    <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 2 }}>
      ดูตัวอย่าง PDF ใบแจ้งหนี้
    </DialogTitle>
    <DialogContent dividers sx={{ p: 0, height: "80vh" }}>
      {pdfUrl ? (
        <iframe
          title="invoice-pdf"
          src={pdfUrl}
          style={{ width: "100%", height: "80vh", border: "0px" }}
        />
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "80vh",
            color: "text.secondary",
            gap: 2,
          }}
        >
          <CircularProgress size={40} />
          <Typography>กำลังโหลด PDF...</Typography>
        </Box>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onOpenInNewTab} disabled={!pdfUrl}>
        เปิดในแท็บใหม่
      </Button>
      <Button onClick={onClose}>ปิด</Button>
    </DialogActions>
  </Dialog>
);

export default InvoicePreviewDialog;
