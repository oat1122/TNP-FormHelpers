import { format } from "date-fns";
import dayjs from "dayjs";
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
import {
  shouldNotebookCreateIntoMine,
  shouldNotebookCreateIntoQueue,
} from "../../../utils/userAccess";
import { useDuplicateCheck } from "../../Customer/hooks/useDuplicateCheck";
import { buildNotebookDraft } from "../utils/notebookAdapters";
import { validationSchema } from "../utils/validationSchema";

export const useNotebookForm = ({ currentUser = {} } = {}) => {
  const dispatch = useDispatch();
  const isAdmin = currentUser?.role === "admin";
  const shouldCreateIntoQueue = shouldNotebookCreateIntoQueue(currentUser);
  const shouldCreateIntoMine = shouldNotebookCreateIntoMine(currentUser);
  const { dialogOpen, selectedNotebook, dialogMode, dialogFocusTarget } = useSelector(
    (state) => state.notebook
  );

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

    setDraft(buildDialogDraft(dialogMode === "create" ? null : selectedNotebook));
    setErrors({});
    setHasUserEdited(false);
  }, [
    buildDialogDraft,
    defaultDraft,
    dialogMode,
    dialogOpen,
    resetDuplicateChecks,
    selectedNotebook,
  ]);

  useEffect(() => {
    if (!dialogOpen || dialogMode === "create" || !notebookDetail || hasUserEdited) {
      return;
    }

    setDraft(buildDialogDraft(notebookDetail));
  }, [buildDialogDraft, dialogMode, dialogOpen, hasUserEdited, notebookDetail]);

  const handleClose = useCallback(() => {
    setErrors({});
    setHasUserEdited(false);
    resetDuplicateChecks();
    dispatch(resetNotebookDialog());
  }, [dispatch, resetDuplicateChecks]);

  const handleChange = useCallback(
    (event) => {
      const { name, value, checked, type } = event.target;
      setHasUserEdited(true);
      setDraft((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));

      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: null }));
      }
    },
    [errors]
  );

  const handleBlur = useCallback(
    async (event) => {
      const { name } = event.target;

      try {
        await validationSchema.validateAt(name, draft);
        if (errors[name]) {
          setErrors((prev) => ({ ...prev, [name]: null }));
        }
      } catch (error) {
        setErrors((prev) => ({ ...prev, [name]: error.message }));
      }
    },
    [draft, errors]
  );

  const handleOnlineToggle = useCallback((value) => {
    setHasUserEdited(true);
    setDraft((prev) => ({ ...prev, nb_is_online: value }));
  }, []);

  const getCreateSuccessMessage = useCallback(() => {
    if (shouldCreateIntoQueue) {
      return "เพิ่ม lead เข้า Notebook queue สำเร็จ";
    }

    if (shouldCreateIntoMine) {
      return "สร้าง lead ในลูกค้าของฉันสำเร็จ";
    }

    return "บันทึกข้อมูลสำเร็จ";
  }, [shouldCreateIntoMine, shouldCreateIntoQueue]);

  const handleSubmit = useCallback(async () => {
    try {
      setErrors({});

      const validatedData = validationSchema.validateSync(draft, {
        abortEarly: false,
      });

      const submitData = { ...validatedData };
      delete submitData.manage_by_user;
      const sourceNotebook = notebookDetail || selectedNotebook || null;

      if (dialogMode === "create") {
        const now = new Date();
        submitData.nb_date = submitData.nb_date
          ? dayjs(submitData.nb_date).format("YYYY-MM-DD")
          : format(now, "yyyy-MM-dd");
        submitData.nb_time = submitData.nb_time || format(now, "HH:mm");

        if (shouldCreateIntoQueue || shouldCreateIntoMine) {
          submitData.nb_workflow = "lead_queue";
        }
      }

      if (dialogMode === "edit") {
        delete submitData.nb_date;
        delete submitData.nb_time;

        ["nb_additional_info", "nb_remarks"].forEach((fieldName) => {
          if ((submitData[fieldName] === "" || submitData[fieldName] == null) && sourceNotebook) {
            submitData[fieldName] = sourceNotebook[fieldName] ?? submitData[fieldName];
          }
        });
      }

      if (!isAdmin && dialogMode === "create" && !submitData.nb_workflow) {
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
          showSuccess(getCreateSuccessMessage());
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

        showError(`เกิดข้อผิดพลาด: ${error?.data?.message || "ไม่สามารถบันทึกได้"}`);
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
  }, [
    addNotebook,
    currentUser.user_id,
    dialogMode,
    draft,
    handleClose,
    isAdmin,
    notebookDetail,
    selectedNotebook,
    shouldCreateIntoMine,
    shouldCreateIntoQueue,
    updateNotebook,
    getCreateSuccessMessage,
  ]);

  return {
    dialogOpen,
    dialogMode,
    dialogFocusTarget,
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
