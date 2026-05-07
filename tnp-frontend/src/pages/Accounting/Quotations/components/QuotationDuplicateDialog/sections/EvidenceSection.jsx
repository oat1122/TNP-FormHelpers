import { Add as AddIcon, Badge as BadgeIcon } from "@mui/icons-material";
import { Avatar, Box, Grid, Typography } from "@mui/material";
import { useMemo, useState } from "react";

import { apiConfig } from "../../../../../../api/apiConfig";
import {
  useUpdateQuotationMutation,
  useUploadQuotationSampleImagesMutation,
  useUploadQuotationSignaturesMutation,
} from "../../../../../../features/Accounting/accountingApi";
import {
  InfoCard,
  Section,
  SectionHeader,
  SecondaryButton,
  tokens,
} from "../../../../shared/styles/quotationFormStyles";
import {
  showSuccess,
  showError,
  showLoading,
  dismissToast,
} from "../../../../utils/accountingToast";
import { resolveSignatureImageUrl } from "../../QuotationDetailDialog/utils/signatureImageUrl";

const UPLOAD_ROLES = ["admin", "account", "sales"];
const MAX_PDF_SAMPLE_IMAGES = 3;

/**
 * Evidence + sample-images section for QuotationDuplicateDialog (edit mode only).
 *
 * Two sub-sections:
 *  1. หลักฐานการเซ็น — required before invoice creation
 *  2. รูปภาพตัวอย่าง — uploaded sample images + checkbox grid to pick max 3 for PDF
 *     (PDF template at quotation-master.blade.php filters `selected_for_pdf`)
 *
 * Role gate: admin / account / sales can upload (mirrors backend permission).
 */
const EvidenceSection = ({
  quotationId,
  signatureImages = [],
  sampleImages = [],
  currentUserRole,
  onUploaded,
}) => {
  const [uploadSignatures, { isLoading: isUploadingSig }] = useUploadQuotationSignaturesMutation();
  const [uploadSampleImages, { isLoading: isUploadingSample }] =
    useUploadQuotationSampleImagesMutation();
  const [updateQuotation] = useUpdateQuotationMutation();

  const role = String(currentUserRole || "").toLowerCase();
  const canUpload = !!quotationId && UPLOAD_ROLES.includes(role);

  // Local state (initial-value-only — prop is the snapshot at dialog open).
  // Upload mutation responses + checkbox toggles update `localSamples` directly;
  // we deliberately do NOT re-sync from prop, because the parent's editData
  // refetch can race with the optimistic update and overwrite the new image.
  // Dialog unmounts on close so re-open re-initializes from fresh prop.
  const [localSignatures, setLocalSignatures] = useState(signatureImages);
  const [localSamples, setLocalSamples] = useState(sampleImages);

  // PDF-selected sample image set (filename → boolean)
  const selectedForPdf = useMemo(() => {
    const set = new Set();
    localSamples.forEach((it) => {
      if (it?.selected_for_pdf && it.filename) set.add(it.filename);
    });
    return set;
  }, [localSamples]);

  const handleUploadSignatures = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const loadingId = showLoading("กำลังอัปโหลดหลักฐานการเซ็น…");
    try {
      const res = await uploadSignatures({ id: quotationId, files }).unwrap();
      const updated = res?.data?.signature_images || res?.signature_images;
      if (Array.isArray(updated)) setLocalSignatures(updated);
      dismissToast(loadingId);
      showSuccess("อัปโหลดหลักฐานการเซ็นเรียบร้อย");
      onUploaded?.({ signatures: updated });
    } catch (err) {
      dismissToast(loadingId);
      showError(err?.data?.message || err?.message || "อัปโหลดไม่สำเร็จ");
    } finally {
      e.target.value = "";
    }
  };

  const handleUploadSamples = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const loadingId = showLoading("กำลังอัปโหลดรูปภาพตัวอย่าง…");
    try {
      const res = await uploadSampleImages({ id: quotationId, files }).unwrap();
      const updated = res?.data?.sample_images || res?.sample_images;
      if (Array.isArray(updated)) setLocalSamples(updated);
      dismissToast(loadingId);
      showSuccess("อัปโหลดรูปภาพตัวอย่างเรียบร้อย");
      onUploaded?.({ samples: updated });
    } catch (err) {
      dismissToast(loadingId);
      showError(err?.data?.message || err?.message || "อัปโหลดไม่สำเร็จ");
    } finally {
      e.target.value = "";
    }
  };

  const handleToggleSamplePdf = async (filename) => {
    if (!canUpload || !filename) return;
    const next = new Set(selectedForPdf);
    if (next.has(filename)) {
      next.delete(filename);
    } else {
      if (next.size >= MAX_PDF_SAMPLE_IMAGES) {
        showError(`เลือกได้สูงสุด ${MAX_PDF_SAMPLE_IMAGES} รูปเท่านั้น`);
        return;
      }
      next.add(filename);
    }
    const updated = localSamples.map((it) => ({
      ...it,
      selected_for_pdf: it.filename ? next.has(it.filename) : false,
    }));
    setLocalSamples(updated); // optimistic
    try {
      await updateQuotation({ id: quotationId, sample_images: updated }).unwrap();
    } catch (err) {
      showError(err?.data?.message || err?.message || "บันทึกไม่สำเร็จ");
    }
  };

  return (
    <>
      {/* ───── Signature evidence (required before invoice) ───── */}
      <Grid item xs={12}>
        <Section>
          <SectionHeader>
            <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
              <BadgeIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                หลักฐานการเซ็น
              </Typography>
              <Typography variant="caption" color="text.secondary">
                อัปโหลดรูปหลักฐานการเซ็นของลูกค้า — จำเป็นต้องมีก่อนสร้างใบแจ้งหนี้
              </Typography>
            </Box>
          </SectionHeader>

          <Box sx={{ p: 2 }}>
            {localSignatures.length === 0 ? (
              <InfoCard sx={{ p: 2, textAlign: "center", mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  ยังไม่มีรูปหลักฐานการเซ็น
                </Typography>
              </InfoCard>
            ) : (
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {localSignatures.map((img, idx) => {
                  const finalUrl = resolveSignatureImageUrl(img, apiConfig.baseUrl || "");
                  return (
                    <Grid item key={idx} xs={6} md={3}>
                      <Box
                        sx={{
                          border: `1px solid ${tokens.border}`,
                          borderRadius: 1,
                          p: 1,
                          bgcolor: tokens.white,
                        }}
                      >
                        <Box
                          sx={{
                            position: "relative",
                            pb: "70%",
                            overflow: "hidden",
                            borderRadius: 1,
                            mb: 1,
                            background: tokens.bgAlt,
                          }}
                        >
                          <img
                            src={finalUrl}
                            alt={img.filename}
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
                          {img.original_filename || img.filename}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {canUpload ? (
              <Box>
                <SecondaryButton component="label" disabled={isUploadingSig}>
                  {isUploadingSig ? "กำลังอัปโหลด…" : "อัปโหลดรูปหลักฐานการเซ็น"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleUploadSignatures}
                  />
                </SecondaryButton>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  รองรับ JPG / PNG สูงสุด 5MB ต่อไฟล์
                </Typography>
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary">
                ไม่มีสิทธิ์อัปโหลด — เฉพาะ admin / account / sales
              </Typography>
            )}
          </Box>
        </Section>
      </Grid>

      {/* ───── Sample images (for PDF) ───── */}
      <Grid item xs={12}>
        <Section>
          <SectionHeader>
            <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
              <AddIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                รูปภาพตัวอย่าง
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ไฟล์จะถูกแทรกลงใน PDF ใบเสนอราคา (เลือกได้สูงสุด {MAX_PDF_SAMPLE_IMAGES} รูป)
              </Typography>
            </Box>
          </SectionHeader>

          <Box sx={{ p: 2 }}>
            {/* Upload row */}
            {canUpload && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <SecondaryButton component="label" disabled={isUploadingSample}>
                  {isUploadingSample ? "กำลังอัปโหลด…" : "อัปโหลดรูปภาพ"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleUploadSamples}
                  />
                </SecondaryButton>
                <Typography variant="caption" color="text.secondary">
                  รองรับ JPG / PNG สูงสุด 5MB ต่อไฟล์
                </Typography>
              </Box>
            )}

            {/* Gallery */}
            {localSamples.length === 0 ? (
              <InfoCard sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  ยังไม่มีรูปภาพตัวอย่าง
                </Typography>
              </InfoCard>
            ) : (
              <>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {localSamples.map((img, idx) => {
                    const src = img?.url || resolveSignatureImageUrl(img, apiConfig.baseUrl || "");
                    return (
                      <Grid item key={img.filename || idx} xs={6} md={3}>
                        <Box
                          sx={{
                            border: `1px solid ${tokens.border}`,
                            borderRadius: 1,
                            p: 1,
                            bgcolor: tokens.white,
                          }}
                        >
                          <Box
                            sx={{
                              position: "relative",
                              pb: "70%",
                              overflow: "hidden",
                              borderRadius: 1,
                              mb: 1,
                              background: tokens.bgAlt,
                            }}
                          >
                            <img
                              src={src}
                              alt={img.original_filename || img.filename}
                              draggable="false"
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
                            {img.original_filename || img.filename}
                          </Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* PDF selection picker */}
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    เลือกรูปแสดงบน PDF (สูงสุด {MAX_PDF_SAMPLE_IMAGES} รูป)
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                    {localSamples.map((img) => {
                      const value = img.filename || "";
                      const src =
                        img?.url || resolveSignatureImageUrl(img, apiConfig.baseUrl || "");
                      const checked = selectedForPdf.has(value);
                      return (
                        <Box
                          key={value || src}
                          component="label"
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 1,
                            border: `${checked ? 2 : 1}px solid ${
                              checked ? tokens.primary : tokens.divider
                            }`,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: canUpload ? "pointer" : "default",
                            userSelect: "none",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!canUpload}
                            onChange={() => handleToggleSamplePdf(value)}
                            style={{ margin: 0 }}
                          />
                          <img
                            src={src}
                            alt="sample"
                            style={{
                              width: 50,
                              height: 50,
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </Section>
      </Grid>
    </>
  );
};

export default EvidenceSection;
