import {
  Close as CloseIcon,
  Edit as EditIcon,
  Payments as PaymentsIcon,
  Person as PersonIcon,
  ReceiptLong as ReceiptLongIcon,
} from "@mui/icons-material";
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";

import { tokens } from "../../../../shared/styles/tokens";

const formatTHB = (n) => {
  const num = Number(n) || 0;
  return num.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const HEADER_TEXT = {
  create: { topLabel: "สร้างใบแจ้งหนี้", subtitle: "จากใบเสนอราคา" },
  "edit-create": { topLabel: "แก้ไขใบแจ้งหนี้", subtitle: null },
};

const DialogHeader = ({
  mode = "create",
  sourceQuotation,
  invoiceNumber,
  customerName,
  finalTotal,
  onClose,
}) => {
  const isEdit = mode === "edit-create";
  const sourceNumber = sourceQuotation?.number || sourceQuotation?.quotation_number;
  const { topLabel } = HEADER_TEXT[mode] || HEADER_TEXT.create;
  const subtitleText = isEdit ? invoiceNumber || "-" : HEADER_TEXT.create.subtitle;
  const Icon = isEdit ? EditIcon : ReceiptLongIcon;

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
              fontFamily: isEdit ? "monospace" : undefined,
            }}
          >
            {subtitleText}
          </Typography>
        </Box>

        {!isEdit && sourceNumber && (
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
