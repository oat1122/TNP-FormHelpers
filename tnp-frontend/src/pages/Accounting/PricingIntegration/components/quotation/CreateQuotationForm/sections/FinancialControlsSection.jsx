import { Divider, Grid } from "@mui/material";

import Calculation from "../../../../../shared/components/Calculation";
import PricingModeSelector from "../components/PricingModeSelector";
import SpecialDiscountField from "../components/SpecialDiscountField";
import VatField from "../components/VatField";
import WithholdingTaxField from "../components/WithholdingTaxField";

const FinancialControlsSection = ({ formData, financials, onUpdateField, disabled }) => {
  const {
    subtotal,
    specialDiscountAmount,
    discountedSubtotal,
    netSubtotal,
    vat,
    total,
    withholdingTaxAmount,
    finalTotal,
  } = financials;

  return (
    <>
      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <SpecialDiscountField
            discountType={formData.specialDiscountType}
            discountValue={formData.specialDiscountValue}
            totalAmount={total}
            discountAmount={specialDiscountAmount}
            onDiscountTypeChange={(type) => onUpdateField("specialDiscountType", type)}
            onDiscountValueChange={(value) => onUpdateField("specialDiscountValue", value)}
            disabled={disabled}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <WithholdingTaxField
            hasWithholdingTax={formData.hasWithholdingTax}
            taxPercentage={formData.withholdingTaxPercentage}
            taxAmount={withholdingTaxAmount}
            subtotalAmount={subtotal}
            onToggleWithholdingTax={(enabled) => onUpdateField("hasWithholdingTax", enabled)}
            onTaxPercentageChange={(percentage) =>
              onUpdateField("withholdingTaxPercentage", percentage)
            }
            disabled={disabled}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <VatField
            hasVat={formData.hasVat}
            vatPercentage={formData.vatPercentage}
            vatAmount={vat}
            subtotalAmount={discountedSubtotal}
            onToggleVat={(enabled) => onUpdateField("hasVat", enabled)}
            onVatPercentageChange={(percentage) => onUpdateField("vatPercentage", percentage)}
            disabled={disabled}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <PricingModeSelector
            pricingMode={formData.pricingMode}
            onPricingModeChange={(mode) => onUpdateField("pricingMode", mode)}
            disabled={disabled}
          />
        </Grid>
      </Grid>

      <Calculation
        subtotal={subtotal}
        discountAmount={specialDiscountAmount}
        discountedBase={discountedSubtotal}
        vat={vat}
        totalAfterVat={total}
        withholdingAmount={withholdingTaxAmount}
        finalTotal={finalTotal}
        pricingMode={formData.pricingMode}
        netSubtotal={netSubtotal}
        hasVat={formData.hasVat}
        vatPercentage={formData.vatPercentage}
      />
    </>
  );
};

export default FinancialControlsSection;
