import React from "react";
import { Box, Grid, Typography, Divider } from "@mui/material";
import {
  InfoCard,
  tokens,
} from "../../PricingIntegration/components/quotation/styles/quotationTheme";
import { formatTHB } from "../../Quotations/utils/format";

/**
 * Calculation (Shared)
 * Summary box showing financial breakdown with discount-before-VAT order.
 * Props expect pre-calculated numeric values.
 */
export default function Calculation({
  subtotal = 0,
  discountAmount = 0,
  discountedBase = 0, // subtotal - discount
  vat = 0,
  totalAfterVat = 0, // discountedBase + vat
  withholdingAmount = 0,
  finalTotal = 0,
  title = "สรุปยอดเงิน",
  vatPercentage = 7, // NEW: Show actual VAT percentage
  hasVat = true, // NEW: Show if VAT is enabled
}) {
  return (
    <InfoCard sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} color={tokens.primary} gutterBottom>
        {title}
      </Typography>
      <Divider sx={{ mb: 1, borderColor: tokens.primary, opacity: 0.4 }} />
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
              <Typography>ฐานภาษีหลังส่วนลด</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography textAlign="right" fontWeight={700}>
                {formatTHB(discountedBase)}
              </Typography>
            </Grid>
          </>
        )}
        <Grid item xs={6}>
          <Typography>VAT {hasVat ? `${vatPercentage}%` : "(ยกเว้น)"}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography textAlign="right" fontWeight={700}>
            {formatTHB(vat)}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography>ยอดหลัง VAT</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography textAlign="right" fontWeight={700}>
            {formatTHB(totalAfterVat)}
          </Typography>
        </Grid>
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
