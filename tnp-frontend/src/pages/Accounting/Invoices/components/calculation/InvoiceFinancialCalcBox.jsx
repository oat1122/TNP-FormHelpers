import {
  Box,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Divider,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";

const tokens = {
  primary: "#900F0F",
  white: "#FFFFFF",
  bg: "#F5F5F5",
};

const InvoiceCalcPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: tokens.white,
  border: `1px solid ${theme.palette.divider}`,
}));

const InvoiceCalcRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(0.5, 0),
  "&.InvoiceCalc-total": {
    fontWeight: 700,
    borderTop: `1px solid ${theme.palette.divider}`,
    paddingTop: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
}));

const InvoiceFinancialCalcBox = React.memo(function InvoiceFinancialCalcBox({
  isEditing = false,

  // Special discount
  specialDiscountType = "percentage",
  specialDiscountValue = 0,
  onSpecialDiscountTypeChange,
  onSpecialDiscountValueChange,

  // VAT
  hasVat = true,
  vatPercentage = 7.0,
  onHasVatChange,
  onVatPercentageChange,

  // Withholding tax
  hasWithholdingTax = false,
  withholdingTaxPercentage = 0,
  withholdingTaxBase = "subtotal",
  onHasWithholdingTaxChange,
  onWithholdingTaxPercentageChange,
  onWithholdingTaxBaseChange,

  // Deposit
  depositMode = "percentage",
  depositPercentage = 0,
  depositAmountInput = 0,
  depositDisplayOrder = "before",
  onDepositModeChange,
  onDepositPercentageChange,
  onDepositAmountInputChange,
  onDepositDisplayOrderChange,

  // Calculated values
  calculation = {},
}) {
  const {
    subtotal = 0,
    discountUsed = 0,
    effectiveSubtotal = 0,
    vatAmount = 0,
    totalAmount = 0,
    withholdingTaxAmount = 0,
    finalTotalAmount = 0,
    depositAmount = 0,
    depositAmountBeforeVat = 0,
    remainingAmount = 0,
    toMoney = (n) => Number(n).toFixed(2),
  } = calculation;

  const formatTHB = (amount) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <InvoiceCalcPaper elevation={0}>
      <Typography variant="h6" gutterBottom sx={{ color: tokens.primary, fontWeight: 700 }}>
        การคำนวณทางการเงิน
      </Typography>

      {/* Special Discount Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          ส่วนลดพิเศษ
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small" disabled={!isEditing}>
              <InputLabel>ประเภทส่วนลด</InputLabel>
              <Select
                value={specialDiscountType}
                onChange={(e) => onSpecialDiscountTypeChange?.(e.target.value)}
                label="ประเภทส่วนลด"
              >
                <MenuItem value="percentage">เปอร์เซ็นต์</MenuItem>
                <MenuItem value="amount">จำนวนเงิน</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label={specialDiscountType === "percentage" ? "เปอร์เซ็นต์" : "จำนวนเงิน (บาท)"}
              value={specialDiscountValue}
              onChange={(e) => onSpecialDiscountValueChange?.(e.target.value)}
              disabled={!isEditing}
              inputProps={{ min: 0, step: specialDiscountType === "percentage" ? 0.01 : 1 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              ส่วนลด: {formatTHB(discountUsed)}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* VAT Section */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={hasVat}
                  onChange={(e) => onHasVatChange?.(e.target.checked)}
                  disabled={!isEditing}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: tokens.primary,
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: tokens.primary,
                    },
                  }}
                />
              }
              label="คิดภาษีมูลค่าเพิ่ม (VAT)"
            />
          </Grid>
          {hasVat && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="อัตรา VAT (%)"
                value={vatPercentage}
                onChange={(e) => onVatPercentageChange?.(e.target.value)}
                disabled={!isEditing}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
              />
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Withholding Tax Section */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={hasWithholdingTax}
                  onChange={(e) => onHasWithholdingTaxChange?.(e.target.checked)}
                  disabled={!isEditing}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: tokens.primary,
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: tokens.primary,
                    },
                  }}
                />
              }
              label="หักภาษี ณ ที่จ่าย"
            />
          </Grid>
          {hasWithholdingTax && (
            <>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="อัตราภาษีหัก (%)"
                  value={withholdingTaxPercentage}
                  onChange={(e) => onWithholdingTaxPercentageChange?.(e.target.value)}
                  disabled={!isEditing}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small" disabled={!isEditing}>
                  <InputLabel>ฐานคำนวณ</InputLabel>
                  <Select
                    value={withholdingTaxBase}
                    onChange={(e) => onWithholdingTaxBaseChange?.(e.target.value)}
                    label="ฐานคำนวณ"
                  >
                    <MenuItem value="subtotal">ก่อน VAT</MenuItem>
                    <MenuItem value="total_after_vat">หลัง VAT</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
        </Grid>
      </Box>

      {/* Deposit Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          เงินมัดจำ
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small" disabled={!isEditing}>
              <InputLabel>รูปแบบมัดจำ</InputLabel>
              <Select
                value={depositMode || "percentage"}
                onChange={(e) => onDepositModeChange?.(e.target.value)}
                label="รูปแบบมัดจำ"
              >
                <MenuItem value="percentage">เปอร์เซ็นต์</MenuItem>
                <MenuItem value="amount">จำนวนเงิน</MenuItem>
                <MenuItem value={null}>ไม่มีมัดจำ</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {depositMode === "percentage" && (
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="เปอร์เซ็นต์มัดจำ"
                value={depositPercentage}
                onChange={(e) => onDepositPercentageChange?.(e.target.value)}
                disabled={!isEditing}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
              />
            </Grid>
          )}
          {depositMode === "amount" && (
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="จำนวนเงินมัดจำ"
                value={depositAmountInput}
                onChange={(e) => onDepositAmountInputChange?.(e.target.value)}
                disabled={!isEditing}
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>
          )}
          {depositMode && (
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small" disabled={!isEditing}>
                <InputLabel>แสดงใน PDF</InputLabel>
                <Select
                  value={depositDisplayOrder}
                  onChange={(e) => onDepositDisplayOrderChange?.(e.target.value)}
                  label="แสดงใน PDF"
                >
                  <MenuItem value="before">ก่อน VAT</MenuItem>
                  <MenuItem value="after">หลัง VAT</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Calculation Summary */}
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          สรุปการคำนวณ
        </Typography>

        <InvoiceCalcRow>
          <Typography>ยอดรวม (ก่อนส่วนลด)</Typography>
          <Typography>{formatTHB(subtotal)}</Typography>
        </InvoiceCalcRow>

        {discountUsed > 0 && (
          <InvoiceCalcRow>
            <Typography>หัก ส่วนลดพิเศษ</Typography>
            <Typography>-{formatTHB(discountUsed)}</Typography>
          </InvoiceCalcRow>
        )}

        <InvoiceCalcRow>
          <Typography>ยอดหลังหักส่วนลด</Typography>
          <Typography>{formatTHB(effectiveSubtotal)}</Typography>
        </InvoiceCalcRow>

        {hasVat && vatAmount > 0 && (
          <InvoiceCalcRow>
            <Typography>ภาษีมูลค่าเพิ่ม {vatPercentage}%</Typography>
            <Typography>{formatTHB(vatAmount)}</Typography>
          </InvoiceCalcRow>
        )}

        <InvoiceCalcRow>
          <Typography>ยอดรวมหลัง VAT</Typography>
          <Typography>{formatTHB(totalAmount)}</Typography>
        </InvoiceCalcRow>

        {hasWithholdingTax && withholdingTaxAmount > 0 && (
          <InvoiceCalcRow>
            <Typography>หัก ภาษี ณ ที่จ่าย {withholdingTaxPercentage}%</Typography>
            <Typography>-{formatTHB(withholdingTaxAmount)}</Typography>
          </InvoiceCalcRow>
        )}

        <InvoiceCalcRow className="InvoiceCalc-total">
          <Typography sx={{ fontSize: "1.1rem", fontWeight: 700 }}>ยอดรวมสุทธิ</Typography>
          <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: tokens.primary }}>
            {formatTHB(finalTotalAmount)}
          </Typography>
        </InvoiceCalcRow>

        {depositAmount > 0 && (
          <>
            <InvoiceCalcRow>
              <Typography>เงินมัดจำ</Typography>
              <Typography>{formatTHB(depositAmount)}</Typography>
            </InvoiceCalcRow>
            <InvoiceCalcRow>
              <Typography>คงเหลือ</Typography>
              <Typography>{formatTHB(remainingAmount)}</Typography>
            </InvoiceCalcRow>
          </>
        )}
      </Box>
    </InvoiceCalcPaper>
  );
});

export default InvoiceFinancialCalcBox;
