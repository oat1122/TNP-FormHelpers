import { useCallback, useState } from "react";

import { apiConfig } from "../../../../../../api/apiConfig";

const getAuthToken = () => localStorage.getItem("authToken") || localStorage.getItem("token") || "";

const KIND_PATH = {
  tax: "tax",
  taxFull: "tax/full",
  receipt: "receipt",
  receiptFull: "receipt/full",
};

// Fixed default headerType ใน table view — ใน card view ผู้ใช้เลือกได้ผ่าน checkbox
// แต่ table view ต้อง compact: ใช้ "ต้นฉบับ" เป็น default ตาม useInvoicePDFDownload.js:13
const DEFAULT_HEADER_TYPES = ["ต้นฉบับ"];

export const useInvoiceTableDownloads = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const openMenu = useCallback((event, invoice) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActiveInvoice(invoice);
  }, []);

  const closeMenu = useCallback(() => {
    setAnchorEl(null);
    setActiveInvoice(null);
  }, []);

  const triggerDownload = useCallback(
    async ({ kind, mode }) => {
      if (!activeInvoice?.id) return;
      const path = KIND_PATH[kind];
      if (!path) return;

      setDownloading(true);
      try {
        const url = `${apiConfig.baseUrl}/invoices/${activeInvoice.id}/pdf/${path}/download`;
        const token = getAuthToken();
        if (!token) throw new Error("ไม่พบ Authentication token");

        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            headerTypes: DEFAULT_HEADER_TYPES,
            mode,
          }),
          credentials: "include",
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const downloadUrl = data?.zip_url || data?.pdf_url;
        if (downloadUrl) {
          window.open(downloadUrl, "_blank");
        } else {
          console.error("No download URL in response", data);
        }
      } catch (e) {
        console.error("Invoice PDF download failed", e);
      } finally {
        setDownloading(false);
        closeMenu();
      }
    },
    [activeInvoice, closeMenu]
  );

  return {
    anchorEl,
    activeInvoice,
    downloading,
    openMenu,
    closeMenu,
    triggerDownload,
  };
};
