import DescriptionIcon from "@mui/icons-material/Description";
import { Box, Chip, Stack, Tooltip, Typography } from "@mui/material";

import { typeLabels, truncateText } from "../../utils/invoiceFormatters";
import { getDisplayInvoiceNumber } from "../../utils/invoiceLogic";
import { AccountingCountChip, AccountingStatusChip } from "../../../../shared/styles";

const InvoiceCardHeader = ({ invoice, depositMode, invoiceStatus, depositInfo }) => {
  const customerSnapshot = (() => {
    if (!invoice?.customer_snapshot) return null;
    try {
      return typeof invoice.customer_snapshot === "string"
        ? JSON.parse(invoice.customer_snapshot)
        : invoice.customer_snapshot;
    } catch {
      return null;
    }
  })();

  const displayCompanyName =
    invoice?.customer_company ||
    invoice?.customer?.cus_company ||
    customerSnapshot?.customer_company ||
    "บริษัท/ลูกค้า";
  const displayAddress =
    invoice?.customer_address ||
    invoice?.customer?.cus_address ||
    customerSnapshot?.customer_address;
  const rawCompanyName = displayCompanyName || displayAddress || "บริษัท/ลูกค้า";
  const cleanCompanyName = rawCompanyName.replace(/(\d+)\s+\1/g, "$1");
  const truncatedCompanyName = truncateText(cleanCompanyName, 35);
  const displayNumber = getDisplayInvoiceNumber(invoice, depositMode);

  return (
    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
      <Box flex={1}>
        <Tooltip title={cleanCompanyName} placement="top-start">
          <Typography
            variant="h6"
            noWrap
            sx={{ fontWeight: 700, mb: 1.25, lineHeight: 1.45, fontSize: "1.1rem" }}
          >
            {truncatedCompanyName}
          </Typography>
        </Tooltip>

        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.25}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {displayNumber && (
              <AccountingCountChip
                icon={<DescriptionIcon sx={{ fontSize: "0.9rem" }} aria-hidden="true" />}
                label={displayNumber}
                size="small"
                sx={{ fontWeight: 600 }}
                aria-label={`เลขที่เอกสาร ${displayNumber}`}
              />
            )}
            <AccountingStatusChip
              label={invoiceStatus.status}
              size="small"
              statuscolor={invoiceStatus.color}
              sx={{ fontWeight: 500 }}
              aria-label={`สถานะ ${invoiceStatus.status}`}
            />
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={typeLabels[invoice?.type] || invoice?.type || "-"}
              sx={{ fontSize: "0.75rem" }}
            />
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {depositInfo && (
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                label={`มัดจำ: ${depositInfo}`}
                sx={{ fontSize: "0.75rem" }}
              />
            )}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default InvoiceCardHeader;
