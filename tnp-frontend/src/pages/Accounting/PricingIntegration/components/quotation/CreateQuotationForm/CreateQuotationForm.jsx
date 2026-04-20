import { Box, Container, Grid } from "@mui/material";
import { useMemo } from "react";

import { useCreateQuotationFormState } from "./hooks/useCreateQuotationFormState";
import { useQuotationFormValidation } from "./hooks/useQuotationFormValidation";
import { useQuotationJobEditor } from "./hooks/useQuotationJobEditor";
import { useQuotationSampleImages } from "./hooks/useQuotationSampleImages";
import { useQuotationSubmit } from "./hooks/useQuotationSubmit";
import ActionBar from "./sections/ActionBar";
import CustomerAndPRSection from "./sections/CustomerAndPRSection";
import FinancialControlsSection from "./sections/FinancialControlsSection";
import FormHeaderBar from "./sections/FormHeaderBar";
import JobsSection from "./sections/JobsSection";
import PaymentTermsSection from "./sections/PaymentTermsSection";
import SampleImagesSection from "./sections/SampleImagesSection";
import { useQuotationFinancials } from "../../../../shared/hooks/useQuotationFinancials";
import { tokens } from "../../../../shared/styles/tokens";

const CreateQuotationForm = ({
  selectedPricingRequests = [],
  onBack,
  onSave,
  onSubmit,
  readOnly = false,
}) => {
  const { formData, setFormData, updateField } =
    useCreateQuotationFormState(selectedPricingRequests);

  const { validationErrors, validateAllManualJobs, clearItemValidationErrors } =
    useQuotationFormValidation(formData);

  const jobEditor = useQuotationJobEditor({ setFormData, clearItemValidationErrors });
  const sampleImages = useQuotationSampleImages({ setFormData });

  const financials = useQuotationFinancials({
    items: formData.items,
    pricingMode: formData.pricingMode,
    depositMode: formData.depositMode,
    depositPercentage: formData.depositPct,
    depositAmountInput: formData.depositAmountInput,
    specialDiscountType: formData.specialDiscountType,
    specialDiscountValue: formData.specialDiscountValue,
    hasWithholdingTax: formData.hasWithholdingTax,
    withholdingTaxPercentage: formData.withholdingTaxPercentage,
    hasVat: formData.hasVat,
    vatPercentage: formData.vatPercentage,
  });

  const { isSubmitting, handleSubmit } = useQuotationSubmit({
    formData,
    financials,
    validateAllManualJobs,
    onSave,
    onSubmit,
  });

  const isEditing = !readOnly;
  const prItems = useMemo(() => formData.items.filter((i) => i.isFromPR), [formData.items]);
  const manualItemsCount = formData.items.length - prItems.length;

  const handleCustomerUpdate = (customer) => updateField("customer", customer);

  return (
    <Box sx={{ bgcolor: tokens.bg, minHeight: "100vh", py: 3 }}>
      <Container maxWidth="lg">
        <FormHeaderBar
          onBack={onBack}
          prItemsCount={prItems.length}
          manualItemsCount={manualItemsCount}
          customerName={formData.customer?.cus_company}
        />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <CustomerAndPRSection
              customer={formData.customer}
              prItems={prItems}
              onCustomerUpdate={handleCustomerUpdate}
              prQtyOf={jobEditor.prQtyOf}
            />
          </Grid>

          <Grid item xs={12}>
            <JobsSection
              items={formData.items}
              isEditing={isEditing}
              validationErrors={validationErrors}
              jobEditor={jobEditor}
              financialControlsSlot={
                <FinancialControlsSection
                  formData={formData}
                  financials={financials}
                  onUpdateField={updateField}
                  disabled={!isEditing}
                />
              }
            />
          </Grid>

          <Grid item xs={12}>
            <PaymentTermsSection
              formData={formData}
              financials={financials}
              onUpdateField={updateField}
            />
          </Grid>

          <Grid item xs={12}>
            <SampleImagesSection formData={formData} sampleImages={sampleImages} />
          </Grid>
        </Grid>

        <ActionBar
          onBack={onBack}
          onSubmitReview={() => handleSubmit("review")}
          isSubmitting={isSubmitting}
          isDisabled={financials.finalTotal === 0}
        />
      </Container>
    </Box>
  );
};

export default CreateQuotationForm;
