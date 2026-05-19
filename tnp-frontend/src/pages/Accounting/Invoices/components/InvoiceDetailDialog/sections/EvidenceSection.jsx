import { Badge as BadgeIcon } from "@mui/icons-material";
import { Avatar, Box, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { apiConfig } from "../../../../../../api/apiConfig";
import { useUploadInvoiceEvidenceMutation } from "../../../../../../features/Accounting/accountingApi";
import {
  InfoCard,
  Section,
  SectionHeader,
  SecondaryButton,
  tokens,
} from "../../../../PricingIntegration/components/styles/quotationFormStyles";
import { ALLOWED_EVIDENCE_MIMES, validateFiles } from "../../../../shared/utils/fileValidation";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "../../../../utils/accountingToast";

const UPLOAD_ROLES = ["admin", "account", "sale"];

// Resolve absolute URL for an evidence filename. Files are stored under
// `storage/images/invoices/evidence/` by the backend MediaService.
const resolveEvidenceUrl = (filename, apiBaseUrl) => {
  if (!filename) return "";
  if (/^https?:/i.test(filename)) return filename;
  let origin = "";
  try {
    origin = new URL(apiBaseUrl).origin;
  } catch {
    origin = String(apiBaseUrl || "").replace(/\/api\b.*$/, "");
  }
  return `${origin}/storage/images/invoices/evidence/${filename}`;
};

// Normalize evidence_files into a { before: string[], after: string[] } shape.
// The backend stores it as JSON with the same shape, but defensively handle nulls.
const normalizeEvidence = (raw) => {
  const out = { before: [], after: [] };
  if (!raw || typeof raw !== "object") return out;
  if (Array.isArray(raw.before)) out.before = raw.before.filter(Boolean);
  if (Array.isArray(raw.after)) out.after = raw.after.filter(Boolean);
  return out;
};

const MODE_LABELS = {
  before: { title: "หลักฐานการชำระเงิน (มัดจำก่อน)", subtitle: "อัปโหลดหลักฐานสำหรับยอดมัดจำก่อน" },
  after: { title: "หลักฐานการชำระเงิน (มัดจำหลัง)", subtitle: "อัปโหลดหลักฐานสำหรับยอดคงเหลือ" },
};

const EvidenceBucket = ({ mode, filenames, canUpload, isUploading, onUpload, storageBase }) => {
  const meta = MODE_LABELS[mode];

  return (
    <Grid item xs={12}>
      <Section>
        <SectionHeader>
          <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
            <BadgeIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {meta.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {meta.subtitle}
            </Typography>
          </Box>
        </SectionHeader>

        <Box sx={{ p: 2 }}>
          {filenames.length === 0 ? (
            <InfoCard sx={{ p: 2, textAlign: "center", mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                ยังไม่มีหลักฐาน
              </Typography>
            </InfoCard>
          ) : (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {filenames.map((filename, idx) => {
                const url = resolveEvidenceUrl(filename, storageBase);
                return (
                  <Grid item key={`${mode}-${filename || idx}`} xs={6} md={3}>
                    <Box
                      sx={{
                        border: `1px solid ${tokens.border}`,
                        borderRadius: 1,
                        p: 1,
                        bgcolor: tokens.white,
                      }}
                    >
                      <Box
                        component="a"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          position: "relative",
                          display: "block",
                          pb: "70%",
                          overflow: "hidden",
                          borderRadius: 1,
                          mb: 1,
                          background: tokens.bgAlt,
                          cursor: "pointer",
                        }}
                      >
                        <img
                          src={url}
                          alt={filename}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ display: "block", wordBreak: "break-all" }}
                      >
                        {filename}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {canUpload ? (
            <Box>
              <SecondaryButton component="label" disabled={isUploading}>
                {isUploading ? "กำลังอัปโหลด…" : "อัปโหลดหลักฐาน"}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  hidden
                  onChange={onUpload}
                />
              </SecondaryButton>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                รองรับ JPG / PNG / PDF สูงสุด 5MB ต่อไฟล์
              </Typography>
            </Box>
          ) : null}
        </Box>
      </Section>
    </Grid>
  );
};

/**
 * Evidence upload section for InvoiceDetailDialog.
 *
 * Uploads through the existing `POST /invoices/{id}/evidence/{mode}` endpoint
 * which persists filenames into the `evidence_files` JSON column shaped as
 * `{ before: string[], after: string[] }`. Two buckets are rendered — one per
 * deposit side — mirroring how the backend stores them.
 *
 * Role gate: admin / account / sale can upload. View mode (readOnly) hides
 * the upload controls regardless of role.
 */
const EvidenceSection = ({ invoice, currentUserRole, readOnly = false, onUploaded }) => {
  const invoiceId = invoice?.id;
  const [uploadEvidence, { isLoading: isUploadingMutation }] = useUploadInvoiceEvidenceMutation();
  const [activeMode, setActiveMode] = useState(null);

  // Local snapshot of evidence_files — sync from prop, but optimistic-update
  // after a successful upload so the gallery refreshes before the parent refetch.
  const [localEvidence, setLocalEvidence] = useState(() =>
    normalizeEvidence(invoice?.evidence_files)
  );
  useEffect(() => {
    setLocalEvidence(normalizeEvidence(invoice?.evidence_files));
  }, [invoice?.evidence_files]);

  const role = String(currentUserRole || "").toLowerCase();
  const canUpload = !readOnly && !!invoiceId && UPLOAD_ROLES.includes(role);

  const handleUpload = (mode) => async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const { valid, validFiles, errors } = validateFiles(files, {
      allowedMimes: ALLOWED_EVIDENCE_MIMES,
    });
    if (!valid) {
      errors.forEach((msg) => showError(msg));
      e.target.value = "";
      if (!validFiles.length) return;
    }

    setActiveMode(mode);
    const loadingId = showLoading(
      `กำลังอัปโหลดหลักฐาน (${mode === "before" ? "มัดจำก่อน" : "มัดจำหลัง"})…`
    );
    try {
      const res = await uploadEvidence({ id: invoiceId, files: validFiles, mode }).unwrap();
      const updated = normalizeEvidence(res?.data?.evidence_files || res?.evidence_files);
      setLocalEvidence(updated);
      dismissToast(loadingId);
      showSuccess("อัปโหลดหลักฐานเรียบร้อย");
      onUploaded?.(updated);
    } catch (err) {
      dismissToast(loadingId);
      showError(err?.data?.message || err?.message || "อัปโหลดไม่สำเร็จ");
    } finally {
      setActiveMode(null);
      e.target.value = "";
    }
  };

  return (
    <>
      <EvidenceBucket
        mode="before"
        filenames={localEvidence.before}
        canUpload={canUpload}
        isUploading={isUploadingMutation && activeMode === "before"}
        onUpload={handleUpload("before")}
        storageBase={apiConfig.baseUrl || ""}
      />
      <EvidenceBucket
        mode="after"
        filenames={localEvidence.after}
        canUpload={canUpload}
        isUploading={isUploadingMutation && activeMode === "after"}
        onUpload={handleUpload("after")}
        storageBase={apiConfig.baseUrl || ""}
      />
    </>
  );
};

export default EvidenceSection;
