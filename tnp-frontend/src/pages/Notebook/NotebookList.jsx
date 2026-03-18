import { Box, Button, Typography } from "@mui/material";
import { MdFileDownload } from "react-icons/md";
import { RiAddLine } from "react-icons/ri";

import NotebookDialog from "./components/NotebookDialog";
import NotebookTable from "./components/NotebookTable";
import PrintPDFDialog from "./components/PrintPDFDialog";
import { useNotebookList } from "./hooks/useNotebookList";
import TitleBar from "../../components/TitleBar";
import { DialogForm } from "../Customer/components/Forms";
import PeriodTabs from "../Telesales/sections/PeriodTabs";

const NotebookList = () => {
  const {
    // State
    paginationModel,
    setPaginationModel,
    periodFilter,
    setPeriodFilter,
    customerDialogOpen,
    setCustomerDialogOpen,
    pdfDialogOpen,
    setPdfDialogOpen,
    // Data
    data,
    isLoading,
    // Handlers
    handleAdd,
    handleEdit,
    handleDelete,
    handleConvert,
    handleAfterCustomerSave,
  } = useNotebookList();

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

        <PeriodTabs periodFilter={periodFilter} onPeriodChange={setPeriodFilter} />

        <NotebookTable
          data={data?.data}
          total={data?.total}
          isLoading={isLoading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onConvert={handleConvert}
          userRole={JSON.parse(localStorage.getItem("userData") || "{}")?.role}
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
        onAfterSave={handleAfterCustomerSave}
      />
    </Box>
  );
};

export default NotebookList;
