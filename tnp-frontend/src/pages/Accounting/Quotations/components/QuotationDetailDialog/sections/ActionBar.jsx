import { SecondaryButton } from "../../../../shared/styles/quotationFormStyles";

// DialogActions content for QuotationDetailDialog.
// Edit-mode shows: Cancel / Save.
// Read-mode shows: Close.
const ActionBar = ({ isEditing, isSaving, onCancelEdit, onSave, onClose }) => {
  if (isEditing) {
    return (
      <>
        <SecondaryButton onClick={onCancelEdit}>ยกเลิก</SecondaryButton>
        <SecondaryButton onClick={onSave} disabled={isSaving}>
          {isSaving ? "กำลังบันทึก…" : "บันทึก"}
        </SecondaryButton>
      </>
    );
  }

  return <SecondaryButton onClick={onClose}>ปิด</SecondaryButton>;
};

export default ActionBar;
