import React, { useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  TextField,
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  InputAdornment,
  Chip,
} from "@mui/material";

/**
 * FinancialSummaryPanel Component
 * แสดงและจัดการการคำนวณทางการเงินแบบ real-time
 */
const FinancialSummaryPanel = ({ items = [], financials, onChange }) => {
  // คำนวณ subtotal จาก items
  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const gross = (item.unit_price || 0) * (item.quantity || 0);
      const discount = item.discount_amount || 0;
      return sum + Math.max(0, gross - discount);
    }, 0);
  }, [items]);

  // คำนวณส่วนลดพิเศษ
  const specialDiscountAmount = useMemo(() => {
    if (financials.special_discount_amount > 0) {
      return financials.special_discount_amount;
    }
    return (itemsSubtotal * (financials.special_discount_percentage || 0)) / 100;
  }, [itemsSubtotal, financials.special_discount_percentage, financials.special_discount_amount]);

  // ยอดหลังหักส่วนลดพิเศษ
  const subtotalAfterDiscount = useMemo(() => {
    return Math.max(0, itemsSubtotal - specialDiscountAmount);
  }, [itemsSubtotal, specialDiscountAmount]);

  // คำนวณ VAT
  const vatAmount = useMemo(() => {
    if (!financials.has_vat) return 0;
    return (subtotalAfterDiscount * (financials.vat_percentage || 7)) / 100;
  }, [subtotalAfterDiscount, financials.has_vat, financials.vat_percentage]);

  // คำนวณ total_amount
  const totalAmount = useMemo(() => {
    return subtotalAfterDiscount + vatAmount;
  }, [subtotalAfterDiscount, vatAmount]);

  // คำนวณภาษีหัก ณ ที่จ่าย
  const withholdingTaxAmount = useMemo(() => {
    if (!financials.has_withholding_tax) return 0;
    return (subtotalAfterDiscount * (financials.withholding_tax_percentage || 0)) / 100;
  }, [
    subtotalAfterDiscount,
    financials.has_withholding_tax,
    financials.withholding_tax_percentage,
  ]);

  // คำนวณยอดสุทธิสุดท้าย
  const finalTotalAmount = useMemo(() => {
    return totalAmount - withholdingTaxAmount;
  }, [totalAmount, withholdingTaxAmount]);

  // คำนวณเงินมัดจำ
  const depositAmount = useMemo(() => {
    if (financials.deposit_mode === "amount") {
      return financials.deposit_amount || 0;
    }
    return (subtotalAfterDiscount * (financials.deposit_percentage || 0)) / 100;
  }, [
    subtotalAfterDiscount,
    financials.deposit_mode,
    financials.deposit_percentage,
    financials.deposit_amount,
  ]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  const handleChange = (field, value) => {
    onChange({ ...financials, [field]: value });
  };

  return (
    <Paper sx={{ p: 3 }} variant="outlined">
      <Typography variant="h6" gutterBottom color="primary">
        สรุปการคำนวณทางการเงิน
      </Typography>

      {/* Subtotal from Items */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            ยอดรวมจากรายการสินค้า
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            ฿{formatCurrency(itemsSubtotal)}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Special Discount */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          ส่วนลดพิเศษ
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <TextField
            label="ส่วนลดพิเศษ (%)"
            type="number"
            value={financials.special_discount_percentage || 0}
            onChange={(e) => {
              const percentage = parseFloat(e.target.value) || 0;
              handleChange("special_discount_percentage", percentage);
              handleChange("special_discount_amount", (itemsSubtotal * percentage) / 100);
            }}
            size="small"
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
          <TextField
            label="จำนวนส่วนลดพิเศษ"
            type="number"
            value={financials.special_discount_amount || 0}
            onChange={(e) => {
              const amount = parseFloat(e.target.value) || 0;
              handleChange("special_discount_amount", amount);
              handleChange(
                "special_discount_percentage",
                itemsSubtotal > 0 ? (amount / itemsSubtotal) * 100 : 0
              );
            }}
            size="small"
            inputProps={{ min: 0, step: 0.01 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">฿</InputAdornment>,
            }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
          ยอดหลังหักส่วนลดพิเศษ: ฿{formatCurrency(subtotalAfterDiscount)}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* VAT */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={financials.has_vat ?? true}
                onChange={(e) => handleChange("has_vat", e.target.checked)}
                color="primary"
              />
            }
            label="คิด VAT"
          />
          {financials.has_vat && (
            <Chip
              label={`VAT ${financials.vat_percentage || 7}%`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
        {financials.has_vat && (
          <TextField
            label="เปอร์เซ็นต์ VAT"
            type="number"
            value={financials.vat_percentage || 7}
            onChange={(e) => handleChange("vat_percentage", parseFloat(e.target.value) || 0)}
            size="small"
            fullWidth
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            จำนวน VAT
          </Typography>
          <Typography
            variant="body1"
            fontWeight={500}
            color={financials.has_vat ? "primary" : "text.disabled"}
          >
            ฿{formatCurrency(vatAmount)}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Total Amount */}
      <Box sx={{ mb: 2, bgcolor: "primary.50", p: 2, borderRadius: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" fontWeight={600}>
            ยอดรวมทั้งสิ้น (รวม VAT)
          </Typography>
          <Typography variant="h6" fontWeight={700} color="primary">
            ฿{formatCurrency(totalAmount)}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Withholding Tax */}
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={financials.has_withholding_tax || false}
              onChange={(e) => handleChange("has_withholding_tax", e.target.checked)}
              color="secondary"
            />
          }
          label="หักภาษี ณ ที่จ่าย"
        />
        {financials.has_withholding_tax && (
          <TextField
            label="เปอร์เซ็นต์ภาษีหัก ณ ที่จ่าย"
            type="number"
            value={financials.withholding_tax_percentage || 0}
            onChange={(e) =>
              handleChange("withholding_tax_percentage", parseFloat(e.target.value) || 0)
            }
            size="small"
            fullWidth
            inputProps={{ min: 0, max: 10, step: 0.5 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            sx={{ mt: 1 }}
          />
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            จำนวนภาษีหัก ณ ที่จ่าย
          </Typography>
          <Typography
            variant="body1"
            fontWeight={500}
            color={financials.has_withholding_tax ? "error" : "text.disabled"}
          >
            ฿{formatCurrency(withholdingTaxAmount)}
          </Typography>
        </Box>
      </Box>

      {financials.has_withholding_tax && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mb: 2, bgcolor: "success.50", p: 2, borderRadius: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="subtitle1" fontWeight={600}>
                ยอดสุทธิสุดท้าย (หลังหักภาษี ณ ที่จ่าย)
              </Typography>
              <Typography variant="h6" fontWeight={700} color="success.main">
                ฿{formatCurrency(finalTotalAmount)}
              </Typography>
            </Box>
          </Box>
        </>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Deposit */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          เงินมัดจำ
        </Typography>
        <RadioGroup
          row
          value={financials.deposit_mode || "percentage"}
          onChange={(e) => handleChange("deposit_mode", e.target.value)}
        >
          <FormControlLabel value="percentage" control={<Radio />} label="เป็นเปอร์เซ็นต์" />
          <FormControlLabel value="amount" control={<Radio />} label="เป็นจำนวนเงิน" />
        </RadioGroup>

        {financials.deposit_mode === "percentage" ? (
          <TextField
            label="เปอร์เซ็นต์เงินมัดจำ"
            type="number"
            value={financials.deposit_percentage || 0}
            onChange={(e) => handleChange("deposit_percentage", parseFloat(e.target.value) || 0)}
            size="small"
            fullWidth
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        ) : (
          <TextField
            label="จำนวนเงินมัดจำ"
            type="number"
            value={financials.deposit_amount || 0}
            onChange={(e) => handleChange("deposit_amount", parseFloat(e.target.value) || 0)}
            size="small"
            fullWidth
            inputProps={{ min: 0, step: 0.01 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">฿</InputAdornment>,
            }}
          />
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            จำนวนเงินมัดจำ
          </Typography>
          <Typography variant="body1" fontWeight={600} color="warning.main">
            ฿{formatCurrency(depositAmount)}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
          คำนวณจาก: ยอดหลังหักส่วนลดพิเศษ (ก่อน VAT)
        </Typography>
      </Box>
    </Paper>
  );
};

export default FinancialSummaryPanel;
