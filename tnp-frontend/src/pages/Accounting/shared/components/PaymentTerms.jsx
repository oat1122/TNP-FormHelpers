import { Grid, Typography, TextField, ToggleButtonGroup, ToggleButton } from "@mui/material";
import React from "react";

import {
  InfoCard,
  tokens,
} from "../../PricingIntegration/components/quotation/styles/quotationTheme";
import { formatTHB } from "../../Quotations/utils/format";

/**
 * PaymentTerms shared component
 * Handles payment method selection + deposit mode (percentage or amount) + summary.
 */
export default function PaymentTerms({
  isEditing = true,
  paymentTermsType,
  paymentTermsCustom,
  onChangePaymentTermsType,
  onChangePaymentTermsCustom,
  depositMode,
  onChangeDepositMode,
  depositPercentage,
  depositAmountInput,
  onChangeDepositPercentage,
  onChangeDepositAmount,
  isCredit,
  dueDateNode,
  finalTotal = 0,
  depositAmount = 0,
  remainingAmount = 0,
}) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <InfoCard sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            การชำระเงิน
          </Typography>
          {isEditing ? (
            <>
              <TextField
                select
                fullWidth
                size="small"
                SelectProps={{ native: true }}
                value={paymentTermsType}
                onChange={(e) => onChangePaymentTermsType(e.target.value)}
                sx={{ mb: paymentTermsType === "other" ? 1 : 0 }}
              >
                <option value="cash">เงินสด</option>
                <option value="credit_30">เครดิต 30 วัน</option>
                <option value="credit_60">เครดิต 60 วัน</option>
                <option value="other">อื่นๆ (กำหนดเอง)</option>
              </TextField>
              {paymentTermsType === "other" && (
                <TextField
                  fullWidth
                  size="small"
                  placeholder="พิมพ์วิธีการชำระเงิน"
                  value={paymentTermsCustom}
                  onChange={(e) => onChangePaymentTermsCustom(e.target.value)}
                />
              )}
            </>
          ) : (
            <Typography variant="body1" fontWeight={700}>
              {paymentTermsType === "cash"
                ? "เงินสด"
                : paymentTermsType === "credit_30"
                  ? "เครดิต 30 วัน"
                  : paymentTermsType === "credit_60"
                    ? "เครดิต 60 วัน"
                    : paymentTermsCustom || "-"}
            </Typography>
          )}
        </InfoCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <InfoCard sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            เงินมัดจำ
          </Typography>
          {isEditing ? (
            <>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={depositMode}
                onChange={(e, val) => val && onChangeDepositMode(val)}
                sx={{ mb: 1 }}
              >
                <ToggleButton value="percentage">เปอร์เซ็นต์</ToggleButton>
                <ToggleButton value="amount">จำนวนเงิน</ToggleButton>
              </ToggleButtonGroup>
              {depositMode === "percentage" ? (
                <TextField
                  fullWidth
                  size="small"
                  type="text"
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  value={String(depositPercentage ?? "")}
                  onChange={(e) => onChangeDepositPercentage(e.target.value)}
                  helperText="เป็นเปอร์เซ็นต์ (0-100)"
                />
              ) : (
                <TextField
                  fullWidth
                  size="small"
                  type="text"
                  inputProps={{ inputMode: "decimal" }}
                  value={String(depositAmountInput ?? "")}
                  onChange={(e) => onChangeDepositAmount(e.target.value)}
                  helperText={`จำนวนเงิน (สูงสุด ${formatTHB(finalTotal)})`}
                />
              )}
            </>
          ) : (
            <Typography variant="body1" fontWeight={700}>
              {depositMode === "amount"
                ? formatTHB(depositAmount)
                : `${depositPercentage}% (${formatTHB(depositAmount)})`}
            </Typography>
          )}
        </InfoCard>
      </Grid>
      <Grid item xs={12}>
        <InfoCard sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} color={tokens.primary} gutterBottom>
            สรุปการชำระเงิน
          </Typography>
          <Grid container>
            <Grid item xs={6}>
              <Typography>จำนวนมัดจำ</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography textAlign="right" fontWeight={700}>
                {depositMode === "amount"
                  ? formatTHB(depositAmount)
                  : `${depositPercentage || 0}% (${formatTHB(depositAmount)})`}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography>ยอดคงเหลือ</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography textAlign="right" fontWeight={700}>
                {formatTHB(remainingAmount)}
              </Typography>
            </Grid>
            {isCredit && dueDateNode}
          </Grid>
        </InfoCard>
      </Grid>
    </Grid>
  );
}
