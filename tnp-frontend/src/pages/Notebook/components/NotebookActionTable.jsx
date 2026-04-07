import { AssignmentInd as AssignmentIndIcon } from "@mui/icons-material";
import { Badge, Box, Chip, Fab, Stack, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import NotebookRowActions from "./NotebookRowActions";
import {
  formatDate,
  getNotebookActionHighlightSx,
  getNotebookContactLines,
  getNotebookNotePreview,
  getStatusColor,
  isNotebookQueueAssignableRow,
} from "../utils/notebookCommon";
import { getNotebookActionLabel, getNotebookEntryTypeLabel } from "../utils/notebookDialogConfig";

const THAI_LOCALE_TEXT = {
  noRowsLabel: "ไม่พบข้อมูล",
  MuiTablePagination: {
    labelRowsPerPage: "รายการต่อหน้า:",
    labelDisplayedRows: ({ from, to, count }) =>
      `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`,
  },
};

const NotebookActionTable = ({
  rows,
  total,
  pagination,
  actions,
  userRole,
  onNoRowsOverlay,
  scopeFilter,
  canReserveQueue,
  queueActionMode,
  selectionState,
}) => {
  const selectionEnabled = Boolean(selectionState?.enabled);

  const columns = [
    {
      field: "follow_up",
      headerName: "ติดตาม",
      minWidth: 210,
      flex: 1.05,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack spacing={0.75} sx={{ width: "100%", py: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {formatDate(row.nb_date || row.created_at) || "-"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            อัปเดตล่าสุด {formatDate(row.updated_at) || "-"}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "customer",
      headerName: "ลูกค้า",
      minWidth: 280,
      flex: 1.35,
      sortable: false,
      renderCell: ({ row }) => {
        const contactLines = getNotebookContactLines(row);

        return (
          <Stack spacing={0.75} sx={{ width: "100%", py: 1 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" useFlexGap flexWrap="wrap">
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {row.nb_customer_name || "-"}
              </Typography>
              <Chip
                label={getNotebookEntryTypeLabel(row.nb_entry_type)}
                size="small"
                color={row.nb_entry_type === "customer_care" ? "secondary" : "default"}
                variant="outlined"
              />
              {row.nb_is_online ? (
                <Chip label="Online" size="small" color="info" variant="outlined" />
              ) : null}
            </Stack>
            {contactLines.map((line) => (
              <Typography key={line} variant="caption" color="text.secondary">
                {line}
              </Typography>
            ))}
          </Stack>
        );
      },
    },
    {
      field: "next_action",
      headerName: "Action",
      minWidth: 250,
      flex: 1.15,
      sortable: false,
      renderCell: ({ row }) => (
        <Box
          onClick={(event) => {
            event.stopPropagation();
            actions.onEditWorkflow(row);
          }}
          sx={getNotebookActionHighlightSx()}
        >
          <Typography variant="caption" sx={{ color: "#9a3412", fontWeight: 700 }}>
            Action
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#7c2d12" }}>
            {getNotebookActionLabel(row.nb_action)}
          </Typography>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "สถานะและบันทึก",
      minWidth: 260,
      flex: 1.2,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack spacing={0.85} sx={{ width: "100%", py: 1 }}>
          <Chip
            label={row.nb_status || "ยังไม่ระบุสถานะ"}
            size="small"
            color={getStatusColor(row.nb_status)}
            sx={{ width: "fit-content", fontWeight: 600 }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            title={getNotebookNotePreview(row)}
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {getNotebookNotePreview(row)}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "actions",
      headerName: "จัดการ",
      minWidth: 310,
      flex: 1.25,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: ({ row }) => (
        <NotebookRowActions
          row={row}
          userRole={userRole}
          onView={actions.onView}
          onEdit={actions.onEdit}
          onDelete={actions.onDelete}
          onAssign={actions.onAssign}
          onReserve={actions.onReserve}
          onConvert={actions.onConvert}
          scopeFilter={scopeFilter}
          canReserveQueue={canReserveQueue}
          queueActionMode={queueActionMode}
        />
      ),
    },
  ];

  return (
    <Box sx={{ height: 640, width: "100%", p: 1.5 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        rowCount={total || 0}
        paginationMode="server"
        paginationModel={pagination.model}
        onPaginationModelChange={pagination.onChange}
        pageSizeOptions={[15, 30, 50]}
        checkboxSelection={selectionEnabled}
        disableRowSelectionOnClick
        hideFooterSelectedRowCount
        rowSelectionModel={selectionState?.selectedIds || []}
        onRowSelectionModelChange={(nextModel) =>
          selectionState?.onSelectedIdsChange?.([...nextModel])
        }
        isRowSelectable={(params) =>
          !selectionEnabled || isNotebookQueueAssignableRow(params.row, scopeFilter)
        }
        localeText={THAI_LOCALE_TEXT}
        slots={{
          noRowsOverlay: onNoRowsOverlay,
        }}
        getRowHeight={() => "auto"}
        getEstimatedRowHeight={() => 128}
        onRowClick={(params) => actions.onView(params.row)}
        sx={{
          border: "none",
          "& .MuiDataGrid-main": {
            borderRadius: 2,
          },
          "& .MuiDataGrid-columnHeaders": {
            bgcolor: "#f7f8fa",
            borderBottom: "1px solid",
            borderColor: "rgba(15, 23, 42, 0.08)",
            color: "text.secondary",
          },
          "& .MuiDataGrid-columnHeader": {
            py: 1.25,
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid",
            borderColor: "rgba(15, 23, 42, 0.08)",
            alignItems: "stretch",
            py: 0.75,
            px: 1.5,
          },
          "& .MuiDataGrid-row:hover": {
            bgcolor: "#fff8f1",
          },
          "& .MuiDataGrid-footerContainer": {
            minHeight: 58,
            borderTop: "1px solid",
            borderColor: "rgba(15, 23, 42, 0.08)",
            bgcolor: "#fcfcfd",
          },
          "& .MuiTablePagination-root, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
            {
              fontFamily: "Kanit, sans-serif",
          },
        }}
      />

      {selectionEnabled ? (
        <Fab
          color="secondary"
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
          disabled={!selectionState?.selectedIds?.length}
          onClick={selectionState?.onOpenAssignSelected}
          aria-label={`มอบหมาย Notebook ${selectionState?.selectedIds?.length || 0} รายการ`}
        >
          <Badge badgeContent={selectionState?.selectedIds?.length || 0} color="warning">
            <AssignmentIndIcon />
          </Badge>
        </Fab>
      ) : null}
    </Box>
  );
};

export default NotebookActionTable;
