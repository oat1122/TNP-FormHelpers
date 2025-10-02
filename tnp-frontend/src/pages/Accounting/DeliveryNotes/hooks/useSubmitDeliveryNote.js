import { showError, showSuccess, showLoading, dismissToast } from "../../utils/accountingToast";
import {
  buildDeliveryNoteItemsFromGroups,
  buildCustomerSnapshot,
  buildDeliveryNoteItemsFromInvoice,
} from "../utils/deliveryNotePayload";

export function useSubmitDeliveryNote(
  createDeliveryNote,
  formState,
  invoice,
  customer,
  customerDataSource,
  source,
  editableItems,
  onCreated
) {
  const handleSubmit = async () => {
    if (!formState?.customer_company) {
      showError("Customer company is required");
      return;
    }

    const toastId = showLoading("Creating delivery note...");

    try {
      let items = buildDeliveryNoteItemsFromGroups(editableItems, invoice);
      if ((!items || items.length === 0) && invoice?.items?.length) {
        items = buildDeliveryNoteItemsFromInvoice(invoice);
      }
      const customerSnapshot = buildCustomerSnapshot(customer);

      const payload = {
        company_id: formState.company_id || invoice?.company_id,
        customer_id: formState.customer_id || undefined,
        customer_company: formState.customer_company,
        customer_address: formState.customer_address,
        customer_tel_1: formState.customer_tel_1 || undefined,
        customer_tax_id: formState.customer_tax_id || undefined,
        // ผู้ติดต่อห้ามเปลี่ยน: ไม่ส่งชื่อ/นามสกุลผู้ติดต่อในใบส่งของ
        work_name: formState.work_name,
        quantity: formState.quantity,
        notes: formState.notes || undefined,
        invoice_id: source?.invoice_id || undefined,
        invoice_item_id: source?.invoice_item_id || undefined,
        invoice_number: source?.invoice_number || invoice?.number,
        customer_data_source: customerDataSource,
        customer_snapshot: customerSnapshot,
        sender_company_id: formState.sender_company_id || undefined,
        // delivery fields: allow backend defaulting
        delivery_method: undefined,
        courier_company: undefined,
        delivery_address: undefined,
        recipient_name: undefined,
        recipient_phone: undefined,
        delivery_date: undefined,
        items: items?.length ? items : undefined,
      };

      await createDeliveryNote(payload).unwrap();
      dismissToast(toastId);
      showSuccess("Delivery note created successfully");
      onCreated?.();
    } catch (error) {
      dismissToast(toastId);
      const message = error?.data?.message || "Failed to create delivery note";
      showError(message);
    }
  };

  return { handleSubmit };
}
