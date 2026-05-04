import EventIcon from "@mui/icons-material/Event";
import PaymentIcon from "@mui/icons-material/Payment";
import { Box, Stack, Typography } from "@mui/material";

import { formatDate } from "../../utils/invoiceFormatters";

const captionSx = { fontSize: "0.8rem", lineHeight: 1.45 };

const InvoiceCardMetadata = ({ invoice, invoiceStatus, quotationNumber }) => {
  const hasPayment = Boolean(invoice?.payment_method || invoice?.payment_terms);
  const hasAdditional =
    quotationNumber ||
    invoice?.customer_address ||
    invoice?.notes ||
    (invoice?.document_header_type && invoice.document_header_type !== "ต้นฉบับ");

  return (
    <>
      {hasPayment && (
        <Box mb={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <PaymentIcon fontSize="small" color="action" aria-hidden="true" />
            <Stack spacing={0.5}>
              {invoice?.payment_method && (
                <Typography variant="caption" color="text.secondary" sx={captionSx}>
                  วิธีชำระเงิน: {invoice.payment_method}
                </Typography>
              )}
              {invoice?.payment_terms && (
                <Typography variant="caption" color="text.secondary" sx={captionSx}>
                  เงื่อนไขการชำระ: {invoice.payment_terms}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Box>
      )}

      <Box mb={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 0.5, sm: 3 }}
          sx={{ fontSize: "0.85rem" }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <EventIcon fontSize="small" color="action" aria-hidden="true" />
            <Typography variant="caption" color="text.secondary" sx={captionSx}>
              สร้างเมื่อ: {formatDate(invoice?.created_at)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <EventIcon fontSize="small" color="warning" aria-hidden="true" />
            <Typography
              variant="caption"
              sx={{
                ...captionSx,
                color: invoiceStatus.status === "เกินกำหนด" ? "error.main" : "warning.main",
                fontWeight: 500,
              }}
            >
              วันครบกำหนด: {formatDate(invoice?.due_date)}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {hasAdditional && (
        <Box mb={2.5}>
          <Stack spacing={0.5}>
            {quotationNumber && (
              <Typography variant="caption" color="text.secondary" sx={captionSx}>
                อ้างอิงใบเสนอราคา: {quotationNumber}
              </Typography>
            )}
            {invoice?.customer_address && (
              <Typography variant="caption" color="text.secondary" sx={captionSx}>
                ที่อยู่ใบกำกับ: {invoice.customer_address}
                {invoice?.customer_zip_code ? ` ${invoice.customer_zip_code}` : ""}
              </Typography>
            )}
            {invoice?.notes && (
              <Typography variant="caption" color="text.secondary" sx={captionSx}>
                หมายเหตุ: {invoice.notes}
              </Typography>
            )}
            {invoice?.document_header_type && invoice.document_header_type !== "ต้นฉบับ" && (
              <Typography variant="caption" color="primary.main" sx={captionSx}>
                ประเภทหัวกระดาษ: {invoice.document_header_type}
              </Typography>
            )}
          </Stack>
        </Box>
      )}
    </>
  );
};

export default InvoiceCardMetadata;
