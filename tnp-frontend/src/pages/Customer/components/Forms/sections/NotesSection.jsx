/**
 * NotesSection.jsx - Customer notes and remarks
 *
 * Used in:
 * - AdditionalInfoTab (DialogForm)
 * - TelesalesQuickCreateForm
 *
 * Features:
 * - Visual Grouping with Paper wrapper
 * - Collapsible notes section
 *
 * @module Forms/sections/NotesSection
 */
import React, { useState } from "react";
import { Box, Stack, Paper, Collapse, Button, Chip } from "@mui/material";
import { MdNote, MdExpandMore, MdExpandLess, MdCheckCircle } from "react-icons/md";

// Shared UI Primitives
import { StyledTextField, FORM_THEME } from "../ui/FormFields";
import { SectionHeader } from "../ui/SectionHeader";

const PRIMARY_RED = FORM_THEME.PRIMARY_RED;

/**
 * Check if notes section has any data
 */
const hasNotesData = (inputList) => {
  return !!(inputList.cd_note || inputList.cd_remark);
};

/**
 * NotesSection - บันทึกและหมายเหตุ
 *
 * @param {object} inputList - Form data object
 * @param {object} errors - Validation errors
 * @param {function} handleInputChange - Input change handler
 * @param {string} mode - "create" | "edit" | "view"
 * @param {boolean} showHeader - Whether to show section header (default: true)
 * @param {boolean} showRemark - Whether to show remark field (default: true)
 * @param {boolean} collapsible - Enable progressive disclosure (default: true)
 */
export const NotesSection = ({
  inputList = {},
  errors = {},
  handleInputChange,
  mode = "create",
  showHeader = true,
  showRemark = true,
  collapsible = true,
}) => {
  const hasData = hasNotesData(inputList);
  const [expanded, setExpanded] = useState(mode !== "create" || hasData);

  // Get preview of note for collapsed state
  const notePreview = inputList.cd_note
    ? inputList.cd_note.substring(0, 50) + (inputList.cd_note.length > 50 ? "..." : "")
    : "";

  return (
    <Box>
      {showHeader && (
        <SectionHeader
          icon={MdNote}
          title="บันทึกและหมายเหตุ"
          subtitle="ข้อมูลเพิ่มเติมสำหรับการดูแลลูกค้า"
          optional
        />
      )}

      {/* Progressive Disclosure Toggle */}
      {collapsible && mode !== "view" && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="text"
            size="small"
            onClick={() => setExpanded(!expanded)}
            startIcon={expanded ? <MdExpandLess /> : <MdExpandMore />}
            endIcon={hasData ? <MdCheckCircle color="#4caf50" /> : null}
            sx={{
              color: PRIMARY_RED,
              fontFamily: "Kanit",
              textTransform: "none",
            }}
          >
            {expanded ? "ซ่อนหมายเหตุ" : "เพิ่มหมายเหตุ"}
          </Button>

          {!expanded && hasData && notePreview && (
            <Chip
              label={notePreview}
              size="small"
              variant="outlined"
              sx={{ ml: 1, fontFamily: "Kanit", maxWidth: 250 }}
            />
          )}
        </Box>
      )}

      <Collapse in={expanded || mode === "view"} timeout="auto">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            bgcolor: "#fefefe",
            borderRadius: 2,
            border: "1px solid #e8e8e8",
          }}
        >
          <Stack spacing={2.5}>
            <StyledTextField
              mode={mode}
              name="cd_note"
              label="หมายเหตุ"
              value={inputList.cd_note || ""}
              onChange={handleInputChange}
              error={!!errors.cd_note}
              helperText={errors.cd_note}
              placeholder="เช่น ลูกค้าใหม่, ต้องการสินค้าคุณภาพดี"
              multiline
              rows={2}
            />

            {showRemark && (
              <StyledTextField
                mode={mode}
                name="cd_remark"
                label="ข้อมูลเพิ่มเติม"
                value={inputList.cd_remark || ""}
                onChange={handleInputChange}
                error={!!errors.cd_remark}
                helperText={errors.cd_remark}
                placeholder="เช่น วันเวลาที่เหมาะแก่การติดต่อ"
                multiline
                rows={2}
              />
            )}
          </Stack>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default NotesSection;
