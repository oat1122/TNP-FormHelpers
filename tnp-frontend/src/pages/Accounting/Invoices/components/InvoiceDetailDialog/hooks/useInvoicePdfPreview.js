import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "../../../../utils/accountingToast";

/**
 * Hook สร้าง handler `handlePreviewPdf` —
 *  call mutation `generateInvoicePDF` → เปิด URL ในแท็บใหม่.
 *
 * Extracted from InvoiceDetailDialog.jsx (~35 บรรทัด).
 */
export function useInvoicePdfPreview({ invoice, invoiceId, formData, generateInvoicePDF }) {
  const handlePreviewPdf = async () => {
    const id = invoice?.id || invoiceId;
    if (!id) {
      showError("ไม่พบรหัสใบแจ้งหนี้ (invoice id)");
      return;
    }

    const loadingId = showLoading("กำลังสร้าง PDF ใบแจ้งหนี้…");
    try {
      const res = await generateInvoicePDF({
        id,
        headerTypes: formData?.document_header_type ? [formData.document_header_type] : undefined,
        preview: true,
      }).unwrap();

      const url = res?.pdf_url || res?.url;
      dismissToast(loadingId);

      if (url) {
        window.open(url, "_blank");
        showSuccess("สร้าง PDF สำเร็จ");
      } else {
        showError("ไม่ได้รับลิงก์ PDF จากเซิร์ฟเวอร์");
      }
    } catch (error) {
      dismissToast(loadingId);
      showError(error?.data?.message || error?.message || "ไม่สามารถสร้าง PDF ได้");
    }
  };

  return { handlePreviewPdf };
}
