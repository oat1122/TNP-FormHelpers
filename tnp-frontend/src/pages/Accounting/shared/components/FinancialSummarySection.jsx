import {
  Calculate as CalculateIcon,
  MonetizationOn as MonetizationOnIcon,
  Percent as PercentIcon,
  Payment as PaymentIcon,
} from "@mui/icons-material";
import { Box, Typography, Avatar, Grid, Divider, Chip } from "@mui/material";
import React from "react";

import {
  Section,
  SectionHeader,
  InfoCard,
  tokens,
} from "../../PricingIntegration/components/quotation/styles/quotationTheme";

// Format number to Thai currency format
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "-";
  const num = parseFloat(amount);
  return num.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Format percentage
const formatPercent = (percent) => {
  if (!percent && percent !== 0) return "-";
  return `${parseFloat(percent).toFixed(2)}%`;
};

/**
 * FinancialSummarySection (Shared Component)
 * Display financial summary, amounts and calculations for invoices
 */
const FinancialSummarySection = ({ invoice }) => {
  // Calculate values
  const subtotal = parseFloat(invoice?.subtotal || 0);
  const netSubtotal = parseFloat(invoice?.net_subtotal || 0);
  const specialDiscountAmount = parseFloat(invoice?.special_discount_amount || 0);
  const vatAmount = parseFloat(invoice?.vat_amount || 0);
  const withholdingTaxAmount = parseFloat(invoice?.withholding_tax_amount || 0);
  const finalTotalAmount = parseFloat(invoice?.final_total_amount || 0);
  const depositAmount = parseFloat(invoice?.deposit_amount || 0);
  const paidAmount = parseFloat(invoice?.paid_amount || 0);
  const remainingAmount = finalTotalAmount - paidAmount;

  // Get percentages
  const specialDiscountPercentage = parseFloat(invoice?.special_discount_percentage || 0);
  const vatPercentage = parseFloat(invoice?.vat_percentage || 0);
  const withholdingTaxPercentage = parseFloat(invoice?.withholding_tax_percentage || 0);
  const depositPercentage = parseFloat(invoice?.deposit_percentage || 0);

  // Get boolean flags and pricing mode
  const hasVat = invoice?.has_vat;
  const hasWithholdingTax = invoice?.has_withholding_tax;
  const isDepositMode = invoice?.deposit_mode;
  const pricingMode = invoice?.pricing_mode || "net";
  const isVatIncluded = pricingMode === "vat_included";

  // Calculate discounted base
  const discountedBase = subtotal - specialDiscountAmount;

  return (
    <Section>
      <SectionHeader>
        <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
          <CalculateIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            สรุปการเงิน
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ยอดเงินและการคำนวณ
          </Typography>
        </Box>
      </SectionHeader>

      <Box sx={{ p: 2 }}>
        {/* Main Calculation */}
        <InfoCard sx={{ p: 2, mb: 2 }}>
          <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1.5}>
            การคำนวณยอดเงิน
          </Typography>

          {isVatIncluded && hasVat && (
            <Box sx={{ mb: 1.5, p: 1, bgcolor: "info.50", borderRadius: 1 }}>
              <Typography variant="caption" fontWeight={600} color="info.main">
                โหมดราคารวม VAT: ราคาที่กรอกรวม VAT {formatPercent(vatPercentage)} แล้ว
              </Typography>
            </Box>
          )}

          <Grid container spacing={1}>
            {/* Subtotal */}
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                ยอดก่อนภาษี (ก่อนส่วนลด)
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" textAlign="right" fontWeight={600}>
                ฿{formatCurrency(subtotal)}
              </Typography>
            </Grid>

            {/* Special Discount */}
            {specialDiscountAmount > 0 && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="error.main">
                    ส่วนลดพิเศษ{" "}
                    {specialDiscountPercentage > 0 &&
                      `(${formatPercent(specialDiscountPercentage)})`}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" textAlign="right" color="error.main" fontWeight={600}>
                    -฿{formatCurrency(specialDiscountAmount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    {isVatIncluded ? "ยอดหลังส่วนลด (รวม VAT)" : "ยอดหลังส่วนลด"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" textAlign="right" fontWeight={600}>
                    ฿{formatCurrency(discountedBase)}
                  </Typography>
                </Grid>
              </>
            )}

            {/* Net Subtotal (VAT Included mode only) */}
            {isVatIncluded && hasVat && netSubtotal > 0 && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="primary.main" fontWeight={600}>
                    → ยอดสุทธิ (แยก VAT ออก)
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography
                    variant="body2"
                    textAlign="right"
                    fontWeight={700}
                    color="primary.main"
                  >
                    ฿{formatCurrency(netSubtotal)}
                  </Typography>
                </Grid>
              </>
            )}

            {/* VAT */}
            {hasVat && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    VAT {formatPercent(vatPercentage)}
                    {isVatIncluded && " (แยกออกมา)"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" textAlign="right" fontWeight={600}>
                    ฿{formatCurrency(vatAmount)}
                  </Typography>
                </Grid>
              </>
            )}

            {/* Withholding Tax */}
            {hasWithholdingTax && withholdingTaxAmount > 0 && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body2" color="warning.main">
                    ภาษีหัก ณ ที่จ่าย ({formatPercent(withholdingTaxPercentage)})
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography
                    variant="body2"
                    textAlign="right"
                    color="warning.main"
                    fontWeight={600}
                  >
                    -฿{formatCurrency(withholdingTaxAmount)}
                  </Typography>
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            {/* Final Total */}
            <Grid item xs={6}>
              <Typography variant="body1" fontWeight={700}>
                ยอดรวมทั้งสิ้น
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" textAlign="right" fontWeight={700} color="primary.main">
                ฿{formatCurrency(finalTotalAmount)}
              </Typography>
            </Grid>
          </Grid>
        </InfoCard>

        {/* Deposit Information */}
        {depositAmount > 0 && (
          <InfoCard sx={{ p: 2, mb: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <MonetizationOnIcon fontSize="small" color="warning" />
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                ข้อมูลมัดจำ
              </Typography>
            </Box>

            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  ประเภทมัดจำ
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Chip
                  size="small"
                  label={isDepositMode === "percentage" ? "คิดเป็นเปอร์เซ็นต์" : "จำนวนเงินคงที่"}
                  variant="outlined"
                  color="warning"
                />
              </Grid>

              {isDepositMode === "percentage" && (
                <>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      เปอร์เซ็นต์มัดจำ
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" textAlign="right">
                      {formatPercent(depositPercentage)}
                    </Typography>
                  </Grid>
                </>
              )}

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  ยอดเงินมัดจำ
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" textAlign="right" fontWeight={600} color="warning.main">
                  ฿{formatCurrency(depositAmount)}
                </Typography>
              </Grid>
            </Grid>
          </InfoCard>
        )}

        {/* Payment Status */}
        <InfoCard sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <PaymentIcon fontSize="small" color="success" />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              สถานะการชำระเงิน
            </Typography>
          </Box>

          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                ยอดเงินที่ต้องชำระ
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" textAlign="right" fontWeight={600}>
                ฿{formatCurrency(finalTotalAmount)}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                ยอดเงินที่ชำระแล้ว
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" textAlign="right" color="success.main">
                ฿{formatCurrency(paidAmount)}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="body1" fontWeight={700}>
                ยอดคงเหลือ
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography
                variant="body1"
                textAlign="right"
                fontWeight={700}
                color={remainingAmount > 0 ? "error.main" : "success.main"}
              >
                ฿{formatCurrency(remainingAmount)}
              </Typography>
            </Grid>

            {/* Payment Status Chip */}
            <Grid item xs={12} mt={1}>
              <Box display="flex" justifyContent="center">
                <Chip
                  label={remainingAmount <= 0 ? "ชำระครบแล้ว" : "ยังไม่ได้ชำระ"}
                  color={remainingAmount <= 0 ? "success" : "error"}
                  variant="filled"
                />
              </Box>
            </Grid>
          </Grid>
        </InfoCard>

        {/* Due Date */}
        {invoice?.due_date && (
          <InfoCard sx={{ p: 2, mt: 2, bgcolor: "warning.50" }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                วันครบกำหนดชำระ
              </Typography>
              <Typography variant="body2" fontWeight={600} color="warning.main">
                {new Date(invoice.due_date).toLocaleDateString("th-TH")}
              </Typography>
            </Box>
          </InfoCard>
        )}
      </Box>
    </Section>
  );
};

export default FinancialSummarySection;
