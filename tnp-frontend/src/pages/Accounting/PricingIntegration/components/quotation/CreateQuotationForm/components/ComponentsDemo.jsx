import { Box, Container, Typography, Grid, Paper } from "@mui/material";
import React, { useState } from "react";

import { SpecialDiscountField, WithholdingTaxField, CalculationSummary } from "./index";

const ComponentsDemo = () => {
  const [specialDiscountType, setSpecialDiscountType] = useState("percentage");
  const [specialDiscountValue, setSpecialDiscountValue] = useState(5);
  const [hasWithholdingTax, setHasWithholdingTax] = useState(true);
  const [withholdingTaxPercentage, setWithholdingTaxPercentage] = useState(3);

  // Sample calculation values
  const subtotal = 10000;
  const vat = subtotal * 0.07;
  const total = subtotal + vat;

  const specialDiscountAmount =
    specialDiscountType === "percentage"
      ? total * (specialDiscountValue / 100)
      : specialDiscountValue;

  const netAfterDiscount = total - specialDiscountAmount;
  const withholdingTaxAmount = hasWithholdingTax ? subtotal * (withholdingTaxPercentage / 100) : 0;
  const finalTotal = netAfterDiscount - withholdingTaxAmount;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom textAlign="center" color="primary">
        🎨 Quotation Components Demo
      </Typography>
      <Typography
        variant="subtitle1"
        gutterBottom
        textAlign="center"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        ตัวอย่างการใช้งาน Components ใหม่สำหรับส่วนลดพิเศษและภาษีหัก ณ ที่จ่าย
      </Typography>

      {/* Sample Values Display */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: "#f5f5f5" }}>
        <Typography variant="h6" gutterBottom>
          📊 ข้อมูลตัวอย่าง
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Typography variant="caption" color="text.secondary">
              ยอดก่อนภาษี
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              ฿10,000.00
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="caption" color="text.secondary">
              VAT 7%
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              ฿700.00
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="caption" color="text.secondary">
              ยอดรวม
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              ฿10,700.00
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="caption" color="text.secondary">
              ยอดสุทธิสุดท้าย
            </Typography>
            <Typography variant="body1" fontWeight={600} color="primary">
              ฿{finalTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Special Discount Field */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            🏷️ SpecialDiscountField
          </Typography>
          <SpecialDiscountField
            discountType={specialDiscountType}
            discountValue={specialDiscountValue}
            totalAmount={total}
            discountAmount={specialDiscountAmount}
            onDiscountTypeChange={setSpecialDiscountType}
            onDiscountValueChange={setSpecialDiscountValue}
          />
        </Grid>

        {/* Withholding Tax Field */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            🏦 WithholdingTaxField
          </Typography>
          <WithholdingTaxField
            hasWithholdingTax={hasWithholdingTax}
            taxPercentage={withholdingTaxPercentage}
            taxAmount={withholdingTaxAmount}
            subtotalAmount={subtotal}
            onToggleWithholdingTax={setHasWithholdingTax}
            onTaxPercentageChange={setWithholdingTaxPercentage}
          />
        </Grid>

        {/* Calculation Summary */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            📋 CalculationSummary
          </Typography>
          <CalculationSummary
            subtotal={subtotal}
            vat={vat}
            total={total}
            specialDiscountAmount={specialDiscountAmount}
            netAfterDiscount={netAfterDiscount}
            withholdingTaxAmount={withholdingTaxAmount}
            finalTotal={finalTotal}
            showDetailed={true}
          />
        </Grid>
      </Grid>

      {/* Code Example */}
      <Paper elevation={1} sx={{ p: 3, mt: 4, bgcolor: "#fafafa" }}>
        <Typography variant="h6" gutterBottom>
          💻 วิธีการใช้งาน
        </Typography>
        <Box component="pre" sx={{ fontSize: "0.875rem", overflow: "auto" }}>
          {`// Import components
import { SpecialDiscountField, WithholdingTaxField, CalculationSummary } from './components';

// Use in your form
<SpecialDiscountField
  discountType={formData.specialDiscountType}
  discountValue={formData.specialDiscountValue}
  totalAmount={total}
  discountAmount={specialDiscountAmount}
  onDiscountTypeChange={(type) => setFormData(p => ({ ...p, specialDiscountType: type }))}
  onDiscountValueChange={(value) => setFormData(p => ({ ...p, specialDiscountValue: value }))}
  disabled={!isEditing}
/>

<WithholdingTaxField
  hasWithholdingTax={formData.hasWithholdingTax}
  taxPercentage={formData.withholdingTaxPercentage}
  taxAmount={withholdingTaxAmount}
  subtotalAmount={subtotal}
  onToggleWithholdingTax={(enabled) => setFormData(p => ({ ...p, hasWithholdingTax: enabled }))}
  onTaxPercentageChange={(percentage) => setFormData(p => ({ ...p, withholdingTaxPercentage: percentage }))}
  disabled={!isEditing}
/>

<CalculationSummary
  subtotal={subtotal}
  vat={vat}
  total={total}
  specialDiscountAmount={specialDiscountAmount}
  netAfterDiscount={netAfterDiscount}
  withholdingTaxAmount={withholdingTaxAmount}
  finalTotal={finalTotal}
  showDetailed={true}
/>`}
        </Box>
      </Paper>
    </Container>
  );
};

export default ComponentsDemo;
