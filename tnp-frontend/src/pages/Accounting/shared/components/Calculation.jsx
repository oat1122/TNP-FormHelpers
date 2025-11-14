import { Box, Grid, Typography, Divider, Alert } from "@mui/material";
import React from "react";

import {
  InfoCard,
  tokens,
} from "../../PricingIntegration/components/quotation/styles/quotationTheme";
import { formatTHB } from "../../Quotations/utils/format";

/**
 * Calculation (Shared)
 * Summary box showing financial breakdown with discount-before-VAT order.
 * Props expect pre-calculated numeric values.
 * Now supports VAT-included pricing mode.
 */
export default function Calculation({
  subtotal = 0,
  discountAmount = 0,
  discountedBase = 0, // subtotal - discount (or gross amount if VAT-included)
  netSubtotal = null, // NEW: Extracted net amount when pricingMode = 'vat_included'
  vat = 0,
  totalAfterVat = 0, // discountedBase + vat (or discountedBase if VAT-included)
  withholdingAmount = 0,
  finalTotal = 0,
  title = "สรุปยอดเงิน",
  vatPercentage = 7, // Show actual VAT percentage
  hasVat = true, // Show if VAT is enabled
  pricingMode = "net", // NEW: 'net' | 'vat_included'
}) {
  const isVatIncluded = pricingMode === "vat_included";

  return (
    <InfoCard sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} color={tokens.primary} gutterBottom>
        {title}
      </Typography>
      <Divider sx={{ mb: 1, borderColor: tokens.primary, opacity: 0.4 }} />

      {isVatIncluded && hasVat && (
        <Alert severity="info" icon={false} sx={{ mb: 2, py: 0.5 }}>
          <Typography variant="caption" fontWeight={600}>
            โหมดราคารวม VAT: ราคาที่กรอกรวม VAT {vatPercentage}% แล้ว
          </Typography>
        </Alert>
      )}

      <Grid container rowSpacing={0.5}>
        <Grid item xs={6}>
          <Typography>ยอดก่อนภาษี (ก่อนส่วนลด)</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography textAlign="right" fontWeight={700}>
            {formatTHB(subtotal)}
          </Typography>
        </Grid>
        {discountAmount > 0 && (
          <>
            <Grid item xs={6}>
              <Typography color="error">ส่วนลดพิเศษ</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography textAlign="right" fontWeight={700} color="error">
                - {formatTHB(discountAmount)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography>
                {isVatIncluded ? "ยอดหลังส่วนลด (รวม VAT)" : "ฐานภาษีหลังส่วนลด"}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography textAlign="right" fontWeight={700}>
                {formatTHB(discountedBase)}
              </Typography>
            </Grid>
          </>
        )}

        {isVatIncluded && hasVat && netSubtotal !== null && (
          <>
            <Grid item xs={6}>
              <Typography color="primary.main" fontWeight={600}>
                → ยอดสุทธิ (แยก VAT ออก)
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography textAlign="right" fontWeight={700} color="primary.main">
                {formatTHB(netSubtotal)}
              </Typography>
            </Grid>
          </>
        )}

        <Grid item xs={6}>
          <Typography>
            VAT {hasVat ? `${vatPercentage}%` : "(ยกเว้น)"}
            {isVatIncluded && hasVat && " (แยกออกมา)"}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography textAlign="right" fontWeight={700}>
            {formatTHB(vat)}
          </Typography>
        </Grid>

        {!isVatIncluded && (
          <>
            <Grid item xs={6}>
              <Typography>ยอดหลัง VAT</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography textAlign="right" fontWeight={700}>
                {formatTHB(totalAfterVat)}
              </Typography>
            </Grid>
          </>
        )}

        {withholdingAmount > 0 && (
          <>
            <Grid item xs={6}>
              <Typography color="warning.main">ภาษีหัก ณ ที่จ่าย</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography textAlign="right" fontWeight={700} color="warning.main">
                - {formatTHB(withholdingAmount)}
              </Typography>
            </Grid>
          </>
        )}
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle1" fontWeight={800}>
            ยอดรวมทั้งสิ้น
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle1" fontWeight={800} textAlign="right">
            {formatTHB(finalTotal)}
          </Typography>
        </Grid>
      </Grid>
    </InfoCard>
  );
}
