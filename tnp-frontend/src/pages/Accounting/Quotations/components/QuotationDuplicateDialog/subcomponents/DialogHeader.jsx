import {
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon,
  Payments as PaymentsIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";

import { tokens } from "../../../../shared/styles/quotationFormStyles";

/**
 * Compact dialog header for QuotationDuplicateDialog (Phase 1, 2, Edit Mode).
 *
 * Replaces plain DialogTitle with prominent action label + customer chip + live
 * total chip + close button. Source ref chip shown only in duplicate mode.
 *
 * Two modes (controlled by `mode` prop):
 *   - "duplicate" (default): สร้างใบเสนอราคา / สำเนาฉบับใหม่ + ContentCopyIcon
 *                           + "จาก {source.number}" chip
 *   - "edit":               แก้ไขใบเสนอราคา / {quotation.number} + EditIcon
 *                           (no source chip — clean per user spec)
 *
 * Props:
 *   - mode            — "duplicate" | "edit" (default "duplicate")
 *   - sourceQuotation — source quotation model (reads .number for chip/subtitle)
 *   - customerName    — customer company name (compact display)
 *   - finalTotal      — current grand total (live chip — re-renders on edit)
 *   - onClose         — close handler
 */
const formatTHB = (n) => {
  const num = Number(n) || 0;
  return num.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const HEADER_TEXT = {
  duplicate: { topLabel: "สร้างใบเสนอราคา", subtitle: "สำเนาฉบับใหม่" },
  edit: { topLabel: "แก้ไขใบเสนอราคา", subtitle: null /* uses quotation number */ },
  view: { topLabel: "รายละเอียดใบเสนอราคา", subtitle: null /* uses quotation number */ },
};

const MODE_ICONS = {
  duplicate: ContentCopyIcon,
  edit: EditIcon,
  view: VisibilityIcon,
};

const DialogHeader = ({
  mode = "duplicate",
  sourceQuotation,
  customerName,
  finalTotal,
  onClose,
}) => {
  const isEdit = mode === "edit";
  const isView = mode === "view";
  const usesQuotationNumber = isEdit || isView;
  const sourceNumber = sourceQuotation?.number || sourceQuotation?.quotation_number;
  const { topLabel } = HEADER_TEXT[mode] || HEADER_TEXT.duplicate;
  // Edit/view subtitle = quotation number. Duplicate subtitle = "สำเนาฉบับใหม่".
  const subtitleText = usesQuotationNumber ? sourceNumber || "-" : HEADER_TEXT.duplicate.subtitle;
  const Icon = MODE_ICONS[mode] || ContentCopyIcon;

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
      {/* Left: action icon + mode label + (source ref chip in duplicate only) + customer chip + total chip */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ flexWrap: "wrap", minWidth: 0, flex: 1 }}
      >
        <Icon sx={{ color: tokens.primary, fontSize: 20, flexShrink: 0 }} />

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="overline"
            sx={{
              color: "text.secondary",
              lineHeight: 1,
              letterSpacing: 0.5,
              display: "block",
            }}
          >
            {topLabel}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: tokens.primary,
              fontWeight: 700,
              lineHeight: 1.2,
              fontSize: "1.05rem",
              fontFamily: usesQuotationNumber ? "monospace" : undefined,
            }}
          >
            {subtitleText}
          </Typography>
        </Box>

        {/* Source ref chip — duplicate mode only (hidden in edit/view) */}
        {!usesQuotationNumber && sourceNumber && (
          <Chip
            label={`จาก ${sourceNumber}`}
            size="small"
            variant="outlined"
            sx={{
              fontFamily: "monospace",
              fontWeight: 600,
              height: 24,
              fontSize: "0.72rem",
              borderColor: tokens.primary,
              color: tokens.primary,
            }}
          />
        )}

        {customerName && (
          <Chip
            icon={<PersonIcon />}
            label={customerName}
            size="small"
            variant="outlined"
            sx={{
              maxWidth: 280,
              height: 24,
              fontSize: "0.72rem",
              "& .MuiChip-label": {
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
            }}
          />
        )}

        {finalTotal != null && (
          <Tooltip title="ยอดรวมสุทธิ — อัพเดทอัตโนมัติเมื่อแก้รายการ">
            <Chip
              icon={<PaymentsIcon />}
              label={`฿${formatTHB(finalTotal)}`}
              size="small"
              color="success"
              variant="filled"
              sx={{
                fontWeight: 700,
                height: 24,
                fontSize: "0.78rem",
                fontFamily: "monospace",
              }}
            />
          </Tooltip>
        )}
      </Stack>

      {/* Right: close button */}
      <Tooltip title="ปิดหน้าต่าง">
        <IconButton
          size="small"
          onClick={onClose}
          aria-label="ปิดหน้าต่าง"
          sx={{ color: "text.secondary", flexShrink: 0 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default DialogHeader;
