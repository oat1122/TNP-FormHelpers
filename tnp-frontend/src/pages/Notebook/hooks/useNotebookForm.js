import { format } from "date-fns";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { useNotebookDuplicateCheck } from "./useNotebookDuplicateCheck";
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
import { buildNotebookDraft } from "../utils/notebookAdapters";
import { validationSchema } from "../utils/validationSchema";

export const useNotebookForm = ({ currentUser = {} } = {}) => {
  const dispatch = useDispatch();
  const isAdmin = currentUser?.role === "admin";
  const defaultCreateIntoQueue = shouldNotebookCreateIntoQueue(currentUser);
  const defaultCreateIntoMine = shouldNotebookCreateIntoMine(currentUser);
  const { dialogOpen, selectedNotebook, dialogMode, dialogFocusTarget, dialogScope } = useSelector(
    (state) => state.notebook
  );
  const isCustomerInfoEdit = dialogMode === "edit" && dialogScope === "customer_info";

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

  const duplicateCheck = useNotebookDuplicateCheck({
    excludeNotebookId: dialogMode === "edit" ? selectedNotebook?.id || null : null,
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
      duplicateCheck.resetAll();
      return;
    }

    setDraft(buildDialogDraft(selectedNotebook));
    setErrors({});
    setHasUserEdited(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildDialogDraft, defaultDraft, dialogOpen, selectedNotebook]);

  useEffect(() => {
    if (!dialogOpen || dialogMode === "create" || !notebookDetail || hasUserEdited) {
      return;
    }

    setDraft(buildDialogDraft(notebookDetail));
  }, [buildDialogDraft, dialogMode, dialogOpen, hasUserEdited, notebookDetail]);

  const handleClose = useCallback(() => {
    setErrors({});
    setHasUserEdited(false);
    duplicateCheck.resetAll();
    dispatch(resetNotebookDialog());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleChange = useCallback(
    (event) => {
      const { name, value, checked, type } = event.target;
      setHasUserEdited(true);
      setDraft((previous) => ({
        ...previous,
        [name]: type === "checkbox" ? checked : value,
      }));

      if (errors[name]) {
        setErrors((previous) => ({ ...previous, [name]: null }));
      }
    },
    [errors]
  );

  const handleBlur = useCallback(
    async (event) => {
      const { name } = event.target;

      if (!validationSchema.fields?.[name]) {
        return;
      }

      try {
        await validationSchema.validateAt(name, draft);
        if (errors[name]) {
          setErrors((previous) => ({ ...previous, [name]: null }));
        }
      } catch (error) {
        setErrors((previous) => ({ ...previous, [name]: error.message }));
      }
    },
    [draft, errors]
  );

  const handleOnlineToggle = useCallback((value) => {
    setHasUserEdited(true);
    setDraft((previous) => ({ ...previous, nb_is_online: value }));
  }, []);

  const getCreateSuccessMessage = useCallback(() => {
    if (draft.nb_workflow === "lead_queue") {
      return "เพิ่ม lead เข้า Notebook queue สำเร็จ";
    }

    if (draft.nb_manage_by) {
      return "สร้าง lead ในลูกค้าของฉันสำเร็จ";
    }

    if (defaultCreateIntoQueue) {
      return "เพิ่ม lead เข้า Notebook queue สำเร็จ";
    }

    if (defaultCreateIntoMine) {
      return "สร้าง lead ในลูกค้าของฉันสำเร็จ";
    }

    return "บันทึกข้อมูลสำเร็จ";
  }, [defaultCreateIntoMine, defaultCreateIntoQueue, draft.nb_manage_by, draft.nb_workflow]);

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

        if (!submitData.nb_workflow && (defaultCreateIntoQueue || defaultCreateIntoMine)) {
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

        if (isCustomerInfoEdit) {
          const customerInfoFields = [
            "nb_status",
            "nb_customer_name",
            "nb_contact_person",
            "nb_contact_number",
            "nb_email",
            "nb_next_followup_date",
            "nb_next_followup_note",
            "nb_additional_info",
            "nb_remarks",
          ];
          const scopedPayload = {};
          customerInfoFields.forEach((fieldName) => {
            if (fieldName in submitData) {
              scopedPayload[fieldName] = submitData[fieldName];
            }
          });
          scopedPayload._history_action = "customer_info_updated";
          Object.keys(submitData).forEach((key) => delete submitData[key]);
          Object.assign(submitData, scopedPayload);
        }
      }

      if (!isAdmin && dialogMode === "create" && !submitData.nb_workflow) {
        submitData.nb_manage_by = currentUser.user_id;
      }

      const proceedPastDuplicates = await duplicateCheck.runSaveCheck(submitData);
      if (!proceedPastDuplicates) {
        return;
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
    defaultCreateIntoMine,
    defaultCreateIntoQueue,
    dialogMode,
    draft,
    duplicateCheck,
    getCreateSuccessMessage,
    handleClose,
    isAdmin,
    isCustomerInfoEdit,
    notebookDetail,
    selectedNotebook,
    updateNotebook,
  ]);

  return {
    dialogOpen,
    dialogMode,
    dialogFocusTarget,
    dialogScope,
    isCustomerInfoEdit,
    recordKey: `${dialogMode}-${dialogScope}-${selectedNotebook?.id || "create"}`,
    draft,
    errors,
    duplicateCheck,
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
    setDraft,
  };
};
