/**
 * Custom Hook สำหรับ TelesalesQuickCreateForm เท่านั้น
 *
 * แยก Logic ออกจากฟอร์มปกติ (DialogForm) เพื่อป้องกันการทับซ้อน:
 * - ไม่ใช้ Redux state (inputList, customerSlice)
 * - จัดการ state ด้วย local useState เท่านั้น
 * - ใช้ Lazy Query สำหรับโหลด location แบบ cascade
 * - รองรับการทำงานแบบ standalone
 */

import { useState, useEffect, useCallback } from "react";
import {
  useAddCustomerMutation,
  useGetAllCustomerQuery,
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
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [showLocationWarning, setShowLocationWarning] = useState(false);

  // Location data - จัดการใน local state เท่านั้น
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingSubdistricts, setIsLoadingSubdistricts] = useState(false);

  // ==================== API Hooks ====================
  const [addCustomer, { isLoading }] = useAddCustomerMutation();

  // Business Types
  const { data: businessTypesData, isFetching: businessTypesIsFetching } =
    useGetAllBusinessTypesQuery();

  // Provinces - โหลดครั้งเดียวตอนเปิด dialog
  const { data: locationsData } = useGetAllLocationQuery({}, { skip: !open });

  // Districts & Subdistricts - โหลดแบบ lazy ตาม user selection
  const [fetchDistricts, { data: districtsData }] = useLazyGetAllLocationQuery();
  const [fetchSubdistricts, { data: subdistrictsData }] = useLazyGetAllLocationQuery();

  // Duplicate check
  const { refetch: checkDuplicate } = useGetAllCustomerQuery(
    {
      search: formData.cus_tel_1,
      page: 0,
      per_page: 5,
    },
    {
      skip: true,
    }
  );

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
    console.log("🏡 [Telesales] Subdistrict changed:", newValue?.sub_name);

    setFormData((prev) => ({
      ...prev,
      cus_sub_id: newValue?.sub_id || "",
      // Auto-fill zip code but preserve if user manually changed it
      cus_zip_code: newValue?.sub_zip_code || prev.cus_zip_code,
    }));
  }, []);

  // Phone blur - check for duplicates
  const handlePhoneBlur = useCallback(async () => {
    const phone = formData.cus_tel_1.trim();

    if (phone && phone.match(/^0\d{9}$/)) {
      try {
        const result = await checkDuplicate();
        if (result.data?.data?.length > 0) {
          setDuplicateWarning(result.data.data[0]);
        } else {
          setDuplicateWarning(null);
        }
      } catch (error) {
        console.error("Failed to check duplicate", error);
      }
    } else if (phone) {
      setFieldErrors((prev) => ({
        ...prev,
        cus_tel_1: "รูปแบบเบอร์โทรไม่ถูกต้อง (ต้องเป็น 0812345678)",
      }));
    }
  }, [formData.cus_tel_1, checkDuplicate]);

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
    } else if (!formData.cus_tel_1.match(/^0\d{9}$/)) {
      errors.cus_tel_1 = "รูปแบบเบอร์โทรไม่ถูกต้อง (10 หลัก)";
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
    setDuplicateWarning(null);
    setShowLocationWarning(false);
    setDistricts([]);
    setSubdistricts([]);
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
        is_possible_duplicate: !!duplicateWarning,
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
  }, [validateForm, addCustomer, formData, user.user_id, duplicateWarning, onClose, resetForm]);

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
        is_possible_duplicate: !!duplicateWarning,
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
    duplicateWarning,
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
    duplicateWarning,
    showLocationWarning,

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
    handleSave,
    handleSaveAndNew,
    handleClose,
    setDuplicateWarning,
  };
};
