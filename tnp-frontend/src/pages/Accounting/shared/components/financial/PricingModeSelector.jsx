import { MonetizationOn, Calculate, InfoOutlined } from "@mui/icons-material";
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Card,
  CardContent,
  Tooltip,
  Alert,
} from "@mui/material";

/**
 * PricingModeSelector Component
 *
 * Allows users to switch between two pricing calculation modes:
 * - 'net': Net price + VAT (standard calculation)
 * - 'vat_included': VAT-included price (reverse calculation to extract VAT)
 *
 * Used in government procurement where total price includes VAT
 * Example: 1,000 THB (VAT included) = 934.58 THB (net) + 65.42 THB (7% VAT)
 */
export default function PricingModeSelector({
  pricingMode = "net",
  onPricingModeChange,
  disabled = false,
}) {
  const handleChange = (event, newValue) => {
    if (newValue !== null) {
      onPricingModeChange?.(newValue);
    }
  };

  const getModeDescription = () => {
    if (pricingMode === "net") {
      return {
        title: "โหมดราคาสุทธิ + VAT",
        description: "กรอกราคาสุทธิ (ก่อน VAT) ระบบจะคำนวณ VAT เพิ่มให้",
        example: "ตัวอย่าง: 100 บาท + VAT 7% = 107 บาท",
        color: "info",
      };
    } else {
      return {
        title: "โหมดราคารวม VAT",
        description: "กรอกราคารวม VAT แล้ว ระบบจะแยก VAT ออกมาให้",
        example: "ตัวอย่าง: 107 บาท (รวม VAT) = 100 บาท (สุทธิ) + 7 บาท (VAT)",
        color: "success",
      };
    }
  };

  const modeInfo = getModeDescription();

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: disabled ? "action.disabled" : "divider",
        bgcolor: disabled ? "action.disabledBackground" : "background.paper",
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            โหมดคำนวณราคา
          </Typography>
          <Tooltip
            title="เลือกวิธีคำนวณราคา: แบบราคาสุทธิ+VAT (ปกติ) หรือแบบราคารวม VAT แล้ว (ใช้กับงานราชการ)"
            arrow
          >
            <InfoOutlined fontSize="small" color="action" />
          </Tooltip>
        </Box>

        <ToggleButtonGroup
          value={pricingMode}
          exclusive
          onChange={handleChange}
          disabled={disabled}
          fullWidth
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              py: 1.5,
              textTransform: "none",
              fontWeight: 500,
            },
            "& .Mui-selected": {
              fontWeight: 700,
            },
          }}
        >
          <ToggleButton value="net">
            <Calculate sx={{ mr: 1 }} fontSize="small" />
            <Box sx={{ textAlign: "left" }}>
              <Typography variant="body2" fontWeight="inherit">
                ราคาสุทธิ + VAT
              </Typography>
              <Typography variant="caption" color="text.secondary">
                (คำนวณ VAT เพิ่ม)
              </Typography>
            </Box>
          </ToggleButton>

          <ToggleButton value="vat_included">
            <MonetizationOn sx={{ mr: 1 }} fontSize="small" />
            <Box sx={{ textAlign: "left" }}>
              <Typography variant="body2" fontWeight="inherit">
                ราคารวม VAT
              </Typography>
              <Typography variant="caption" color="text.secondary">
                (แยก VAT ออกมา)
              </Typography>
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>

        <Alert
          severity={modeInfo.color}
          icon={false}
          sx={{
            mt: 2,
            py: 0.5,
            "& .MuiAlert-message": {
              width: "100%",
            },
          }}
        >
          <Typography variant="caption" fontWeight={600} display="block">
            {modeInfo.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {modeInfo.description}
          </Typography>
          <Typography
            variant="caption"
            sx={{ mt: 0.5, display: "block", fontStyle: "italic" }}
            color="text.secondary"
          >
            {modeInfo.example}
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
}
