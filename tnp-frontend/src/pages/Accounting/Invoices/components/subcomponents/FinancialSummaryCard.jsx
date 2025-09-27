/**
 * Component for displaying financial summary with breakdown
 */

import React from "react";
import { Card, Stack, Typography, Divider } from "@mui/material";
import { formatTHB } from "../utils/invoiceFormatters";

// Component สำหรับแถวในตารางสรุปยอดเงิน
const FinancialRow = ({ label, value, emphasis = false, negative = false, color = null }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.9rem" }}>
      {label}
    </Typography>
    <Typography
      variant={emphasis ? "subtitle2" : "body2"}
      align="right"
      sx={{
        fontWeight: emphasis ? 700 : 400,
        color: color || (negative ? "error.main" : emphasis ? "primary.main" : "text.primary"),
        fontSize: emphasis ? "1rem" : "0.9rem",
      }}
    >
      {negative ? `- ${formatTHB(value)}` : formatTHB(value)}
    </Typography>
  </Stack>
);

const FinancialSummaryCard = ({ financials, invoice, showDetails }) => {
  const { subtotal, specialDiscountAmount, vatAmount, afterVat, withholding, total } = financials;

  if (!showDetails) return null;

  return (
    <Card
      variant="outlined"
      sx={{
        mt: 2,
        p: 2.5,
        bgcolor: "grey.50",
        borderRadius: 2,
        borderColor: "primary.100",
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          color: "text.secondary",
          fontWeight: 600,
          mb: 1.25,
        }}
      >
        สรุปยอดเงิน
      </Typography>
      <Divider sx={{ my: 1 }} />

      <Stack spacing={1}>
        {subtotal > 0 && <FinancialRow label="ยอดก่อนภาษี (ก่อนส่วนลด)" value={subtotal} />}

        {specialDiscountAmount > 0 && (
          <FinancialRow
            label={`ส่วนลดพิเศษ${invoice?.special_discount_percentage ? ` (${invoice.special_discount_percentage}%)` : ""}`}
            value={specialDiscountAmount}
            negative={true}
          />
        )}

        {invoice?.has_vat && vatAmount > 0 && (
          <FinancialRow label={`VAT ${invoice?.vat_percentage || 7}%`} value={vatAmount} />
        )}

        {invoice?.has_vat && vatAmount > 0 && <FinancialRow label="ยอดหลัง VAT" value={afterVat} />}

        {invoice?.has_withholding_tax && withholding > 0 && (
          <FinancialRow
            label={`ภาษีหัก ณ ที่จ่าย (${invoice?.withholding_tax_percentage || 0}%)`}
            value={withholding}
            negative={true}
            color="warning.main"
          />
        )}

        <Divider sx={{ my: 1.5 }} />
        <FinancialRow label="ยอดรวมทั้งสิ้น" value={total} emphasis={true} />
      </Stack>
    </Card>
  );
};

export default FinancialSummaryCard;
