// 📁hooks/useQuotationImageManager.js
import React from "react";

import {
  useGenerateQuotationPDFMutation,
  useUploadQuotationSignaturesMutation,
  useUploadQuotationSampleImagesMutation,
  useUpdateQuotationMutation,
} from "../../../../../../features/Accounting/accountingApi";
import {
  showSuccess,
  showError,
  showLoading,
  dismissToast,
} from "../../../../utils/accountingToast";

export function useQuotationImageManager(quotationId, isEditing, handleSave) {
  // State for PDF Generation
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [pdfUrl, setPdfUrl] = React.useState("");
  const [showPdfViewer, setShowPdfViewer] = React.useState(false);
  const [generateQuotationPDF] = useGenerateQuotationPDFMutation();

  // Mutations for image handling
  const [uploadSignatures, { isLoading: isUploadingSignatures }] =
    useUploadQuotationSignaturesMutation();
  const [uploadSampleImages, { isLoading: isUploadingSamples }] =
    useUploadQuotationSampleImagesMutation();
  const [updateQuotation] = useUpdateQuotationMutation();

  // State for image preview
  const [previewImage, setPreviewImage] = React.useState(null); // {url, filename, idx}

  // Sample image selection for PDF
  const [selectedSampleForPdfLocal, setSelectedSampleForPdfLocal] = React.useState(null);
  const selDebounceRef = React.useRef(null);
  const lastSyncedSelRef = React.useRef("");
  const sampleImagesRef = React.useRef([]);

  const handlePreviewPdf = async (quotationStatus) => {
    if (!quotationId) return;
    // If editing, ask to save changes first so PDF reflects latest data
    if (isEditing) {
      const confirmSave = window.confirm("คุณกำลังแก้ไขข้อมูล ต้องการบันทึกก่อนสร้าง PDF หรือไม่?");
      if (confirmSave) {
        const saveSuccess = await handleSave();
        if (!saveSuccess) return;
      }
    }
    await generatePdf(quotationStatus);
  };

  const generatePdf = async (quotationStatus) => {
    setIsGeneratingPdf(true);
    const loadingId = showLoading("กำลังสร้าง PDF ใบเสนอราคา…");
    try {
      // Request mPDF with preview watermark if not final
      const isFinal = ["approved", "sent", "completed"].includes(String(quotationStatus || ""));
      const res = await generateQuotationPDF({
        id: quotationId,
        format: "A4",
        orientation: "P",
        showWatermark: !isFinal,
      }).unwrap();

      const dataObj = res?.data || res; // support either wrapped or direct
      const url = dataObj?.pdf_url || dataObj?.url;
      if (!url) throw new Error("ไม่พบลิงก์ไฟล์ PDF");

      setPdfUrl(url);
      setShowPdfViewer(true);

      const engine = (dataObj?.engine || "").toLowerCase();
      if (engine === "fpdf") {
        showError("ระบบใช้ FPDF (fallback) ชั่วคราว เนื่องจาก mPDF ไม่พร้อมใช้งาน");
      } else {
        showSuccess("PDF สร้างด้วย mPDF สำเร็จ");
      }
      dismissToast(loadingId);
    } catch (e) {
      dismissToast(loadingId);
      const msg = e?.data?.message || e?.message || "ไม่สามารถสร้าง PDF ได้";
      showError(msg);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleUploadSignatures = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const loadingId = showLoading("กำลังอัปโหลดหลักฐานการเซ็น…");
      await uploadSignatures({ id: quotationId, files }).unwrap();
      dismissToast(loadingId);
      showSuccess("อัปโหลดสำเร็จ");
    } catch (err) {
      showError(err?.data?.message || err?.message || "อัปโหลดไม่สำเร็จ");
    } finally {
      e.target.value = "";
    }
  };

  const handleUploadSamples = async (files) => {
    try {
      await uploadSampleImages({ id: quotationId, files }).unwrap();
      // RTK invalidates Quotation tag; UI will refresh from server
    } catch (err) {
      showError(err?.data?.message || err?.message || "อัปโหลดรูปตัวอย่างไม่สำเร็จ");
    }
  };

  const scheduleSyncSelectedForPdf = React.useCallback(
    (value) => {
      if (selDebounceRef.current) {
        clearTimeout(selDebounceRef.current);
      }
      selDebounceRef.current = setTimeout(async () => {
        try {
          // Avoid redundant sync if nothing changed
          if (lastSyncedSelRef.current === value) return;
          const current = sampleImagesRef.current || [];
          const updated = current.map((it) => ({
            ...it,
            selected_for_pdf: value ? (it.filename || "") === value : false,
          }));
          await updateQuotation({ id: quotationId, sample_images: updated }).unwrap();
          lastSyncedSelRef.current = value;
        } catch {
          // keep local state; server will eventually refresh
        }
      }, 250);
    },
    [updateQuotation, quotationId]
  );

  const initializeSampleSelection = React.useCallback((sampleImages) => {
    sampleImagesRef.current = sampleImages;
    const initial = sampleImages.find?.((it) => !!it.selected_for_pdf)?.filename || "";
    setSelectedSampleForPdfLocal(initial);
    lastSyncedSelRef.current = initial;
  }, []);

  const updateSampleSelection = React.useCallback((sampleImages) => {
    sampleImagesRef.current = sampleImages;
  }, []);

  return {
    // PDF Generation
    isGeneratingPdf,
    pdfUrl,
    showPdfViewer,
    setShowPdfViewer,
    handlePreviewPdf,

    // Image Upload States
    isUploadingSignatures,
    isUploadingSamples,

    // Image Handlers
    handleUploadSignatures,
    handleUploadSamples,

    // Preview
    previewImage,
    setPreviewImage,

    // Sample Selection
    selectedSampleForPdfLocal,
    setSelectedSampleForPdfLocal,
    scheduleSyncSelectedForPdf,
    initializeSampleSelection,
    updateSampleSelection,
  };
}
