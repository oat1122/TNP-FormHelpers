import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Box, Chip, Typography, Fab, Badge, useTheme, useMediaQuery } from "@mui/material";
import { PersonAdd as PersonAddIcon } from "@mui/icons-material";
import dayjs from "dayjs";

import PoolEmptyState from "./PoolEmptyState";
import { DataGridWithRowIdFix } from "../../Customer/components/DataDisplay";
import { getSourceDisplayName, getSourceColor } from "../../../features/Customer/customerUtils";
import { getChannelLabelTh, getChannelColor } from "../../Customer/constants/customerChannel";

/**
 * PoolCustomersTable - Data grid for displaying and selecting pool customers
 *
 * @param {string} mode - "telesales" or "transferred"
 */
const PoolCustomersTable = ({
  data,
  isLoading,
  paginationModel,
  onPaginationModelChange,
  selectedIds,
  onSelectedIdsChange,
  onAssignClick,
  mode = "telesales",
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTransferredMode = mode === "transferred";

  // Column definitions with responsive visibility
  const columns = useMemo(() => {
    const baseColumns = [
      {
        field: "cus_no",
        headerName: "รหัส",
        width: 100,
        sortable: false,
      },
      {
        field: "cus_name",
        headerName: "ชื่อ",
        flex: 0.8,
        minWidth: 160,
        sortable: false,
        renderCell: (params) => {
          const fullName = params.value;
          const company = params.row.cus_company || "";

          return (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                height: "100%",
                overflow: "hidden",
              }}
            >
              <Typography variant="body2" fontWeight="bold" noWrap title={fullName}>
                {fullName}
              </Typography>
              {company && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  title={company}
                  sx={{ lineHeight: 1.2 }}
                >
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
        width: 130,
        sortable: false,
      },
    ];

    // Source column for Telesales mode
    if (!isTransferredMode) {
      baseColumns.push({
        field: "cus_source",
        headerName: "ที่มา",
        width: 120,
        sortable: false,
        renderCell: (params) => {
          if (!params.value) {
            return (
              <Typography variant="caption" color="text.disabled">
                -
              </Typography>
            );
          }

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
      });
    }

    // Transfer-specific columns
    if (isTransferredMode && !isMobile) {
      baseColumns.push(
        {
          field: "previous_manager",
          headerName: "เจ้าของเดิม",
          flex: 1,
          minWidth: 150,
          sortable: false,
          renderCell: (params) => {
            const transfer = params.row.latest_transfer;
            if (!transfer?.previous_manager_name) {
              return (
                <Typography variant="caption" color="text.disabled">
                  -
                </Typography>
              );
            }
            return <Typography variant="body2">{transfer.previous_manager_name}</Typography>;
          },
        },
        {
          field: "from_channel",
          headerName: "โอนมาจากทีม",
          width: 130,
          sortable: false,
          renderCell: (params) => {
            const transfer = params.row.latest_transfer;
            if (!transfer) {
              return (
                <Typography variant="caption" color="text.disabled">
                  -
                </Typography>
              );
            }
            return (
              <Chip
                label={getChannelLabelTh(transfer.previous_channel)}
                color={getChannelColor(transfer.previous_channel)}
                size="small"
              />
            );
          },
        },
        {
          field: "transfer_date",
          headerName: "วันที่โอน",
          width: 140,
          sortable: false,
          renderCell: (params) => {
            const transfer = params.row.latest_transfer;
            if (!transfer?.transferred_at) {
              return (
                <Typography variant="caption" color="text.disabled">
                  -
                </Typography>
              );
            }
            return dayjs(transfer.transferred_at).format("DD/MM/YY HH:mm");
          },
        }
      );
    }

    // Add columns that hide on mobile
    if (!isMobile) {
      baseColumns.push({
        field: "cus_created_date",
        headerName: "วันที่สร้าง",
        width: 150,
        sortable: false,
        renderCell: (params) => {
          if (!params.value) return "-";
          return dayjs(params.value).format("DD/MM/YYYY HH:mm");
        },
      });
    }

    return baseColumns;
  }, [isMobile, isTransferredMode]);

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
    return (
      <PoolEmptyState
        message={isTransferredMode ? "ไม่มีลูกค้าที่ถูกโยนมา" : "ไม่มีลูกค้าจาก Telesales"}
      />
    );
  }

  return (
    <Box position="relative">
      <DataGridWithRowIdFix
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
        aria-label={isTransferredMode ? "ตารางลูกค้าที่ถูกโยน" : "ตารางลูกค้าจาก Telesales"}
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
        <Badge badgeContent={selectedIds.length} color="secondary">
          <PersonAddIcon />
        </Badge>
      </Fab>
    </Box>
  );
};

PoolCustomersTable.propTypes = {
  data: PropTypes.object,
  isLoading: PropTypes.bool,
  paginationModel: PropTypes.object.isRequired,
  onPaginationModelChange: PropTypes.func.isRequired,
  selectedIds: PropTypes.array.isRequired,
  onSelectedIdsChange: PropTypes.func.isRequired,
  onAssignClick: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["telesales", "transferred"]),
};

export default PoolCustomersTable;
