/**
 * Component for displaying financial summary with breakdown
 * Matches Calculation.jsx style with Grid layout and Alert component
 */

import { Card, Grid, Typography, Divider, Alert } from "@mui/material";
import React from "react";

import { formatTHB } from "../utils/invoiceFormatters";

const FinancialSummaryCard = ({ financials, invoice, showDetails }) => {
  const {
    pricingMode,
    netSubtotal,
    subtotal,
    specialDiscountAmount,
    vatAmount,
    afterVat,
    withholding,
    total,
  } = financials;

  if (!showDetails) return null;

  const isVatIncluded = pricingMode === "vat_included";
  const hasVat = invoice?.has_vat;
  const vatPercentage = invoice?.vat_percentage || 7;

  // Calculate discounted base
  const discountedBase = subtotal - specialDiscountAmount;

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
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        สรุปยอดเงิน
      </Typography>
      <Divider sx={{ mb: 1.5 }} />

      {/* Pricing Mode Indicator */}
      {isVatIncluded && hasVat && (
        <Alert severity="info" icon={false} sx={{ mb: 2, py: 0.5 }}>
          <Typography variant="caption" fontWeight={600}>
            โหมดราคารวม VAT: ราคาที่กรอกรวม VAT {vatPercentage}% แล้ว
          </Typography>
        </Alert>
      )}

      <Grid container rowSpacing={0.5}>
        {/* ยอดก่อนภาษี (ก่อนส่วนลด) */}
        <Grid item xs={6}>
          <Typography variant="body1">ยอดก่อนภาษี (ก่อนส่วนลด)</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body1" textAlign="right" fontWeight={700}>
            {formatTHB(subtotal)}
          </Typography>
        </Grid>

        {/* ส่วนลดพิเศษ */}
        {specialDiscountAmount > 0 && (
          <>
            <Grid item xs={6}>
              <Typography variant="body1" color="error">
                ส่วนลดพิเศษ
                {invoice?.special_discount_percentage > 0 &&
                  ` (${invoice.special_discount_percentage}%)`}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" textAlign="right" fontWeight={700} color="error">
                - {formatTHB(specialDiscountAmount)}
              </Typography>
            </Grid>

            {/* ยอดหลังส่วนลด */}
            <Grid item xs={6}>
              <Typography variant="body1">
                {isVatIncluded ? "ยอดหลังส่วนลด (รวม VAT)" : "ยอดหลังส่วนลด"}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" textAlign="right" fontWeight={700}>
                {formatTHB(discountedBase)}
              </Typography>
            </Grid>
          </>
        )}

        {/* → ยอดสุทธิ (แยก VAT ออก) - VAT Included mode only */}
        {isVatIncluded && hasVat && netSubtotal > 0 && (
          <>
            <Grid item xs={6}>
              <Typography variant="body1" color="primary.main" fontWeight={600}>
                → ยอดสุทธิ (แยก VAT ออก)
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" textAlign="right" fontWeight={700} color="primary.main">
                {formatTHB(netSubtotal)}
              </Typography>
            </Grid>
          </>
        )}

        {/* VAT */}
        {hasVat && vatAmount > 0 && (
          <>
            <Grid item xs={6}>
              <Typography variant="body1">
                VAT {vatPercentage}%{isVatIncluded && " (แยกออกมา)"}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" textAlign="right" fontWeight={700}>
                {formatTHB(vatAmount)}
              </Typography>
            </Grid>
          </>
        )}

        {/* ยอดหลัง VAT - hide in VAT included mode */}
        {!isVatIncluded && hasVat && vatAmount > 0 && (
          <>
            <Grid item xs={6}>
              <Typography variant="body1">ยอดหลัง VAT</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" textAlign="right" fontWeight={700}>
                {formatTHB(afterVat)}
              </Typography>
            </Grid>
          </>
        )}

        {/* ภาษีหัก ณ ที่จ่าย */}
        {invoice?.has_withholding_tax && withholding > 0 && (
          <>
            <Grid item xs={6}>
              <Typography variant="body1" color="warning.main">
                ภาษีหัก ณ ที่จ่าย ({invoice?.withholding_tax_percentage || 0}%)
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" textAlign="right" fontWeight={700} color="warning.main">
                - {formatTHB(withholding)}
              </Typography>
            </Grid>
          </>
        )}

        {/* Divider */}
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>

        {/* ยอดรวมทั้งสิ้น */}
        <Grid item xs={6}>
          <Typography variant="subtitle1" fontWeight={800}>
            ยอดรวมทั้งสิ้น
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle1" fontWeight={800} textAlign="right">
            {formatTHB(total)}
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
};

export default FinancialSummaryCard;
