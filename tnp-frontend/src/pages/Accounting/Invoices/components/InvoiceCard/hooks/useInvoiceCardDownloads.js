import { useCallback, useState } from "react";

import { getApiBaseUrl, getAuthToken } from "../utils/apiHelpers";

const PATH_BY_KIND = {
  tax: "tax",
  taxFull: "tax/full",
  receipt: "receipt",
  receiptFull: "receipt/full",
};

/**
 * Manages the 4 download menus inside InvoiceCard:
 * tax / receipt — each with before/after mode + dedicated anchor
 * taxFull / receiptFull — single mode "full"
 *
 * `selectedHeaders` lives in `useInvoicePDFDownload` (pdfHook) — caller passes
 * them into each `confirmXxx` call so this hook stays decoupled.
 */
export const useInvoiceCardDownloads = (invoice) => {
  const [taxAnchor, setTaxAnchor] = useState(null);
  const [receiptAnchor, setReceiptAnchor] = useState(null);
  const [taxFullAnchor, setTaxFullAnchor] = useState(null);
  const [receiptFullAnchor, setReceiptFullAnchor] = useState(null);
  const [taxMode, setTaxMode] = useState("before");
  const [receiptMode, setReceiptMode] = useState("before");

  const closeTax = useCallback(() => setTaxAnchor(null), []);
  const closeReceipt = useCallback(() => setReceiptAnchor(null), []);
  const closeTaxFull = useCallback(() => setTaxFullAnchor(null), []);
  const closeReceiptFull = useCallback(() => setReceiptFullAnchor(null), []);

  const openTaxBefore = useCallback((e) => {
    setTaxAnchor(e.currentTarget);
    setTaxMode("before");
  }, []);
  const openTaxAfter = useCallback((e) => {
    setTaxAnchor(e.currentTarget);
    setTaxMode("after");
  }, []);
  const openTaxFull = useCallback((e) => setTaxFullAnchor(e.currentTarget), []);
  const openReceiptBefore = useCallback((e) => {
    setReceiptAnchor(e.currentTarget);
    setReceiptMode("before");
  }, []);
  const openReceiptAfter = useCallback((e) => {
    setReceiptAnchor(e.currentTarget);
    setReceiptMode("after");
  }, []);
  const openReceiptFull = useCallback((e) => setReceiptFullAnchor(e.currentTarget), []);

  const downloadPdf = useCallback(
    async ({ kind, headerTypes, mode }) => {
      if (!invoice?.id) return;
      const path = PATH_BY_KIND[kind];
      if (!path) return;
      if (!Array.isArray(headerTypes) || headerTypes.length === 0) return;

      const url = `${getApiBaseUrl()}/invoices/${invoice.id}/pdf/${path}/download`;
      const token = getAuthToken();
      if (!token) throw new Error("No authentication token");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ headerTypes, mode: mode || "before" }),
        credentials: "include",
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const downloadUrl = data?.zip_url || data?.pdf_url;
      if (downloadUrl) {
        window.open(downloadUrl, "_blank", "noopener,noreferrer");
      } else if (import.meta.env.DEV) {
        console.error("No download URL in response", data);
      }
    },
    [invoice?.id]
  );

  const confirmTax = useCallback(
    async (headerTypes) => {
      closeTax();
      try {
        await downloadPdf({ kind: "tax", headerTypes, mode: taxMode });
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error("Tax Invoice download failed", e);
        }
      }
    },
    [closeTax, downloadPdf, taxMode]
  );

  const confirmReceipt = useCallback(
    async (headerTypes) => {
      closeReceipt();
      try {
        await downloadPdf({ kind: "receipt", headerTypes, mode: receiptMode });
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error("Receipt download failed", e);
        }
      }
    },
    [closeReceipt, downloadPdf, receiptMode]
  );

  const confirmTaxFull = useCallback(
    async (headerTypes) => {
      closeTaxFull();
      try {
        await downloadPdf({ kind: "taxFull", headerTypes, mode: "full" });
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error("Tax Invoice Full download failed", e);
        }
      }
    },
    [closeTaxFull, downloadPdf]
  );

  const confirmReceiptFull = useCallback(
    async (headerTypes) => {
      closeReceiptFull();
      try {
        await downloadPdf({ kind: "receiptFull", headerTypes, mode: "full" });
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error("Receipt Full download failed", e);
        }
      }
    },
    [closeReceiptFull, downloadPdf]
  );

  return {
    taxAnchor,
    receiptAnchor,
    taxFullAnchor,
    receiptFullAnchor,
    taxMode,
    receiptMode,
    openTaxBefore,
    openTaxAfter,
    openTaxFull,
    openReceiptBefore,
    openReceiptAfter,
    openReceiptFull,
    closeTax,
    closeReceipt,
    closeTaxFull,
    closeReceiptFull,
    confirmTax,
    confirmReceipt,
    confirmTaxFull,
    confirmReceiptFull,
  };
};
