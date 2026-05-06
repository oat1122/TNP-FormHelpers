import {
  Grid,
  Typography,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Box,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import "react";

import { InfoCard, tokens } from "../styles/quotationFormStyles";
import { formatTHB } from "../utils/format";

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
  paidBeforeOverride = null,
  paidAfterOverride = null,
}) {
  const hasSideOverride = paidBeforeOverride != null || paidAfterOverride != null;
  const summaryBefore = paidBeforeOverride != null ? Number(paidBeforeOverride) : depositAmount;
  const summaryAfter = paidAfterOverride != null ? Number(paidAfterOverride) : remainingAmount;
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
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={depositMode}
                  onChange={(e, val) => val && onChangeDepositMode(val)}
                >
                  <ToggleButton value="percentage">เปอร์เซ็นต์</ToggleButton>
                  <ToggleButton value="amount">จำนวนเงิน</ToggleButton>
                </ToggleButtonGroup>

                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={depositMode === "percentage" && String(depositPercentage) === "100"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onChangeDepositMode("percentage");
                          onChangeDepositPercentage("100");
                        } else {
                          onChangeDepositPercentage("50");
                        }
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" fontWeight={600} color="primary">
                      จ่ายเต็มจำนวน (100%)
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </Box>
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
              <Typography>{hasSideOverride ? "ชำระก่อน (มัดจำ)" : "จำนวนมัดจำ"}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography textAlign="right" fontWeight={700}>
                {hasSideOverride
                  ? formatTHB(summaryBefore)
                  : depositMode === "amount"
                    ? formatTHB(depositAmount)
                    : `${depositPercentage || 0}% (${formatTHB(depositAmount)})`}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography>{hasSideOverride ? "ชำระหลัง (คงเหลือ)" : "ยอดคงเหลือ"}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography textAlign="right" fontWeight={700}>
                {formatTHB(summaryAfter)}
              </Typography>
            </Grid>
            {hasSideOverride && (
              <>
                <Grid item xs={6}>
                  <Typography color="text.secondary">รวม ก่อน + หลัง</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography
                    textAlign="right"
                    fontWeight={700}
                    color={
                      Math.abs(summaryBefore + summaryAfter - finalTotal) > 0.01
                        ? "warning.main"
                        : "success.main"
                    }
                  >
                    {formatTHB(summaryBefore + summaryAfter)}
                    {Math.abs(summaryBefore + summaryAfter - finalTotal) > 0.01 && (
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ ml: 1, color: "warning.main" }}
                      >
                        (ยอดรวม {formatTHB(finalTotal)})
                      </Typography>
                    )}
                  </Typography>
                </Grid>
              </>
            )}
            {isCredit && dueDateNode}
          </Grid>
        </InfoCard>
      </Grid>
    </Grid>
  );
}
