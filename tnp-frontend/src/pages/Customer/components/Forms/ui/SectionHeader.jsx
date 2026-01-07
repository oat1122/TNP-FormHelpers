/**
 * SectionHeader.jsx - Reusable form section header
 *
 * Used across:
 * - EssentialInfoTab (ข้อมูลธุรกิจ, ข้อมูลผู้ติดต่อ, ช่องทางติดต่อ)
 * - AdditionalInfoTab (ที่อยู่ธุรกิจ, ข้อมูลทางธุรกิจ, ผู้ดูแลลูกค้า, หมายเหตุ)
 * - TelesalesQuickCreateForm (ข้อมูลหลัก, ข้อมูลธุรกิจ, ที่อยู่)
 *
 * @module Forms/ui/SectionHeader
 */
import React from "react";
import { Box, Typography } from "@mui/material";
import { FORM_THEME } from "./FormFields";

/**
 * SectionHeader - Visual section divider with icon and title
 *
 * Supports two icon patterns for backward compatibility:
 * 1. Component ref: icon={MdPerson} - will render with default color/size
 * 2. Rendered element: icon={<MdPerson size={20} color="#9e0000" />} - uses as-is
 *
 * @param {React.ComponentType|React.ReactElement} icon - Icon component or element
 * @param {string} title - Section title
 * @param {string} subtitle - Optional subtitle/description
 * @param {boolean} optional - Shows "ไม่บังคับ" badge if true
 */
export const SectionHeader = ({ icon, title, subtitle, optional = false }) => {
  // Determine if icon is a component (needs rendering) or already rendered element
  const isComponent = typeof icon === "function" || (icon && icon.$$typeof === undefined);
  const IconElement = isComponent ? (
    <Box component={icon} size={20} color={FORM_THEME.PRIMARY_RED} />
  ) : (
    icon
  );

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        mb: 2,
        pb: 1,
        borderBottom: `2px solid ${FORM_THEME.PRIMARY_RED}20`,
      }}
    >
      {/* Icon container */}
      <Box
        sx={{
          p: 1,
          borderRadius: 1,
          bgcolor: `${FORM_THEME.PRIMARY_RED}10`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {IconElement}
      </Box>

      {/* Title and subtitle */}
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontFamily: "Kanit",
              fontWeight: 600,
              color: FORM_THEME.PRIMARY_RED,
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          {optional && (
            <Typography
              variant="caption"
              sx={{
                fontFamily: "Kanit",
                color: "text.secondary",
                bgcolor: "#f5f5f5",
                px: 1,
                py: 0.25,
                borderRadius: 1,
              }}
            >
              ไม่บังคับ
            </Typography>
          )}
        </Box>
        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              fontFamily: "Kanit",
              color: "text.secondary",
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default SectionHeader;
