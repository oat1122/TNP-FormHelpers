import { useState } from "react";
import { useDispatch } from "react-redux";

import { useNotebookExport } from "./useNotebookExport";
import { useNotebookPageState } from "./useNotebookPageState";
import { setInputList, setMode } from "../../../features/Customer/customerSlice";
import {
  useConvertNotebookMutation,
  useDeleteNotebookMutation,
  useGetNotebooksQuery,
  useReserveNotebookMutation,
} from "../../../features/Notebook/notebookApi";
import { setDialogOpen, setSelectedNotebook } from "../../../features/Notebook/notebookSlice";
import { dialog_confirm_yes_no } from "../../../utils/dialog_swal2/dialog_confirm_yes_no";
import { dismissToast, showError, showLoading, showSuccess } from "../../../utils/toast";
import { mapNotebookToCustomer } from "../utils/notebookMapping";

export const useNotebookList = () => {
  const dispatch = useDispatch();
  const pageState = useNotebookPageState();
  const [convertingNotebookId, setConvertingNotebookId] = useState(null);

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

  const exportState = useNotebookExport({
    open: pageState.exportDialogOpen,
    filters: pageState.exportFilters,
    currentUser: pageState.currentUser,
    canSelfReport: pageState.canSelfReport,
  });

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

  const handleConvert = (notebook) => {
    if (notebook?.nb_entry_type === "customer_care") {
      return;
    }

    dispatch(setInputList(mapNotebookToCustomer(notebook)));
    dispatch(setMode("create"));
    setConvertingNotebookId(notebook.id);
    pageState.setCustomerDialogOpen(true);
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
    rows: data?.rows || [],
    total: data?.total || 0,
    listMeta: data?.meta,
    listError: fetchError,
    isLoading,
    isFetching,
    isConverting,
    isReserving,
    convertingNotebookId,
    exportState,
    refetch,
    handleDelete,
    handleReserve,
    handleConvert,
    handleEdit: (notebook) =>
      notebook?.nb_entry_type === "customer_care"
        ? pageState.handleCustomerCareEdit(notebook)
        : pageState.handleEdit(notebook),
    handleEditWorkflow: (notebook) =>
      notebook?.nb_entry_type === "customer_care"
        ? pageState.handleCustomerCareEdit(notebook)
        : pageState.handleEditWorkflow(notebook),
    handleView: (notebook) =>
      notebook?.nb_entry_type === "customer_care"
        ? pageState.handleCustomerCareView(notebook)
        : pageState.handleView(notebook),
    handleAfterCustomerSave,
    handleCloseNotebookDialog,
  };
};
