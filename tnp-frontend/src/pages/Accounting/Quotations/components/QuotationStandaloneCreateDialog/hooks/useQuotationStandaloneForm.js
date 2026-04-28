import { useCallback, useEffect, useMemo, useState } from "react";

import { useGetCompaniesQuery } from "../../../../../../features/Accounting/accountingApi";
import { PAYMENT_TERMS } from "../../../../shared/constants/paymentTerms";
import { emptyFinancials, emptyFormData } from "../utils/standaloneFormDefaults";

const buildInitialFormData = (companyId) => ({
  ...emptyFormData,
  company_id: companyId || "",
  jobs: [],
  payment_terms: PAYMENT_TERMS.CASH,
  payment_terms_custom: "",
});

const populateFromCustomer = (customer) => ({
  customer_id: customer.cus_id,
  customer_company: customer.cus_company || "",
  customer_phone: customer.cus_tel_1 || "",
  customer_type: customer.customer_type || "individual",
  contact_firstname: customer.cus_firstname || "",
  contact_lastname: customer.cus_lastname || "",
  contact_nickname: customer.cus_name || "",
  contact_position: customer.cus_depart || "",
  contact_phone_alt: customer.cus_tel_2 || "",
  customer_email: customer.cus_email || "",
  customer_tax_id: customer.cus_tax_id || "",
  customer_channel: customer.cus_channel || "1",
  customer_address: customer.cus_address || "",
  customer_zip_code: customer.cus_zip_code || "",
});

const clearedCustomerFields = {
  customer_id: "",
  customer_company: "",
  customer_phone: "",
  customer_type: "individual",
  contact_firstname: "",
  contact_lastname: "",
  contact_nickname: "",
  contact_position: "",
  contact_phone_alt: "",
  customer_email: "",
  customer_tax_id: "",
  customer_channel: "1",
  customer_address: "",
  customer_zip_code: "",
  payment_terms: PAYMENT_TERMS.CASH,
  payment_terms_custom: "",
};

// State holder for the standalone-create wizard.
// Owns: formData, financials, selectedCustomer, activeStep + handlers/effects.
// Validation + submission live in their own hooks (the shell composes them).
export function useQuotationStandaloneForm({ open, companyId }) {
  const { data: companiesData, isLoading: isLoadingCompanies } = useGetCompaniesQuery();
  const companies = useMemo(() => companiesData?.data || [], [companiesData]);

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(() => buildInitialFormData(companyId));
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [financials, setFinancials] = useState(emptyFinancials);

  // Sync companyId prop into formData when it changes mid-mount.
  useEffect(() => {
    if (companyId) setFormData((prev) => ({ ...prev, company_id: companyId }));
  }, [companyId]);

  // Reset everything when the dialog opens.
  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setFormData(buildInitialFormData(companyId));
    setSelectedCustomer(null);
    setFinancials(emptyFinancials);
  }, [open, companyId]);

  // Populate / clear customer fields when selection changes.
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      ...(selectedCustomer ? populateFromCustomer(selectedCustomer) : clearedCustomerFields),
    }));
  }, [selectedCustomer]);

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleJobsChange = useCallback((jobs) => {
    setFormData((prev) => ({ ...prev, jobs }));
  }, []);

  const handleFinancialsChange = useCallback((next) => setFinancials(next), []);

  const goNext = useCallback(() => setActiveStep((prev) => prev + 1), []);
  const goBack = useCallback(() => setActiveStep((prev) => prev - 1), []);

  // Items shape that FinancialSummaryPanel expects.
  const financialPanelItems = useMemo(
    () =>
      formData.jobs.flatMap((job) =>
        (job.sizeRows || []).map((row) => ({
          unit_price: row.unit_price || 0,
          quantity: row.quantity || 0,
          discount_amount: 0,
        }))
      ),
    [formData.jobs]
  );

  return {
    activeStep,
    formData,
    financials,
    selectedCustomer,
    companies,
    financialPanelItems,
    isLoadingCompanies,
    handleChange,
    handleJobsChange,
    handleFinancialsChange,
    setSelectedCustomer,
    goNext,
    goBack,
  };
}
