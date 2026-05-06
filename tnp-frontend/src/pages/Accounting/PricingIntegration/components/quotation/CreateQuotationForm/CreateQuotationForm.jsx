import { Box, Container, Stack } from "@mui/material";
import { useMemo, useState } from "react";

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
import QuotationFormTabs from "./sections/QuotationFormTabs";
import QuotationValidationBanner from "./sections/QuotationValidationBanner";
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

  // Phase 4: lift activeTab to allow Phase 5 banner to navigate
  const [activeTab, setActiveTab] = useState("customer");

  // Phase 5: aggregate cross-tab issues
  const jobsErrorCount = useMemo(
    () => Object.values(validationErrors || {}).filter((errs) => errs?.length > 0).length,
    [validationErrors]
  );

  const issues = useMemo(() => {
    const list = [];
    if (jobsErrorCount > 0) {
      list.push({
        id: "jobs-required-fields",
        severity: "error",
        message: `มี ${jobsErrorCount} รายการที่ขาดข้อมูลจำเป็น (เช่น ชื่องาน)`,
        targetTab: "jobs",
      });
    }
    if (formData.items.length === 0) {
      list.push({
        id: "no-items",
        severity: "error",
        message: 'ยังไม่มีรายการงาน — เพิ่มจาก PR หรือกด "เพิ่มงานใหม่"',
        targetTab: "jobs",
      });
    } else if (financials.finalTotal === 0) {
      list.push({
        id: "zero-total",
        severity: "warning",
        message: "ยอดรวมเป็น ฿0.00 — ตรวจสอบจำนวน/ราคาในแต่ละงาน",
        targetTab: "jobs",
      });
    }
    if (financials.depositAmount > financials.finalTotal && financials.finalTotal > 0) {
      list.push({
        id: "deposit-exceeds-total",
        severity: "warning",
        message: `จำนวนมัดจำ (${financials.depositAmount.toLocaleString()}) มากกว่ายอดรวม (${financials.finalTotal.toLocaleString()})`,
        targetTab: "payment",
      });
    }
    return list;
  }, [jobsErrorCount, formData.items.length, financials.finalTotal, financials.depositAmount]);

  // Phase 5: derive disable reason for submit tooltip
  const submitDisableReason = useMemo(() => {
    if (formData.items.length === 0) return "ต้องมีรายการงานอย่างน้อย 1 รายการ";
    if (financials.finalTotal === 0) return "ยอดรวมเป็น ฿0.00 — ตรวจสอบจำนวน/ราคา";
    if (jobsErrorCount > 0) return `มี ${jobsErrorCount} รายการที่ขาดข้อมูลจำเป็น`;
    return "";
  }, [formData.items.length, financials.finalTotal, jobsErrorCount]);

  const panels = {
    customer: (
      <CustomerAndPRSection
        customer={formData.customer}
        prItems={prItems}
        onCustomerUpdate={handleCustomerUpdate}
        prQtyOf={jobEditor.prQtyOf}
      />
    ),
    jobs: (
      <JobsSection
        items={formData.items}
        isEditing={isEditing}
        validationErrors={validationErrors}
        jobEditor={jobEditor}
      />
    ),
    calc: (
      <Box
        sx={{ p: 2, bgcolor: tokens.white, border: `1px solid ${tokens.border}`, borderRadius: 1 }}
      >
        <FinancialControlsSection
          formData={formData}
          financials={financials}
          onUpdateField={updateField}
          disabled={!isEditing}
        />
      </Box>
    ),
    payment: (
      <Stack spacing={2}>
        <SampleImagesSection formData={formData} sampleImages={sampleImages} />
        <PaymentTermsSection
          formData={formData}
          financials={financials}
          onUpdateField={updateField}
        />
      </Stack>
    ),
  };

  return (
    <Box sx={{ bgcolor: tokens.bg, minHeight: "100vh", py: 3 }}>
      <Container maxWidth="lg">
        <FormHeaderBar
          onBack={onBack}
          prItemsCount={prItems.length}
          manualItemsCount={manualItemsCount}
          customerName={formData.customer?.cus_company}
        />

        <QuotationValidationBanner issues={issues} onJumpToTab={setActiveTab} />

        <QuotationFormTabs
          panels={panels}
          errorCounts={{ jobs: jobsErrorCount }}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
        />

        <ActionBar
          onBack={onBack}
          onSubmitReview={() => handleSubmit("review")}
          isSubmitting={isSubmitting}
          isDisabled={!!submitDisableReason}
          disableReason={submitDisableReason}
        />
      </Container>
    </Box>
  );
};

export default CreateQuotationForm;
