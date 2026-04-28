import { Add as AddIcon } from "@mui/icons-material";
import { Avatar, Box, Grid, Typography } from "@mui/material";

import { apiConfig } from "../../../../../../api/apiConfig";
import ImageUploadGrid from "../../../../shared/components/ImageUploadGrid";
import {
  InfoCard,
  Section,
  SectionHeader,
  SecondaryButton,
  tokens,
} from "../../../../shared/styles/quotationFormStyles";
import { showError } from "../../../../utils/accountingToast";
import { resolveSignatureImageUrl } from "../utils/signatureImageUrl";

const MAX_PDF_SAMPLE_IMAGES = 3;

// Sample images (max 3 selectable for PDF) + optional signature evidence (when approved).
const SampleImagesSection = ({
  status,
  sampleImages,
  signatureImages,
  imageManager,
  canUploadSampleImages,
  canUploadSignatures,
}) => {
  const handleToggleSample = (img) => {
    if (!canUploadSampleImages) return;
    const value = img.filename || "";
    if (!value) return;

    const newSet = new Set(imageManager.selectedSampleForPdfLocal);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      if (newSet.size >= MAX_PDF_SAMPLE_IMAGES) {
        showError(`คุณสามารถเลือกรูปภาพได้สูงสุด ${MAX_PDF_SAMPLE_IMAGES} รูปเท่านั้น`);
        return;
      }
      newSet.add(value);
    }

    imageManager.setSelectedSampleForPdfLocal(newSet);
    imageManager.scheduleSyncSelectedForPdf(newSet);
  };

  return (
    <>
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
              ไฟล์จะถูกแทรกลงใน PDF ใบเสนอราคา
            </Typography>
          </Box>
        </SectionHeader>
        <Box sx={{ p: 2 }}>
          <ImageUploadGrid
            title="รูปภาพตัวอย่าง"
            images={sampleImages}
            disabled={imageManager.isUploadingSamples || !canUploadSampleImages}
            onUpload={imageManager.handleUploadSamples}
            helperText="รองรับ JPG/PNG สูงสุด 5MB ต่อไฟล์"
          />
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              เลือกรูปแสดงบน PDF (สูงสุด {MAX_PDF_SAMPLE_IMAGES} รูป)
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
              {(sampleImages || []).map((img) => {
                const value = img.filename || "";
                const src = img.url || "";
                const checked = imageManager.selectedSampleForPdfLocal.has(value);
                return (
                  <label
                    key={value || src}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      border: checked ? `2px solid ${tokens.primary}` : "1px solid #ddd",
                      padding: 6,
                      borderRadius: 6,
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!canUploadSampleImages}
                      onChange={() => handleToggleSample(img)}
                      style={{ margin: 0 }}
                    />
                    {src ? (
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
                    ) : null}
                  </label>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Section>

      {status === "approved" && (
        <Grid item xs={12}>
          <Section>
            <SectionHeader>
              <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
                S
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  หลักฐานการเซ็น / Signed Evidence
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ไฟล์รูปภาพที่ยืนยันการเซ็นใบเสนอราคา
                </Typography>
              </Box>
            </SectionHeader>
            <Box sx={{ p: 2 }}>
              {signatureImages.length === 0 && (
                <InfoCard sx={{ p: 2, textAlign: "center", mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    ยังไม่มีรูปหลักฐานการเซ็น
                  </Typography>
                </InfoCard>
              )}
              {signatureImages.length > 0 && (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {signatureImages.map((img, idx) => {
                    const finalUrl = resolveSignatureImageUrl(img, apiConfig.baseUrl || "");
                    return (
                      <Grid item key={idx} xs={6} md={3}>
                        <Box
                          sx={{
                            border: "1px solid " + tokens.border,
                            borderRadius: 1,
                            p: 1,
                            bgcolor: "#fff",
                            cursor: "pointer",
                            position: "relative",
                          }}
                          onClick={() =>
                            imageManager.setPreviewImage({
                              url: finalUrl,
                              filename: img.original_filename || img.filename,
                              idx,
                            })
                          }
                        >
                          <Box
                            sx={{
                              position: "relative",
                              pb: "70%",
                              overflow: "hidden",
                              borderRadius: 1,
                              mb: 1,
                              background: "#fafafa",
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
              {canUploadSignatures && (
                <Box>
                  <SecondaryButton component="label" disabled={imageManager.isUploadingSignatures}>
                    {imageManager.isUploadingSignatures
                      ? "กำลังอัปโหลด…"
                      : "อัปโหลดรูปหลักฐานการเซ็น"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={imageManager.handleUploadSignatures}
                    />
                  </SecondaryButton>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    รองรับ JPG / PNG สูงสุด 5MB ต่อไฟล์
                  </Typography>
                </Box>
              )}
            </Box>
          </Section>
        </Grid>
      )}
    </>
  );
};

export default SampleImagesSection;
