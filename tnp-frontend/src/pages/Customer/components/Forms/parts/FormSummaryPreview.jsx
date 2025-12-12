import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import React from "react";
import {
  MdExpandMore,
  MdPreview,
  MdBusiness,
  MdPerson,
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdSupervisorAccount,
} from "react-icons/md";

// สี theme ของบริษัท
const PRIMARY_RED = "#9e0000";
const SECONDARY_RED = "#d32f2f";

/**
 * FormSummaryPreview - Real-time summary of filled form data
 * Shows a collapsible preview of all entered information
 */
const FormSummaryPreview = ({ inputList = {}, mode = "create" }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Helper to check if a field has value
  const hasValue = (field) => {
    if (field === null || field === undefined) return false;
    if (typeof field === "string") return field.trim() !== "";
    if (typeof field === "object") return Object.keys(field).length > 0;
    return true;
  };

  // Count filled fields
  const countFilledFields = () => {
    const essentialFields = [
      "cus_bt_id",
      "cus_company",
      "cus_firstname",
      "cus_lastname",
      "cus_name",
      "cus_tel_1",
    ];
    const filledEssential = essentialFields.filter((f) => hasValue(inputList[f])).length;
    return { essential: filledEssential, total: essentialFields.length };
  };

  const { essential, total } = countFilledFields();
  const isComplete = essential === total;

  // Summary Item Component
  const SummaryItem = ({ icon: Icon, label, value, color = "text.primary" }) => {
    if (!value) return null;
    return (
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, py: 0.5 }}>
        <Icon size={16} color={PRIMARY_RED} style={{ marginTop: 2, flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              fontFamily: "Kanit",
              color: "text.secondary",
              display: "block",
              lineHeight: 1.2,
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: "Kanit",
              fontWeight: 500,
              color,
              wordBreak: "break-word",
            }}
          >
            {value}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Build full address string
  const getFullAddress = () => {
    // ถ้ามี cus_address ให้ใช้เลย (ข้อมูลจาก database ที่สมบูรณ์แล้ว)
    if (hasValue(inputList.cus_address)) {
      return inputList.cus_address;
    }

    // Fallback: สร้างจาก text fields แยก
    const parts = [
      inputList.cus_address_detail,
      inputList.cus_subdistrict_text ? `ต.${inputList.cus_subdistrict_text}` : null,
      inputList.cus_district_text ? `อ.${inputList.cus_district_text}` : null,
      inputList.cus_province_text ? `จ.${inputList.cus_province_text}` : null,
      inputList.cus_zip_code,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : null;
  };

  // Check if there's any data to show
  const hasAnyData =
    hasValue(inputList.cus_company) ||
    hasValue(inputList.cus_firstname) ||
    hasValue(inputList.cus_tel_1);

  if (!hasAnyData && mode !== "view") {
    return null; // Don't show preview if no data entered
  }

  return (
    <Accordion
      defaultExpanded={mode === "view"}
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: "hidden",
        "&:before": { display: "none" },
        boxShadow: "0 2px 8px rgba(158, 0, 0, 0.1)",
        border: `1px solid ${isComplete ? "#4caf50" : PRIMARY_RED}30`,
      }}
    >
      <AccordionSummary
        expandIcon={<MdExpandMore size={20} />}
        sx={{
          bgcolor: isComplete ? "#e8f5e9" : "#fff5f5",
          minHeight: 48,
          "&.Mui-expanded": {
            minHeight: 48,
          },
          "& .MuiAccordionSummary-content": {
            alignItems: "center",
            gap: 1.5,
            my: 1,
          },
        }}
      >
        <MdPreview size={20} color={isComplete ? "#4caf50" : PRIMARY_RED} />
        <Typography
          variant="body2"
          sx={{
            fontFamily: "Kanit",
            fontWeight: 600,
            color: isComplete ? "#2e7d32" : PRIMARY_RED,
            flex: 1,
          }}
        >
          {mode === "view" ? "ข้อมูลลูกค้า" : "สรุปข้อมูลที่กรอก"}
        </Typography>
        <Chip
          label={`${essential}/${total}`}
          size="small"
          sx={{
            fontFamily: "Kanit",
            fontSize: "0.75rem",
            height: 24,
            bgcolor: isComplete ? "#4caf5020" : `${PRIMARY_RED}15`,
            color: isComplete ? "#2e7d32" : PRIMARY_RED,
            fontWeight: 600,
          }}
        />
      </AccordionSummary>

      <AccordionDetails sx={{ bgcolor: "white", p: 2 }}>
        <Stack spacing={1} divider={<Divider flexItem sx={{ my: 0.5 }} />}>
          {/* Business Info */}
          <Box>
            <SummaryItem icon={MdBusiness} label="ชื่อบริษัท" value={inputList.cus_company} />
          </Box>

          {/* Contact Person */}
          {(hasValue(inputList.cus_firstname) || hasValue(inputList.cus_name)) && (
            <Box>
              <SummaryItem
                icon={MdPerson}
                label="ผู้ติดต่อ"
                value={
                  [
                    inputList.cus_firstname,
                    inputList.cus_lastname,
                    inputList.cus_name ? `(${inputList.cus_name})` : null,
                  ]
                    .filter(Boolean)
                    .join(" ") || null
                }
              />
            </Box>
          )}

          {/* Contact Info */}
          {(hasValue(inputList.cus_tel_1) || hasValue(inputList.cus_email)) && (
            <Box>
              <Stack direction={isMobile ? "column" : "row"} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <SummaryItem
                    icon={MdPhone}
                    label="เบอร์โทร"
                    value={
                      [inputList.cus_tel_1, inputList.cus_tel_2].filter(Boolean).join(", ") || null
                    }
                  />
                </Box>
                {hasValue(inputList.cus_email) && (
                  <Box sx={{ flex: 1 }}>
                    <SummaryItem icon={MdEmail} label="อีเมล" value={inputList.cus_email} />
                  </Box>
                )}
              </Stack>
            </Box>
          )}

          {/* Address */}
          {getFullAddress() && (
            <Box>
              <SummaryItem icon={MdLocationOn} label="ที่อยู่" value={getFullAddress()} />
            </Box>
          )}

          {/* Manager */}
          {hasValue(inputList.cus_manage_by?.username) && (
            <Box>
              <SummaryItem
                icon={MdSupervisorAccount}
                label="ผู้ดูแล"
                value={inputList.cus_manage_by?.username}
              />
            </Box>
          )}
        </Stack>

        {/* Completion message */}
        {isComplete && mode !== "view" && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: "#e8f5e9",
              borderRadius: 1,
              textAlign: "center",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontFamily: "Kanit",
                color: "#2e7d32",
                fontWeight: 500,
              }}
            >
              ✅ กรอกข้อมูลครบแล้ว พร้อมบันทึก!
            </Typography>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default FormSummaryPreview;
