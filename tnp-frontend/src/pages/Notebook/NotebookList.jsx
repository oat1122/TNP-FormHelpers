import { Box, Button, Typography } from "@mui/material";
import { useState } from "react";
import { MdFileDownload } from "react-icons/md";
import { RiAddLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";

import NotebookDialog from "./components/NotebookDialog";
import NotebookTable from "./components/NotebookTable";
import PrintPDFDialog from "./components/PrintPDFDialog";
import TitleBar from "../../components/TitleBar";
import { setInputList, setMode } from "../../features/Customer/customerSlice";
import {
  useDeleteNotebookMutation,
  useGetNotebooksQuery,
  useUpdateNotebookMutation,
} from "../../features/Notebook/notebookApi";
import {
  setDialogMode,
  setDialogOpen,
  setSelectedNotebook,
} from "../../features/Notebook/notebookSlice";
import { useSnackbar } from "../AllocationHub/hooks";
import { DialogForm } from "../Customer/components/Forms";

const NotebookList = () => {
  const dispatch = useDispatch();
  const { showSuccess, showError } = useSnackbar();

  // Get global search keyword from header
  const globalKeyword = useSelector((state) => state.global.keyword);

  // Notebook State
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 15 });

  // Customer Dialog State (reusing Component)
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  // PDF Dialog State
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);

  // Track which notebook is being converted
  const [convertingNotebookId, setConvertingNotebookId] = useState(null);

  // Fetch Data
  const { data, isLoading, refetch } = useGetNotebooksQuery({
    page: paginationModel.page,
    per_page: paginationModel.pageSize,
    search: globalKeyword,
  });

  const [deleteNotebook] = useDeleteNotebookMutation();
  const [updateNotebook] = useUpdateNotebookMutation();

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
    if (window.confirm("ยืนยันการลบรายการนี้?")) {
      try {
        await deleteNotebook(id).unwrap();
        showSuccess("ลบรายการสำเร็จ");
      } catch {
        showError("ลบรายการไม่สำเร็จ");
      }
    }
  };

  const handleConvert = (notebook) => {
    // Map Notebook data to Customer Input List
    // nb_customer_name -> cus_company / cus_name (logic: if has "บริษัท" -> company, else name)
    // nb_contact_number -> cus_tel_1
    // nb_email -> cus_email
    // nb_contact_person -> cus_firstname / cus_lastname (split by space)

    const isCompany =
      notebook.nb_customer_name?.includes("บริษัท") || notebook.nb_customer_name?.includes("หจก.");

    const nameParts = notebook.nb_contact_person ? notebook.nb_contact_person.split(" ") : [];
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const mappingData = {
      cus_company: isCompany ? notebook.nb_customer_name : "",
      cus_name: !isCompany ? notebook.nb_customer_name : "", // Store Name if not company
      cus_tel_1: notebook.nb_contact_number || "",
      cus_email: notebook.nb_email || "",
      cus_firstname: firstName,
      cus_lastname: lastName,
      cd_note: `${notebook.nb_remarks || ""} \n[ข้อมูลเพิ่มเติมจาก Notebook]: ${notebook.nb_additional_info || ""}`,
      cus_channel: notebook.nb_is_online ? 2 : 1, // 2 = Online, 1 = Sales (Default)
    };

    dispatch(setInputList(mappingData));
    dispatch(setMode("create"));
    setConvertingNotebookId(notebook.id);
    setCustomerDialogOpen(true);
  };

  return (
    <Box>
      <TitleBar title="สมุดจดบันทึก (Notebook)" />

      <Box sx={{ p: 3, maxWidth: 1600, margin: "auto" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h5" component="h1" fontWeight="bold" color="text.secondary">
            รายการที่จดบันทึก
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<MdFileDownload />}
              onClick={() => setPdfDialogOpen(true)}
              disabled={isLoading}
              sx={{ borderColor: "#1976d2", color: "#1976d2" }}
            >
              Export ข้อมูล
            </Button>
            <Button
              variant="contained"
              startIcon={<RiAddLine />}
              onClick={handleAdd}
              sx={{ bgcolor: "#d32f2f", "&:hover": { bgcolor: "#b71c1c" } }}
            >
              จดบันทึก
            </Button>
          </Box>
        </Box>

        <NotebookTable
          data={data?.data}
          total={data?.total}
          isLoading={isLoading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onConvert={handleConvert}
        />
      </Box>

      {/* Dialogs */}
      <NotebookDialog />

      <PrintPDFDialog
        open={pdfDialogOpen}
        onClose={() => setPdfDialogOpen(false)}
        data={data?.data || []}
      />

      <DialogForm
        openDialog={customerDialogOpen}
        handleCloseDialog={() => setCustomerDialogOpen(false)}
        handleRecall={() => {}} // Dummy prop
        onAfterSave={async () => {
          // If we were converting a notebook, mark it as converted
          if (convertingNotebookId) {
            try {
              await updateNotebook({
                id: convertingNotebookId,
                nb_converted_at: new Date().toISOString(),
                nb_status: "ได้งาน", // Update status to reflect success
              }).unwrap();
              setConvertingNotebookId(null);
            } catch (error) {
              console.error("Failed to update notebook conversion status:", error);
            }
          }
          refetch();
        }}
      />
    </Box>
  );
};

export default NotebookList;
