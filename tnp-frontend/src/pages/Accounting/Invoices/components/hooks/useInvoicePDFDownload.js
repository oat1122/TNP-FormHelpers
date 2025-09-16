/**
 * Custom hook for PDF download functionality with multi-header support
 */

import { useState } from 'react';
import { headerOptions } from '../utils/invoiceFormatters';

export const useInvoicePDFDownload = (invoice, onDownloadPDF) => {
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const [selectedHeaders, setSelectedHeaders] = useState(() => {
    // default select current header type if not ต้นฉบับ
    const base = ['ต้นฉบับ'];
    if (invoice?.document_header_type && !base.includes(invoice.document_header_type)) {
      base.push(invoice.document_header_type);
    }
    return base;
  });

  const extendedHeaderOptions = [
    ...headerOptions,
    ...(invoice?.document_header_type && !headerOptions.includes(invoice.document_header_type)
      ? [invoice.document_header_type] : [])
  ];

  const toggleHeader = (h) => {
    setSelectedHeaders(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);
  };

  const handleDownloadClick = (e) => {
    if (!onDownloadPDF) return;
    setDownloadAnchorEl(e.currentTarget);
  };

  const handleCloseMenu = () => setDownloadAnchorEl(null);

  const handleConfirmDownload = () => {
    handleCloseMenu();
    if (onDownloadPDF) {
      onDownloadPDF({ invoiceId: invoice?.id, headerTypes: selectedHeaders });
    }
  };

  return {
    downloadAnchorEl,
    selectedHeaders,
    extendedHeaderOptions,
    toggleHeader,
    handleDownloadClick,
    handleCloseMenu,
    handleConfirmDownload
  };
};