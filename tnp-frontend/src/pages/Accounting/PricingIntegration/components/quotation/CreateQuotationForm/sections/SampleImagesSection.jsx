import { Add as AddIcon } from "@mui/icons-material";
import { Avatar, Box, Typography } from "@mui/material";

import ImageUploadGrid from "../../../../../shared/components/ImageUploadGrid";
import { tokens } from "../../../../../shared/styles/tokens";
import { Section, SectionHeader } from "../../../styles/quotationFormStyles";

const SamplePdfRadioPicker = ({ images, selectedFilename, onSelect, onDeselect }) => (
  <Box sx={{ mt: 1 }}>
    <Typography variant="caption" color="text.secondary">
      เลือกรูปแสดงบน PDF (เลือกได้ 1 รูป)
    </Typography>
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
      {(images || []).map((img) => {
        const value = img.filename || "";
        const src = img.url || "";
        const isSelected = (selectedFilename || "") === value;
        return (
          <label
            key={value || src}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: isSelected ? `2px solid ${tokens.primary}` : `1px solid ${tokens.border}`,
              padding: 6,
              borderRadius: 6,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <input
              type="radio"
              name="selectedSample"
              checked={isSelected}
              onClick={(e) => {
                if (isSelected) {
                  e.preventDefault();
                  onDeselect();
                }
              }}
              onChange={() => onSelect(value)}
              style={{ margin: 0 }}
            />
            {src ? (
              <img
                src={src}
                alt="sample"
                style={{ width: 72, height: 72, objectFit: "cover", display: "block" }}
              />
            ) : null}
          </label>
        );
      })}
    </Box>
  </Box>
);

const SampleImagesSection = ({ formData, sampleImages }) => (
  <Section>
    <SectionHeader>
      <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
        <AddIcon fontSize="small" />
      </Avatar>
      <Typography variant="subtitle1" fontWeight={700}>
        รูปภาพตัวอย่าง
      </Typography>
    </SectionHeader>
    <Box sx={{ p: 2 }}>
      <ImageUploadGrid
        title="รูปภาพตัวอย่าง"
        images={formData.sampleImages}
        disabled={sampleImages.isUploadingSamples}
        onUpload={sampleImages.handleUpload}
        helperText="รองรับ JPG/PNG สูงสุด 5MB ต่อไฟล์"
      />
      <SamplePdfRadioPicker
        images={formData.sampleImages}
        selectedFilename={formData.selectedSampleForPdf}
        onSelect={sampleImages.selectForPdf}
        onDeselect={sampleImages.deselectForPdf}
      />
    </Box>
  </Section>
);

export default SampleImagesSection;
