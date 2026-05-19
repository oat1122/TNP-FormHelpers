import {
  showError,
  showLoading,
  showSuccess,
  dismissToast,
} from "../../../../utils/accountingToast";
import { buildInvoiceUpdatePayload } from "../utils/buildInvoiceUpdatePayload";

const translateSaveError = (error, invoice) => {
  if (error?.data?.message) return error.data.message;
  let message = error?.message || "บันทึกใบแจ้งหนี้ไม่สำเร็จ";
  if (message.includes("cannot be updated in current status")) {
    message = `ไม่สามารถแก้ไขใบแจ้งหนี้ได้ในสถานะปัจจุบัน (${invoice?.status || "unknown"})`;
  }
  return message;
};

/**
 * Hook รวม save flow ของ InvoiceDetailDialog:
 *  - buildUpdatePayload (pure)
 *  - executeSave (mutation + side cleanup + toast)
 *  - handleSave (gate ด้วย side validation warning → ขออนุญาตก่อน)
 *
 * Extracted from InvoiceDetailDialog.jsx (~85 บรรทัด).
 */
export function useInvoiceSave({
  invoice,
  formData,
  notes,
  isEditing,
  editableItems,
  calculation,
  customerDataSource,
  sideEdit,
  sideValidation,
  updateInvoice,
  setIsEditing,
  setSaveConfirmOpen,
  clearCustomerSourceManualFlag,
  setCustomerDataSource,
}) {
  const buildPayload = () =>
    buildInvoiceUpdatePayload({
      invoice,
      formData,
      notes,
      isEditing,
      editableItems,
      calculation,
      customerDataSource,
      sidePayload: sideEdit.getSidePayload(),
    });

  const executeSave = async () => {
    const updateData = buildPayload();
    const loadingId = showLoading("กำลังบันทึกใบแจ้งหนี้…");
    try {
      await updateInvoice(updateData).unwrap();
      if (customerDataSource === "master") {
        clearCustomerSourceManualFlag();
        setCustomerDataSource("master");
      }
      sideEdit.resetAll();
      setIsEditing(false);
      setSaveConfirmOpen(false);
      dismissToast(loadingId);
      showSuccess("บันทึกใบแจ้งหนี้เรียบร้อย");
    } catch (error) {
      dismissToast(loadingId);
      if (import.meta.env.DEV) {
        console.error("Failed to update invoice:", error);
      }
      showError(translateSaveError(error, invoice));
    }
  };

  const handleSave = () => {
    if (sideValidation.hasAnyWarning) {
      setSaveConfirmOpen(true);
      return undefined;
    }
    return executeSave();
  };

  return { executeSave, handleSave, buildPayload };
}
