import { Typography } from "@mui/material";

import { formatTHB } from "../../../../Invoices/utils/format";
import { InfoCard } from "../../../../PricingIntegration/components/styles/quotationFormStyles";

/**
 * Card สรุปใบแจ้งหนี้ต้นทาง (เลขใบแจ้งหนี้ + ลูกค้า + ยอดรวม).
 * Render null ถ้าไม่มี invoice — เลือกใช้ใน shell แทน inline JSX.
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
