import { useCallback, useState } from "react";

import { useUpdateCustomerByIdMutation } from "../../../../../../features/Accounting/accountingApi";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "../../../../utils/accountingToast";
import { validateCustomerData } from "../../customerFormatters";
import { getDefaultManagerAssignment, validateManagerAssignment } from "../../managerLogic";
import {
  buildCustomerUpdatePayload,
  buildOptimisticDisplayAddress,
} from "../utils/customerUpdatePayload";

const runFormValidation = (editData, { isAdmin, currentUser, salesList }) => {
  const baseValidation = validateCustomerData(editData);
  const nextErrors = { ...(baseValidation.errors || {}) };
  let isValid = !!baseValidation.isValid;

  if (!editData.cus_channel || !["1", "2", "3"].includes(String(editData.cus_channel))) {
    nextErrors.cus_channel = "กรุณาเลือกช่องทางการติดต่อ";
    isValid = false;
  }

  const managerValidation = validateManagerAssignment(
    editData.cus_manage_by,
    isAdmin,
    salesList,
    currentUser
  );
  if (!managerValidation.isValid) {
    Object.assign(nextErrors, managerValidation.errors);
    isValid = false;
  }

  return { isValid, errors: nextErrors };
};

export const useCustomerSave = ({
  customer,
  displayCustomer,
  editData,
  setEditData,
  setDisplayCustomer,
  setErrors,
  isAdmin,
  currentUser,
  salesList,
  addressLookupState,
  onUpdate,
  onSaveSuccess,
  onSaveFailure,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [updateCustomerById] = useUpdateCustomerByIdMutation();

  const validateForm = useCallback(() => {
    const { isValid, errors } = runFormValidation(editData, {
      isAdmin,
      currentUser,
      salesList,
    });

    if (!isAdmin && currentUser?.user_id && !editData.cus_manage_by?.user_id) {
      const defaultManager = getDefaultManagerAssignment(isAdmin, currentUser);
      setEditData((prev) => ({ ...prev, cus_manage_by: defaultManager }));
    }

    setErrors(errors);
    return isValid;
  }, [editData, isAdmin, currentUser, salesList, setEditData, setErrors]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    const originalCustomer = displayCustomer || customer;
    const optimisticCustomer = { ...originalCustomer, ...editData };
    const optimisticAddress = buildOptimisticDisplayAddress(editData, addressLookupState);
    if (optimisticAddress) {
      optimisticCustomer.cus_address = optimisticAddress;
    }
    optimisticCustomer.cus_province_name =
      editData.cus_province_name || optimisticCustomer.cus_province_name;
    optimisticCustomer.cus_district_name =
      editData.cus_district_name || optimisticCustomer.cus_district_name;
    optimisticCustomer.cus_subdistrict_name =
      editData.cus_subdistrict_name || optimisticCustomer.cus_subdistrict_name;
    optimisticCustomer.cus_zip_code = editData.cus_zip_code || optimisticCustomer.cus_zip_code;

    setDisplayCustomer(optimisticCustomer);
    onUpdate?.(optimisticCustomer);
    onSaveSuccess?.();

    setIsSaving(true);
    const loadingId = showLoading("กำลังบันทึกข้อมูลลูกค้า…");
    try {
      const payload = buildCustomerUpdatePayload(editData, { isAdmin, currentUser });
      await updateCustomerById({ customerId: customer.cus_id, ...payload }).unwrap();
      dismissToast(loadingId);
      showSuccess("บันทึกข้อมูลลูกค้าเรียบร้อยแล้ว");
      setErrors({});
    } catch (error) {
      dismissToast(loadingId);
      setDisplayCustomer(originalCustomer);
      onUpdate?.(originalCustomer);

      const errorMessage =
        error?.data?.message || error?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      if (import.meta.env.DEV) {
        console.error("Failed to save customer data:", {
          customerId: customer.cus_id,
          error: errorMessage,
          status: error?.status,
          data: error?.data,
        });
      }
      setErrors({ general: `เกิดข้อผิดพลาด: ${errorMessage}` });
      showError(errorMessage || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      onSaveFailure?.();
    } finally {
      setIsSaving(false);
    }
  }, [
    validateForm,
    displayCustomer,
    customer,
    editData,
    addressLookupState,
    setDisplayCustomer,
    onUpdate,
    onSaveSuccess,
    updateCustomerById,
    isAdmin,
    currentUser,
    setErrors,
    onSaveFailure,
  ]);

  return { handleSave, isSaving };
};
