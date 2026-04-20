// 📁hooks/useQuotationImageManager.js
import { useState, useCallback, useRef } from "react";

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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [generateQuotationPDF] = useGenerateQuotationPDFMutation();

  // Mutations for image handling
  const [uploadSignatures, { isLoading: isUploadingSignatures }] =
    useUploadQuotationSignaturesMutation();
  const [uploadSampleImages, { isLoading: isUploadingSamples }] =
    useUploadQuotationSampleImagesMutation();
  const [updateQuotation] = useUpdateQuotationMutation();

  // State for image preview
  const [previewImage, setPreviewImage] = useState(null); // {url, filename, idx}

  // Sample image selection for PDF
  const [selectedSampleForPdfLocal, setSelectedSampleForPdfLocal] = useState(new Set());
  const selDebounceRef = useRef(null);
  const lastSyncedSelRef = useRef("");
  const sampleImagesRef = useRef([]);

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

  const scheduleSyncSelectedForPdf = useCallback(
    (newSelectedSet) => {
      if (selDebounceRef.current) {
        clearTimeout(selDebounceRef.current);
      }
      selDebounceRef.current = setTimeout(async () => {
        try {
          // Sort array for consistent key
          const selectedArray = Array.from(newSelectedSet).sort();
          const selectedKey = JSON.stringify(selectedArray);

          // Avoid redundant sync if nothing changed
          if (lastSyncedSelRef.current === selectedKey) return;

          const current = sampleImagesRef.current || [];
          const updated = current.map((it) => ({
            ...it,
            // Mark as selected if its filename is in the new set
            selected_for_pdf: it.filename ? newSelectedSet.has(it.filename) : false,
          }));

          await updateQuotation({ id: quotationId, sample_images: updated }).unwrap();
          lastSyncedSelRef.current = selectedKey; // Store the new synced state
        } catch {
          // keep local state; server will eventually refresh
        }
      }, 250);
    },
    [updateQuotation, quotationId]
  );

  const initializeSampleSelection = useCallback((sampleImages) => {
    sampleImagesRef.current = sampleImages;
    // Filter all selected images and put their filenames into the Set
    const initialSet = new Set(
      sampleImages
        .filter((it) => !!it.selected_for_pdf)
        .map((it) => it.filename || "")
        .filter(Boolean)
    );
    setSelectedSampleForPdfLocal(initialSet);
    // Store sorted array as JSON string for comparison
    lastSyncedSelRef.current = JSON.stringify(Array.from(initialSet).sort());
  }, []);

  const updateSampleSelection = useCallback((sampleImages) => {
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
