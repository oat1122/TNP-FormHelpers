import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { setInputList, setMode } from "../../../features/Customer/customerSlice";
import {
  useDeleteNotebookMutation,
  useGetNotebooksQuery,
  useUpdateNotebookMutation,
} from "../../../features/Notebook/notebookApi";
import {
  setDialogMode,
  setDialogOpen,
  setSelectedNotebook,
} from "../../../features/Notebook/notebookSlice";
import { dialog_confirm_yes_no } from "../../../utils/dialog_swal2/dialog_confirm_yes_no";
import { showSuccess, showError, showLoading, dismissToast } from "../../../utils/toast";
import { mapNotebookToCustomer } from "../utils/notebookMapping";

export const useNotebookList = () => {
  const dispatch = useDispatch();
  const globalKeyword = useSelector((state) => state.global.keyword);

  // States
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 15 });
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [convertingNotebookId, setConvertingNotebookId] = useState(null);

  // API Hooks
  const {
    data,
    isLoading,
    refetch,
    error: fetchError,
  } = useGetNotebooksQuery({
    page: paginationModel.page,
    per_page: paginationModel.pageSize,
    search: globalKeyword,
    include: "histories",
  });

  const [deleteNotebook] = useDeleteNotebookMutation();
  const [updateNotebook] = useUpdateNotebookMutation();

  // Effects
  useEffect(() => {
    if (fetchError) {
      showError("ไม่สามารถดึงข้อมูลได้: " + (fetchError?.data?.message || "Internal Server Error"));
    }
  }, [fetchError]);

  // Handlers
  const handleAdd = () => {
    dispatch(setDialogMode("create"));
    dispatch(setSelectedNotebook(null));
    dispatch(setDialogOpen(true));
  };

  const handleEdit = (notebook) => {
    dispatch(setDialogMode("edit"));
    dispatch(setSelectedNotebook(notebook));
    dispatch(setDialogOpen(true));
  };

  const handleDelete = async (id) => {
    const isConfirmed = await dialog_confirm_yes_no("ยืนยันการลบรายการนี้?");
    if (isConfirmed) {
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
    }
  };

  const handleConvert = (notebook) => {
    const mappingData = mapNotebookToCustomer(notebook);
    dispatch(setInputList(mappingData));
    dispatch(setMode("create"));
    setConvertingNotebookId(notebook.id);
    setCustomerDialogOpen(true);
  };

  const handleAfterCustomerSave = async () => {
    if (convertingNotebookId) {
      const loadingId = showLoading("กำลังอัปเดตสถานะ Notebook...");
      try {
        await updateNotebook({
          id: convertingNotebookId,
          nb_converted_at: new Date().toISOString(),
          nb_status: "ได้งาน",
        }).unwrap();
        showSuccess("สร้างลูกค้าและอัปเดต Notebook เรียบร้อย");
      } catch (error) {
        console.error("Failed to update notebook conversion status:", error);
        showError("สร้างลูกค้าสำเร็จ แต่ไม่สามารถอัปเดต Notebook ได้");
      } finally {
        setConvertingNotebookId(null);
        dismissToast(loadingId);
      }
    }
    refetch();
  };

  return {
    // State
    paginationModel,
    setPaginationModel,
    customerDialogOpen,
    setCustomerDialogOpen,
    pdfDialogOpen,
    setPdfDialogOpen,
    convertingNotebookId,
    // Data
    data,
    isLoading,
    // Handlers
    handleAdd,
    handleEdit,
    handleDelete,
    handleConvert,
    handleAfterCustomerSave,
  };
};
