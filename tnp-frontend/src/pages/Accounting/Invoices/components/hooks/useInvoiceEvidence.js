/**
 * Custom hooks for invoice evidence management
 * จัดการอัพโหลดและแสดงหลักฐานการชำระเงิน
 */

import { useState, useEffect } from "react";

import { useUploadInvoiceEvidenceMutation } from "../../../../../features/Accounting/accountingApi";

// Normalize evidence structure to handle corrupted nested data
const normalizeEvidenceStructure = (evidenceData) => {
  const normalized = { before: [], after: [] };

  if (!evidenceData) return normalized;

  // Handle string JSON
  if (typeof evidenceData === "string") {
    try {
      evidenceData = JSON.parse(evidenceData);
    } catch (e) {
      return normalized;
    }
  }

  // Handle array (legacy format)
  if (Array.isArray(evidenceData)) {
    normalized.before = evidenceData.filter(
      (item) => typeof item === "string" && item.includes("inv_")
    );
    return normalized;
  }

  // Handle object with potential nested corruption
  if (typeof evidenceData === "object" && evidenceData !== null) {
    // Extract files recursively from corrupted structure
    const extractFilesFromNested = (data, targetMode) => {
      const files = [];

      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (
            typeof item === "string" &&
            item.includes("inv_") &&
            item.includes(`_${targetMode}_`)
          ) {
            files.push(item);
          } else if (typeof item === "object" && item !== null) {
            files.push(...extractFilesFromNested(item, targetMode));
          }
        });
      } else if (typeof data === "object" && data !== null) {
        Object.entries(data).forEach(([key, value]) => {
          if (
            typeof value === "string" &&
            value.includes("inv_") &&
            value.includes(`_${targetMode}_`)
          ) {
            files.push(value);
          } else if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
            files.push(...extractFilesFromNested(value, targetMode));
          }
        });
      }

      return files;
    };

    // Extract files for both modes
    normalized.before = [...new Set(extractFilesFromNested(evidenceData, "before"))];
    normalized.after = [...new Set(extractFilesFromNested(evidenceData, "after"))];

    // Direct access if structure is clean
    if (evidenceData.before && Array.isArray(evidenceData.before)) {
      normalized.before = [
        ...new Set([
          ...normalized.before,
          ...evidenceData.before.filter((f) => typeof f === "string"),
        ]),
      ];
    }
    if (evidenceData.after && Array.isArray(evidenceData.after)) {
      normalized.after = [
        ...new Set([
          ...normalized.after,
          ...evidenceData.after.filter((f) => typeof f === "string"),
        ]),
      ];
    }
  }

  return normalized;
};

export const useInvoiceEvidence = (invoice) => {
  const [uploadInvoiceEvidence, { isLoading: uploadingEvidence }] =
    useUploadInvoiceEvidenceMutation();

  // เก็บหลักฐานหลังอัพโหลด (optimistic refresh เฉพาะ card นี้) แยกตาม mode
  const [localEvidenceFiles, setLocalEvidenceFiles] = useState({
    before: null, // array ของชื่อไฟล์สำหรับ mode before
    after: null, // array ของชื่อไฟล์สำหรับ mode after
  });

  // สร้าง backend origin จาก VITE_END_POINT_URL เพื่อป้องกัน dev server (5173) ดึง /storage แล้ว 404
  const getBackendOrigin = () => {
    try {
      const apiBase = import.meta.env.VITE_END_POINT_URL || "";
      return new URL(apiBase).origin; // เช่น http://localhost:8000
    } catch (e) {
      return window.location.origin; // fallback
    }
  };

  // แปลง evidence_files แยกตาม mode: { before: [...], after: [...] }
  const getEvidenceForMode = (mode) => {
    const backendOrigin = getBackendOrigin();

    // Check local evidence first
    if (localEvidenceFiles[mode]) {
      return localEvidenceFiles[mode].map((fn) => ({
        url: `${backendOrigin}/storage/images/invoices/evidence/${fn}`,
        filename: fn,
      }));
    }

    // Normalize and extract evidence from corrupted structure
    const normalizedEvidence = normalizeEvidenceStructure(invoice?.evidence_files);

    if (normalizedEvidence[mode] && Array.isArray(normalizedEvidence[mode])) {
      return normalizedEvidence[mode]
        .filter((fn) => typeof fn === "string" && fn.includes("inv_"))
        .map((fn) => ({
          url: `${backendOrigin}/storage/images/invoices/evidence/${fn}`,
          filename: fn,
        }));
    }

    return [];
  };

  // ตรวจสอบว่ามีการอัพโหลดหลักฐานการชำระเงินหรือไม่ (รองรับ mode-specific evidence)
  const hasEvidenceForMode = (mode) => {
    const evidenceFiles = getEvidenceForMode(mode);
    return evidenceFiles.length > 0;
  };

  const hasEvidence = Boolean(
    hasEvidenceForMode("before") ||
      hasEvidenceForMode("after") ||
      invoice?.payment_evidence ||
      invoice?.payment_proof ||
      invoice?.evidence_url ||
      (invoice?.payments &&
        Array.isArray(invoice.payments) &&
        invoice.payments.some((p) => p?.proof_url || p?.attachment || p?.evidence))
  );

  const handleUploadEvidence = async (files, mode = "before") => {
    if (!invoice?.id || !files?.length) return;

    try {
      const res = await uploadInvoiceEvidence({ id: invoice.id, files, mode }).unwrap();
      // ถ้า backend ส่ง evidence_files กลับมา ใช้สำหรับอัพเดตเฉพาะ card นี้ทันที
      if (res && res.evidence_files) {
        if (typeof res.evidence_files === "object" && !Array.isArray(res.evidence_files)) {
          // New structure: { before: [...], after: [...] }
          setLocalEvidenceFiles((prev) => ({
            ...prev,
            [mode]: res.evidence_files[mode] || prev[mode],
          }));
        } else if (Array.isArray(res.evidence_files)) {
          // Legacy structure: assume it's for the current mode
          setLocalEvidenceFiles((prev) => ({
            ...prev,
            [mode]: res.evidence_files,
          }));
        }
      }
      // ถ้าไม่มี ให้พึ่ง parent refetch
      return res;
    } catch (e) {
      console.error("Upload invoice evidence failed", e);
      throw e;
    }
  };

  return {
    getEvidenceForMode,
    hasEvidenceForMode,
    hasEvidence,
    handleUploadEvidence,
    uploadingEvidence,
  };
};
