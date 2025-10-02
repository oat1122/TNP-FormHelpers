import { showError, showSuccess, showLoading, dismissToast } from "../../utils/accountingToast";
import { buildUpdateItemsFromGroups } from "../utils/deliveryNoteUpdatePayload";

export function useSubmitUpdateDeliveryNote(
  updateDeliveryNote,
  note,
  formState,
  groups,
  customerDataSource = "delivery"
) {
  const handleUpdate = async () => {
    if (!note?.id) return;
    if (customerDataSource === "delivery" && !formState?.customer_company) {
      showError("กรุณากรอกชื่อบริษัทลูกค้า");
      return;
    }
    const toastId = showLoading("กำลังบันทึกการแก้ไข...");
    try {
      const items = buildUpdateItemsFromGroups(groups, note);
      // Build payload; include customer override fields only when using 'delivery' source
      const payload = {
        id: note.id,
        customer_data_source: customerDataSource,
        // If choosing to edit only for this delivery, send override fields
        ...(customerDataSource === "delivery"
          ? {
              customer_company: formState.customer_company,
              customer_tax_id: formState.customer_tax_id || undefined,
              customer_firstname: formState.customer_firstname || undefined,
              customer_lastname: formState.customer_lastname || undefined,
              customer_tel_1: formState.customer_tel_1 || undefined,
              customer_address: formState.customer_address || undefined,
            }
          : {}),
        work_name: formState.work_name || undefined,
        quantity: formState.quantity || undefined,
        notes: formState.notes || undefined,
        sender_company_id: formState.sender_company_id || undefined,
        // include items only if present
        ...(items.length ? { items } : {}),
      };
      await updateDeliveryNote(payload).unwrap();
      dismissToast(toastId);
      showSuccess("บันทึกสำเร็จ");
      return true;
    } catch (e) {
      dismissToast(toastId);
      const msg = e?.data?.message || "ไม่สามารถบันทึกการแก้ไขได้";
      showError(msg);
      return false;
    }
  };

  return { handleUpdate };
}
