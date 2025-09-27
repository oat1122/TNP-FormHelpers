import { useState, useCallback } from "react";

import { FORM_VALIDATION } from "../components/Shared/constants";

export const useFormValidation = (initialFormData = {}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validate a single field
  const validateField = useCallback(
    (fieldName, value, step = null) => {
      const newErrors = { ...errors };

      switch (fieldName) {
        case "worksheet_id":
          if (!value) {
            newErrors[fieldName] = "กรุณาเลือก Worksheet";
          } else {
            delete newErrors[fieldName];
          }
          break;

        case "title":
          if (!value?.trim()) {
            newErrors[fieldName] = "กรุณาระบุชื่อเรื่อง";
          } else if (value.length > FORM_VALIDATION.MAX_TITLE_LENGTH) {
            newErrors[fieldName] =
              `ชื่อเรื่องต้องไม่เกิน ${FORM_VALIDATION.MAX_TITLE_LENGTH} ตัวอักษร`;
          } else {
            delete newErrors[fieldName];
          }
          break;

        case "customer_name":
          if (!value?.trim()) {
            newErrors[fieldName] = "กรุณาระบุชื่อลูกค้า";
          } else {
            delete newErrors[fieldName];
          }
          break;

        case "production_type":
          if (!value) {
            newErrors[fieldName] = "กรุณาเลือกประเภทการผลิต";
          } else {
            delete newErrors[fieldName];
          }
          break;

        case "shirt_type":
          if (!value) {
            newErrors[fieldName] = "กรุณาเลือกประเภทเสื้อ";
          } else {
            delete newErrors[fieldName];
          }
          break;

        case "total_quantity":
          if (!value || value <= 0) {
            newErrors[fieldName] = "กรุณาระบุจำนวนที่ถูกต้อง";
          } else if (value > FORM_VALIDATION.MAX_QUANTITY) {
            newErrors[fieldName] = `จำนวนต้องไม่เกิน ${FORM_VALIDATION.MAX_QUANTITY}`;
          } else {
            delete newErrors[fieldName];
          }
          break;

        case "start_date":
          if (!value) {
            newErrors[fieldName] = "กรุณาระบุวันที่เริ่ม";
          } else {
            delete newErrors[fieldName];
          }
          break;

        case "expected_completion_date":
          if (!value) {
            newErrors[fieldName] = "กรุณาระบุวันที่คาดว่าจะเสร็จ";
          } else if (formData.start_date && value < formData.start_date) {
            newErrors[fieldName] = "วันที่เสร็จต้องมาหลังวันที่เริ่ม";
          } else {
            delete newErrors[fieldName];
          }
          break;

        case "due_date":
          if (value && formData.start_date && value < formData.start_date) {
            newErrors[fieldName] = "วันครบกำหนดต้องมาหลังวันที่เริ่ม";
          } else {
            delete newErrors[fieldName];
          }
          break;

        case "priority":
          if (!value) {
            newErrors[fieldName] = "กรุณาระบุระดับความสำคัญ";
          } else {
            delete newErrors[fieldName];
          }
          break;

        case "size_breakdown":
          if (!value || !Array.isArray(value) || value.length === 0) {
            newErrors[fieldName] = "กรุณาระบุรายละเอียดไซต์";
          } else {
            const totalSizes = value.reduce((sum, item) => sum + (item.quantity || 0), 0);
            if (totalSizes !== formData.total_quantity) {
              newErrors[fieldName] = "จำนวนไซต์ต้องตรงกับจำนวนทั้งหมด";
            } else {
              delete newErrors[fieldName];
            }
          }
          break;

        case "notes":
          if (value && value.length > FORM_VALIDATION.MAX_NOTES_LENGTH) {
            newErrors[fieldName] =
              `หมายเหตุต้องไม่เกิน ${FORM_VALIDATION.MAX_NOTES_LENGTH} ตัวอักษร`;
          } else {
            delete newErrors[fieldName];
          }
          break;

        case "special_instructions":
          if (value && value.length > FORM_VALIDATION.MAX_NOTES_LENGTH) {
            newErrors[fieldName] =
              `คำแนะนำพิเศษต้องไม่เกิน ${FORM_VALIDATION.MAX_NOTES_LENGTH} ตัวอักษร`;
          } else {
            delete newErrors[fieldName];
          }
          break;

        default:
          break;
      }

      setErrors(newErrors);
      return !newErrors[fieldName];
    },
    [errors, formData]
  );

  // Validate entire step
  const validateStep = useCallback(
    (step) => {
      const newErrors = {};

      switch (step) {
        case 0: // Basic Info
          FORM_VALIDATION.REQUIRED_FIELDS.forEach((field) => {
            if (!formData[field]) {
              switch (field) {
                case "worksheet_id":
                  newErrors[field] = "กรุณาเลือก Worksheet";
                  break;
                case "title":
                  newErrors[field] = "กรุณาระบุชื่อเรื่อง";
                  break;
                case "production_type":
                  newErrors[field] = "กรุณาเลือกประเภทการผลิต";
                  break;
                case "start_date":
                  newErrors[field] = "กรุณาระบุวันที่เริ่ม";
                  break;
                case "expected_completion_date":
                  newErrors[field] = "กรุณาระบุวันที่คาดว่าจะเสร็จ";
                  break;
                default:
                  newErrors[field] = "ข้อมูลนี้จำเป็นต้องกรอก";
              }
            }
          });

          // Additional validations for step 0
          if (!formData.customer_name?.trim()) {
            newErrors.customer_name = "กรุณาระบุชื่อลูกค้า";
          }
          if (!formData.priority) {
            newErrors.priority = "กรุณาระบุระดับความสำคัญ";
          }
          break;

        case 1: // Production Info
          if (!formData.production_type) {
            newErrors.production_type = "กรุณาเลือกประเภทการผลิต";
          }
          if (!formData.shirt_type) {
            newErrors.shirt_type = "กรุณาเลือกประเภทเสื้อ";
          }
          if (!formData.total_quantity || formData.total_quantity <= 0) {
            newErrors.total_quantity = "กรุณาระบุจำนวนที่ถูกต้อง";
          }
          if (!formData.size_breakdown || formData.size_breakdown.length === 0) {
            newErrors.size_breakdown = "กรุณาระบุรายละเอียดไซต์";
          }
          break;

        case 2: // Notes
          // Optional step - no required fields
          break;

        default:
          break;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData]
  );

  // Update form data
  const updateFormData = useCallback(
    (field, value) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }

      // Mark field as touched
      setTouched((prev) => ({
        ...prev,
        [field]: true,
      }));
    },
    [errors]
  );

  // Update multiple fields at once
  const updateMultipleFields = useCallback((updates) => {
    setFormData((prev) => ({
      ...prev,
      ...updates,
    }));

    // Clear errors for updated fields
    const updatedFields = Object.keys(updates);
    setErrors((prev) => {
      const newErrors = { ...prev };
      updatedFields.forEach((field) => {
        delete newErrors[field];
      });
      return newErrors;
    });

    // Mark updated fields as touched
    setTouched((prev) => ({
      ...prev,
      ...updatedFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
    }));
  }, []);

  // Reset form
  const resetForm = useCallback((newData = {}) => {
    setFormData(newData);
    setErrors({});
    setTouched({});
  }, []);

  // Get field error
  const getFieldError = useCallback(
    (fieldName) => {
      return errors[fieldName] || "";
    },
    [errors]
  );

  // Check if field has error
  const hasError = useCallback(
    (fieldName) => {
      return Boolean(errors[fieldName]);
    },
    [errors]
  );

  // Check if field is touched
  const isFieldTouched = useCallback(
    (fieldName) => {
      return Boolean(touched[fieldName]);
    },
    [touched]
  );

  // Check if form is valid
  const isFormValid = useCallback(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    // Data
    formData,
    errors,
    touched,

    // Functions
    validateField,
    validateStep,
    updateFormData,
    updateMultipleFields,
    resetForm,
    getFieldError,
    hasError,
    isFieldTouched,
    isFormValid,

    // Direct setters if needed
    setFormData,
    setErrors,
    setTouched,
  };
};
