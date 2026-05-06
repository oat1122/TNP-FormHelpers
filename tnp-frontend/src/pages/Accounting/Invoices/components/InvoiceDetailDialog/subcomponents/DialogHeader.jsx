import { Close as CloseIcon, Edit as EditIcon } from "@mui/icons-material";
import { Box, Chip, IconButton, Typography } from "@mui/material";

import { tokens } from "../../../../PricingIntegration/components/styles/quotationFormStyles";
import { getDisplayInvoiceNumber } from "../../utils/invoiceLogic";
import { statusColors } from "../utils/invoiceDetailNormalizers";

/**
 * Compact dialog header for InvoiceDetailDialog (Phase 4 of redesign).
 *
 * Replaces plain "รายละเอียดใบแจ้งหนี้" title with prominent doc number + status
 * chip + mode label + close button. Provides clear context at a glance.
 *
 * Props:
 *   - invoice    — invoice model (for number, status)
 *   - isEditing  — boolean (mode indicator)
 *   - depositMode — "before" | "after" (drives which doc number to show)
 *   - onClose    — close handler (intercepted by parent for unsaved-changes guard)
 */
const DialogHeader = ({ invoice, isEditing, depositMode, onClose }) => {
  const docNumber = getDisplayInvoiceNumber(invoice, depositMode) || invoice?.id || "-";
  const status = invoice?.status || "draft";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        px: 3,
        py: 1.5,
        borderBottom: `1px solid ${tokens.borderLight}`,
        bgcolor: tokens.white,
      }}
    >
      {/* Left: mode label + doc number + status */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", minWidth: 0 }}>
        {isEditing && <EditIcon fontSize="small" sx={{ color: tokens.primary }} />}
        <Typography
          variant="overline"
          sx={{ color: "text.secondary", lineHeight: 1, letterSpacing: 0.5 }}
        >
          {isEditing ? "กำลังแก้ไข" : "รายละเอียดใบแจ้งหนี้"}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontFamily: "monospace",
            color: tokens.primary,
            fontWeight: 700,
            fontSize: "1.1rem",
            lineHeight: 1.2,
          }}
        >
          {docNumber}
        </Typography>
        <Chip
          label={status}
          color={statusColors[status] || "default"}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, height: 22, fontSize: "0.72rem" }}
        />
      </Box>

      {/* Right: close button */}
      <IconButton
        size="small"
        onClick={onClose}
        aria-label="ปิดหน้าต่าง"
        sx={{ color: "text.secondary" }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default DialogHeader;
