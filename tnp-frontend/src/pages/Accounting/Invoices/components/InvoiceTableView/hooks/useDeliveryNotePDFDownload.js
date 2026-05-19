import { useCallback, useState } from "react";

import { apiConfig } from "../../../../../../api/apiConfig";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "../../../../utils/accountingToast";

const getAuthToken = () => localStorage.getItem("authToken") || localStorage.getItem("token") || "";

/**
 * PDF download flow for delivery notes attached to an invoice row.
 *
 * Two entry points — both stream the rendered PDF inline via fetch+blob+
 * window.open. The "ad-hoc" form lets the user grab a delivery-note PDF for an
 * invoice that already has uploaded evidence even when no DeliveryNote record
 * exists yet (BE renders it in-memory from invoice data).
 *
 * Returns:
 *   downloading      — boolean, true while any download is in-flight
 *   downloadingKey   — string id of the active download ("dn:<uuid>" or "inv:<uuid>")
 *   downloadingId    — alias kept for compatibility with the MenuItem spinner
 *                      check (matches `dn.id` when downloading a DN record)
 *   downloadDeliveryNote(deliveryNote) — open PDF for an existing DN record
 *   downloadFromInvoice(invoice)       — open ad-hoc PDF built from invoice data
 */
const openPdfBlob = (blob, prettyName) => {
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  if (!opened) {
    showError("เบราว์เซอร์บล็อกการเปิดแท็บใหม่ — อนุญาต popup แล้วลองใหม่");
    return false;
  }
  showSuccess(`เปิด PDF ใบส่งของ ${prettyName || ""} แล้ว`);
  return true;
};

const fetchPdf = async (url) => {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      Accept: "application/pdf",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.blob();
};

export const useDeliveryNotePDFDownload = () => {
  const [downloadingKey, setDownloadingKey] = useState(null);

  const downloadDeliveryNote = useCallback(async (deliveryNote) => {
    const id = deliveryNote?.id;
    if (!id) return;

    const key = `dn:${id}`;
    setDownloadingKey(key);
    const loadingId = showLoading("กำลังสร้าง PDF ใบส่งของ…");

    try {
      const blob = await fetchPdf(`${apiConfig.baseUrl}/delivery-notes/${id}/pdf/stream`);
      dismissToast(loadingId);
      openPdfBlob(blob, deliveryNote?.number);
    } catch (err) {
      dismissToast(loadingId);
      showError(err?.message || "ดาวน์โหลด PDF ใบส่งของไม่สำเร็จ");
    } finally {
      setDownloadingKey(null);
    }
  }, []);

  const downloadFromInvoice = useCallback(async (invoice) => {
    const id = invoice?.id;
    if (!id) return;

    const key = `inv:${id}`;
    setDownloadingKey(key);
    const loadingId = showLoading("กำลังสร้าง PDF ใบส่งของจากใบแจ้งหนี้…");

    try {
      const blob = await fetchPdf(`${apiConfig.baseUrl}/invoices/${id}/pdf/delivery-note/stream`);
      dismissToast(loadingId);
      openPdfBlob(blob, invoice?.number_before || invoice?.number);
    } catch (err) {
      dismissToast(loadingId);
      showError(err?.message || "ดาวน์โหลด PDF ใบส่งของไม่สำเร็จ");
    } finally {
      setDownloadingKey(null);
    }
  }, []);

  // `downloadingId` keeps the MenuItem spinner check (`downloadingId === dn.id`)
  // working — only resolve to the bare id when an existing DN record is the
  // download target; ad-hoc invoice downloads use the unrelated `inv:` prefix
  // and so won't accidentally light up a per-DN spinner.
  const downloadingId =
    downloadingKey && downloadingKey.startsWith("dn:") ? downloadingKey.slice(3) : null;

  return {
    downloading: downloadingKey !== null,
    downloadingKey,
    downloadingId,
    downloadDeliveryNote,
    downloadFromInvoice,
  };
};
