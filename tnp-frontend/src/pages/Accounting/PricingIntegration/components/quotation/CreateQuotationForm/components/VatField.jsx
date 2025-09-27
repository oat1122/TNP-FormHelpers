import {
  Percent as VatIcon,
  Info as InfoIcon,
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
import React, { useState } from "react";

import { sanitizeDecimal } from "../../../../../shared/inputSanitizers";
import { tokens } from "../../styles/quotationTheme";
import { formatTHB } from "../../utils/currency";

const VatField = ({
  hasVat = true,
  vatPercentage = 7,
  vatAmount = 0,
  subtotalAmount = 0,
  onToggleVat,
  onVatPercentageChange,
  disabled = false,
}) => {
  const theme = useTheme();
  const [showDetails, setShowDetails] = useState(false);

  // Common VAT rates in Thailand
  const commonVatRates = [
    { value: 0, label: "0%", desc: "ยกเว้นภาษี" },
    { value: 7, label: "7%", desc: "อัตราปกติ" },
    { value: 10, label: "10%", desc: "อัตราพิเศษ" },
  ];

  const handleVatRateSelect = (rate) => {
    onVatPercentageChange?.(rate);
  };

  const handlePercentageChange = (value) => {
    const sanitizedValue = sanitizeDecimal(value, 0, 100);
    onVatPercentageChange?.(sanitizedValue);
  };

  const calculatedVatAmount = subtotalAmount * (vatPercentage / 100);

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        background: hasVat
          ? `linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)`
          : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
        transition: "all 0.3s ease",
        "&:hover": {
          borderColor: hasVat ? "#4caf50" : tokens.primary,
          boxShadow: hasVat
            ? "0 4px 20px rgba(76, 175, 80, 0.2)"
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
              bgcolor: hasVat ? "#4caf50" : theme.palette.grey[300],
              color: hasVat ? "white" : theme.palette.grey[600],
              transition: "all 0.3s ease",
            }}
          >
            <VatIcon fontSize="small" />
          </Box>
          <Box flex={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={hasVat}
                  onChange={(e) => onToggleVat?.(e.target.checked)}
                  disabled={disabled}
                  color="success"
                  size="small"
                />
              }
              label={
                <Typography variant="subtitle1" fontWeight={600}>
                  ภาษีมูลค่าเพิ่ม (VAT)
                </Typography>
              }
            />
          </Box>
          <Tooltip title={hasVat ? "คำนวณภาษีมูลค่าเพิ่ม" : "ไม่คิดภาษีมูลค่าเพิ่ม"}>
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* VAT Summary */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary">
              อัตราภาษี: {vatPercentage}%
            </Typography>
          </Box>
          <Chip
            icon={<CalculateIcon fontSize="small" />}
            label={`VAT: ${formatTHB(hasVat ? calculatedVatAmount : 0)}`}
            size="small"
            color={hasVat ? "success" : "default"}
            variant={hasVat ? "filled" : "outlined"}
          />
        </Box>

        {/* Toggle Details */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="caption" color="text.secondary">
            {hasVat ? "ปรับแต่งอัตราภาษี" : "การตั้งค่าภาษี"}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setShowDetails(!showDetails)}
            disabled={disabled}
            sx={{
              transform: showDetails ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* VAT Details - Expanded */}
        <Collapse in={hasVat}>
          <Box>
            {/* Quick Rate Selector */}
            <Collapse in={showDetails}>
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  อัตราภาษีทั่วไป
                </Typography>
                <Grid container spacing={1}>
                  {commonVatRates.map((rate) => (
                    <Grid item xs={4} key={rate.value}>
                      <Box
                        onClick={() => !disabled && handleVatRateSelect(rate.value)}
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          border: `1px solid ${vatPercentage === rate.value ? "#4caf50" : theme.palette.divider}`,
                          bgcolor: vatPercentage === rate.value ? "#e8f5e8" : "transparent",
                          cursor: disabled ? "not-allowed" : "pointer",
                          transition: "all 0.2s ease",
                          opacity: disabled ? 0.6 : 1,
                          "&:hover": !disabled
                            ? {
                                borderColor: "#4caf50",
                                bgcolor: "#f1f8e9",
                              }
                            : {},
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={vatPercentage === rate.value ? 700 : 500}
                          color={vatPercentage === rate.value ? "#2e7d32" : "text.primary"}
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
                value={String(vatPercentage || "")}
                onChange={(e) => handlePercentageChange(e.target.value)}
                placeholder="7.00"
                disabled={disabled}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: theme.palette.background.paper,
                    "&.Mui-focused": {
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#4caf50",
                        borderWidth: 2,
                      },
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#4caf50",
                  },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  bgcolor: theme.palette.background.paper,
                  px: 0.5,
                }}
              >
                %
              </Typography>
            </Box>

            {/* Calculation Display */}
            <Fade in={hasVat}>
              <Box
                sx={{
                  bgcolor: "#f9fdf9",
                  borderRadius: 1,
                  p: 1.5,
                  border: `1px solid ${theme.palette.success.light}`,
                }}
              >
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  การคำนวณ VAT
                </Typography>
                <Grid container spacing={1} sx={{ fontSize: "0.875rem" }}>
                  <Grid item xs={6}>
                    <Typography variant="body2">ฐานภาษี:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" textAlign="right" fontWeight={600}>
                      {formatTHB(subtotalAmount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">VAT {vatPercentage}%:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      variant="body2"
                      textAlign="right"
                      fontWeight={600}
                      color="success.main"
                    >
                      {formatTHB(calculatedVatAmount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 0.5, mt: 0.5 }}>
                      <Grid container>
                        <Grid item xs={6}>
                          <Typography variant="body2" fontWeight={700}>
                            ยอดรวม VAT:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            textAlign="right"
                            fontWeight={700}
                            color="success.main"
                          >
                            {formatTHB(subtotalAmount + calculatedVatAmount)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Fade>
          </Box>
        </Collapse>

        {/* Help text when VAT is disabled */}
        <Collapse in={!hasVat}>
          <Box
            sx={{
              bgcolor: theme.palette.grey[50],
              borderRadius: 1,
              p: 1.5,
              textAlign: "center",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              ไม่คิดภาษีมูลค่าเพิ่ม (ยกเว้นภาษี หรือสินค้าไม่มี VAT)
            </Typography>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default VatField;
