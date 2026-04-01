import { useState } from "react";
import { useDispatch } from "react-redux";

import { useNotebookExport } from "./useNotebookExport";
import { useNotebookPageState } from "./useNotebookPageState";
import { setInputList, setMode } from "../../../features/Customer/customerSlice";
import {
  useConvertNotebookMutation,
  useDeleteNotebookMutation,
  useGetNotebooksQuery,
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

  const exportState = useNotebookExport({
    open: pageState.exportDialogOpen,
    filters: pageState.exportFilters,
    currentUser: pageState.currentUser,
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
        showError("คุณไม่มีสิทธิ์ลบรายการนี้ (เฉพาะ Admin)");
      } else {
        showError("ลบรายการไม่สำเร็จ");
      }
    } finally {
      dismissToast(loadingId);
    }
  };

  const handleConvert = (notebook) => {
    dispatch(setInputList(mapNotebookToCustomer(notebook)));
    dispatch(setMode("create"));
    setConvertingNotebookId(notebook.id);
    pageState.setCustomerDialogOpen(true);
  };

  const handleCloseNotebookDialog = () => {
    dispatch(setDialogOpen(false));
    dispatch(setSelectedNotebook(null));
  };

  const handleAfterCustomerSave = async () => {
    if (convertingNotebookId) {
      const loadingId = showLoading("กำลังอัปเดตสถานะ Notebook...");
      try {
        await convertNotebook({
          id: convertingNotebookId,
          nb_status: "ได้งาน",
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
    convertingNotebookId,
    exportState,
    refetch,
    handleDelete,
    handleConvert,
    handleAfterCustomerSave,
    handleCloseNotebookDialog,
  };
};
