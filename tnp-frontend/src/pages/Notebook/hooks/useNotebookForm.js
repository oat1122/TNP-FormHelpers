import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  useAddNotebookMutation,
  useGetNotebookQuery,
  useUpdateNotebookMutation,
} from "../../../features/Notebook/notebookApi";
import { resetNotebookDialog } from "../../../features/Notebook/notebookSlice";
import { dialog_confirm_yes_no } from "../../../utils/dialog_swal2/dialog_confirm_yes_no";
import { dismissToast, showError, showLoading, showSuccess } from "../../../utils/toast";
import { useDuplicateCheck } from "../../Customer/hooks/useDuplicateCheck";
import { buildNotebookDraft } from "../utils/notebookAdapters";
import { validationSchema } from "../utils/validationSchema";

export const useNotebookForm = ({ currentUser = {} } = {}) => {
  const dispatch = useDispatch();
  const isAdmin = currentUser?.role === "admin";
  const { dialogOpen, selectedNotebook, dialogMode } = useSelector((state) => state.notebook);

  const [draft, setDraft] = useState(() =>
    buildNotebookDraft({ notebook: null, currentUser, isAdmin })
  );
  const [errors, setErrors] = useState({});
  const [hasUserEdited, setHasUserEdited] = useState(false);

  const [addNotebook, { isLoading: isAdding }] = useAddNotebookMutation();
  const [updateNotebook, { isLoading: isUpdating }] = useUpdateNotebookMutation();

  const shouldLoadNotebookDetail = Boolean(
    dialogOpen && selectedNotebook?.id && dialogMode !== "create"
  );

  const { data: notebookDetail, isFetching: isNotebookDetailFetching } = useGetNotebookQuery(
    selectedNotebook?.id,
    {
      skip: !shouldLoadNotebookDetail,
    }
  );

  const notebookHistories = notebookDetail?.histories || [];

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

  const defaultDraft = useMemo(
    () => buildNotebookDraft({ notebook: null, currentUser, isAdmin }),
    [currentUser, isAdmin]
  );
  const buildDialogDraft = useCallback(
    (notebook) => {
      const nextDraft = buildNotebookDraft({ notebook, currentUser, isAdmin });

      if (dialogMode === "edit") {
        return {
          ...nextDraft,
          nb_additional_info: "",
          nb_remarks: "",
        };
      }

      return nextDraft;
    },
    [currentUser, dialogMode, isAdmin]
  );

  useEffect(() => {
    if (!dialogOpen) {
      setDraft(defaultDraft);
      setErrors({});
      setHasUserEdited(false);
      resetDuplicateChecks();
      return;
    }

    const sourceNotebook = dialogMode === "create" ? null : selectedNotebook;
    setDraft(buildDialogDraft(sourceNotebook));
    setErrors({});
    setHasUserEdited(false);
  }, [
    buildDialogDraft,
    defaultDraft,
    dialogOpen,
    dialogMode,
    selectedNotebook,
    resetDuplicateChecks,
  ]);

  useEffect(() => {
    if (!dialogOpen || dialogMode === "create" || !notebookDetail || hasUserEdited) {
      return;
    }

    setDraft(buildDialogDraft(notebookDetail));
  }, [buildDialogDraft, dialogOpen, dialogMode, notebookDetail, hasUserEdited]);

  const handleClose = () => {
    setErrors({});
    setHasUserEdited(false);
    resetDuplicateChecks();
    dispatch(resetNotebookDialog());
  };

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setHasUserEdited(true);
    setDraft((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = async (event) => {
    const { name } = event.target;

    try {
      await validationSchema.validateAt(name, draft);
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: null }));
      }
    } catch (error) {
      setErrors((prev) => ({ ...prev, [name]: error.message }));
    }
  };

  const handleOnlineToggle = (value) => {
    setHasUserEdited(true);
    setDraft((prev) => ({ ...prev, nb_is_online: value }));
  };

  const handleSubmit = async () => {
    try {
      setErrors({});
      const validatedData = validationSchema.validateSync(draft, {
        abortEarly: false,
      });

      const submitData = { ...validatedData };
      const sourceNotebook = notebookDetail || selectedNotebook || null;
      if (dialogMode === "create") {
        const now = new Date();
        submitData.nb_date = submitData.nb_date || format(now, "yyyy-MM-dd");
        submitData.nb_time = submitData.nb_time || format(now, "HH:mm");
      }

      if (dialogMode === "edit") {
        ["nb_additional_info", "nb_remarks"].forEach((fieldName) => {
          if ((submitData[fieldName] === "" || submitData[fieldName] == null) && sourceNotebook) {
            submitData[fieldName] = sourceNotebook[fieldName] ?? submitData[fieldName];
          }
        });
      }

      if (!isAdmin && dialogMode === "create") {
        submitData.nb_manage_by = currentUser.user_id;
      }

      const confirmed = await dialog_confirm_yes_no(
        dialogMode === "create" ? "ยืนยันการบันทึกข้อมูล?" : "ยืนยันการแก้ไขข้อมูล?"
      );

      if (!confirmed) {
        return;
      }

      const loadingId = showLoading(
        dialogMode === "create" ? "กำลังบันทึกข้อมูล..." : "กำลังอัปเดตข้อมูล..."
      );

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
          showError("คุณไม่มีสิทธิ์แก้ไขรายการนี้");
          return;
        }

        showError("เกิดข้อผิดพลาด: " + (error?.data?.message || "ไม่สามารถบันทึกได้"));
      }
    } catch (error) {
      if (error.name === "ValidationError") {
        const nextErrors = {};
        error.inner.forEach((item) => {
          nextErrors[item.path] = item.message;
        });
        setErrors(nextErrors);
        showError("กรุณากรอกข้อมูลให้ครบถ้วน");
      }
    }
  };

  return {
    dialogOpen,
    dialogMode,
    recordKey: `${dialogMode}-${selectedNotebook?.id || "create"}`,
    draft,
    errors,
    duplicatePhoneDialogOpen,
    duplicatePhoneData,
    isSubmitting: isAdding || isUpdating,
    isNotebookDetailFetching,
    currentUser,
    isAdmin,
    notebookHistories,
    handleClose,
    handleChange,
    handleBlur,
    handleOnlineToggle,
    handleSubmit,
    closeDuplicatePhoneDialog,
    checkPhoneDuplicate,
    setDraft,
  };
};
