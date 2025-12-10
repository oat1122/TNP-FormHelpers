/**
 * Custom Hook สำหรับ TelesalesQuickCreateForm เท่านั้น
 *
 * แยก Logic ออกจากฟอร์มปกติ (DialogForm) เพื่อป้องกันการทับซ้อน:
 * - ไม่ใช้ Redux state (inputList, customerSlice)
 * - จัดการ state ด้วย local useState เท่านั้น
 * - ใช้ Lazy Query สำหรับโหลด location แบบ cascade
 * - รองรับการทำงานแบบ standalone
 * - ✅ NEW: Duplicate checking for phone & company
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useAddCustomerMutation,
  useCheckDuplicateCustomerMutation,
} from "../../../features/Customer/customerApi";
import {
  useGetAllBusinessTypesQuery,
  useGetAllLocationQuery,
  useLazyGetAllLocationQuery,
} from "../../../features/globalApi";

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

  // ✅ NEW: Duplicate checking states
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateDialogData, setDuplicateDialogData] = useState(null);
  const [companyWarning, setCompanyWarning] = useState(null);

  // Track last checked values to avoid redundant API calls
  const lastCheckedPhone = useRef("");
  const lastCheckedCompany = useRef("");

  // Location data - จัดการใน local state เท่านั้น
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingSubdistricts, setIsLoadingSubdistricts] = useState(false);

  // ==================== API Hooks ====================
  const [addCustomer, { isLoading }] = useAddCustomerMutation();
  const [checkDuplicate] = useCheckDuplicateCustomerMutation(); // ✅ NEW

  // Business Types
  const { data: businessTypesData, isFetching: businessTypesIsFetching } =
    useGetAllBusinessTypesQuery();

  // Provinces - โหลดครั้งเดียวตอนเปิด dialog
  const { data: locationsData } = useGetAllLocationQuery({}, { skip: !open });

  // Districts & Subdistricts - โหลดแบบ lazy ตาม user selection
  const [fetchDistricts, { data: districtsData }] = useLazyGetAllLocationQuery();
  const [fetchSubdistricts, { data: subdistrictsData }] = useLazyGetAllLocationQuery();

  const businessTypesList = businessTypesData || [];

  // ==================== Effects ====================

  // โหลด Provinces เมื่อเปิด dialog
  useEffect(() => {
    if (locationsData?.master_provinces) {
      const validProvinces = locationsData.master_provinces
        .filter((prov) => prov?.pro_id && prov?.pro_name_th)
        .map((prov, index) => ({
          ...prov,
          pro_id: prov.pro_id || `prov-${index}`,
        }));
      setProvinces(validProvinces);
    }
  }, [locationsData]);

  // อัพเดท Districts เมื่อโหลดเสร็จ
  useEffect(() => {
    if (districtsData?.master_district) {
      const validDistricts = districtsData.master_district
        .filter((district) => {
          const hasValidName = district.dis_name_th || district.dis_name;
          const hasValidId = district.dis_id;
          return district && hasValidId && hasValidName;
        })
        .map((district) => ({
          ...district,
          dis_name: district.dis_name || district.dis_name_th,
        }));
      setDistricts(validDistricts);
      setIsLoadingDistricts(false);
    }
  }, [districtsData]);

  // อัพเดท Subdistricts เมื่อโหลดเสร็จ
  useEffect(() => {
    if (subdistrictsData?.master_subdistrict) {
      const validSubdistricts = subdistrictsData.master_subdistrict
        .filter((subdistrict) => {
          const hasValidName = subdistrict.sub_name_th || subdistrict.sub_name;
          const hasValidId = subdistrict.sub_id;
          return subdistrict && hasValidId && hasValidName;
        })
        .map((subdistrict) => ({
          ...subdistrict,
          sub_name: subdistrict.sub_name || subdistrict.sub_name_th,
        }));
      setSubdistricts(validSubdistricts);
      setIsLoadingSubdistricts(false);
    }
  }, [subdistrictsData]);

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

      // ✅ NEW: Clear company warning when user modifies company field
      if (field === "cus_company") {
        setCompanyWarning(null);
      }

      // Hide location warning if user starts filling location
      if (["cus_pro_id", "cus_dis_id", "cus_sub_id"].includes(field) && value) {
        setShowLocationWarning(false);
      }
    },
    [fieldErrors]
  );

  // Province change - โหลด districts และ clear ข้อมูลที่ขึ้นต่อกัน
  const handleProvinceChange = useCallback(
    (event, newValue) => {
      console.log("🏙️ [Telesales] Province changed:", newValue?.pro_name_th);

      setFormData((prev) => ({
        ...prev,
        cus_pro_id: newValue?.pro_id || "",
        cus_dis_id: "",
        cus_sub_id: "",
        cus_zip_code: "",
      }));

      // Clear dependent data
      setDistricts([]);
      setSubdistricts([]);

      // Load districts
      if (newValue?.pro_sort_id) {
        setIsLoadingDistricts(true);
        fetchDistricts({ province_sort_id: newValue.pro_sort_id });
      }
    },
    [fetchDistricts]
  );

  // District change - โหลด subdistricts และ clear ข้อมูลที่ขึ้นต่อกัน
  const handleDistrictChange = useCallback(
    (event, newValue) => {
      console.log("🏘️ [Telesales] District changed:", newValue?.dis_name);

      setFormData((prev) => ({
        ...prev,
        cus_dis_id: newValue?.dis_id || "",
        cus_sub_id: "",
        cus_zip_code: "",
      }));

      // Clear dependent data
      setSubdistricts([]);

      // Load subdistricts
      if (newValue?.dis_sort_id) {
        setIsLoadingSubdistricts(true);
        fetchSubdistricts({ district_sort_id: newValue.dis_sort_id });
      }
    },
    [fetchSubdistricts]
  );

  // Subdistrict change - auto-fill zip code
  const handleSubdistrictChange = useCallback((event, newValue) => {
    console.log(" [Telesales] Subdistrict changed:", newValue?.sub_name);

    setFormData((prev) => ({
      ...prev,
      cus_sub_id: newValue?.sub_id || "",
      // Auto-fill zip code but preserve if user manually changed it
      cus_zip_code: newValue?.sub_zip_code || prev.cus_zip_code,
    }));
  }, []);

  // ✅ NEW: Phone blur - check for duplicates (with Dialog)
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

    // ✅ Check if value changed (avoid redundant API calls)
    if (cleanPhone === lastCheckedPhone.current) {
      return;
    }

    lastCheckedPhone.current = cleanPhone;

    try {
      console.log("📞 [Duplicate Check] Checking phone:", cleanPhone);
      const result = await checkDuplicate({
        type: "phone",
        value: cleanPhone,
      }).unwrap();

      if (result.found && result.data.length > 0) {
        console.log("⚠️ [Duplicate Found] Phone exists:", result.data[0]);
        setDuplicateDialogData(result.data[0]);
        setDuplicateDialogOpen(true);
      }
    } catch (error) {
      console.error("❌ [Duplicate Check] Failed:", error);
    }
  }, [formData.cus_tel_1, checkDuplicate]);

  // ✅ NEW: Company blur - check for duplicates (with Alert)
  const handleCompanyBlur = useCallback(async () => {
    const company = formData.cus_company.trim();

    // Skip if empty or too short (< 3 characters)
    if (!company || company.length < 3) {
      return;
    }

    // ✅ Check if value changed (avoid redundant API calls)
    if (company === lastCheckedCompany.current) {
      return;
    }

    lastCheckedCompany.current = company;

    try {
      console.log("🏢 [Duplicate Check] Checking company:", company);
      const result = await checkDuplicate({
        type: "company",
        value: company,
      }).unwrap();

      if (result.found && result.data.length > 0) {
        console.log("⚠️ [Duplicate Found] Company exists:", result.data);
        setCompanyWarning({
          count: result.data.length,
          examples: result.data.slice(0, 2), // Show max 2 examples
        });
      } else {
        setCompanyWarning(null);
      }
    } catch (error) {
      console.error("❌ [Duplicate Check] Failed:", error);
    }
  }, [formData.cus_company, checkDuplicate]);

  // ✅ NEW: Close duplicate dialog handler
  const handleCloseDuplicateDialog = useCallback(() => {
    setDuplicateDialogOpen(false);
    // Keep data for reference, don't clear it
  }, []);

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
    setDuplicateDialogOpen(false);
    setDuplicateDialogData(null);
    setCompanyWarning(null);
    setDistricts([]);
    setSubdistricts([]);
    lastCheckedPhone.current = "";
    lastCheckedCompany.current = "";
  }, [initialFormData]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      await addCustomer({
        ...formData,
        cus_source: "telesales",
        cus_allocation_status: "pool",
        cus_created_by: user.user_id,
        cus_manage_by: null,
        cus_allocated_by: user.user_id,
        is_possible_duplicate: !!(duplicateDialogData || companyWarning),
      }).unwrap();

      console.log("✅ [Telesales] Customer created successfully");
      onClose();
      resetForm();
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
    duplicateDialogData,
    companyWarning,
    onClose,
    resetForm,
  ]);

  // Save and create another handler
  const handleSaveAndNew = useCallback(async () => {
    if (!validateForm()) return;

    try {
      await addCustomer({
        ...formData,
        cus_source: "telesales",
        cus_allocation_status: "pool",
        cus_created_by: user.user_id,
        cus_manage_by: null,
        cus_allocated_by: user.user_id,
        is_possible_duplicate: !!(duplicateDialogData || companyWarning),
      }).unwrap();

      console.log("✅ [Telesales] Customer created successfully, ready for next entry");

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
    duplicateDialogData,
    companyWarning,
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

    // ✅ NEW: Duplicate states
    duplicateDialogOpen,
    duplicateDialogData,
    companyWarning,

    // Location data
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
    handleCompanyBlur, // ✅ NEW
    handleCloseDuplicateDialog, // ✅ NEW
    handleSave,
    handleSaveAndNew,
    handleClose,
  };
};
