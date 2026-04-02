import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { useAddressManager } from "./useAddressManager";
import { useSanitizeInput } from "./useSanitizeInput";
import { useAddCustomerMutation } from "../../../../features/Customer/customerApi";
import { useAddNotebookLeadMutation } from "../../../../features/Notebook/notebookApi";
import { useGetAllBusinessTypesQuery } from "../../../../features/globalApi";
import { shouldCreateNotebookLead } from "../../../../utils/userAccess";
import { useDuplicateCheck } from "../useDuplicateCheck";

export const useTelesalesQuickForm = ({ open, onClose, nameFieldRef }) => {
  const user = JSON.parse(localStorage.getItem("userData") || "{}");
  const shouldSubmitNotebookLead = shouldCreateNotebookLead(user);

  const initialFormData = useMemo(
    () => ({
      cus_name: "",
      cus_firstname: "",
      cus_lastname: "",
      cus_tel_1: "",
      cus_company: "",
      cus_bt_id: "",
      cus_channel: 1,
      cus_pro_id: "",
      cus_dis_id: "",
      cus_sub_id: "",
      cus_zip_code: "",
      cus_address: "",
      cd_note: "",
      cus_email: "",
      cus_tax_id: "",
    }),
    []
  );

  const [formData, setFormData] = useState(initialFormData);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showLocationWarning, setShowLocationWarning] = useState(false);

  const {
    provinces,
    districts,
    subdistricts,
    isLoadingDistricts,
    isLoadingSubdistricts,
    handleProvinceChange: addressProvinceChange,
    handleDistrictChange: addressDistrictChange,
    handleSubdistrictChange: addressSubdistrictChange,
    resetLocationData,
  } = useAddressManager({ skip: !open });

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

  const { sanitizeFormData } = useSanitizeInput();

  const [addCustomer, { isLoading: isCreatingCustomer }] = useAddCustomerMutation();
  const [addNotebookLead, { isLoading: isCreatingNotebookLead }] = useAddNotebookLeadMutation();
  const { data: businessTypesData, isFetching: businessTypesIsFetching } =
    useGetAllBusinessTypesQuery();

  const businessTypesList = businessTypesData || [];

  useEffect(() => {
    if (open && nameFieldRef?.current) {
      setTimeout(() => nameFieldRef.current?.focus(), 100);
    }
  }, [open, nameFieldRef]);

  const handleChange = useCallback(
    (field) => (eventOrValue) => {
      const value = eventOrValue?.target?.value ?? eventOrValue;

      setFormData((prev) => ({ ...prev, [field]: value }));

      if (fieldErrors[field]) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }

      if (field === "cus_company") {
        clearCompanyWarning();
      }

      if (field === "cus_tel_1" && duplicatePhoneData) {
        clearDuplicatePhoneData();
      }

      if (["cus_pro_id", "cus_dis_id", "cus_sub_id"].includes(field) && value) {
        setShowLocationWarning(false);
      }
    },
    [fieldErrors, duplicatePhoneData, clearCompanyWarning, clearDuplicatePhoneData]
  );

  const handleProvinceChange = useCallback(
    (event, newValue) => {
      const updatedFields = addressProvinceChange(event, newValue);
      setFormData((prev) => ({ ...prev, ...updatedFields }));
    },
    [addressProvinceChange]
  );

  const handleDistrictChange = useCallback(
    (event, newValue) => {
      const updatedFields = addressDistrictChange(event, newValue);
      setFormData((prev) => ({ ...prev, ...updatedFields }));
    },
    [addressDistrictChange]
  );

  const handleSubdistrictChange = useCallback(
    (event, newValue) => {
      const updatedFields = addressSubdistrictChange(event, newValue, formData.cus_zip_code);
      setFormData((prev) => ({ ...prev, ...updatedFields }));
    },
    [addressSubdistrictChange, formData.cus_zip_code]
  );

  const handlePhoneBlur = useCallback(async () => {
    const phone = formData.cus_tel_1.trim();
    if (!phone) return;

    const cleanPhone = phone.replace(/[\s\-()]/g, "");
    const digitCount = cleanPhone.replace(/\D/g, "").length;
    if (digitCount < 9) {
      setFieldErrors((prev) => ({
        ...prev,
        cus_tel_1: "กรุณากรอกเบอร์โทรอย่างน้อย 9 หลัก",
      }));
      return;
    }

    await checkPhoneDuplicate(cleanPhone);
  }, [formData.cus_tel_1, checkPhoneDuplicate]);

  const handleCompanyBlur = useCallback(async () => {
    const company = formData.cus_company.trim();
    if (!company || company.length < 3) return;
    await checkCompanyDuplicate(company);
  }, [formData.cus_company, checkCompanyDuplicate]);

  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.cus_name.trim()) errors.cus_name = "กรุณากรอกชื่อเล่น";
    if (!formData.cus_firstname.trim()) errors.cus_firstname = "กรุณากรอกชื่อจริง";
    if (!formData.cus_lastname.trim()) errors.cus_lastname = "กรุณากรอกนามสกุล";

    if (!formData.cus_tel_1.trim()) {
      errors.cus_tel_1 = "กรุณากรอกเบอร์โทร";
    } else {
      const cleanPhone = formData.cus_tel_1.replace(/[\s\-()]/g, "");
      const digitCount = cleanPhone.replace(/\D/g, "").length;
      if (digitCount < 9) {
        errors.cus_tel_1 = "กรุณากรอกเบอร์โทรอย่างน้อย 9 หลัก";
      }
    }

    if (!formData.cus_pro_id || !formData.cus_dis_id || !formData.cus_sub_id) {
      setShowLocationWarning(true);
    } else {
      setShowLocationWarning(false);
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setFieldErrors({});
    setShowLocationWarning(false);
    resetDuplicateChecks();
    resetLocationData();
  }, [initialFormData, resetDuplicateChecks, resetLocationData]);

  const submitForm = useCallback(async () => {
    const sanitizedData = sanitizeFormData(formData);

    if (shouldSubmitNotebookLead) {
      await addNotebookLead({
        ...sanitizedData,
        is_possible_duplicate: hasDuplicateWarning,
      }).unwrap();
      toast.success("เพิ่ม lead เข้า Notebook queue สำเร็จ");
      return;
    }

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
  }, [
    addCustomer,
    addNotebookLead,
    formData,
    hasDuplicateWarning,
    sanitizeFormData,
    shouldSubmitNotebookLead,
    user.user_id,
  ]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      await submitForm();
      onClose();
      resetForm();
    } catch (error) {
      console.error("[QuickForm] Failed to submit:", error);
      setFieldErrors({
        submit: error?.data?.message || "เกิดข้อผิดพลาดในการบันทึก",
      });
    }
  }, [onClose, resetForm, submitForm, validateForm]);

  const handleSaveAndNew = useCallback(async () => {
    if (!validateForm()) return;

    try {
      await submitForm();
      setTimeout(() => {
        resetForm();
        nameFieldRef?.current?.focus();
      }, 0);
    } catch (error) {
      console.error("[QuickForm] Failed to submit:", error);
      setFieldErrors({
        submit: error?.data?.message || "เกิดข้อผิดพลาดในการบันทึก",
      });
    }
  }, [nameFieldRef, resetForm, submitForm, validateForm]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  return {
    formData,
    fieldErrors,
    showLocationWarning,
    duplicateDialogOpen: duplicatePhoneDialogOpen,
    duplicateDialogData: duplicatePhoneData,
    companyWarning,
    isPhoneBlocked: !!duplicatePhoneData,
    provinces,
    districts,
    subdistricts,
    isLoadingDistricts,
    isLoadingSubdistricts,
    businessTypesList,
    businessTypesIsFetching,
    isLoading: isCreatingCustomer || isCreatingNotebookLead,
    handleChange,
    handleProvinceChange,
    handleDistrictChange,
    handleSubdistrictChange,
    handlePhoneBlur,
    handleCompanyBlur,
    handleCloseDuplicateDialog: closeDuplicatePhoneDialog,
    handleSave,
    handleSaveAndNew,
    handleClose,
  };
};
