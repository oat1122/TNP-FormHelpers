import { useState, useCallback, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  useCreateStandaloneQuotationMutation,
  useGetCompaniesQuery,
} from "../../../../../../features/Accounting/accountingApi";
import { addNotification } from "../../../../../../features/Accounting/accountingSlice";

const emptyFormData = {
  company_id: "",
  customer_id: "",
  payment_terms: "credit_30",
  payment_terms_custom: "",
  due_date: "",
  notes: "",
  document_header_type: "ต้นฉบับ",
  jobs: [],
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
  customer_business_type_id: "",
  customer_sales_user_id: "",
  customer_address: "",
  customer_province_id: "",
  customer_district_id: "",
  customer_subdistrict_id: "",
  customer_zip_code: "",
};

const emptyFinancials = {
  special_discount_percentage: 0,
  special_discount_amount: 0,
  has_vat: true,
  vat_percentage: 7,
  pricing_mode: "net",
  has_withholding_tax: false,
  withholding_tax_percentage: 0,
  deposit_mode: "percentage",
  deposit_percentage: 0,
  deposit_amount: 0,
};

/**
 * Hook จัดการ Logic ทั้งหมดของ QuotationStandaloneCreateDialog
 */
export const useQuotationStandaloneForm = ({ open, onClose, onSuccess, companyId }) => {
  const dispatch = useDispatch();
  const [createQuotation, { isLoading, error: apiError }] = useCreateStandaloneQuotationMutation();

  const { data: companiesData, isLoading: isLoadingCompanies } = useGetCompaniesQuery();
  const companies = useMemo(() => companiesData?.data || [], [companiesData]);

  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(emptyFormData);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [financials, setFinancials] = useState(emptyFinancials);

  // Update company_id when prop changes
  useEffect(() => {
    if (companyId) {
      setFormData((prev) => ({ ...prev, company_id: companyId }));
    }
  }, [companyId]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setErrors({});
      setFormData({
        ...emptyFormData,
        company_id: companyId || "",
        jobs: [],
        payment_terms: "credit_30",
        payment_terms_custom: "",
      });
      setSelectedCustomer(null);
      setFinancials(emptyFinancials);
    }
  }, [open, companyId]);

  // Effect to populate form when a customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      setFormData((prev) => ({
        ...prev,
        customer_id: selectedCustomer.cus_id,
        customer_company: selectedCustomer.cus_company || "",
        customer_phone: selectedCustomer.cus_tel_1 || "",
        customer_type: selectedCustomer.customer_type || "individual",
        contact_firstname: selectedCustomer.cus_firstname || "",
        contact_lastname: selectedCustomer.cus_lastname || "",
        contact_nickname: selectedCustomer.cus_name || "",
        contact_position: selectedCustomer.cus_depart || "",
        contact_phone_alt: selectedCustomer.cus_tel_2 || "",
        customer_email: selectedCustomer.cus_email || "",
        customer_tax_id: selectedCustomer.cus_tax_id || "",
        customer_channel: selectedCustomer.cus_channel || "1",
        customer_address: selectedCustomer.cus_address || "",
        customer_zip_code: selectedCustomer.cus_zip_code || "",
      }));
    } else {
      // Clear fields if customer is deselected
      setFormData((prev) => ({
        ...prev,
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
        payment_terms: "credit_30",
        payment_terms_custom: "",
      }));
    }
  }, [selectedCustomer]);

  const handleChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const handleJobsChange = useCallback((jobs) => {
    setFormData((prev) => ({ ...prev, jobs }));
  }, []);

  const handleFinancialsChange = useCallback((newFinancials) => {
    setFinancials(newFinancials);
  }, []);

  // Flatten jobs into items for FinancialSummaryPanel
  const financialPanelItems = useMemo(() => {
    return formData.jobs.flatMap((job) =>
      job.sizeRows.map((row) => ({
        unit_price: row.unit_price || 0,
        quantity: row.quantity || 0,
        discount_amount: 0,
      }))
    );
  }, [formData.jobs]);

  // Validation
  const validateStep = useCallback(
    (step) => {
      const newErrors = {};

      if (step === 0) {
        if (!formData.company_id) newErrors.company_id = "กรุณาเลือกบริษัท";
        if (!formData.customer_id) newErrors.customer_id = "กรุณาเลือกลูกค้า";
        if (!formData.customer_company.trim()) newErrors.customer_company = "กรุณากรอกชื่อบริษัท";
        if (!formData.customer_phone.trim()) newErrors.customer_phone = "กรุณากรอกเบอร์โทรศัพท์";
      }

      if (step === 1) {
        if (formData.jobs.length === 0) {
          newErrors.jobs = "กรุณาเพิ่มงานอย่างน้อย 1 งาน";
        } else {
          formData.jobs.forEach((job, jobIndex) => {
            if (!job.work_name.trim()) {
              newErrors[`jobs.${jobIndex}.work_name`] = "กรุณากรอกชื่องาน";
            }
            if (job.sizeRows.length === 0) {
              newErrors[`jobs.${jobIndex}.sizeRows`] = "กรุณาเพิ่มอย่างน้อย 1 ขนาด";
            } else {
              job.sizeRows.forEach((row, rowIndex) => {
                if (!row.unit_price || row.unit_price <= 0) {
                  newErrors[`jobs.${jobIndex}.rows.${rowIndex}.unit_price`] = "กรุณากรอกราคา";
                }
                if (!row.quantity || row.quantity <= 0) {
                  newErrors[`jobs.${jobIndex}.rows.${rowIndex}.quantity`] = "กรุณากรอกจำนวน";
                }
              });
            }
          });
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData]
  );

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    try {
      // Flatten jobs back to items for the API
      const itemsPayload = formData.jobs.flatMap((job, jobIndex) =>
        job.sizeRows.map((row, rowIndex) => ({
          item_name: job.work_name,
          item_description: "",
          pattern: job.pattern,
          fabric_type: job.fabric_type,
          color: job.color,
          size: row.size,
          unit_price: row.unit_price,
          quantity: row.quantity,
          unit: job.unit,
          discount_percentage: 0,
          discount_amount: 0,
          notes: row.notes,
          sequence_order: jobIndex * 100 + rowIndex + 1,
        }))
      );

      const isCredit =
        formData.payment_terms === "credit_30" || formData.payment_terms === "credit_60";
      const finalPaymentTerms =
        formData.payment_terms === "other" ? formData.payment_terms_custom : formData.payment_terms;
      const finalDueDate = isCredit ? formData.due_date : "";

      const payload = {
        company_id: formData.company_id,
        customer_id: formData.customer_id,
        work_name: formData.jobs.map((j) => j.work_name).join(", "),
        payment_terms: finalPaymentTerms,
        due_date: finalDueDate,
        notes: formData.notes,
        document_header_type: formData.document_header_type,
        items: itemsPayload,
        ...financials,
        customer_details: {
          cus_company: formData.customer_company,
          cus_tel_1: formData.customer_phone,
          customer_type: formData.customer_type,
          cus_firstname: formData.contact_firstname,
          cus_lastname: formData.contact_lastname,
          cus_name: formData.contact_nickname,
          cus_depart: formData.contact_position,
          cus_tel_2: formData.contact_phone_alt,
          cus_email: formData.customer_email,
          cus_tax_id: formData.customer_tax_id,
          cus_address: formData.customer_address,
          cus_zip_code: formData.customer_zip_code,
        },
      };

      const result = await createQuotation(payload).unwrap();

      dispatch(
        addNotification({
          type: "success",
          message: `สร้างใบเสนอราคา ${result.data.number} สำเร็จ`,
        })
      );

      if (onSuccess) {
        onSuccess(result.data);
      }

      onClose();
    } catch (err) {
      console.error("Failed to create quotation:", err);
      dispatch(
        addNotification({
          type: "error",
          message: err?.data?.message || "เกิดข้อผิดพลาดในการสร้างใบเสนอราคา",
        })
      );
    }
  };

  return {
    // State & Data
    activeStep,
    errors,
    apiError,
    formData,
    financials,
    selectedCustomer,
    companies,
    financialPanelItems,
    isLoading,
    isLoadingCompanies,

    // Handlers
    handleNext,
    handleBack,
    handleSubmit,
    handleChange,
    handleJobsChange,
    handleFinancialsChange,
    setSelectedCustomer,
  };
};
