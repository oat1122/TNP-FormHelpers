import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import { Close as CloseIcon, FilterList as FilterIcon } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useGetKpiRecallDetailsQuery } from "../../../features/Customer/customerApi";
import dayjs from "dayjs";
import "dayjs/locale/th";

/**
 * Dialog to show the list of customers for a specific Recall Status
 */
const RecallDetailsDialog = ({
  open,
  onClose,
  recallType,
  period,
  startDate,
  endDate,
  sourceFilter,
  userId,
}) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch data only when dialog is open and recallType is provided
  const { data, isLoading, isFetching } = useGetKpiRecallDetailsQuery(
    {
      recall_type: recallType,
      period,
      source_filter: sourceFilter,
      user_id: userId,
      page: page + 1, // API uses 1-based index, DataGrid uses 0-based
      per_page: pageSize,
      start_date: startDate,
      end_date: endDate,
    },
    { skip: !open || !recallType }
  );

  const customers = data?.data?.customers || [];
  const totalRows = data?.data?.total || 0;

  // Title configuration based on recall type
  const titles = {
    waiting: "รายชื่อลูกค้ารอกด Recall (ตกเกณฑ์)",
    in_criteria: "รายชื่อลูกค้าอยู่ในเกณฑ์",
    made: "รายชื่อลูกค้าที่กด Recall (ในรอบนี้)",
  };

  const columns = [
    {
      field: "full_name",
      headerName: "ชื่อ-นามสกุล",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "status",
      headerName: "สถานะล่าสุด",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Chip label={params.value || "ไม่ระบุ"} size="small" color="primary" variant="outlined" />
      ),
    },
    {
      field: "target_date",
      headerName: "กำหนดการโทร (Target Date)",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => {
        if (!params.value) return "-";
        return dayjs(params.value).locale("th").format("D MMM YYYY HH:mm");
      },
    },
    {
      field: "updated_date",
      headerName: "วันที่อัปเดต (Updated Date)",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => {
        if (!params.value) return "-";
        return dayjs(params.value).locale("th").format("D MMM YYYY HH:mm");
      },
    },
    {
      field: "group_name",
      headerName: "กลุ่มลูกค้า",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "source",
      headerName: "แหล่งที่มา",
      width: 120,
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ m: 0, p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography variant="h6" fontFamily="Kanit" fontWeight={600}>
          {titles[recallType] || "รายละเอียดข้อมูล"}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Context metadata about the current filter */}
        <Box sx={{ p: 2, borderBottom: "1px solid #eee", bgcolor: "#fafafa" }}>
          <Typography
            variant="body2"
            color="text.secondary"
            fontFamily="Kanit"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <FilterIcon fontSize="small" />
            คุณกำลังดูข้อมูลผู้มุ่งหวังตามตัวกรองที่คุณเลือก (รวมถึงกำหนดการ)
          </Typography>
        </Box>

        <Box sx={{ height: 500, width: "100%" }}>
          <DataGrid
            rows={customers}
            columns={columns}
            getRowId={(row) => row.id}
            rowHeight={60}
            // Pagination settings
            pagination
            paginationMode="server"
            rowCount={totalRows}
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setPageSize(model.pageSize);
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            // Loading state
            loading={isLoading || isFetching}
            // Configuration
            disableRowSelectionOnClick
            disableColumnMenu
            sx={{
              border: 0,
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "#f5f5f5",
                fontFamily: "Kanit",
                fontSize: "0.9rem",
              },
              "& .MuiDataGrid-cell": {
                fontFamily: "Kanit",
                fontSize: "0.9rem",
              },
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default RecallDetailsDialog;
