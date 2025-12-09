import React, { useMemo } from "react";
import { Box, Chip, Typography, Fab, Badge, useTheme, useMediaQuery } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { PersonAdd as PersonAddIcon } from "@mui/icons-material";
import dayjs from "dayjs";

import PoolEmptyState from "./PoolEmptyState";
import { getSourceDisplayName, getSourceColor } from "../../../features/Customer/customerUtils";

/**
 * PoolCustomersTable - Data grid for displaying and selecting pool customers
 */
const PoolCustomersTable = ({
  data,
  isLoading,
  paginationModel,
  onPaginationModelChange,
  selectedIds,
  onSelectedIdsChange,
  onAssignClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Column definitions with responsive visibility
  const columns = useMemo(() => {
    const baseColumns = [
      {
        field: "cus_no",
        headerName: "รหัส",
        width: 120,
        sortable: false,
      },
      {
        field: "cus_name",
        headerName: "ชื่อ",
        width: 200,
        sortable: false,
        renderCell: (params) => {
          const fullName = params.value;
          const company = params.row.cus_company || "";

          return (
            <Box>
              <Typography variant="body2" fontWeight="bold">
                {fullName}
              </Typography>
              {company && (
                <Typography variant="caption" color="text.secondary">
                  {company}
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        field: "cus_tel_1",
        headerName: "เบอร์",
        width: 140,
        sortable: false,
      },
      {
        field: "cus_source",
        headerName: "ที่มา",
        width: 130,
        sortable: false,
        renderCell: (params) => {
          if (!params.value)
            return (
              <Typography variant="caption" color="text.disabled">
                -
              </Typography>
            );

          return (
            <Chip
              label={getSourceDisplayName(params.value)}
              color={getSourceColor(params.value)}
              size="small"
              sx={{ fontWeight: "bold" }}
              aria-label={`ที่มา: ${getSourceDisplayName(params.value)}`}
            />
          );
        },
      },
    ];

    // Add columns that hide on mobile
    if (!isMobile) {
      baseColumns.push(
        {
          field: "cus_company",
          headerName: "บริษัท",
          width: 200,
          sortable: false,
          renderCell: (params) => params.value || "-",
        },
        {
          field: "cus_created_date",
          headerName: "วันที่สร้าง",
          width: 180,
          sortable: false,
          renderCell: (params) => {
            if (!params.value) return "-";
            return dayjs(params.value).format("DD/MM/YYYY HH:mm");
          },
        }
      );
    }

    return baseColumns;
  }, [isMobile]);

  // Prepare rows
  const rows = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map((customer) => ({
      id: customer.cus_id,
      ...customer,
    }));
  }, [data]);

  const rowCount = data?.pagination?.total || 0;

  // Handle empty state
  if (!isLoading && rows.length === 0) {
    return <PoolEmptyState />;
  }

  return (
    <Box position="relative">
      <DataGrid
        rows={rows}
        columns={columns}
        loading={isLoading}
        checkboxSelection
        disableRowSelectionOnClick
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        rowCount={rowCount}
        pageSizeOptions={[30, 50, 100]}
        rowSelectionModel={selectedIds}
        onRowSelectionModelChange={onSelectedIdsChange}
        sx={{
          minHeight: 400,
          "& .MuiDataGrid-cell:focus": {
            outline: "none",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        }}
        aria-label="ตารางลูกค้าใน Pool"
        localeText={{
          noRowsLabel: "ไม่มีข้อมูล",
          MuiTablePagination: {
            labelRowsPerPage: "แถวต่อหน้า:",
            labelDisplayedRows: ({ from, to, count }) =>
              `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`,
          },
        }}
      />

      {/* Floating Action Button for Assignment */}
      <Fab
        color="primary"
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
        disabled={selectedIds.length === 0}
        onClick={onAssignClick}
        aria-label={`จัดสรรลูกค้า ${selectedIds.length} รายการ`}
      >
        <Badge
          badgeContent={selectedIds.length}
          color="secondary"
          sx={{ position: "absolute", top: -8, right: -8 }}
        >
          <PersonAddIcon />
        </Badge>
      </Fab>
    </Box>
  );
};

export default PoolCustomersTable;
