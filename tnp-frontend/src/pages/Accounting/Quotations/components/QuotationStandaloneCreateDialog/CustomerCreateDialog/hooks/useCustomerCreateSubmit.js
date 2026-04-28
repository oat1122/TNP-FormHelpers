import { useCallback, useState } from "react";

import { useAddCustomerMutation } from "../../../../../../../features/Customer/customerApi";
import { validateCustomerData } from "../../../../../shared/utils/customerFormatters";
import {
  getDefaultManagerAssignment,
  validateManagerAssignment,
} from "../../../../../shared/utils/managerLogic";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "../../../../../utils/accountingToast";
import { buildCustomerCreatePayload, extractCreatedCustomer } from "../utils/customerCreatePayload";

const ALLOWED_CHANNELS = ["1", "2", "3"];

// Validates form state, builds + dispatches the create-customer mutation, and
// translates the response/errors into UI-friendly callbacks. Owns the local
// `isSaving` flag so the shell can disable controls during submit.
export function useCustomerCreateSubmit({
  formData,
  salesList,
  isAdmin,
  currentUser,
  setErrors,
  setManagerAssignment,
  onSuccess,
  onClose,
}) {
  const [addCustomer] = useAddCustomerMutation();
  const [isSaving, setIsSaving] = useState(false);

  const validate = useCallback(() => {
    const validation = validateCustomerData(formData);
    const nextErrors = { ...(validation.errors || {}) };
    let isValid = !!validation.isValid;

    if (!ALLOWED_CHANNELS.includes(String(formData.cus_channel))) {
      nextErrors.cus_channel = "กรุณาเลือกช่องทางการติดต่อ";
      isValid = false;
    }

    const managerValidation = validateManagerAssignment(
      formData.cus_manage_by,
      isAdmin,
      salesList,
      currentUser
    );
    if (!managerValidation.isValid) {
      Object.assign(nextErrors, managerValidation.errors);
      isValid = false;
    } else if (!isAdmin && currentUser?.user_id && !formData.cus_manage_by?.user_id) {
      setManagerAssignment(getDefaultManagerAssignment(isAdmin, currentUser));
    }

    setErrors(nextErrors);
    return isValid;
  }, [formData, isAdmin, salesList, currentUser, setErrors, setManagerAssignment]);

  const handleSave = useCallback(async () => {
    if (!validate()) {
      showError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    setIsSaving(true);
    const loadingId = showLoading("กำลังสร้างข้อมูลลูกค้า…");

    try {
      const payload = buildCustomerCreatePayload(formData, { isAdmin, currentUser });
      const result = await addCustomer(payload).unwrap();

      dismissToast(loadingId);
      showSuccess("สร้างลูกค้าใหม่เรียบร้อยแล้ว");
      setErrors({});

      const createdCustomer = extractCreatedCustomer(result, formData);
      onSuccess?.(createdCustomer);
      onClose?.();
    } catch (error) {
      dismissToast(loadingId);
      const message = error?.data?.message || error?.message || "เกิดข้อผิดพลาดในการสร้างลูกค้า";
      if (import.meta.env.DEV) console.error("Failed to create customer:", error);
      setErrors({ general: `เกิดข้อผิดพลาด: ${message}` });
      showError(message);
    } finally {
      setIsSaving(false);
    }
  }, [validate, formData, isAdmin, currentUser, addCustomer, setErrors, onSuccess, onClose]);

  return { isSaving, handleSave };
}
