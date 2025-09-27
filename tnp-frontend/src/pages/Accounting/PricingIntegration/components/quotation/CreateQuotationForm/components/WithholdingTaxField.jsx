import React, { useState } from "react";
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
import {
  AccountBalance as TaxIcon,
  Info as InfoIcon,
  Calculate as CalculateIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { formatTHB } from "../../utils/currency";
import { sanitizeDecimal } from "../../../../../shared/inputSanitizers";
import { tokens } from "../../styles/quotationTheme";

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
    { value: 1, label: "1%" },
    { value: 3, label: "3%" },
    { value: 5, label: "5%" },
    { value: 10, label: "10%" },
  ];

  const handleTaxRateSelect = (rate) => {
    onTaxPercentageChange?.(rate);
  };

  const handlePercentageChange = (value) => {
    const sanitizedValue = sanitizeDecimal(value, 0, 10);
    onTaxPercentageChange?.(sanitizedValue);
  };

  const calculatedTaxAmount = subtotalAmount * (taxPercentage / 100);

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        background: hasWithholdingTax
          ? `linear-gradient(135deg, #fff8e1 0%, #fff3e0 100%)`
          : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
        transition: "all 0.3s ease",
        "&:hover": {
          borderColor: hasWithholdingTax ? "#ff9800" : tokens.primary,
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
              bgcolor: hasWithholdingTax ? "#fff3e0" : `${tokens.primary}15`,
              color: hasWithholdingTax ? "#ff9800" : tokens.primary,
            }}
          >
            <TaxIcon fontSize="small" />
          </Box>
          <Box flex={1}>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              color={hasWithholdingTax ? "#f57c00" : tokens.primary}
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
                bgcolor: "#fff3e0",
                color: "#f57c00",
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
                    color: "#ff9800",
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#ff9800",
                  },
                }}
              />
            }
            label={
              <Typography
                variant="body2"
                fontWeight={600}
                color={hasWithholdingTax ? "#f57c00" : "text.secondary"}
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
                  color: "#f57c00",
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
                          border: `1px solid ${taxPercentage === rate.value ? "#ff9800" : theme.palette.divider}`,
                          bgcolor: taxPercentage === rate.value ? "#fff3e0" : "transparent",
                          cursor: disabled ? "not-allowed" : "pointer",
                          transition: "all 0.2s ease",
                          opacity: disabled ? 0.6 : 1,
                          "&:hover": !disabled
                            ? {
                                borderColor: "#ff9800",
                                bgcolor: "#fff8e1",
                              }
                            : {},
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={taxPercentage === rate.value ? 700 : 500}
                          color={taxPercentage === rate.value ? "#f57c00" : "text.primary"}
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
                onChange={(e) => handlePercentageChange(e.target.value)}
                placeholder="0.00"
                disabled={disabled}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: theme.palette.background.paper,
                    "&.Mui-focused": {
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ff9800",
                        borderWidth: 2,
                      },
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#ff9800",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ color: "#ff9800", mr: 1 }}>
                      <CalculateIcon fontSize="small" />
                    </Box>
                  ),
                  endAdornment: (
                    <Typography variant="body2" color="#ff9800" fontWeight={600}>
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
                    bgcolor: "#fff8e1",
                    border: "1px solid #ffcc02",
                  }}
                >
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <CalculateIcon fontSize="small" sx={{ color: "#f57c00" }} />
                        <Typography variant="subtitle2" color="#f57c00" fontWeight={700}>
                          การคำนวณ
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={8}>
                      <Typography variant="caption" color="#f57c00">
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
                        color="#d84315"
                        textAlign="right"
                      >
                        -{formatTHB(calculatedTaxAmount)}
                      </Typography>
                    </Grid>
                  </Grid>

                  {Math.abs(calculatedTaxAmount - taxAmount) > 0.01 && (
                    <Box mt={1} pt={1} borderTop="1px solid #ffcc02">
                      <Typography variant="caption" color="#f57c00">
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
