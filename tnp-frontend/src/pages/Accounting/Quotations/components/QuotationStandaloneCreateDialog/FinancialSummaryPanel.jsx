import React from "react";
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
import { useFinancialCalculations } from "./hooks/useFinancialCalculations";
import { formatTHB } from "./utils/formatting";

/**
 * FinancialSummaryPanel Component (Dumb UI)
 * แสดงผลการคำนวณทางการเงิน
 */
const FinancialSummaryPanel = ({ items = [], financials, onChange }) => {
  const {
    itemsSubtotal,
    subtotalAfterDiscount,
    vatAmount,
    totalAmount,
    withholdingTaxAmount,
    finalTotalAmount,
    depositAmount,
  } = useFinancialCalculations(items, financials);

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
            ฿{formatTHB(itemsSubtotal)}
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
          ยอดหลังหักส่วนลดพิเศษ: ฿{formatTHB(subtotalAfterDiscount)}
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
            ฿{formatTHB(vatAmount)}
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
            ฿{formatTHB(totalAmount)}
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
            ฿{formatTHB(withholdingTaxAmount)}
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
                ฿{formatTHB(finalTotalAmount)}
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
            ฿{formatTHB(depositAmount)}
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
