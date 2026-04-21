import {
  AccountBalance as TaxIcon,
  Calculate as CalculateIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Card,
  CardContent,
  Fade,
  IconButton,
  Tooltip,
  useTheme,
  Collapse,
} from "@mui/material";
import { useState } from "react";

import { createDecimalInputHandler } from "../../inputSanitizers";
import { tokens } from "../../styles/tokens";
import { formatTHB } from "../../utils/format";

const WithholdingTaxField = ({
  hasWithholdingTax = false,
  taxPercentage = 0,
  taxAmount = 0,
  subtotalAmount = 0,
  onToggleWithholdingTax,
  onTaxPercentageChange,
  disabled = false,
}) => {
  const theme = useTheme();
  const [showDetails, setShowDetails] = useState(false);

  const commonTaxRates = [
    { value: 1, label: "1%", desc: "ขนส่ง/โฆษณา" },
    { value: 3, label: "3%", desc: "บริการ/รับจ้าง" },
    { value: 5, label: "5%", desc: "ค่าเช่า" },
    { value: 10, label: "10%", desc: "วิชาชีพอิสระ" },
  ];

  const handleTaxRateSelect = (rate) => {
    onTaxPercentageChange?.(rate);
  };

  const handlePercentageChange = (value) => {
    const numValue = parseFloat(value) || 0;
    // จำกัดค่าไม่ให้เกิน 10%
    const clampedValue = Math.min(Math.max(numValue, 0), 10);
    onTaxPercentageChange?.(clampedValue);
  };

  const calculatedTaxAmount = subtotalAmount * (taxPercentage / 100);

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        background: hasWithholdingTax
          ? `linear-gradient(135deg, ${tokens.warningLighter} 0%, ${tokens.warningSoft} 100%)`
          : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
        transition: "all 0.3s ease",
        "&:hover": {
          borderColor: hasWithholdingTax ? tokens.warning : tokens.primary,
          boxShadow: hasWithholdingTax
            ? "0 4px 20px rgba(255, 152, 0, 0.2)"
            : `0 4px 20px ${tokens.primary}20`,
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header with Toggle */}
        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
          <Box
            sx={{
              p: 1,
              borderRadius: "50%",
              bgcolor: hasWithholdingTax ? tokens.warningSoft : `${tokens.primary}15`,
              color: hasWithholdingTax ? tokens.warning : tokens.primary,
            }}
          >
            <TaxIcon fontSize="small" />
          </Box>
          <Box flex={1}>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              color={hasWithholdingTax ? tokens.warningDark : tokens.primary}
            >
              ภาษีหัก ณ ที่จ่าย
            </Typography>
            <Typography variant="caption" color="text.secondary">
              คำนวณจากยอดก่อนภาษี {formatTHB(subtotalAmount)}
            </Typography>
          </Box>
          {taxAmount > 0 && (
            <Chip
              label={`-${formatTHB(taxAmount)}`}
              size="small"
              sx={{
                bgcolor: tokens.warningSoft,
                color: tokens.warningDark,
                fontWeight: 700,
                "& .MuiChip-label": {
                  fontSize: "0.75rem",
                },
              }}
            />
          )}
        </Box>

        {/* Toggle Switch */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={hasWithholdingTax ? 2 : 0}
        >
          <FormControlLabel
            control={
              <Switch
                checked={hasWithholdingTax}
                onChange={(e) => onToggleWithholdingTax?.(e.target.checked)}
                disabled={disabled}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: tokens.warning,
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: tokens.warning,
                  },
                }}
              />
            }
            label={
              <Typography
                variant="body2"
                fontWeight={600}
                color={hasWithholdingTax ? tokens.warningDark : "text.secondary"}
              >
                {hasWithholdingTax ? "มีการหักภาษี ณ ที่จ่าย" : "ไม่มีการหักภาษี ณ ที่จ่าย"}
              </Typography>
            }
          />

          {hasWithholdingTax && (
            <Tooltip title="ดูข้อมูลอัตราภาษี">
              <IconButton
                size="small"
                onClick={() => setShowDetails(!showDetails)}
                sx={{
                  color: tokens.warningDark,
                  transform: showDetails ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              >
                <ExpandMoreIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Tax Details - Expanded */}
        <Collapse in={hasWithholdingTax}>
          <Box>
            {/* Quick Rate Selector */}
            <Collapse in={showDetails}>
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  อัตราภาษีทั่วไป
                </Typography>
                <Grid container spacing={1}>
                  {commonTaxRates.map((rate) => (
                    <Grid item xs={6} md={3} key={rate.value}>
                      <Box
                        onClick={() => !disabled && handleTaxRateSelect(rate.value)}
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          border: `1px solid ${taxPercentage === rate.value ? tokens.warning : theme.palette.divider}`,
                          bgcolor:
                            taxPercentage === rate.value ? tokens.warningSoft : "transparent",
                          cursor: disabled ? "not-allowed" : "pointer",
                          transition: "all 0.2s ease",
                          opacity: disabled ? 0.6 : 1,
                          "&:hover": !disabled
                            ? {
                                borderColor: tokens.warning,
                                bgcolor: tokens.warningLighter,
                              }
                            : {},
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={taxPercentage === rate.value ? 700 : 500}
                          color={taxPercentage === rate.value ? tokens.warningDark : "text.primary"}
                          textAlign="center"
                        >
                          {rate.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          textAlign="center"
                          display="block"
                        >
                          {rate.desc}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Collapse>

            {/* Custom Percentage Input */}
            <Box position="relative" mb={2}>
              <TextField
                fullWidth
                size="small"
                type="text"
                label="อัตราภาษี (%)"
                inputProps={{
                  inputMode: "numeric",
                  style: {
                    textAlign: "center",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                  },
                }}
                value={String(taxPercentage || "")}
                onChange={createDecimalInputHandler(handlePercentageChange)}
                placeholder="0.00"
                disabled={disabled}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: theme.palette.background.paper,
                    "&.Mui-focused": {
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: tokens.warning,
                        borderWidth: 2,
                      },
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: tokens.warning,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ color: tokens.warning, mr: 1 }}>
                      <CalculateIcon fontSize="small" />
                    </Box>
                  ),
                  endAdornment: (
                    <Typography variant="body2" color={tokens.warning} fontWeight={600}>
                      %
                    </Typography>
                  ),
                }}
              />

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "block",
                  textAlign: "center",
                  mt: 0.5,
                }}
              >
                สูงสุด 10% • ตามอัตราภาษีอากร
              </Typography>
            </Box>

            {/* Calculation Display */}
            {taxPercentage > 0 && (
              <Fade in={true}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    bgcolor: tokens.warningLighter,
                    border: `1px solid ${tokens.warningAccent}`,
                  }}
                >
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <CalculateIcon fontSize="small" sx={{ color: tokens.warningDark }} />
                        <Typography variant="subtitle2" color={tokens.warningDark} fontWeight={700}>
                          การคำนวณ
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={8}>
                      <Typography variant="caption" color={tokens.warningDark}>
                        ยอดก่อนภาษี × {taxPercentage}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatTHB(subtotalAmount)} × {taxPercentage}%
                      </Typography>
                    </Grid>

                    <Grid item xs={4}>
                      <Typography
                        variant="body1"
                        fontWeight={700}
                        color={tokens.warningDeep}
                        textAlign="right"
                      >
                        -{formatTHB(calculatedTaxAmount)}
                      </Typography>
                    </Grid>
                  </Grid>

                  {Math.abs(calculatedTaxAmount - taxAmount) > 0.01 && (
                    <Box mt={1} pt={1} borderTop={`1px solid ${tokens.warningAccent}`}>
                      <Typography variant="caption" color={tokens.warningDark}>
                        💡 ยอดที่แสดงอาจแตกต่างเล็กน้อยจากการปัดเศษ
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Fade>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default WithholdingTaxField;
