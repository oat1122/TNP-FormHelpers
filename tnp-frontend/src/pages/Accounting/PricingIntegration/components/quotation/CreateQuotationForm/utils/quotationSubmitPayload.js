const formatDueDate = (dueDate) => (dueDate ? dueDate.toISOString().split("T")[0] : null);

const decoratePdfFlag = (sampleImages = [], selectedSampleForPdf) =>
  sampleImages.map((img) => ({
    ...img,
    selected_for_pdf: img.filename && img.filename === selectedSampleForPdf,
  }));

const derivePaymentMethod = (formData) =>
  formData.paymentTermsType === "other" ? formData.paymentTermsCustom : formData.paymentTermsType;

const deriveDepositPercentageString = (formData, financials) => {
  if (formData.depositMode === "percentage") {
    return String(formData.depositPct ?? 0);
  }
  if (financials?.depositPercentage != null) {
    return String(Number(financials.depositPercentage).toFixed(4));
  }
  return "0";
};

export const buildFormSubmitPayload = ({ formData, financials, action }) => {
  const {
    subtotal,
    specialDiscountAmount,
    discountedSubtotal,
    netSubtotal,
    vat,
    total,
    withholdingTaxAmount,
    finalTotal,
    depositAmount,
    remainingAmount,
  } = financials;

  return {
    ...formData,
    subtotal,
    vat,
    total,
    specialDiscountType: formData.specialDiscountType,
    specialDiscountValue: formData.specialDiscountValue,
    specialDiscountAmount,
    netAfterDiscount: discountedSubtotal,
    hasWithholdingTax: formData.hasWithholdingTax,
    withholdingTaxPercentage: formData.withholdingTaxPercentage,
    withholdingTaxAmount,
    hasVat: formData.hasVat,
    vatPercentage: formData.vatPercentage,
    pricingMode: formData.pricingMode,
    netSubtotal,
    finalTotal,
    depositAmount,
    remainingAmount,
    due_date: formatDueDate(formData.dueDate),
    sample_images: decoratePdfFlag(formData.sampleImages, formData.selectedSampleForPdf),
    paymentMethod: derivePaymentMethod(formData),
    depositMode: formData.depositMode,
    depositPercentage: deriveDepositPercentageString(formData, financials),
    depositAmountInput: formData.depositAmountInput,
    action,
  };
};
