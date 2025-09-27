import React from "react";
import { Box, Typography, Avatar, Button, CircularProgress } from "@mui/material";
import { PictureAsPdf as PdfIcon, Visibility as VisibilityIcon } from "@mui/icons-material";
import {
  Section,
  SectionHeader,
  SecondaryButton,
  tokens,
} from "../../PricingIntegration/components/quotation/styles/quotationTheme";

/**
 * ActionsSection (Shared Component)
 * Standard action buttons for documents (View PDF, Download, etc.)
 */
const ActionsSection = ({
  title = "การดำเนินการ",
  onPreviewPdf,
  onDownloadPdf,
  onEdit,
  onSave,
  onCancel,
  isEditing = false,
  isSaving = false,
  isGeneratingPdf = false,
  showEditButton = true,
  additionalActions = [],
  children,
}) => {
  return (
    <Section>
      <SectionHeader>
        <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
          <PdfIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ดาวน์โหลด PDF และการจัดการเอกสาร
          </Typography>
        </Box>
      </SectionHeader>
      <Box sx={{ p: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          {/* PDF Actions */}
          {onPreviewPdf && (
            <SecondaryButton
              startIcon={isGeneratingPdf ? <CircularProgress size={16} /> : <VisibilityIcon />}
              onClick={onPreviewPdf}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? "กำลังสร้าง…" : "ดูตัวอย่าง PDF"}
            </SecondaryButton>
          )}

          {onDownloadPdf && (
            <SecondaryButton
              startIcon={<PdfIcon />}
              onClick={onDownloadPdf}
              disabled={isGeneratingPdf}
            >
              ดาวน์โหลด PDF
            </SecondaryButton>
          )}

          {/* Edit Actions */}
          {isEditing ? (
            <>
              {onSave && (
                <SecondaryButton variant="contained" onClick={onSave} disabled={isSaving}>
                  {isSaving ? "กำลังบันทึก…" : "บันทึก"}
                </SecondaryButton>
              )}
              {onCancel && <SecondaryButton onClick={onCancel}>ยกเลิก</SecondaryButton>}
            </>
          ) : (
            showEditButton && onEdit && <SecondaryButton onClick={onEdit}>แก้ไข</SecondaryButton>
          )}

          {/* Additional custom actions */}
          {additionalActions.map((action, index) => (
            <SecondaryButton
              key={index}
              startIcon={action.icon}
              onClick={action.onClick}
              disabled={action.disabled}
              color={action.color}
              variant={action.variant}
            >
              {action.label}
            </SecondaryButton>
          ))}
        </Box>

        {/* Custom content */}
        {children}
      </Box>
    </Section>
  );
};

export default ActionsSection;
