import { ArrowBack as ArrowBackIcon, Receipt as ReceiptIcon } from "@mui/icons-material";
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";

import { tokens } from "../../../../../shared/styles/tokens";

/**
 * Compact form header (Phase 1 of create-quotation-redesign).
 *
 * Replaces previous large two-line header with a single-row sticky-friendly bar:
 *   [back] [icon] สร้างใบเสนอราคา • <customer>     [PR n] [+m เพิ่มเติม]
 *
 * Designed to live above the form scroll area without consuming vertical space.
 */
const FormHeaderBar = ({ onBack, prItemsCount, manualItemsCount, customerName }) => (
  <Box
    sx={{
      mb: 2,
      px: 2,
      py: 1.25,
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      justifyContent: "space-between",
      bgcolor: tokens.white,
      border: `1px solid ${tokens.borderLight || "#e0e0e0"}`,
      borderRadius: 1,
      flexWrap: "wrap",
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
      <Tooltip title="ย้อนกลับ">
        <IconButton
          onClick={onBack}
          size="small"
          sx={{
            color: tokens.primary,
            border: `1px solid ${tokens.primary}`,
            width: 32,
            height: 32,
          }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <ReceiptIcon sx={{ color: tokens.primary, fontSize: 22 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          color={tokens.primary}
          sx={{ lineHeight: 1.2 }}
          noWrap
        >
          สร้างใบเสนอราคา
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", lineHeight: 1.2 }}
          noWrap
        >
          {customerName || "กำลังโหลด…"}
        </Typography>
      </Box>
    </Stack>

    <Stack direction="row" spacing={0.75} alignItems="center" flexShrink={0}>
      <Chip
        label={`PR ${prItemsCount}`}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 600, height: 24 }}
      />
      {manualItemsCount > 0 && (
        <Chip
          label={`+${manualItemsCount} เพิ่มเติม`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 600, height: 24 }}
        />
      )}
    </Stack>
  </Box>
);

export default FormHeaderBar;
