import React from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Card,
  CardContent,
  Fade,
  useTheme,
} from "@mui/material";
import {
  Percent as PercentIcon,
  AttachMoney as MoneyIcon,
  Info as InfoIcon,
  LocalOffer as OfferIcon,
} from "@mui/icons-material";
import { formatTHB } from "../../utils/currency";
import { sanitizeDecimal } from "../../../../../shared/inputSanitizers";
import { tokens } from "../../styles/quotationTheme";

const SpecialDiscountField = ({
  discountType = "percentage",
  discountValue = 0,
  totalAmount = 0,
  discountAmount = 0,
  onDiscountTypeChange,
  onDiscountValueChange,
  disabled = false,
}) => {
  const theme = useTheme();

  // Ensure all values are numbers to prevent errors
  const safeDiscountValue = Number(discountValue) || 0;
  const safeTotalAmount = Number(totalAmount) || 0;
  const safeDiscountAmount = Number(discountAmount) || 0;

  const discountTypeOptions = [
    {
      value: "percentage",
      label: "เปอร์เซ็นต์",
      icon: <PercentIcon fontSize="small" />,
      color: "#2196F3",
      placeholder: "0.00 %",
      maxValue: 100,
      helperText: "สูงสุด 100%",
    },
    {
      value: "amount",
      label: "จำนวนเงิน",
      icon: <MoneyIcon fontSize="small" />,
      color: "#4CAF50",
      placeholder: "0.00 บาท",
      maxValue: safeTotalAmount,
      helperText: `สูงสุด ${formatTHB(safeTotalAmount)}`,
    },
  ];

  const currentOption =
    discountTypeOptions.find((opt) => opt.value === discountType) || discountTypeOptions[0];

  const handleValueChange = (value) => {
    const numValue = Number(value) || 0;
    const sanitizedValue = sanitizeDecimal(numValue, 0, currentOption?.maxValue || 0);
    onDiscountValueChange?.(sanitizedValue);
  };

  const discountPercentage =
    discountType === "percentage"
      ? safeDiscountValue
      : safeTotalAmount > 0
        ? (safeDiscountAmount / safeTotalAmount) * 100
        : 0;

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
        transition: "all 0.3s ease",
        "&:hover": {
          borderColor: tokens.primary,
          boxShadow: `0 4px 20px ${tokens.primary}20`,
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
          <Box
            sx={{
              p: 1,
              borderRadius: "50%",
              bgcolor: `${tokens.primary}15`,
              color: tokens.primary,
            }}
          >
            <OfferIcon fontSize="small" />
          </Box>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight={700} color={tokens.primary}>
              ส่วนลดพิเศษ
            </Typography>
            <Typography variant="caption" color="text.secondary">
              เลือกประเภทส่วนลดและระบุจำนวน
            </Typography>
          </Box>
          {discountAmount > 0 && (
            <Chip
              label={`-${formatTHB(discountAmount)}`}
              size="small"
              sx={{
                bgcolor: "#ffebee",
                color: "#d32f2f",
                fontWeight: 700,
                "& .MuiChip-label": {
                  fontSize: "0.75rem",
                },
              }}
            />
          )}
        </Box>

        {/* Discount Type Selector */}
        <Grid container spacing={1} mb={2}>
          {discountTypeOptions.map((option) => (
            <Grid item xs={6} key={option.value}>
              <Box
                onClick={() => !disabled && onDiscountTypeChange?.(option.value)}
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  border: `2px solid ${discountType === option.value ? option.color : theme.palette.divider}`,
                  bgcolor: discountType === option.value ? `${option.color}08` : "transparent",
                  cursor: disabled ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  opacity: disabled ? 0.6 : 1,
                  "&:hover": !disabled
                    ? {
                        borderColor: option.color,
                        bgcolor: `${option.color}08`,
                      }
                    : {},
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ color: option.color }}>{option.icon}</Box>
                  <Typography
                    variant="body2"
                    fontWeight={discountType === option.value ? 700 : 500}
                    color={discountType === option.value ? option.color : "text.primary"}
                  >
                    {option.label}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Value Input */}
        <Box position="relative">
          <TextField
            fullWidth
            size="small"
            type="text"
            inputProps={{
              inputMode: "numeric",
              style: {
                textAlign: "center",
                fontSize: "1.1rem",
                fontWeight: 600,
              },
            }}
            value={String(safeDiscountValue || "")}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={currentOption.placeholder}
            disabled={disabled}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: theme.palette.background.paper,
                "&.Mui-focused": {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: currentOption.color,
                    borderWidth: 2,
                  },
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: currentOption.color,
              },
            }}
            InputProps={{
              startAdornment: (
                <Box sx={{ color: currentOption.color, mr: 1 }}>{currentOption.icon}</Box>
              ),
              endAdornment: discountValue > 0 && (
                <Tooltip title="ข้อมูลส่วนลด">
                  <IconButton size="small" sx={{ color: "text.secondary" }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ),
            }}
          />

          {/* Helper Text with Animation */}
          <Fade in={!!currentOption.helperText}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                textAlign: "center",
                mt: 0.5,
                minHeight: "1rem",
              }}
            >
              {currentOption.helperText}
            </Typography>
          </Fade>
        </Box>

        {/* Discount Summary */}
        {discountAmount > 0 && (
          <Fade in={true}>
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: "#fff3e0",
                border: "1px solid #ffb74d",
              }}
            >
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={8}>
                  <Typography variant="caption" color="#f57c00" fontWeight={600}>
                    ส่วนลด {Number(discountPercentage || 0).toFixed(2)}%
                    {discountType === "amount" && ` (${formatTHB(safeDiscountValue)})`}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" fontWeight={700} color="#d84315" textAlign="right">
                    -{formatTHB(safeDiscountAmount)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}
      </CardContent>
    </Card>
  );
};

export default SpecialDiscountField;
