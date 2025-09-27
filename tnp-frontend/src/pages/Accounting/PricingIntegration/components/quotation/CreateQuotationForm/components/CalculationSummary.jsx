import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from "@mui/icons-material";
import { Box, Grid, Typography, Divider, Card, CardContent, useTheme } from "@mui/material";
import React from "react";

import { tokens } from "../../styles/quotationTheme";
import { formatTHB } from "../../utils/currency";

const CalculationSummary = ({
  subtotal = 0,
  specialDiscountAmount = 0,
  netAfterDiscount = 0, // discounted subtotal (base for VAT & WHT)
  vat = 0,
  total = 0, // discountedSubtotal + VAT
  withholdingTaxAmount = 0,
  finalTotal = 0,
  showDetailed = true,
}) => {
  const theme = useTheme();

  const LineItem = ({
    label,
    amount,
    isDeduction = false,
    isSubtotal = false,
    isFinal = false,
    description,
  }) => (
    <Grid container alignItems="center" spacing={1} sx={{ py: isSubtotal || isFinal ? 1 : 0.5 }}>
      <Grid item xs={7}>
        <Box display="flex" alignItems="center" gap={1}>
          {isDeduction && (
            <TrendingDownIcon
              fontSize="small"
              sx={{ color: isDeduction ? "#d32f2f" : "#388e3c" }}
            />
          )}
          <Box>
            <Typography
              variant={isFinal ? "h6" : isSubtotal ? "subtitle1" : "body2"}
              fontWeight={isFinal ? 800 : isSubtotal ? 700 : 500}
              color={isFinal ? tokens.primary : isDeduction ? "#d32f2f" : "text.primary"}
            >
              {label}
            </Typography>
            {description && (
              <Typography variant="caption" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
        </Box>
      </Grid>
      <Grid item xs={5}>
        <Typography
          variant={isFinal ? "h6" : isSubtotal ? "subtitle1" : "body2"}
          fontWeight={isFinal ? 800 : isSubtotal ? 700 : 600}
          textAlign="right"
          color={
            isFinal
              ? tokens.primary
              : isDeduction
                ? "#d32f2f"
                : isSubtotal
                  ? "text.primary"
                  : "text.secondary"
          }
        >
          {isDeduction ? "-" : ""}
          {formatTHB(Math.abs(amount))}
        </Typography>
      </Grid>
    </Grid>
  );

  const SectionDivider = ({ thick = false }) => (
    <Grid item xs={12}>
      <Divider
        sx={{
          my: thick ? 1.5 : 0.5,
          borderWidth: thick ? 2 : 1,
          borderColor: thick ? tokens.primary : theme.palette.divider,
        }}
      />
    </Grid>
  );

  return (
    <Card
      elevation={0}
      sx={{
        border: `2px solid ${tokens.primary}`,
        borderRadius: 2,
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, #f8f9ff 100%)`,
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Header Badge */}
      <Box
        sx={{
          position: "absolute",
          top: -12,
          left: 20,
          bgcolor: tokens.primary,
          color: "white",
          px: 2,
          py: 0.5,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <TrendingUpIcon fontSize="small" />
        <Typography variant="caption" fontWeight={700}>
          สรุปยอดเงิน
        </Typography>
      </Box>

      <CardContent sx={{ pt: 3, pb: 2 }}>
        <Grid container>
          {/* Basic Calculation */}
          <LineItem
            label="ยอดก่อนภาษี"
            amount={subtotal}
            description="รวมราคาสินค้าทั้งหมด (ก่อนส่วนลด)"
          />
          {specialDiscountAmount > 0 && (
            <LineItem
              label="ส่วนลดพิเศษ"
              amount={specialDiscountAmount}
              isDeduction
              description="หักออกจากยอดก่อนภาษี"
            />
          )}
          <LineItem label="ฐานคำนวณภาษี (หลังส่วนลด)" amount={netAfterDiscount} isSubtotal />
          <LineItem
            label="VAT 7%"
            amount={vat}
            description={`คำนวณจาก ${formatTHB(netAfterDiscount)} x 7%`}
          />
          <SectionDivider />
          <LineItem label="ยอดรวมหลัง VAT" amount={total} isSubtotal />
          {withholdingTaxAmount > 0 && (
            <LineItem
              label="ภาษีหัก ณ ที่จ่าย"
              amount={withholdingTaxAmount}
              isDeduction
              description={`คำนวณจากฐานหลังส่วนลด ${formatTHB(netAfterDiscount)}`}
            />
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default CalculationSummary;
