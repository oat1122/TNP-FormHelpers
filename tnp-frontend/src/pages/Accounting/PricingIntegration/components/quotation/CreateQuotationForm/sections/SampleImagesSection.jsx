import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import { Avatar, Box, Chip, Collapse, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useState } from "react";

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

/**
 * Sample images section (Phase 6 of create-quotation-redesign).
 *
 * Discoverability improvements:
 *   - Image count badge in section header (visible even when collapsed)
 *   - Collapsible body — default expanded only when at least one image exists
 *   - Empty state: header still shows "ยังไม่มีรูป" chip + helper text on expand to invite upload
 */
const SampleImagesSection = ({ formData, sampleImages }) => {
  const images = formData.sampleImages || [];
  const count = images.length;
  const hasImages = count > 0;
  const [expanded, setExpanded] = useState(hasImages);

  return (
    <Section>
      <SectionHeader>
        <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
          <ImageIcon fontSize="small" />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            รูปภาพตัวอย่าง
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={hasImages ? `${count} รูป` : "ยังไม่มีรูป"}
            size="small"
            color={hasImages ? "primary" : "default"}
            variant={hasImages ? "filled" : "outlined"}
            sx={{ fontWeight: 600 }}
          />
          {formData.selectedSampleForPdf && (
            <Chip
              label="เลือกแสดงใน PDF แล้ว"
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
          <Tooltip title={expanded ? "ย่อ" : "ขยาย"}>
            <IconButton size="small" onClick={() => setExpanded((v) => !v)}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Stack>
      </SectionHeader>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ p: 2 }}>
          <ImageUploadGrid
            title="รูปภาพตัวอย่าง"
            images={formData.sampleImages}
            disabled={sampleImages.isUploadingSamples}
            onUpload={sampleImages.handleUpload}
            helperText="รองรับ JPG/PNG สูงสุด 5MB ต่อไฟล์"
          />
          {hasImages && (
            <SamplePdfRadioPicker
              images={formData.sampleImages}
              selectedFilename={formData.selectedSampleForPdf}
              onSelect={sampleImages.selectForPdf}
              onDeselect={sampleImages.deselectForPdf}
            />
          )}
        </Box>
      </Collapse>
    </Section>
  );
};

export default SampleImagesSection;
