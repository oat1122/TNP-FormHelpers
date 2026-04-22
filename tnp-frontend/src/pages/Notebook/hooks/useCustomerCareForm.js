import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";

import {
  useAddCustomerCareMutation,
  useGetNotebookQuery,
  useUpdateNotebookMutation,
} from "../../../features/Notebook/notebookApi";
import { dialog_confirm_yes_no } from "../../../utils/dialog_swal2/dialog_confirm_yes_no";
import { dismissToast, showError, showLoading, showSuccess } from "../../../utils/toast";
import { validationSchema } from "../utils/validationSchema";

const normalizeNotebookDate = (value) => {
  if (!value) {
    return dayjs().format("YYYY-MM-DD");
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
};

const normalizeOptionalDate = (value) => {
  if (!value) {
    return "";
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
};

const buildCustomerCareDraft = (record = null) => ({
  nb_date: normalizeNotebookDate(record?.nb_date),
  nb_customer_name: record?.nb_customer_name || "",
  nb_is_online: Boolean(record?.nb_is_online),
  nb_additional_info: record?.nb_additional_info || "",
  nb_contact_number: record?.nb_contact_number || "",
  nb_email: record?.nb_email || "",
  nb_contact_person: record?.nb_contact_person || "",
  nb_action: record?.nb_action || "",
  nb_status: record?.nb_status || "",
  nb_remarks: record?.nb_remarks || "",
  nb_next_followup_date: normalizeOptionalDate(record?.nb_next_followup_date),
  nb_next_followup_note: record?.nb_next_followup_note || "",
  nb_entry_type: record?.nb_entry_type || "customer_care",
  nb_source_type: record?.nb_source_type || "customer",
  source_customer_id: record?.nb_source_customer_id || null,
  source_notebook_id: record?.nb_source_notebook_id || null,
});

export const useCustomerCareForm = ({ open, mode, selectedRecord, onClose }) => {
  const [draft, setDraft] = useState(() => buildCustomerCareDraft());
  const [errors, setErrors] = useState({});
  const [hasUserEdited, setHasUserEdited] = useState(false);

  const isCreateMode = mode === "create";

  const [addCustomerCare, { isLoading: isAdding }] = useAddCustomerCareMutation();
  const [updateNotebook, { isLoading: isUpdating }] = useUpdateNotebookMutation();

  const shouldLoadDetail = Boolean(open && selectedRecord?.id && !isCreateMode);
  const { data: notebookDetail, isFetching: isNotebookDetailFetching } = useGetNotebookQuery(
    selectedRecord?.id,
    {
      skip: !shouldLoadDetail,
    }
  );

  useEffect(() => {
    if (!open) {
      setDraft(buildCustomerCareDraft());
      setErrors({});
      setHasUserEdited(false);
      return;
    }

    setDraft(buildCustomerCareDraft(isCreateMode ? null : selectedRecord));
    setErrors({});
    setHasUserEdited(false);
  }, [isCreateMode, open, selectedRecord]);

  useEffect(() => {
    if (!open || isCreateMode || !notebookDetail || hasUserEdited) {
      return;
    }

    setDraft(buildCustomerCareDraft(notebookDetail));
  }, [hasUserEdited, isCreateMode, notebookDetail, open]);

  const handleChange = useCallback(
    (event) => {
      const { name, value } = event.target;
      setHasUserEdited(true);
      setDraft((previous) => ({
        ...previous,
        [name]: value,
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

  const handleSourceSelect = useCallback((item) => {
    setHasUserEdited(true);
    setErrors((previous) => ({
      ...previous,
      nb_customer_name: null,
      source: null,
    }));
    setDraft((previous) => ({
      ...previous,
      nb_customer_name: item.company || item.customer_name || item.label || "",
      nb_contact_person: item.contact_person || "",
      nb_contact_number: item.phone || "",
      nb_email: item.email || "",
      nb_is_online: Boolean(item.is_online),
      nb_source_type: item.source_type,
      source_customer_id: item.source_customer_id || null,
      source_notebook_id: item.source_notebook_id || null,
    }));
  }, []);

  const validateCustomerCareDraft = useCallback(() => {
    const nextErrors = {};

    try {
      validationSchema.validateSync(draft, {
        abortEarly: false,
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        error.inner.forEach((item) => {
          nextErrors[item.path] = item.message;
        });
      }
    }

    if (draft.nb_source_type === "customer" && !draft.source_customer_id) {
      nextErrors.source = "กรุณาเลือกลูกค้าจาก Customer";
    }

    if (draft.nb_source_type === "notebook" && !draft.source_notebook_id) {
      nextErrors.source = "กรุณาเลือกลูกค้าจาก Notebook";
    }

    if (!draft.nb_date) {
      nextErrors.nb_date = "กรุณาเลือกวันที่";
    }

    return nextErrors;
  }, [draft]);

  const handleSubmit = useCallback(async () => {
    const nextErrors = validateCustomerCareDraft();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      showError("กรุณากรอกข้อมูลให้ครบก่อนบันทึก");
      return;
    }

    const confirmed = await dialog_confirm_yes_no(
      isCreateMode ? "ยืนยันการบันทึกดูแลลูกค้า?" : "ยืนยันการอัปเดตดูแลลูกค้า?"
    );

    if (!confirmed) {
      return;
    }

    const payload = {
      nb_date: draft.nb_date,
      nb_additional_info: draft.nb_additional_info || null,
      nb_action: draft.nb_action || null,
      nb_status: draft.nb_status || null,
      nb_remarks: draft.nb_remarks || null,
      nb_next_followup_date: draft.nb_next_followup_date || null,
      nb_next_followup_note: draft.nb_next_followup_note || null,
    };

    const loadingId = showLoading(isCreateMode ? "กำลังบันทึกข้อมูล..." : "กำลังอัปเดตข้อมูล...");

    try {
      if (isCreateMode) {
        await addCustomerCare({
          ...payload,
          source_type: draft.nb_source_type,
          source_customer_id:
            draft.nb_source_type === "customer" ? draft.source_customer_id : undefined,
          source_notebook_id:
            draft.nb_source_type === "notebook" ? draft.source_notebook_id : undefined,
        }).unwrap();
        showSuccess("บันทึกดูแลลูกค้าสำเร็จ");
      } else {
        await updateNotebook({
          id: selectedRecord.id,
          ...payload,
        }).unwrap();
        showSuccess("อัปเดตดูแลลูกค้าสำเร็จ");
      }

      dismissToast(loadingId);
      onClose?.();
    } catch (error) {
      dismissToast(loadingId);
      showError(error?.data?.message || "ไม่สามารถบันทึกดูแลลูกค้าได้");
    }
  }, [
    addCustomerCare,
    draft,
    isCreateMode,
    onClose,
    selectedRecord?.id,
    updateNotebook,
    validateCustomerCareDraft,
  ]);

  return {
    draft,
    errors,
    recordKey: `${mode}-${selectedRecord?.id || "create"}`,
    isSubmitting: isAdding || isUpdating,
    isNotebookDetailFetching,
    notebookHistories: notebookDetail?.histories || [],
    handleChange,
    handleBlur,
    handleSourceSelect,
    handleSubmit,
  };
};
