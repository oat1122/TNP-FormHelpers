import {
  Calculate as CalculateIcon,
  Edit as EditIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { Avatar, Box, Button, Collapse, Divider, Grid, Typography } from "@mui/material";
import { useState } from "react";

import PricingModeSelector from "../../../../PricingIntegration/components/quotation/CreateQuotationForm/components/PricingModeSelector";
import SpecialDiscountField from "../../../../PricingIntegration/components/quotation/CreateQuotationForm/components/SpecialDiscountField";
import VatField from "../../../../PricingIntegration/components/quotation/CreateQuotationForm/components/VatField";
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
  // Phase 2: items collapsible in read-only mode (default collapsed for compact view)
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const itemsList = isEditing ? editableItems : items;
  const showCollapsibleItems = !isEditing && itemsList.length > 0;

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
            {!validation.isReadOnly && setIsEditing && (
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
        <Box sx={{ p: 1.5 }} id="calc-section">
          {/* 1. รายการ Item — collapsible in read-only mode (Phase 2 compact) */}
          {showCollapsibleItems && (
            <Box sx={{ mb: 1 }}>
              <Button
                size="small"
                onClick={() => setItemsExpanded((v) => !v)}
                startIcon={itemsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{
                  textTransform: "none",
                  color: tokens.textSecondary,
                  fontSize: "0.8rem",
                }}
              >
                {itemsExpanded ? "ซ่อนรายการ" : `ดูรายการ (${itemsList.length})`}
              </Button>
            </Box>
          )}
          <Collapse in={isEditing || itemsExpanded} timeout="auto" unmountOnExit>
            {itemsList.map((item, idx) => (
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
          </Collapse>

          <Divider sx={{ my: 1.5 }} />

          {/* Pricing Mode + Discount/Tax Fields — edit mode only (Phase 2: hide in read mode, values appear in Calculation summary below) */}
          {isEditing && (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12}>
                  <PricingModeSelector
                    pricingMode={formData.pricing_mode}
                    onPricingModeChange={(mode) => handleFieldChange("pricing_mode", mode)}
                    disabled={formData.status !== "draft"}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
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
                      setDiscountTypeState(type);
                      // เคลียร์ค่าของช่องที่ไม่ได้เลือก
                      if (type === "percentage") {
                        handleFieldChange("special_discount_amount", 0);
                      } else {
                        handleFieldChange("special_discount_percentage", 0);
                      }
                    }}
                    onDiscountValueChange={(value) => {
                      const numValue = Math.max(0, Number(value) || 0);
                      if (discountTypeState === "percentage") {
                        handleFieldChange("special_discount_percentage", numValue);
                      } else {
                        handleFieldChange("special_discount_amount", numValue);
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <VatField
                    hasVat={formData.has_vat}
                    vatPercentage={formData.vat_percentage}
                    subtotalAmount={calculation.effectiveSubtotal}
                    onToggleVat={(en) => handleFieldChange("has_vat", en)}
                    onVatPercentageChange={(p) =>
                      handleFieldChange(
                        "vat_percentage",
                        Math.max(0, Math.min(100, Number(p) || 0))
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <WithholdingTaxField
                    hasWithholdingTax={formData.has_withholding_tax}
                    taxPercentage={formData.withholding_tax_percentage}
                    taxAmount={calculation.withholdingTaxAmount}
                    subtotalAmount={calculation.effectiveSubtotal}
                    onToggleWithholdingTax={(en) => handleFieldChange("has_withholding_tax", en)}
                    onTaxPercentageChange={(p) =>
                      handleFieldChange("withholding_tax_percentage", Math.max(0, Number(p) || 0))
                    }
                  />
                </Grid>
              </Grid>
            </>
          )}

          {/* 3. Calculation Summary (always shown — primary value display) */}
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
