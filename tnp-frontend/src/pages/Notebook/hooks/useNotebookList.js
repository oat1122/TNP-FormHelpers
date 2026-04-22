import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { useNotebookExport } from "./useNotebookExport";
import { useNotebookPageState } from "./useNotebookPageState";
import { setInputList, setMode } from "../../../features/Customer/customerSlice";
import {
  useConvertNotebookMutation,
  useDeleteNotebookMutation,
  useGetNotebooksQuery,
  useReserveNotebookMutation,
  useUpdateNotebookMutation,
} from "../../../features/Notebook/notebookApi";
import {
  setDialogMode,
  setDialogOpen,
  setSelectedNotebook,
} from "../../../features/Notebook/notebookSlice";
import { dialog_confirm_yes_no } from "../../../utils/dialog_swal2/dialog_confirm_yes_no";
import { dismissToast, showError, showLoading, showSuccess } from "../../../utils/toast";
import { isNotebookQueueAssignableRow } from "../utils/notebookCommon";
import { mapNotebookToCustomer } from "../utils/notebookMapping";

export const useNotebookList = () => {
  const dispatch = useDispatch();
  const pageState = useNotebookPageState();
  const [convertingNotebookId, setConvertingNotebookId] = useState(null);
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);
  const [assignDialogState, setAssignDialogState] = useState({
    open: false,
    notebooks: [],
  });

  const {
    data,
    isFetching,
    isLoading,
    refetch,
    error: fetchError,
  } = useGetNotebooksQuery(pageState.queryFilters);

  const [deleteNotebook] = useDeleteNotebookMutation();
  const [convertNotebook, { isLoading: isConverting }] = useConvertNotebookMutation();
  const [reserveNotebook, { isLoading: isReserving }] = useReserveNotebookMutation();
  const [updateNotebook] = useUpdateNotebookMutation();
  const rows = data?.rows || [];
  const isBulkAssignEnabled =
    pageState.scopeFilter === "queue" && pageState.queueActionMode === "assign";
  const selectableQueueIds = useMemo(
    () =>
      rows
        .filter((row) => isNotebookQueueAssignableRow(row, pageState.scopeFilter))
        .map((row) => row.id),
    [pageState.scopeFilter, rows]
  );
  const selectedQueueNotebooks = useMemo(() => {
    const selectedIdSet = new Set(selectedQueueIds);
    return rows.filter((row) => selectedIdSet.has(row.id));
  }, [rows, selectedQueueIds]);

  const exportState = useNotebookExport({
    open: pageState.exportDialogOpen,
    filters: pageState.exportFilters,
    currentUser: pageState.currentUser,
    canSelfReport: pageState.canSelfReport,
  });

  useEffect(() => {
    if (!isBulkAssignEnabled) {
      setSelectedQueueIds([]);
      return;
    }

    const allowedIds = new Set(selectableQueueIds);
    setSelectedQueueIds((previous) => previous.filter((id) => allowedIds.has(id)));
  }, [isBulkAssignEnabled, selectableQueueIds]);

  const handleDelete = async (id) => {
    const confirmed = await dialog_confirm_yes_no("ยืนยันการลบรายการนี้?");
    if (!confirmed) {
      return;
    }

    const loadingId = showLoading("กำลังลบรายการ...");
    try {
      await deleteNotebook(id).unwrap();
      showSuccess("ลบรายการสำเร็จ");
    } catch (error) {
      if (error?.status === 403) {
        showError("คุณไม่มีสิทธิ์ลบรายการนี้");
      } else {
        showError("ลบรายการไม่สำเร็จ");
      }
    } finally {
      dismissToast(loadingId);
    }
  };

  const handleToggleFavorite = async (notebook) => {
    if (!notebook?.id) {
      return;
    }

    try {
      await updateNotebook({
        id: notebook.id,
        nb_is_favorite: !notebook.nb_is_favorite,
      }).unwrap();
    } catch (error) {
      showError(error?.data?.message || "ไม่สามารถอัปเดตรายการโปรดได้");
    }
  };

  const handleReserve = async (notebook) => {
    const confirmed = await dialog_confirm_yes_no("ยืนยันการรับลูกค้ารายนี้เข้าดูแล?");
    if (!confirmed) {
      return;
    }

    const loadingId = showLoading("กำลังรับลูกค้าเข้าดูแล...");
    try {
      await reserveNotebook({ id: notebook.id }).unwrap();
      showSuccess("รับลูกค้าเข้าดูแลสำเร็จ");
    } catch (error) {
      showError(error?.data?.message || "ไม่สามารถรับลูกค้าเข้าดูแลได้");
    } finally {
      dismissToast(loadingId);
    }
  };

  const handleAssign = (notebook) => {
    if (!notebook) {
      return;
    }

    setAssignDialogState({
      open: true,
      notebooks: [notebook],
    });
  };

  const handleSelectedQueueIdsChange = (nextIds) => {
    if (!isBulkAssignEnabled) {
      setSelectedQueueIds([]);
      return;
    }

    const allowedIds = new Set(selectableQueueIds);
    setSelectedQueueIds((nextIds || []).filter((id) => allowedIds.has(id)));
  };

  const handleToggleSelectedQueueRow = (rowId, checked) => {
    const allowedIds = new Set(selectableQueueIds);
    if (!allowedIds.has(rowId)) {
      return;
    }

    setSelectedQueueIds((previous) => {
      if (checked) {
        return previous.includes(rowId) ? previous : [...previous, rowId];
      }

      return previous.filter((id) => id !== rowId);
    });
  };

  const handleOpenAssignSelected = () => {
    if (!selectedQueueNotebooks.length) {
      return;
    }

    setAssignDialogState({
      open: true,
      notebooks: selectedQueueNotebooks,
    });
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogState({
      open: false,
      notebooks: [],
    });
  };

  const handleAssignSuccess = ({ assignee, count }) => {
    const fullName = `${assignee?.user_firstname || ""} ${assignee?.user_lastname || ""}`.trim();
    const assigneeName =
      fullName || assignee?.user_nickname || assignee?.username || "ผู้รับผิดชอบ";

    const assignedCount = count || 1;
    showSuccess(
      assignedCount > 1
        ? `มอบหมาย Notebook ${assignedCount} รายการให้ ${assigneeName} สำเร็จ`
        : `มอบหมาย Notebook ให้ ${assigneeName} สำเร็จ`
    );
    setSelectedQueueIds([]);
    handleCloseAssignDialog();
    refetch();
  };

  const handleAssignError = (message) => {
    showError(message || "ไม่สามารถมอบหมาย Notebook ได้");
    setSelectedQueueIds([]);
    handleCloseAssignDialog();
    refetch();
  };

  const handleConvert = (notebook) => {
    if (notebook?.nb_entry_type === "customer_care") {
      return;
    }

    dispatch(setInputList(mapNotebookToCustomer(notebook)));
    dispatch(setMode("create"));
    setConvertingNotebookId(notebook.id);
    pageState.setCustomerDialogOpen(true);
  };

  const handleAddIntoMine = () => {
    pageState.setScopeFilter("mine");
    dispatch(
      setSelectedNotebook({
        nb_customer_name: "",
        nb_contact_person: "",
        nb_contact_number: "",
        nb_email: "",
        nb_additional_info: "",
        nb_remarks: "",
        nb_is_online: false,
        nb_manage_by: pageState.currentUser?.user_id || null,
        nb_workflow: "standard",
        nb_entry_type: "standard",
        manage_by_user: pageState.currentUser || null,
      })
    );
    dispatch(setDialogMode("create"));
    dispatch(setDialogOpen(true));
  };

  const handleCloseNotebookDialog = () => {
    dispatch(setDialogOpen(false));
    dispatch(setSelectedNotebook(null));
  };

  const handleAfterCustomerSave = async (savedResponse) => {
    if (convertingNotebookId) {
      const loadingId = showLoading("กำลังอัปเดตสถานะ Notebook...");
      try {
        await convertNotebook({
          id: convertingNotebookId,
          nb_status: "ได้งาน",
          customer_id: savedResponse?.data?.customer_id,
        }).unwrap();
        showSuccess("สร้างลูกค้าและอัปเดต Notebook เรียบร้อย");
      } catch {
        showError("สร้างลูกค้าสำเร็จ แต่ไม่สามารถอัปเดต Notebook ได้");
      } finally {
        setConvertingNotebookId(null);
        dismissToast(loadingId);
      }
    }

    refetch();
    pageState.setCustomerDialogOpen(false);
  };

  return {
    ...pageState,
    rows,
    total: data?.total || 0,
    listMeta: data?.meta,
    listError: fetchError,
    isLoading,
    isFetching,
    isConverting,
    isReserving,
    convertingNotebookId,
    isBulkAssignEnabled,
    selectedQueueIds,
    assignDialogState,
    exportState,
    refetch,
    handleDelete,
    handleAssign,
    handleSelectedQueueIdsChange,
    handleToggleSelectedQueueRow,
    handleOpenAssignSelected,
    handleCloseAssignDialog,
    handleAssignSuccess,
    handleAssignError,
    handleReserve,
    handleConvert,
    handleToggleFavorite,
    handleAddIntoMine,
    handleEdit: (notebook) =>
      notebook?.nb_entry_type === "personal_activity"
        ? pageState.openPersonalActivityDialog("edit", notebook)
        : notebook?.nb_entry_type === "customer_care"
          ? pageState.handleCustomerCareEdit(notebook)
          : pageState.handleEdit(notebook),
    handleEditWorkflow: (notebook) =>
      notebook?.nb_entry_type === "personal_activity"
        ? pageState.openPersonalActivityDialog("edit", notebook)
        : notebook?.nb_entry_type === "customer_care"
          ? pageState.handleCustomerCareEdit(notebook)
          : pageState.handleEditWorkflow(notebook),
    handleView: (notebook) =>
      notebook?.nb_entry_type === "personal_activity"
        ? pageState.openPersonalActivityDialog("view", notebook)
        : notebook?.nb_entry_type === "customer_care"
          ? pageState.handleCustomerCareView(notebook)
          : pageState.handleView(notebook),
    handleClosePersonalActivityDialog: pageState.closePersonalActivityDialog,
    handleAfterCustomerSave,
    handleCloseNotebookDialog,
  };
};
