import { Typography } from "@mui/material";

import { formatTHB } from "../../../../Invoices/utils/format";
import { InfoCard } from "../../../../PricingIntegration/components/styles/quotationFormStyles";

/**
 * Card สรุปใบแจ้งหนี้ต้นทาง (ของ Create dialog).
 * Render null เมื่อไม่มี invoice.
 */
const InvoiceSummaryCard = ({ invoice }) => {
  if (!invoice) return null;
  return (
    <InfoCard sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        สรุปใบแจ้งหนี้
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {invoice.number} • {invoice.customer_company}
        {invoice.final_total_amount && <> • ยอดรวม {formatTHB(invoice.final_total_amount)}</>}
      </Typography>
    </InfoCard>
  );
};

export default InvoiceSummaryCard;
