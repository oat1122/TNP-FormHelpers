import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton, Typography } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useGetKpiDashboardDetailsQuery } from "../../../features/Customer/customerApi";

/**
 * Dialog to show the list of customers for a specific KPI (Total, Pool, Allocated)
 */
const KpiDetailsDialog = ({
  open,
  onClose,
  kpiType,
  period,
  startDate,
  endDate,
  sourceFilter,
  userId,
}) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch data only when dialog is open and kpiType is provided
  const { data, isLoading, isFetching } = useGetKpiDashboardDetailsQuery(
    {
      kpi_type: kpiType,
      period,
      source_filter: sourceFilter,
      user_id: userId,
      page,
      per_page: pageSize,
      ...(period === "custom" && {
        start_date: startDate,
        end_date: endDate,
      }),
    },
    { skip: !open || !kpiType }
  );

  const rows = data?.data || [];
  const totalCount = data?.meta?.total || rows.length;

  const getTitle = () => {
    switch (kpiType) {
      case "total":
        return "รายละเอียดลูกค้าใหม่ทั้งหมด";
      case "pool":
        return "รายละเอียดลูกค้ารอจัดสรร (Pool)";
      case "allocated":
        return "รายละเอียดลูกค้าที่จัดสรรแล้ว";
      default:
        return "รายละเอียดลูกค้า";
    }
  };

  const columns = [
    {
      field: "full_name",
      headerName: "ชื่อ-นามสกุล",
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => {
        return params.row?.full_name || params.row?.name || "-";
      },
    },
    { field: "mobile", headerName: "เบอร์โทรศัพท์", flex: 1, minWidth: 120 },
    { field: "source", headerName: "แหล่งที่มา", flex: 1, minWidth: 120 },
    { field: "sales_full_name", headerName: "พนักงานขาย", flex: 1.5, minWidth: 150 },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <Typography variant="h6" fontWeight="bold" fontFamily="Kanit">
          {getTitle()}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ height: 500, p: 0 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.cus_id || row.id || `temp-${Math.random()}`}
          loading={isLoading || isFetching}
          rowCount={totalCount}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(newModel) => {
            setPage(newModel.page);
            setPageSize(newModel.pageSize);
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{
            border: 0,
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f5f5f5",
            },
            "& .MuiDataGrid-cell": {
              fontFamily: "Kanit",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontFamily: "Kanit",
              fontWeight: "bold",
            },
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default KpiDetailsDialog;
