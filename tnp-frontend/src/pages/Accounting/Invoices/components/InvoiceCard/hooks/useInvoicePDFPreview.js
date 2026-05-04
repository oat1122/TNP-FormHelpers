import { useCallback, useState } from "react";

import { getApiBaseUrl, getAuthToken } from "../utils/apiHelpers";

/**
 * Manages the PDF preview dialog inside InvoiceCard:
 * fetches a blob from `/invoices/{id}/pdf/preview?mode=...`, creates an object URL,
 * and tracks open/close + cleanup of the URL to prevent memory leaks.
 */
export const useInvoicePDFPreview = (invoice) => {
  const [open, setOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  const close = useCallback(() => {
    if (pdfUrl && pdfUrl.startsWith("blob:")) {
      URL.revokeObjectURL(pdfUrl);
    }
    setOpen(false);
    setPdfUrl("");
  }, [pdfUrl]);

  const openInNewTab = useCallback(() => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  }, [pdfUrl]);

  const preview = useCallback(
    async (mode) => {
      if (!invoice?.id) return;

      setOpen(true);
      setPdfUrl("");

      const url = `${getApiBaseUrl()}/invoices/${invoice.id}/pdf/preview?mode=${mode || "before"}`;
      const finalToken = getAuthToken();
      if (!finalToken) {
        console.error("No authentication token");
        setOpen(false);
        return;
      }

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${finalToken}`,
            Accept: "application/pdf",
          },
          credentials: "include",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        if (blob.type !== "application/pdf") {
          throw new Error(`Expected PDF but got ${blob.type}`);
        }
        setPdfUrl(URL.createObjectURL(blob));
      } catch (e) {
        console.error("PDF preview failed", e);
        setOpen(false);
        setPdfUrl("");
      }
    },
    [invoice?.id]
  );

  return { open, pdfUrl, preview, close, openInNewTab };
};
