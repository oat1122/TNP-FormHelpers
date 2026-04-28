import { Close as CloseIcon, Save as SaveIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import { useState } from "react";

import CustomerCreateDialog from "./CustomerCreateDialog";
import { useQuotationStandaloneForm } from "./hooks/useQuotationStandaloneForm";
import { useQuotationStandaloneSubmit } from "./hooks/useQuotationStandaloneSubmit";
import { useQuotationStandaloneValidation } from "./hooks/useQuotationStandaloneValidation";
import CustomerStep from "./sections/CustomerStep";
import FinancialStep from "./sections/FinancialStep";
import JobsStep from "./sections/JobsStep";
import StepperBar from "./sections/StepperBar";
import { STEP_LABELS } from "./utils/standaloneFormDefaults";

const QuotationStandaloneCreateDialog = ({ open, onClose, onSuccess, companyId }) => {
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);

  const form = useQuotationStandaloneForm({ open, companyId });
  const validation = useQuotationStandaloneValidation(form.formData);
  const submit = useQuotationStandaloneSubmit({
    formData: form.formData,
    financials: form.financials,
    validate: () => validation.validateStep(form.activeStep),
    onSuccess,
    onClose,
  });

  const handleChange = (field, value) => {
    form.handleChange(field, value);
    validation.clearFieldError(field);
  };

  const handleNext = () => {
    if (validation.validateStep(form.activeStep)) form.goNext();
  };

  const renderStep = () => {
    switch (form.activeStep) {
      case 0:
        return (
          <CustomerStep
            formData={form.formData}
            errors={validation.errors}
            companies={form.companies}
            isLoadingCompanies={form.isLoadingCompanies}
            selectedCustomer={form.selectedCustomer}
            onChange={handleChange}
            onSelectCustomer={form.setSelectedCustomer}
            onOpenCreateCustomer={() => setCreateCustomerOpen(true)}
          />
        );
      case 1:
        return (
          <JobsStep
            formData={form.formData}
            errors={validation.errors}
            onChange={handleChange}
            onJobsChange={form.handleJobsChange}
          />
        );
      case 2:
        return (
          <FinancialStep
            items={form.financialPanelItems}
            financials={form.financials}
            onChange={form.handleFinancialsChange}
          />
        );
      default:
        return null;
    }
  };

  const isLastStep = form.activeStep === STEP_LABELS.length - 1;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: "90vh" } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h6">สร้างใบเสนอราคา (Standalone)</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <StepperBar activeStep={form.activeStep} />
          {submit.apiError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {submit.apiError?.data?.message || "เกิดข้อผิดพลาด"}
            </Alert>
          )}
          <Box sx={{ minHeight: 400 }}>{renderStep()}</Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
          <Button onClick={onClose} disabled={submit.isLoading}>
            ยกเลิก
          </Button>
          <Box sx={{ display: "flex", gap: 1 }}>
            {form.activeStep > 0 && (
              <Button onClick={form.goBack} disabled={submit.isLoading}>
                ย้อนกลับ
              </Button>
            )}
            {!isLastStep ? (
              <Button variant="contained" onClick={handleNext}>
                ถัดไป
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={submit.handleSubmit}
                disabled={submit.isLoading}
                startIcon={submit.isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {submit.isLoading ? "กำลังบันทึก..." : "สร้างใบเสนอราคา"}
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {createCustomerOpen && (
        <CustomerCreateDialog
          open={createCustomerOpen}
          onClose={() => setCreateCustomerOpen(false)}
          onSuccess={(newCustomer) => {
            form.setSelectedCustomer(newCustomer);
            setCreateCustomerOpen(false);
          }}
        />
      )}
    </>
  );
};

export default QuotationStandaloneCreateDialog;
