/**
 * Custom Hook สำหรับ TelesalesQuickCreateForm เท่านั้น
 *
 * REFACTORED: ใช้ shared hooks แทนการ re-implement
 * - useAddressManager: จัดการ location selection (Province > District > Subdistrict)
 * - useDuplicateCheck: ตรวจสอบเบอร์โทร/บริษัทซ้ำ
 *
 * แยก Logic ออกจากฟอร์มปกติ (DialogForm) เพื่อป้องกันการทับซ้อน:
 * - ไม่ใช้ Redux state (inputList, customerSlice)
 * - จัดการ state ด้วย local useState เท่านั้น
 * - รองรับการทำงานแบบ standalone
 */

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useAddCustomerMutation } from "../../../../features/Customer/customerApi";
import { useGetAllBusinessTypesQuery } from "../../../../features/globalApi";

// Use shared hooks instead of re-implementing
import { useAddressManager } from "./useAddressManager";
import { useDuplicateCheck } from "../useDuplicateCheck";
import { useSanitizeInput } from "./useSanitizeInput";

export const useTelesalesQuickForm = ({ open, onClose, nameFieldRef }) => {
  const user = JSON.parse(localStorage.getItem("userData"));

  // ==================== Initial State ====================
  const initialFormData = {
    // ข้อมูลพื้นฐาน (Required)
    cus_name: "",
    cus_firstname: "",
    cus_lastname: "",
    cus_tel_1: "",

    // ข้อมูลธุรกิจ (Optional)
    cus_company: "",
    cus_bt_id: "",
    cus_channel: 1,

    // ที่อยู่ (Optional but recommended)
    cus_pro_id: "",
    cus_dis_id: "",
    cus_sub_id: "",
    cus_zip_code: "",
    cus_address: "",

    // ข้อมูลเพิ่มเติม (Optional)
    cd_note: "",
    cus_email: "",
    cus_tax_id: "",
  };

  // ==================== Local State (ไม่ใช้ Redux) ====================
  const [formData, setFormData] = useState(initialFormData);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showLocationWarning, setShowLocationWarning] = useState(false);

  // ==================== Shared Hooks ====================

  // Address Manager for location selection
  const {
    provinces,
    districts,
    subdistricts,
    isLoadingDistricts,
    isLoadingSubdistricts,
    handleProvinceChange: addressProvinceChange,
    handleDistrictChange: addressDistrictChange,
    handleSubdistrictChange: addressSubdistrictChange,
    buildFullAddress,
    resetLocationData,
  } = useAddressManager({ skip: !open });

  // Duplicate Check for phone and company
  const {
    duplicatePhoneDialogOpen,
    duplicatePhoneData,
    companyWarning,
    checkPhoneDuplicate,
    checkCompanyDuplicate,
    closeDuplicatePhoneDialog,
    clearCompanyWarning,
    clearDuplicatePhoneData,
    resetDuplicateChecks,
    hasDuplicateWarning,
  } = useDuplicateCheck({ mode: "create" });

  // Sanitize input hook - ตัดตัวอักษรพิเศษก่อนบันทึก
  const { sanitizeFormData } = useSanitizeInput();

  // ==================== API Hooks ====================
  const [addCustomer, { isLoading }] = useAddCustomerMutation();

  // Business Types
  const { data: businessTypesData, isFetching: businessTypesIsFetching } =
    useGetAllBusinessTypesQuery();

  const businessTypesList = businessTypesData || [];

  // ==================== Effects ====================

  // Auto-focus on first field
  useEffect(() => {
    if (open && nameFieldRef?.current) {
      setTimeout(() => {
        nameFieldRef.current?.focus();
      }, 100);
    }
  }, [open, nameFieldRef]);

  // ==================== Handlers ====================

  // General input change handler
  const handleChange = useCallback(
    (field) => (e) => {
      const value = e?.target?.value !== undefined ? e.target.value : e;

      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear field error
      if (fieldErrors[field]) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }

      // Clear company warning when user modifies company field
      if (field === "cus_company") {
        clearCompanyWarning();
      }

      // Clear phone duplicate state when user modifies phone field
      if (field === "cus_tel_1" && duplicatePhoneData) {
        clearDuplicatePhoneData();
      }

      // Hide location warning if user starts filling location
      if (["cus_pro_id", "cus_dis_id", "cus_sub_id"].includes(field) && value) {
        setShowLocationWarning(false);
      }
    },
    [fieldErrors, duplicatePhoneData, clearCompanyWarning, clearDuplicatePhoneData]
  );

  // Province change - uses useAddressManager
  const handleProvinceChange = useCallback(
    (event, newValue) => {
      const updatedFields = addressProvinceChange(event, newValue);

      setFormData((prev) => ({
        ...prev,
        ...updatedFields,
      }));
    },
    [addressProvinceChange]
  );

  // District change - uses useAddressManager
  const handleDistrictChange = useCallback(
    (event, newValue) => {
      const updatedFields = addressDistrictChange(event, newValue);

      setFormData((prev) => ({
        ...prev,
        ...updatedFields,
      }));
    },
    [addressDistrictChange]
  );

  // Subdistrict change - uses useAddressManager with auto-fill zip code
  const handleSubdistrictChange = useCallback(
    (event, newValue) => {
      const updatedFields = addressSubdistrictChange(event, newValue, formData.cus_zip_code);

      setFormData((prev) => ({
        ...prev,
        ...updatedFields,
      }));
    },
    [addressSubdistrictChange, formData.cus_zip_code]
  );

  // Phone blur - uses useDuplicateCheck
  const handlePhoneBlur = useCallback(async () => {
    const phone = formData.cus_tel_1.trim();

    // Skip if empty
    if (!phone) return;

    // Clean phone number (remove spaces, dashes, parentheses)
    const cleanPhone = phone.replace(/[\s\-()]/g, "");

    // Validate: Must contain at least 9 digits
    const digitCount = cleanPhone.replace(/\D/g, "").length;
    if (digitCount < 9) {
      setFieldErrors((prev) => ({
        ...prev,
        cus_tel_1: "กรุณากรอกเบอร์โทรอย่างน้อย 9 หลัก",
      }));
      return;
    }

    // Use shared duplicate check
    await checkPhoneDuplicate(cleanPhone);
  }, [formData.cus_tel_1, checkPhoneDuplicate]);

  // Company blur - uses useDuplicateCheck
  const handleCompanyBlur = useCallback(async () => {
    const company = formData.cus_company.trim();

    // Skip if empty or too short (< 3 characters)
    if (!company || company.length < 3) {
      return;
    }

    // Use shared duplicate check
    await checkCompanyDuplicate(company);
  }, [formData.cus_company, checkCompanyDuplicate]);

  // Close duplicate dialog handler - uses useDuplicateCheck
  const handleCloseDuplicateDialog = useCallback(() => {
    closeDuplicatePhoneDialog();
  }, [closeDuplicatePhoneDialog]);

  // Form validation
  const validateForm = useCallback(() => {
    const errors = {};

    // Required fields
    if (!formData.cus_name.trim()) {
      errors.cus_name = "กรุณากรอกชื่อเล่น";
    }

    if (!formData.cus_firstname.trim()) {
      errors.cus_firstname = "กรุณากรอกชื่อจริง";
    }

    if (!formData.cus_lastname.trim()) {
      errors.cus_lastname = "กรุณากรอกนามสกุล";
    }

    if (!formData.cus_tel_1.trim()) {
      errors.cus_tel_1 = "กรุณากรอกเบอร์โทร";
    } else {
      const cleanPhone = formData.cus_tel_1.replace(/[\s\-()]/g, "");
      const digitCount = cleanPhone.replace(/\D/g, "").length;
      if (digitCount < 9) {
        errors.cus_tel_1 = "กรุณากรอกเบอร์โทรอย่างน้อย 9 หลัก";
      }
    }

    // Location warning (ไม่บล็อกการ submit)
    if (!formData.cus_pro_id || !formData.cus_dis_id || !formData.cus_sub_id) {
      setShowLocationWarning(true);
    } else {
      setShowLocationWarning(false);
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setFieldErrors({});
    setShowLocationWarning(false);
    resetDuplicateChecks();
    resetLocationData();
  }, [initialFormData, resetDuplicateChecks, resetLocationData]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      // Sanitize ข้อมูลก่อนบันทึก - ตัดตัวอักษรพิเศษป้องกัน SQL Injection และ XSS
      const sanitizedData = sanitizeFormData(formData);

      await addCustomer({
        ...sanitizedData,
        cus_source: "telesales",
        cus_allocation_status: "pool",
        cus_created_by: user.user_id,
        cus_manage_by: null,
        cus_allocated_by: user.user_id,
        is_possible_duplicate: hasDuplicateWarning,
      }).unwrap();

      toast.success("สร้างลูกค้าสำเร็จ");
      onClose();
      resetForm();
    } catch (error) {
      console.error("❌ [Telesales] Failed to add customer:", error);
      setFieldErrors({
        submit: error.data?.message || "เกิดข้อผิดพลาดในการบันทึก",
      });
    }
  }, [validateForm, addCustomer, formData, user.user_id, hasDuplicateWarning, onClose, resetForm]);

  // Save and create another handler
  const handleSaveAndNew = useCallback(async () => {
    if (!validateForm()) return;

    try {
      // Sanitize ข้อมูลก่อนบันทึก - ตัดตัวอักษรพิเศษป้องกัน SQL Injection และ XSS
      const sanitizedData = sanitizeFormData(formData);

      await addCustomer({
        ...sanitizedData,
        cus_source: "telesales",
        cus_allocation_status: "pool",
        cus_created_by: user.user_id,
        cus_manage_by: null,
        cus_allocated_by: user.user_id,
        is_possible_duplicate: hasDuplicateWarning,
      }).unwrap();

      toast.success("สร้างลูกค้าสำเร็จ");

      // Optimistic reset
      setTimeout(() => {
        resetForm();
        nameFieldRef?.current?.focus();
      }, 0);
    } catch (error) {
      console.error("❌ [Telesales] Failed to add customer:", error);
      setFieldErrors({
        submit: error.data?.message || "เกิดข้อผิดพลาดในการบันทึก",
      });
    }
  }, [
    validateForm,
    addCustomer,
    formData,
    user.user_id,
    hasDuplicateWarning,
    resetForm,
    nameFieldRef,
  ]);

  // Close handler
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // ==================== Return API ====================
  return {
    // Form state
    formData,
    fieldErrors,
    showLocationWarning,

    // Duplicate states (from useDuplicateCheck)
    duplicateDialogOpen: duplicatePhoneDialogOpen,
    duplicateDialogData: duplicatePhoneData,
    companyWarning,
    isPhoneBlocked: !!duplicatePhoneData,

    // Location data (from useAddressManager)
    provinces,
    districts,
    subdistricts,
    isLoadingDistricts,
    isLoadingSubdistricts,

    // Business types
    businessTypesList,
    businessTypesIsFetching,

    // Loading state
    isLoading,

    // Handlers
    handleChange,
    handleProvinceChange,
    handleDistrictChange,
    handleSubdistrictChange,
    handlePhoneBlur,
    handleCompanyBlur,
    handleCloseDuplicateDialog,
    handleSave,
    handleSaveAndNew,
    handleClose,
  };
};
