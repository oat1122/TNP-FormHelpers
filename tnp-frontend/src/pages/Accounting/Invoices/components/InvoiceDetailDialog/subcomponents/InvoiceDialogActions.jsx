import { Box, Button } from "@mui/material";

import {
  SecondaryButton,
  tokens,
} from "../../../../PricingIntegration/components/styles/quotationFormStyles";

/**
 * Action bar ด้านล่างของ InvoiceDetailDialog (สลับระหว่างโหมดดู/แก้ไข).
 * เดิม inline เป็น `const actions = (...)` ใน shell ~75 บรรทัด.
 */
const InvoiceDialogActions = ({
  isEditing,
  isSaving,
  isGeneratingPdf,
  invoice,
  validation,
  lockedReadOnly,
  canEditInvoice,
  onPreviewPdf,
  onResetCalculation,
  onCancelEdit,
  onSave,
  onEnterEdit,
  onClose,
}) => {
  if (isEditing) {
    return (
      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", alignItems: "center" }}>
        <SecondaryButton
          onClick={onPreviewPdf}
          disabled={isGeneratingPdf || !invoice?.id || !validation.isValid}
          aria-label="ดูตัวอย่าง PDF"
        >
          {isGeneratingPdf ? "กำลังสร้าง…" : "ดูตัวอย่าง PDF"}
        </SecondaryButton>
        <Button
          variant="outlined"
          onClick={onResetCalculation}
          disabled={isSaving}
          sx={{ borderColor: tokens.primary, color: tokens.primary }}
          aria-label="รีเซ็ตการคำนวณ"
        >
          รีเซ็ต
        </Button>
        <Button
          variant="text"
          onClick={onCancelEdit}
          disabled={isSaving}
          aria-label="ยกเลิกการแก้ไข"
        >
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={isSaving || !validation.isValid}
          sx={{
            bgcolor: tokens.primary,
            "&:hover": { bgcolor: "#7A0E0E" },
            "&:disabled": { bgcolor: "grey.300" },
          }}
          aria-label="บันทึกการเปลี่ยนแปลง"
        >
          {isSaving ? "กำลังบันทึก…" : "บันทึกทั้งหมด"}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", alignItems: "center" }}>
      <SecondaryButton
        onClick={onPreviewPdf}
        disabled={isGeneratingPdf || !invoice?.id}
        aria-label="ดูตัวอย่าง PDF"
      >
        {isGeneratingPdf ? "กำลังสร้าง…" : "ดูตัวอย่าง PDF"}
      </SecondaryButton>
      {lockedReadOnly ? (
        <Button variant="text" onClick={onClose} aria-label="ปิดหน้าต่าง">
          ปิด
        </Button>
      ) : (
        canEditInvoice && (
          <Button
            variant="contained"
            onClick={onEnterEdit}
            disabled={validation.isReadOnly}
            sx={{
              bgcolor: tokens.primary,
              "&:hover": { bgcolor: "#7A0E0E" },
              "&:disabled": { bgcolor: "grey.300" },
            }}
            aria-label={
              validation.isReadOnly ? "ไม่สามารถแก้ไขได้ในสถานะปัจจุบัน" : "แก้ไขใบแจ้งหนี้"
            }
          >
            แก้ไข
          </Button>
        )
      )}
    </Box>
  );
};

export default InvoiceDialogActions;
