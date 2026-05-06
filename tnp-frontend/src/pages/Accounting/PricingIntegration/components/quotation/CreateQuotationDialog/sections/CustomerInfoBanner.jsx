import {
  Business as BusinessIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { Box, Chip, Collapse, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useState } from "react";

import { tokens } from "../../../../../shared/styles/tokens";
import { InfoCard } from "../../../styles/quotationFormStyles";

/**
 * Compact customer info banner (Phase 2 of CreateQuotationDialog redesign).
 *
 * Was a 3-row Grid card (~140px tall). Now a single row that fits in ~48px,
 * with the address available via collapse toggle (or tooltip on the icon).
 */
const CustomerInfoBanner = ({ customer }) => {
  const [addressOpen, setAddressOpen] = useState(false);
  const company = customer?.cus_company || "—";
  const taxId = customer?.cus_tax_id;
  const address = customer?.cus_address;

  return (
    <InfoCard sx={{ px: 1.5, py: 1, mb: 1.5 }}>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
        <BusinessIcon sx={{ color: tokens.primary, fontSize: 20, flexShrink: 0 }} />
        <Typography
          variant="body2"
          fontWeight={700}
          color={tokens.primary}
          noWrap
          sx={{ flex: 1, minWidth: 0 }}
          title={company}
        >
          {company}
        </Typography>
        {taxId && (
          <Chip
            label={`TAX ${taxId}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.7rem", height: 22 }}
          />
        )}
        {address && (
          <Tooltip title={addressOpen ? "ซ่อนที่อยู่" : "แสดงที่อยู่"}>
            <IconButton size="small" onClick={() => setAddressOpen((v) => !v)}>
              {addressOpen ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      <Collapse in={addressOpen} timeout="auto" unmountOnExit>
        <Box
          sx={{
            mt: 1,
            pt: 1,
            borderTop: `1px dashed ${tokens.border}`,
            display: "flex",
            gap: 1,
            alignItems: "flex-start",
          }}
        >
          <LocationIcon sx={{ color: "text.secondary", fontSize: 16, mt: 0.25, flexShrink: 0 }} />
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            {address}
          </Typography>
        </Box>
      </Collapse>
    </InfoCard>
  );
};

export default CustomerInfoBanner;
