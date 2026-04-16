import { WarningAmber } from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Alert,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";

import { useGetQuotationRelatedInvoicesQuery } from "../../../../features/Accounting/accountingApi";
import {
  PrimaryButton,
  SecondaryButton,
  tokens,
} from "../../PricingIntegration/components/quotation/styles/quotationTheme";

/**
 * SyncConfirmationDialog Component
 *
 * Displays confirmation dialog before syncing quotation changes to related invoices
 * Shows affected invoice count, warning for queued mode (>3 invoices), and requires checkbox confirmation
 *
 * @param {boolean} open - Dialog open state
 * @param {function} onClose - Close handler
 * @param {function} onConfirm - Confirmation handler, called when user confirms sync
 * @param {string} quotationId - Quotation ID (for fallback fetch if affectedInvoices not provided)
 * @param {number} invoiceCount - Number of invoices (passed from parent)
 * @param {Array} affectedInvoices - Array of affected invoice objects from backend (optional)
 */
const SyncConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  quotationId,
  invoiceCount = 0,
  affectedInvoices = [],
}) => {
  const [confirmed, setConfirmed] = useState(false);

  // Fetch related invoices only if not provided by parent
  const {
    data: invoicesData,
    isLoading,
    error,
  } = useGetQuotationRelatedInvoicesQuery(quotationId, {
    skip: !open || !quotationId || affectedInvoices.length > 0,
  });

  const invoices = affectedInvoices.length > 0 ? affectedInvoices : invoicesData?.data || [];
  const actualCount = invoices.length || invoiceCount;
  const isQueuedMode = actualCount > 3;

  const handleConfirm = () => {
    if (!confirmed) return;
    onConfirm();
    handleClose();
  };

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
        <WarningAmber sx={{ color: tokens.primary, fontSize: 28 }} />
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          ยืนยันการซิงค์ข้อมูลไปยังใบแจ้งหนี้
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            ไม่สามารถโหลดข้อมูลใบแจ้งหนี้ได้:{" "}
            {error?.data?.message || error?.message || "เกิดข้อผิดพลาด"}
          </Alert>
        ) : (
          <>
            <Alert severity="warning" icon={<WarningAmber />} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                การแก้ไขใบเสนอราคานี้จะส่งผลต่อใบแจ้งหนี้ทั้งหมด {actualCount} ใบ
              </Typography>
              <Typography variant="body2">
                ระบบจะซิงค์ข้อมูลหัวเอกสาร (ข้อมูลลูกค้า, VAT, หัก ณ ที่จ่าย, มัดจำ)
                และรายการสินค้าไปยังใบแจ้งหนี้ที่เชื่อมโยง
              </Typography>
            </Alert>

            {isQueuedMode && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  🔄 โหมดการทำงานแบบพื้นหลัง (Background Queue)
                </Typography>
                <Typography variant="body2">
                  เนื่องจากมีใบแจ้งหนี้มากกว่า 3 ใบ ระบบจะประมวลผลในพื้นหลัง
                  คุณสามารถติดตามความคืบหน้าได้ในหน้าจอถัดไป
                </Typography>
              </Alert>
            )}

            {invoices.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, mb: 1, color: tokens.textSecondary }}
                >
                  ใบแจ้งหนี้ที่จะได้รับการอัปเดต:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {invoices.map((invoice) => (
                    <Chip
                      key={invoice.id}
                      label={invoice.number}
                      size="small"
                      sx={{
                        backgroundColor: tokens.bg,
                        border: `1px solid ${tokens.border}`,
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <Box sx={{ mt: 3, p: 2, backgroundColor: tokens.bg, borderRadius: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    sx={{
                      color: tokens.primary,
                      "&.Mui-checked": { color: tokens.primary },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    ฉันเข้าใจและยืนยันการซิงค์ข้อมูลไปยังใบแจ้งหนี้ทั้งหมด
                  </Typography>
                }
              />
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SecondaryButton onClick={handleClose}>ยกเลิก</SecondaryButton>
        <PrimaryButton onClick={handleConfirm} disabled={!confirmed || isLoading}>
          {isLoading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "ยืนยันและบันทึก"}
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
};

export default SyncConfirmationDialog;
