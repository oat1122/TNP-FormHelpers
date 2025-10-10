/**
 * Custom hook for Delivery Note PDF download functionality with multi-header support
 * Based on Invoice PDF Download pattern
 */

import { useState } from "react";

// Header type options for delivery notes
export const headerOptions = ["ต้นฉบับ", "สำเนา", "สำเนา-ลูกค้า"];

export const useDeliveryNotePDFDownload = (deliveryNote, onDownloadPDF, onPreviewPDF) => {
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const [selectedHeaders, setSelectedHeaders] = useState(() => {
    // Default to "ต้นฉบับ"
    return ["ต้นฉบับ"];
  });

  const toggleHeader = (header) => {
    setSelectedHeaders((prev) =>
      prev.includes(header) ? prev.filter((h) => h !== header) : [...prev, header]
    );
  };

  const handleDownloadClick = (e) => {
    if (!onDownloadPDF) return;
    setDownloadAnchorEl(e.currentTarget);
  };

  const handlePreviewClick = () => {
    if (onPreviewPDF) {
      onPreviewPDF({
        deliveryNoteId: deliveryNote?.id,
        headerType: selectedHeaders[0] || "ต้นฉบับ",
      });
    }
  };

  const handleCloseMenu = () => setDownloadAnchorEl(null);

  const handleConfirmDownload = () => {
    handleCloseMenu();
    if (onDownloadPDF) {
      onDownloadPDF({
        deliveryNoteId: deliveryNote?.id,
        headerTypes: selectedHeaders,
      });
    }
  };

  return {
    downloadAnchorEl,
    selectedHeaders,
    headerOptions,
    toggleHeader,
    handleDownloadClick,
    handlePreviewClick,
    handleCloseMenu,
    handleConfirmDownload,
  };
};
