import { useCallback } from "react";
import { apiConfig } from "../../api/apiConfig";
import {
  useApproveInvoiceMutation,
  useSubmitInvoiceMutation,
  useGenerateInvoicePDFMutation,
} from "../../features/Accounting/accountingApi";

/**
 * Custom Hook สำหรับจัดการ Actions ต่างๆ ของ Invoice
 * แยก Business Logic ออกจาก UI Components
 * 
 * @returns {Object} Object ที่มี handler functions สำหรับ Invoice actions
 */
export const useInvoiceActions = () => {
  const [approveInvoiceMutation] = useApproveInvoiceMutation();
  const [submitInvoiceMutation] = useSubmitInvoiceMutation();
  const [generateInvoicePDFMutation] = useGenerateInvoicePDFMutation();

  /**
   * อนุมัติ Invoice
   * @param {string} invoiceId - ID ของ Invoice
   * @param {string} notes - หมายเหตุการอนุมัติ
   */
  const handleApprove = useCallback(
    async (invoiceId, notes = null) => {
      try {
        await approveInvoiceMutation({ id: invoiceId, notes }).unwrap();
        return { success: true };
      } catch (error) {
        console.error("Approve invoice failed:", error);
        return {
          success: false,
          error: error.message || "ไม่สามารถอนุมัติใบแจ้งหนี้ได้",
        };
      }
    },
    [approveInvoiceMutation]
  );

  /**
   * ส่งขออนุมัติ Invoice
   * @param {string} invoiceId - ID ของ Invoice
   */
  const handleSubmit = useCallback(
    async (invoiceId) => {
      try {
        await submitInvoiceMutation(invoiceId).unwrap();
        return { success: true };
      } catch (error) {
        console.error("Submit invoice failed:", error);
        return {
          success: false,
          error: error.message || "ไม่สามารถส่งขออนุมัติได้",
        };
      }
    },
    [submitInvoiceMutation]
  );

  /**
   * ส่งขออนุมัติและอนุมัติ Invoice ในคราวเดียว (สำหรับ draft)
   * @param {string} invoice - Invoice object
   * @param {string} notes - หมายเหตุการอนุมัติ
   */
  const handleSubmitAndApprove = useCallback(
    async (invoice, notes = null) => {
      try {
        // ถ้าสถานะเป็น draft ให้ submit ก่อน
        if (invoice.status === "draft") {
          await submitInvoiceMutation(invoice.id).unwrap();
        }

        // จากนั้นอนุมัติ
        await approveInvoiceMutation({ id: invoice.id, notes }).unwrap();

        return { success: true };
      } catch (error) {
        console.error("Submit and approve invoice failed:", error);
        return {
          success: false,
          error: error.message || "ไม่สามารถส่งขออนุมัติและอนุมัติได้",
        };
      }
    },
    [submitInvoiceMutation, approveInvoiceMutation]
  );

  /**
   * ดาวน์โหลด PDF พร้อม multi-header support
   * @param {Object} options - ตัวเลือก { invoiceId, headerTypes, mode }
   */
  const handleDownloadPDF = useCallback(
    async ({ invoiceId, headerTypes = [], mode = "before" }) => {
      try {
        if (!invoiceId || !Array.isArray(headerTypes) || headerTypes.length === 0) {
          console.warn("Invalid download parameters");
          return { success: false, error: "ข้อมูลไม่ครบถ้วน" };
        }

        // Build URL with parameters
        const params = new URLSearchParams();
        params.append("mode", mode);
        headerTypes.forEach((header) => params.append("headerTypes[]", header));

        const url = `${apiConfig.baseUrl}/invoices/${invoiceId}/pdf/download?${params.toString()}`;

        // Get auth token
        const authToken = localStorage.getItem("authToken");
        const token = localStorage.getItem("token");
        const finalToken = authToken || token;

        if (!finalToken) {
          throw new Error("ไม่พบ Authentication token");
        }

        // Fetch file
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${finalToken}`,
            Accept: "application/pdf, application/zip, application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/pdf") || contentType.includes("application/zip")) {
          // Handle binary response
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = objectUrl;

          // Determine filename
          if (contentType.includes("application/zip")) {
            a.download = `invoices-${mode}-${Date.now()}.zip`;
          } else {
            a.download = `invoice-${mode}-${invoiceId}.pdf`;
          }

          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

          return { success: true };
        } else if (contentType.includes("application/json")) {
          // Handle JSON response (legacy format)
          const data = await response.json();

          if (data.mode === "single" && data.pdf_url) {
            const a = document.createElement("a");
            a.href = data.pdf_url;
            a.download = data.filename || `invoice-${mode}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
          } else if (data.mode === "zip" && data.zip_url) {
            const a = document.createElement("a");
            a.href = data.zip_url;
            a.download = data.zip_filename || `invoices-${mode}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
          } else if (data.pdf_url) {
            const a = document.createElement("a");
            a.href = data.pdf_url;
            a.download = data.filename || `invoice-${mode}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
          }

          return { success: true };
        } else {
          throw new Error("Unexpected content type: " + contentType);
        }
      } catch (error) {
        console.error("PDF download failed:", error);
        return {
          success: false,
          error: error.message || "ไม่สามารถดาวน์โหลด PDF ได้",
        };
      }
    },
    []
  );

  /**
   * แสดงตัวอย่าง PDF ในแท็บใหม่
   * @param {Object} options - ตัวเลือก { invoiceId, mode }
   */
  const handlePreviewPDF = useCallback(async ({ invoiceId, mode = "before" }) => {
    try {
      if (!invoiceId) {
        console.warn("Invalid preview parameters");
        return { success: false, error: "ไม่พบ ID ของใบแจ้งหนี้" };
      }

      // Build URL with mode parameter
      const url = `${apiConfig.baseUrl}/invoices/${invoiceId}/pdf/preview?mode=${mode}`;

      // Get auth token
      const authToken = localStorage.getItem("authToken");
      const token = localStorage.getItem("token");
      const finalToken = authToken || token;

      if (!finalToken) {
        throw new Error("ไม่พบ Authentication token");
      }

      // Fetch PDF
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${finalToken}`,
          Accept: "application/pdf",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Convert to blob and open in new tab
      const blob = await response.blob();
      if (blob.type === "application/pdf") {
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, "_blank");
        // Clean up after delay
        setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
        return { success: true };
      } else {
        throw new Error("Unexpected response type: " + blob.type);
      }
    } catch (error) {
      console.error("PDF preview failed:", error);
      return {
        success: false,
        error: error.message || "ไม่สามารถแสดงตัวอย่าง PDF ได้",
      };
    }
  }, []);

  /**
   * ดาวน์โหลด PDF หลายไฟล์รวม (Multi-header)
   * @param {Object} options - ตัวเลือก { invoiceId, headerTypes }
   */
  const handleDownloadMultiHeader = useCallback(
    async ({ invoiceId, headerTypes = [] }) => {
      try {
        if (!invoiceId || !Array.isArray(headerTypes) || headerTypes.length === 0) {
          return { success: false, error: "ข้อมูลไม่ครบถ้วน" };
        }

        const data = await generateInvoicePDFMutation({ id: invoiceId, headerTypes }).unwrap();

        if (data.mode === "single" && data.pdf_url) {
          const a = document.createElement("a");
          a.href = data.pdf_url;
          a.download = data.filename || "invoice.pdf";
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else if (data.mode === "zip" && data.zip_url) {
          const a = document.createElement("a");
          a.href = data.zip_url;
          a.download = data.zip_filename || "invoices.zip";
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else if (data.pdf_url) {
          const a = document.createElement("a");
          a.href = data.pdf_url;
          a.download = data.filename || "invoice.pdf";
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else {
          console.warn("Unexpected response from generateInvoicePDF", data);
          return { success: false, error: "รูปแบบข้อมูลไม่ถูกต้อง" };
        }

        return { success: true };
      } catch (error) {
        console.error("Multi-header download failed:", error);
        return {
          success: false,
          error: error.message || "ไม่สามารถดาวน์โหลดไฟล์รวมได้",
        };
      }
    },
    [generateInvoicePDFMutation]
  );

  return {
    handleApprove,
    handleSubmit,
    handleSubmitAndApprove,
    handleDownloadPDF,
    handlePreviewPDF,
    handleDownloadMultiHeader,
  };
};

export default useInvoiceActions;
