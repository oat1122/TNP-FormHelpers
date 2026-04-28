import {
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import PermissionErrorDialog from "../../../../components/PermissionErrorDialog";
import { SecondaryButton } from "../../../../shared/styles/quotationFormStyles";
import SyncConfirmationDialog from "../../SyncConfirmationDialog";
import SyncProgressDialog from "../../SyncProgressDialog";

// Auxiliary dialogs that float above QuotationDetailDialog: the sync warning,
// background sync progress, PDF preview iframe, signature image lightbox, and
// permission-denied modal. Grouped here so the shell stays thin.
const SyncDialogs = ({
  // Sync flow
  syncConfirmOpen,
  pendingSaveData,
  onCloseSyncConfirm,
  onConfirmSync,
  quotationId,
  syncJobId,
  onCloseSyncProgress,

  // PDF viewer
  showPdfViewer,
  pdfUrl,
  onClosePdfViewer,

  // Signature image preview
  previewImage,
  onClosePreviewImage,

  // Permission error
  permissionError,
  quotationNumber,
  userRole,
  onClosePermissionError,
}) => {
  return (
    <>
      <SyncConfirmationDialog
        open={syncConfirmOpen}
        onClose={onCloseSyncConfirm}
        onConfirm={onConfirmSync}
        quotationId={quotationId}
        invoiceCount={pendingSaveData?.invoiceCount || 0}
        affectedInvoices={pendingSaveData?.affectedInvoices || []}
      />

      <SyncProgressDialog open={!!syncJobId} syncJobId={syncJobId} onClose={onCloseSyncProgress} />

      <Dialog open={showPdfViewer} onClose={onClosePdfViewer} maxWidth="lg" fullWidth>
        <DialogTitle>ดูตัวอย่าง PDF</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {pdfUrl ? (
            <iframe
              title="quotation-pdf"
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
          <SecondaryButton onClick={onClosePdfViewer}>ปิด</SecondaryButton>
        </DialogActions>
      </Dialog>

      <Dialog open={!!previewImage} onClose={onClosePreviewImage} maxWidth="md" fullWidth>
        <DialogTitle>{previewImage?.filename || "ภาพตัวอย่าง"}</DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "common.black" }}>
          {previewImage && (
            <Box sx={{ position: "relative", width: "100%", textAlign: "center" }}>
              <img
                src={previewImage.url}
                alt={previewImage.filename}
                style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain" }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <SecondaryButton onClick={onClosePreviewImage}>ปิด</SecondaryButton>
        </DialogActions>
      </Dialog>

      <PermissionErrorDialog
        open={permissionError.open}
        onClose={onClosePermissionError}
        message={permissionError.message}
        invoices={permissionError.invoices}
        quotationNumber={quotationNumber}
        userRole={userRole}
      />
    </>
  );
};

export default SyncDialogs;
