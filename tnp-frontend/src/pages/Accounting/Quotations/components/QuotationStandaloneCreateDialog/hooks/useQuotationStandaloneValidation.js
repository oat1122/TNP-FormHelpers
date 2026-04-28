import { useCallback, useState } from "react";

const validateCustomerStep = (formData) => {
  const errors = {};
  if (!formData.company_id) errors.company_id = "กรุณาเลือกบริษัท";
  if (!formData.customer_id) errors.customer_id = "กรุณาเลือกลูกค้า";
  if (!formData.customer_company.trim()) errors.customer_company = "กรุณากรอกชื่อบริษัท";
  if (!formData.customer_phone.trim()) errors.customer_phone = "กรุณากรอกเบอร์โทรศัพท์";
  return errors;
};

const validateJobsStep = (formData) => {
  const errors = {};
  if (formData.jobs.length === 0) {
    errors.jobs = "กรุณาเพิ่มงานอย่างน้อย 1 งาน";
    return errors;
  }
  formData.jobs.forEach((job, jobIndex) => {
    if (!job.work_name.trim()) {
      errors[`jobs.${jobIndex}.work_name`] = "กรุณากรอกชื่องาน";
    }
    if (job.sizeRows.length === 0) {
      errors[`jobs.${jobIndex}.sizeRows`] = "กรุณาเพิ่มอย่างน้อย 1 ขนาด";
      return;
    }
    job.sizeRows.forEach((row, rowIndex) => {
      if (!row.unit_price || row.unit_price <= 0) {
        errors[`jobs.${jobIndex}.rows.${rowIndex}.unit_price`] = "กรุณากรอกราคา";
      }
      if (!row.quantity || row.quantity <= 0) {
        errors[`jobs.${jobIndex}.rows.${rowIndex}.quantity`] = "กรุณากรอกจำนวน";
      }
    });
  });
  return errors;
};

// Manages step-level validation + the shared `errors` map.
// Returns `validateStep(step)` which sets errors and returns whether the step is valid.
export function useQuotationStandaloneValidation(formData) {
  const [errors, setErrors] = useState({});

  const validateStep = useCallback(
    (step) => {
      let stepErrors = {};
      if (step === 0) stepErrors = validateCustomerStep(formData);
      else if (step === 1) stepErrors = validateJobsStep(formData);
      setErrors(stepErrors);
      return Object.keys(stepErrors).length === 0;
    },
    [formData]
  );

  const clearFieldError = useCallback((field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  return { errors, setErrors, validateStep, clearFieldError };
}
