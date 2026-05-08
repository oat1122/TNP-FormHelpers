import { useCallback, useState } from "react";

import { apiConfig } from "../../../../../../api/apiConfig";

const getAuthToken = () => localStorage.getItem("authToken") || localStorage.getItem("token") || "";

// path suffix ใต้ /invoices/{id}/pdf/...
// "invoice" = endpoint /pdf/download (no subpath) — ใช้ InvoicePdfMasterService
//             สร้าง "ใบแจ้งหนี้" (ไม่ใช่ใบกำกับภาษี)
const KIND_PATH = {
  invoice: "",
  tax: "tax",
  taxFull: "tax/full",
  receipt: "receipt",
  receiptFull: "receipt/full",
};

const KIND_LABEL = {
  invoice: "ใบแจ้งหนี้",
  tax: "ใบกำกับภาษี",
  taxFull: "ใบกำกับภาษี (100%)",
  receipt: "ใบเสร็จรับเงิน",
  receiptFull: "ใบเสร็จรับเงิน (100%)",
};

// build endpoint URL — handle empty path (kind="invoice") ไม่ให้เป็น `//download`
const buildPdfUrl = (baseUrl, invoiceId, path) =>
  path
    ? `${baseUrl}/invoices/${invoiceId}/pdf/${path}/download`
    : `${baseUrl}/invoices/${invoiceId}/pdf/download`;

export const useInvoiceTableDownloads = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [downloading, setDownloading] = useState(false);

  // Header-type picker dialog state ที่เปิดก่อนยิง download
  const [pendingDownload, setPendingDownload] = useState(null); // { kind, mode, invoiceId }
  const [dialogOpen, setDialogOpen] = useState(false);

  const openMenu = useCallback((event, invoice) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActiveInvoice(invoice);
  }, []);

  const closeMenu = useCallback(() => {
    setAnchorEl(null);
    setActiveInvoice(null);
  }, []);

  // เปิด picker dialog (ไม่ยิง API ทันที — รอ user เลือกหัวกระดาษ)
  // รับ `invoice` arg เพื่อ trigger ตรงโดยไม่ต้องผ่าน openMenu ก่อน (สำหรับ preview flow)
  const triggerDownload = useCallback(
    ({ kind, mode, invoice }) => {
      const target = invoice || activeInvoice;
      if (!target?.id) return;
      // เช็คว่า kind valid (in KIND_PATH map)
      if (!(kind in KIND_PATH)) return;

      setPendingDownload({
        kind,
        mode,
        invoiceId: target.id,
      });
      setDialogOpen(true);
      closeMenu();
    },
    [activeInvoice, closeMenu]
  );

  const cancelDownload = useCallback(() => {
    if (downloading) return;
    setDialogOpen(false);
    setPendingDownload(null);
  }, [downloading]);

  // ยิง download จริงหลัง user เลือก headerType จาก dialog
  // ส่ง `document_header_type` (single) — ไม่ส่ง `headerTypes` array → BE single-path
  // BE คืน binary PDF (response()->download()) — ไม่ใช่ JSON — ต้อง parse เป็น Blob
  const confirmDownload = useCallback(
    async (headerType) => {
      if (!pendingDownload) return;
      const { kind, mode, invoiceId } = pendingDownload;
      if (!(kind in KIND_PATH)) return;
      const path = KIND_PATH[kind];

      setDownloading(true);
      let blobUrl = null;
      try {
        const url = buildPdfUrl(apiConfig.baseUrl, invoiceId, path);
        const token = getAuthToken();
        if (!token) throw new Error("ไม่พบ Authentication token");

        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/pdf, application/json",
          },
          body: JSON.stringify({
            document_header_type: headerType,
            mode,
          }),
          credentials: "include",
        });

        if (!response.ok) {
          // Error response is JSON — try to extract message
          let msg = `HTTP ${response.status}`;
          try {
            const err = await response.json();
            if (err?.message) msg = err.message;
          } catch {
            /* ignore */
          }
          throw new Error(msg);
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/pdf")) {
          // ผ่าน path ZIP หรือ JSON-only response — fallback หา URL
          const data = await response.json();
          const downloadUrl = data?.pdf_url || data?.zip_url || data?.data?.pdf_url;
          if (!downloadUrl) throw new Error("ไม่พบไฟล์ PDF ใน response");
          window.open(downloadUrl, "_blank");
        } else {
          // Binary PDF response → blob → object URL → เปิดแท็บใหม่
          const blob = await response.blob();
          blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, "_blank");
          // Cleanup blob URL หลังจาก browser มีโอกาสเปิด (~ 1 minute เผื่อโหลดช้า)
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        }

        setDialogOpen(false);
        setPendingDownload(null);
      } catch (e) {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        if (import.meta.env.DEV) console.error("Invoice PDF download failed", e);
      } finally {
        setDownloading(false);
      }
    },
    [pendingDownload]
  );

  // Label สำหรับแสดงใน dialog (เช่น "ใบกำกับภาษี (มัดจำก่อน)")
  const dialogDocumentLabel = pendingDownload
    ? `${KIND_LABEL[pendingDownload.kind] ?? "PDF"}` +
      (pendingDownload.mode === "before"
        ? " (มัดจำก่อน)"
        : pendingDownload.mode === "after"
          ? " (มัดจำหลัง)"
          : "")
    : "PDF";

  return {
    anchorEl,
    activeInvoice,
    downloading,
    openMenu,
    closeMenu,
    triggerDownload,
    // Header-type picker dialog
    dialogOpen,
    cancelDownload,
    confirmDownload,
    dialogDocumentLabel,
  };
};
