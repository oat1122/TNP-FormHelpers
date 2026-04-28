import { Close as CloseIcon, Save as SaveIcon } from "@mui/icons-material";
import {
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
} from "@mui/material";

import { useCustomerCreateForm } from "./hooks/useCustomerCreateForm";
import { useCustomerCreateLocations } from "./hooks/useCustomerCreateLocations";
import { useCustomerCreateManagers } from "./hooks/useCustomerCreateManagers";
import { useCustomerCreateSubmit } from "./hooks/useCustomerCreateSubmit";
import BusinessInfoSection from "./sections/BusinessInfoSection";
import CompanyInfoSection from "./sections/CompanyInfoSection";
import ContactInfoSection from "./sections/ContactInfoSection";
import LocationSection from "./sections/LocationSection";
import { useCurrentUser } from "../../../../shared/hooks/useCurrentUser";
import { PrimaryButton, SecondaryButton } from "../../../../shared/styles/quotationFormStyles";

const CustomerCreateDialog = ({ open, onClose, onSuccess }) => {
  const { currentUser, isAdmin } = useCurrentUser();

  const form = useCustomerCreateForm({ open, isAdmin, currentUser });

  const { salesList, businessTypes } = useCustomerCreateManagers({
    managerAssignment: form.formData.cus_manage_by,
    onManagerChange: form.setManagerAssignment,
  });

  const locations = useCustomerCreateLocations({
    formData: form.formData,
    onChange: form.handleInputChange,
  });

  const submit = useCustomerCreateSubmit({
    formData: form.formData,
    salesList,
    isAdmin,
    currentUser,
    setErrors: form.setErrors,
    setManagerAssignment: form.setManagerAssignment,
    onSuccess,
    onClose,
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        สร้างลูกค้าใหม่
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {form.errors.general && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>
            {form.errors.general}
          </Alert>
        )}

        <Grid container spacing={2}>
          <CompanyInfoSection
            formData={form.formData}
            errors={form.errors}
            onChange={form.handleInputChange}
          />
          <ContactInfoSection
            formData={form.formData}
            errors={form.errors}
            onChange={form.handleInputChange}
          />
          <BusinessInfoSection
            formData={form.formData}
            errors={form.errors}
            onChange={form.handleInputChange}
            businessTypes={businessTypes}
            salesList={salesList}
            isAdmin={isAdmin}
            currentUser={currentUser}
          />
          <LocationSection
            formData={form.formData}
            onChange={form.handleInputChange}
            locations={locations}
          />
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <SecondaryButton onClick={onClose} disabled={submit.isSaving}>
          ยกเลิก
        </SecondaryButton>
        <PrimaryButton
          onClick={submit.handleSave}
          disabled={submit.isSaving}
          startIcon={
            submit.isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />
          }
        >
          {submit.isSaving ? "กำลังบันทึก..." : "สร้างลูกค้า"}
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerCreateDialog;
