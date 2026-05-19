import { useState } from "react";

/**
 * Hook คุม flow ปิด dialog — เช็ค dirty side edits ก่อน close
 * แล้วเปิด UnsavedChangesDialog ถ้าจำเป็น.
 *
 * Return:
 *  - unsavedDialogOpen / setUnsavedDialogOpen
 *  - handleDialogClose — เรียกตอนกด ESC/backdrop หรือปุ่มปิด
 *  - handleDiscardUnsaved — confirm discard → reset + close
 */
export function useInvoiceCloseFlow({ isEditing, sideEdit, setIsEditing, onClose }) {
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);

  const handleDialogClose = () => {
    if (isEditing && sideEdit.dirtyAny) {
      setUnsavedDialogOpen(true);
      return;
    }
    onClose?.();
  };

  const handleDiscardUnsaved = () => {
    sideEdit.resetAll();
    setUnsavedDialogOpen(false);
    setIsEditing(false);
    onClose?.();
  };

  return {
    unsavedDialogOpen,
    setUnsavedDialogOpen,
    handleDialogClose,
    handleDiscardUnsaved,
  };
}
