import { useState } from "react";
import { useDispatch } from "react-redux";
import { resetInputList } from "../../../../features/Customer/customerSlice";
import {
  useAddCustomerMutation,
  useUpdateCustomerMutation,
} from "../../../../features/Customer/customerApi";
import { useSanitizeInput } from "./useSanitizeInput";
import {
  open_dialog_ok_timer,
  open_dialog_error,
  open_dialog_loading,
} from "../../../../utils/import_lib";

/**
 * useCustomerSubmit - จัดการ Validation และ Submit form
 *
 * @param {Object} params
 * @param {Object} params.inputList - ข้อมูล form ปัจจุบัน
 * @param {string} params.mode - โหมดของ form ('create' | 'edit' | 'view')
 * @param {Function} params.setErrors - Set validation errors
 * @param {Function} params.setActiveTab - เปลี่ยน Tab
 * @param {Function} params.onSuccess - Callback เมื่อบันทึกสำเร็จ
 * @param {Function} params.onAfterSave - Callback หลังบันทึก (optional)
 * @param {Function} params.scrollToTop - Scroll ไปด้านบน
 * @returns {Object} { handleSubmit, saveLoading, validateEssentialFields }
 */
export const useCustomerSubmit = ({
  inputList,
  mode,
  setErrors,
  setActiveTab,
  onSuccess,
  onAfterSave,
  scrollToTop,
}) => {
  const dispatch = useDispatch();
  const [saveLoading, setSaveLoading] = useState(false);

  // Sanitize input hook - ตัดตัวอักษรพิเศษก่อนบันทึก
  const { sanitizeFormData } = useSanitizeInput();

  // API hooks
  const [addCustomer] = useAddCustomerMutation();
  const [updateCustomer] = useUpdateCustomerMutation();

  /**
   * Validate Essential Fields (ฟิลด์ที่จำเป็น)
   * @returns {boolean} true ถ้าผ่าน validation
   */
  const validateEssentialFields = () => {
    const newErrors = {};

    if (!inputList.cus_bt_id) {
      newErrors.cus_bt_id = "กรุณาเลือกประเภทธุรกิจ";
    }
    if (!inputList.cus_company?.trim()) {
      newErrors.cus_company = "กรุณากรอกชื่อบริษัท";
    }
    if (!inputList.cus_firstname?.trim()) {
      newErrors.cus_firstname = "กรุณากรอกชื่อจริง";
    }
    if (!inputList.cus_lastname?.trim()) {
      newErrors.cus_lastname = "กรุณากรอกนามสกุล";
    }
    if (!inputList.cus_name?.trim()) {
      newErrors.cus_name = "กรุณากรอกชื่อเล่น";
    }
    if (!inputList.cus_tel_1?.trim()) {
      newErrors.cus_tel_1 = "กรุณากรอกเบอร์โทรหลัก";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle Form Submit
   */
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Validate essential fields
    if (!validateEssentialFields()) {
      // Switch to essential tab if there are errors
      if (setActiveTab) {
        setActiveTab(0);
      }
      return;
    }

    setSaveLoading(true);

    try {
      open_dialog_loading();

      // Sanitize ข้อมูลก่อนบันทึก - ตัดตัวอักษรพิเศษป้องกัน SQL Injection และ XSS
      const sanitizedData = sanitizeFormData(inputList);

      const res =
        mode === "create" ? await addCustomer(sanitizedData) : await updateCustomer(sanitizedData);

      if (res?.data?.status === "success") {
        // ปิด Dialog
        if (onSuccess) {
          onSuccess();
        }

        const savedCustomerId =
          mode === "create" ? res?.data?.customer_id || res?.data?.data?.cus_id : inputList.cus_id;

        open_dialog_ok_timer("บันทึกข้อมูลสำเร็จ").then(() => {
          setSaveLoading(false);
          dispatch(resetInputList());

          if (scrollToTop) {
            scrollToTop();
          }

          if (onAfterSave && savedCustomerId) {
            onAfterSave(savedCustomerId);
          }
        });
      } else {
        setSaveLoading(false);
        open_dialog_error(res?.data?.message || "เกิดข้อผิดพลาดในการบันทึก");
        console.error(res?.data?.message || "Unknown error");
      }
    } catch (error) {
      setSaveLoading(false);

      let errorMessage = "เกิดข้อผิดพลาดในการบันทึก";

      if (error?.error?.status === 422) {
        errorMessage = "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลที่กรอก";

        if (error?.error?.data?.errors) {
          const validationErrors = error.error.data.errors;
          const errorMessages = Object.values(validationErrors).flat();
          errorMessage += "\n" + errorMessages.join("\n");
        }
      } else if (error?.error?.data?.message) {
        errorMessage = error.error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      open_dialog_error(errorMessage);
      console.error("Submit error:", error);
    }
  };

  return {
    handleSubmit,
    saveLoading,
    validateEssentialFields,
  };
};
