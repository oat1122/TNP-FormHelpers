import { useCallback } from "react";

import { apiConfig } from "../../../../api/apiConfig";
import {
  useSubmitInvoiceMutation,
  useApproveInvoiceMutation,
} from "../../../../features/Accounting/accountingApi";

/**
 * Page-level invoice actions for InvoicesView (table list).
 *
 * Scope: thin Submit / Submit+Approve flow + raw PDF download/preview that
 * bypass RTK Query (binary blob → trigger browser download). Single-action
 * approve lives in `components/hooks/useInvoiceApproval.js` (used by
 * InvoiceCard) — don't duplicate it here.
 */
export const useInvoiceActions = () => {
  const [submitInvoiceMutation] = useSubmitInvoiceMutation();
  const [approveInvoiceMutation] = useApproveInvoiceMutation();

  const handleSubmit = useCallback(
    async (invoiceId) => {
      try {
        await submitInvoiceMutation(invoiceId).unwrap();
        return { success: true };
      } catch (error) {
        if (import.meta.env.DEV) console.error("Submit invoice failed:", error);
        return {
          success: false,
          error: error.message || "ไม่สามารถส่งขออนุมัติได้",
        };
      }
    },
    [submitInvoiceMutation]
  );

  // For draft invoices: submit then approve in one click.
  const handleSubmitAndApprove = useCallback(
    async (invoice, notes = null) => {
      try {
        if (invoice.status === "draft") {
          await submitInvoiceMutation(invoice.id).unwrap();
        }
        await approveInvoiceMutation({ id: invoice.id, notes }).unwrap();
        return { success: true };
      } catch (error) {
        if (import.meta.env.DEV) console.error("Submit and approve invoice failed:", error);
        return {
          success: false,
          error: error.message || "ไม่สามารถส่งขออนุมัติและอนุมัติได้",
        };
      }
    },
    [submitInvoiceMutation, approveInvoiceMutation]
  );

  // Direct fetch (not RTK Query) — backend returns binary blob.
  const handleDownloadPDF = useCallback(
    async ({ invoiceId, headerTypes = [], mode = "before" }) => {
      try {
        if (!invoiceId || !Array.isArray(headerTypes) || headerTypes.length === 0) {
          return { success: false, error: "ข้อมูลไม่ครบถ้วน" };
        }

        const params = new URLSearchParams();
        params.append("mode", mode);
        headerTypes.forEach((header) => params.append("headerTypes[]", header));

        const url = `${apiConfig.baseUrl}/invoices/${invoiceId}/pdf/download?${params.toString()}`;
        const finalToken = localStorage.getItem("authToken") || localStorage.getItem("token");
        if (!finalToken) throw new Error("ไม่พบ Authentication token");

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${finalToken}`,
            Accept: "application/pdf, application/zip, application/json",
          },
          credentials: "include",
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/pdf") || contentType.includes("application/zip")) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = objectUrl;
          a.download = contentType.includes("application/zip")
            ? `invoices-${mode}-${Date.now()}.zip`
            : `invoice-${mode}-${invoiceId}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
          return { success: true };
        }

        if (contentType.includes("application/json")) {
          // Legacy JSON response — server may return URL instead of blob
          const data = await response.json();
          const a = document.createElement("a");
          if (data.mode === "zip" && data.zip_url) {
            a.href = data.zip_url;
            a.download = data.zip_filename || `invoices-${mode}.zip`;
          } else if (data.pdf_url) {
            a.href = data.pdf_url;
            a.download = data.filename || `invoice-${mode}.pdf`;
          } else {
            return { success: false, error: "รูปแบบข้อมูลไม่ถูกต้อง" };
          }
          document.body.appendChild(a);
          a.click();
          a.remove();
          return { success: true };
        }

        throw new Error("Unexpected content type: " + contentType);
      } catch (error) {
        if (import.meta.env.DEV) console.error("PDF download failed:", error);
        return {
          success: false,
          error: error.message || "ไม่สามารถดาวน์โหลด PDF ได้",
        };
      }
    },
    []
  );

  // Open PDF in new tab via blob URL.
  const handlePreviewPDF = useCallback(async ({ invoiceId, mode = "before" }) => {
    try {
      if (!invoiceId) return { success: false, error: "ไม่พบ ID ของใบแจ้งหนี้" };

      const url = `${apiConfig.baseUrl}/invoices/${invoiceId}/pdf/preview?mode=${mode}`;
      const finalToken = localStorage.getItem("authToken") || localStorage.getItem("token");
      if (!finalToken) throw new Error("ไม่พบ Authentication token");

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${finalToken}`,
          Accept: "application/pdf",
        },
        credentials: "include",
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const blob = await response.blob();
      if (blob.type !== "application/pdf") {
        throw new Error("Unexpected response type: " + blob.type);
      }
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
      return { success: true };
    } catch (error) {
      if (import.meta.env.DEV) console.error("PDF preview failed:", error);
      return {
        success: false,
        error: error.message || "ไม่สามารถแสดงตัวอย่าง PDF ได้",
      };
    }
  }, []);

  return {
    handleSubmit,
    handleSubmitAndApprove,
    handleDownloadPDF,
    handlePreviewPDF,
  };
};

export default useInvoiceActions;
