import { SecondaryButton } from "../../../../shared/styles/quotationFormStyles";

// DialogActions content for QuotationDetailDialog.
// Edit-mode shows: Preview PDF / Cancel / Save.
// Read-mode shows: Preview PDF / Close.
const ActionBar = ({
  isEditing,
  isSaving,
  isGeneratingPdf,
  onPreviewPdf,
  onCancelEdit,
  onSave,
  onClose,
}) => {
  const previewLabel = isGeneratingPdf ? "กำลังสร้าง…" : "ดูตัวอย่าง PDF";

  if (isEditing) {
    return (
      <>
        <SecondaryButton onClick={onPreviewPdf} disabled={isGeneratingPdf}>
          {previewLabel}
        </SecondaryButton>
        <SecondaryButton onClick={onCancelEdit}>ยกเลิก</SecondaryButton>
        <SecondaryButton onClick={onSave} disabled={isSaving}>
          {isSaving ? "กำลังบันทึก…" : "บันทึก"}
        </SecondaryButton>
      </>
    );
  }

  return (
    <>
      <SecondaryButton onClick={onPreviewPdf} disabled={isGeneratingPdf}>
        {previewLabel}
      </SecondaryButton>
      <SecondaryButton onClick={onClose}>ปิด</SecondaryButton>
    </>
  );
};

export default ActionBar;
