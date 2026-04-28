import { Divider, Grid } from "@mui/material";

import Calculation from "../../../../shared/components/Calculation";
import PricingModeSelector from "../../../../shared/components/financial/PricingModeSelector";
import SpecialDiscountField from "../../../../shared/components/financial/SpecialDiscountField";
import VatField from "../../../../shared/components/financial/VatField";
import WithholdingTaxField from "../../../../shared/components/financial/WithholdingTaxField";

// Renders the financial controls + summary block of QuotationDetailDialog.
// Designed to be rendered inside `PRGroupsSection`'s calc Section so it visually
// continues the calculation block.
const FinancialControlsSection = ({ isEditing, financials, formState, setters }) => {
  const { specialDiscount, withholding, vat, pricingMode } = formState;

  return (
    <>
      <Divider sx={{ my: 2 }} />
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <SpecialDiscountField
            discountType={specialDiscount.type}
            discountValue={specialDiscount.value}
            totalAmount={financials.subtotal}
            discountAmount={financials.specialDiscountAmount}
            onDiscountTypeChange={(t) => isEditing && setters.setSpecialDiscountType(t)}
            onDiscountValueChange={(v) => isEditing && setters.setSpecialDiscountValue(v)}
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <WithholdingTaxField
            hasWithholdingTax={withholding.enabled}
            taxPercentage={withholding.percentage}
            taxAmount={financials.withholdingTaxAmount}
            subtotalAmount={financials.subtotal}
            onToggleWithholdingTax={(en) => isEditing && setters.setHasWithholdingTax(en)}
            onTaxPercentageChange={(p) => isEditing && setters.setWithholdingTaxPercentage(p)}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <VatField
            hasVat={vat.enabled}
            vatPercentage={vat.percentage}
            vatAmount={financials.vat}
            subtotalAmount={financials.discountedSubtotal}
            onToggleVat={(enabled) => isEditing && setters.setHasVat(enabled)}
            onVatPercentageChange={(percentage) =>
              isEditing && setters.setVatPercentage(percentage)
            }
            disabled={!isEditing}
          />
        </Grid>

        {isEditing && (
          <Grid item xs={12}>
            <PricingModeSelector
              pricingMode={pricingMode}
              onPricingModeChange={setters.setPricingMode}
              disabled={!isEditing}
            />
          </Grid>
        )}
      </Grid>

      <Calculation
        subtotal={financials.subtotal}
        discountAmount={financials.specialDiscountAmount}
        discountedBase={financials.discountedSubtotal}
        netSubtotal={financials.netSubtotal}
        pricingMode={financials.pricingMode}
        vat={financials.vat}
        totalAfterVat={financials.total}
        withholdingAmount={financials.withholdingTaxAmount}
        finalTotal={financials.finalTotal}
      />
    </>
  );
};

export default FinancialControlsSection;
