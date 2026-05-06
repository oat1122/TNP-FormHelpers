import { Calculate as CalculateIcon, Edit as EditIcon } from "@mui/icons-material";
import { Avatar, Box, Divider, Grid, Typography } from "@mui/material";

import PricingModeSelector from "../../../../PricingIntegration/components/quotation/CreateQuotationForm/components/PricingModeSelector";
import SpecialDiscountField from "../../../../PricingIntegration/components/quotation/CreateQuotationForm/components/SpecialDiscountField";
import WithholdingTaxField from "../../../../PricingIntegration/components/quotation/CreateQuotationForm/components/WithholdingTaxField";
import {
  Section,
  SectionHeader,
  SecondaryButton,
  tokens,
} from "../../../../PricingIntegration/components/styles/quotationFormStyles";
import { Calculation } from "../../../../shared/components";
import InvoiceSummaryCard from "../../calculation/InvoiceSummaryCard";

/**
 * Section 2: การคำนวณราคา — Items table + Pricing/Discount/VAT fields + Calculation summary
 *
 * Extracted from InvoiceDetailDialog.jsx during Phase 1c of redesign refactor.
 * Zero behavior change.
 */
const CalculationSection = ({
  // mode flags
  isEditing,
  setIsEditing,
  validation,
  // items data + handlers
  items,
  editableItems,
  handleAddSizeRow,
  handleChangeSizeRow,
  handleRemoveSizeRow,
  handleDeleteItem,
  handleChangeItem,
  // form data + handler
  formData,
  handleFieldChange,
  // calculation result + discount type local state
  calculation,
  discountTypeState,
  setDiscountTypeState,
}) => {
  return (
    <Grid item xs={12}>
      <Section>
        <SectionHeader>
          <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
            <CalculateIcon fontSize="small" />
          </Avatar>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1" fontWeight={700}>
              การคำนวณราคา
            </Typography>
            {!validation.isReadOnly && (
              <SecondaryButton
                size="small"
                startIcon={<EditIcon />}
                onClick={() => {
                  const el = document.getElementById("calc-section");
                  const y = el ? el.scrollTop : null;
                  setIsEditing((v) => !v);
                  setTimeout(() => {
                    const el2 = document.getElementById("calc-section");
                    if (el2 != null && y != null) el2.scrollTop = y;
                  }, 0);
                }}
              >
                {isEditing ? "ยกเลิกแก้ไข" : "แก้ไข"}
              </SecondaryButton>
            )}
          </Box>
        </SectionHeader>
        <Box sx={{ p: 2 }} id="calc-section">
          {/* 1. รายการ Item (ที่แก้ไขได้) */}
          {(isEditing ? editableItems : items).map((item, idx) => (
            <InvoiceSummaryCard
              key={`calc-${item.id || idx}`}
              item={item}
              index={idx}
              isEditing={isEditing && !validation.isReadOnly}
              onAddRow={handleAddSizeRow}
              onChangeRow={handleChangeSizeRow}
              onRemoveRow={handleRemoveSizeRow}
              onDeleteItem={handleDeleteItem}
              onChangeItem={handleChangeItem}
            />
          ))}

          <Divider sx={{ my: 2 }} />

          {/* Pricing Mode Selector */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <PricingModeSelector
                pricingMode={formData.pricing_mode}
                onPricingModeChange={(mode) => {
                  if (!isEditing) return;
                  handleFieldChange("pricing_mode", mode);
                }}
                disabled={!isEditing || formData.status !== "draft"}
              />
            </Grid>
          </Grid>

          {/* 2. เพิ่ม Discount และ Tax Fields */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <SpecialDiscountField
                discountType={discountTypeState}
                discountValue={
                  discountTypeState === "percentage"
                    ? formData.special_discount_percentage
                    : formData.special_discount_amount
                }
                totalAmount={calculation.subtotal}
                discountAmount={calculation.discountUsed}
                onDiscountTypeChange={(type) => {
                  if (!isEditing) return;
                  setDiscountTypeState(type);
                  // เคลียร์ค่าของช่องที่ไม่ได้เลือก
                  if (type === "percentage") {
                    handleFieldChange("special_discount_amount", 0);
                  } else {
                    handleFieldChange("special_discount_percentage", 0);
                  }
                }}
                onDiscountValueChange={(value) => {
                  if (!isEditing) return;
                  const numValue = Math.max(0, Number(value) || 0);
                  if (discountTypeState === "percentage") {
                    handleFieldChange("special_discount_percentage", numValue);
                  } else {
                    handleFieldChange("special_discount_amount", numValue);
                  }
                }}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <WithholdingTaxField
                hasWithholdingTax={formData.has_withholding_tax}
                taxPercentage={formData.withholding_tax_percentage}
                taxAmount={calculation.withholdingTaxAmount}
                subtotalAmount={calculation.effectiveSubtotal}
                onToggleWithholdingTax={(en) =>
                  isEditing && handleFieldChange("has_withholding_tax", en)
                }
                onTaxPercentageChange={(p) =>
                  isEditing &&
                  handleFieldChange("withholding_tax_percentage", Math.max(0, Number(p) || 0))
                }
                disabled={!isEditing}
              />
            </Grid>
          </Grid>

          {/* 3. เพิ่ม Calculation Summary */}
          <Calculation
            subtotal={calculation.subtotal}
            discountAmount={calculation.discountUsed}
            discountedBase={calculation.effectiveSubtotal}
            vat={calculation.vatAmount}
            totalAfterVat={calculation.totalAmount}
            withholdingAmount={calculation.withholdingTaxAmount}
            finalTotal={calculation.finalTotalAmount}
            vatPercentage={formData.vat_percentage}
            hasVat={formData.has_vat}
          />
        </Box>
      </Section>
    </Grid>
  );
};

export default CalculationSection;
