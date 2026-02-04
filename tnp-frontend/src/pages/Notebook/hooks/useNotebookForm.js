import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  useAddNotebookMutation,
  useUpdateNotebookMutation,
} from "../../../features/Notebook/notebookApi";
import {
  resetForm,
  setDialogOpen,
  setInputData,
  updateInputData,
} from "../../../features/Notebook/notebookSlice";
import { dialog_confirm_yes_no } from "../../../utils/dialog_swal2/dialog_confirm_yes_no";
import { dismissToast, showError, showLoading, showSuccess } from "../../../utils/toast";
import { useDuplicateCheck } from "../../Customer/hooks/useDuplicateCheck";
import { validationSchema } from "../utils/validationSchema";

export const useNotebookForm = () => {
  const dispatch = useDispatch();
  const currentUser = JSON.parse(localStorage.getItem("userData") || "{}");
  const isAdmin = currentUser.role === "admin";

  const { dialogOpen, inputData, selectedNotebook, dialogMode } = useSelector(
    (state) => state.notebook
  );

  const [errors, setErrors] = useState({});

  const [addNotebook, { isLoading: isAdding }] = useAddNotebookMutation();
  const [updateNotebook, { isLoading: isUpdating }] = useUpdateNotebookMutation();

  // Duplicate Check Hook
  const {
    duplicatePhoneDialogOpen,
    duplicatePhoneData,
    checkPhoneDuplicate,
    closeDuplicatePhoneDialog,
    resetDuplicateChecks,
  } = useDuplicateCheck({
    mode: dialogMode,
    currentCustomerId: null,
  });

  // Handlers
  const handleClose = () => {
    dispatch(setDialogOpen(false));
    setErrors({});
    setTimeout(() => dispatch(resetForm()), 150);
    resetDuplicateChecks();
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    dispatch(updateInputData({ [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleOnlineToggle = (val) => {
    dispatch(updateInputData({ nb_is_online: val }));
  };

  const handleSubmit = async () => {
    try {
      setErrors({});
      // Validate Data
      const validatedData = validationSchema.validateSync(inputData, {
        abortEarly: false,
      });

      // Prepare submit data
      let submitData = { ...validatedData };

      // Auto-inject current Date and Time
      const now = new Date();
      submitData.nb_date = format(now, "yyyy-MM-dd");
      submitData.nb_time = format(now, "HH:mm");

      if (!isAdmin && dialogMode === "create") {
        submitData.nb_manage_by = currentUser.user_id;
      }

      const isConfirmed = await dialog_confirm_yes_no(
        dialogMode === "create" ? "ยืนยันการบันทึกข้อมูล?" : "ยืนยันการแก้ไขข้อมูล?"
      );

      if (isConfirmed) {
        const loadingId = showLoading("กำลังบันทึกข้อมูล...");
        try {
          if (dialogMode === "create") {
            await addNotebook(submitData).unwrap();
            showSuccess("บันทึกข้อมูลสำเร็จ");
          } else {
            await updateNotebook({
              id: selectedNotebook.id,
              ...submitData,
            }).unwrap();
            showSuccess("อัปเดตข้อมูลสำเร็จ");
          }
          dismissToast(loadingId);
          handleClose();
        } catch (error) {
          dismissToast(loadingId);
          if (error?.status === 403) {
            showError("คุณไม่มีสิทธิ์แก้ไขรายการนี้ (เฉพาะ Admin หรือเจ้าของรายการ)");
          } else {
            showError("เกิดข้อผิดพลาด: " + (error?.data?.message || "ไม่สามารถบันทึกได้"));
          }
        }
      }
    } catch (error) {
      if (error.name === "ValidationError") {
        const newErrors = {};
        error.inner.forEach((err) => {
          newErrors[err.path] = err.message;
        });
        setErrors(newErrors);
        showError("กรุณากรอกข้อมูลให้ครบถ้วน");
      }
    }
  };

  // Effects
  useEffect(() => {
    if (selectedNotebook && dialogMode === "edit") {
      dispatch(
        setInputData({
          nb_date: selectedNotebook.nb_date,
          nb_time: selectedNotebook.nb_time,
          nb_customer_name: selectedNotebook.nb_customer_name,
          nb_is_online: selectedNotebook.nb_is_online,
          nb_additional_info: selectedNotebook.nb_additional_info,
          nb_contact_number: selectedNotebook.nb_contact_number,
          nb_email: selectedNotebook.nb_email,
          nb_contact_person: selectedNotebook.nb_contact_person,
          nb_action: selectedNotebook.nb_action,
          nb_status: selectedNotebook.nb_status,
          nb_remarks: selectedNotebook.nb_remarks,
          nb_manage_by: selectedNotebook.nb_manage_by,
        })
      );
    } else if (dialogMode === "create" && !isAdmin) {
      dispatch(updateInputData({ nb_manage_by: currentUser.user_id }));
    }
  }, [selectedNotebook, dialogMode, dispatch, isAdmin, currentUser.user_id]);

  return {
    // State
    dialogOpen,
    dialogMode,
    inputData,
    errors,
    duplicatePhoneDialogOpen,
    duplicatePhoneData,
    isSubmitting: isAdding || isUpdating,
    currentUser,
    isAdmin,
    // Handlers
    handleClose,
    handleChange,
    handleOnlineToggle,
    handleSubmit,
    closeDuplicatePhoneDialog,
    checkPhoneDuplicate,
  };
};
