import { AssignmentInd as AssignmentIndIcon } from "@mui/icons-material";
import { Badge, Box, Chip, Fab, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { MdStar, MdStarBorder } from "react-icons/md";

import NotebookRowActions from "./NotebookRowActions";
import {
  formatDate,
  getNotebookContactLines,
  getNotebookFollowupChip,
  getNotebookNotePreview,
  getStatusColor,
  isNotebookQueueAssignableRow,
  isUntouchedQueueClaim,
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
      renderCell: ({ row }) => {
        const followupInfo = getNotebookFollowupChip(row);
        const followupNote = row?.nb_next_followup_note?.trim();
        return (
          <Stack spacing={0.25} sx={{ width: "100%", py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatDate(row.nb_date || row.created_at) || "-"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              อัปเดต {formatDate(row.updated_at, "dd/MM/yyyy HH:mm") || "-"}
            </Typography>
            {followupInfo ? (
              <Typography
                variant="caption"
                sx={{
                  color: followupInfo.textColor,
                  fontWeight: followupInfo.severity === "scheduled" ? 400 : 600,
                }}
              >
                {followupInfo.label}
              </Typography>
            ) : null}
            {followupNote ? (
              <Typography
                variant="caption"
                title={followupNote}
                sx={{
                  color: "text.secondary",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  lineHeight: 1.35,
                }}
              >
                {followupNote}
              </Typography>
            ) : null}
          </Stack>
        );
      },
    },
    {
      field: "customer",
      headerName: "ลูกค้า",
      minWidth: 260,
      flex: 1.35,
      sortable: false,
      renderCell: ({ row }) => {
        const contactLines = getNotebookContactLines(row);
        const isPersonalActivity = row.nb_entry_type === "personal_activity";
        const isCustomerCare = row.nb_entry_type === "customer_care";
        const showEntryTypeChip = isCustomerCare || isPersonalActivity;
        const isFreshQueueClaim = isUntouchedQueueClaim(row);

        const canFavorite =
          scopeFilter === "mine" && !isPersonalActivity && actions?.onToggleFavorite;
        const isFavorite = Boolean(row.nb_is_favorite);

        return (
          <Stack spacing={0.5} sx={{ width: "100%", py: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.5} alignItems="center" useFlexGap flexWrap="wrap">
              {canFavorite ? (
                <Tooltip title={isFavorite ? "เอาออกจากรายการโปรด" : "เพิ่มเป็นรายการโปรด"}>
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      actions.onToggleFavorite(row);
                    }}
                    sx={{
                      p: 0.25,
                      color: isFavorite ? "warning.main" : "action.disabled",
                      "&:hover": { color: "warning.dark" },
                    }}
                  >
                    {isFavorite ? <MdStar size={18} /> : <MdStarBorder size={18} />}
                  </IconButton>
                </Tooltip>
              ) : null}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {isPersonalActivity
                  ? row.nb_additional_info || row.nb_customer_name || "-"
                  : row.nb_customer_name || "-"}
              </Typography>
              {isFreshQueueClaim ? (
                <Chip
                  label="🆕 ใหม่จากคิวกลาง"
                  size="small"
                  color="error"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    "& .MuiChip-label": { px: 0.85 },
                  }}
                />
              ) : null}
              {showEntryTypeChip ? (
                <Chip
                  label={getNotebookEntryTypeLabel(row.nb_entry_type)}
                  size="small"
                  color={isCustomerCare ? "secondary" : "warning"}
                  variant="outlined"
                  sx={{
                    height: 18,
                    fontSize: "0.68rem",
                    "& .MuiChip-label": { px: 0.75 },
                  }}
                />
              ) : null}
              {row.nb_is_online ? (
                <Chip
                  label="Online"
                  size="small"
                  color="info"
                  variant="outlined"
                  sx={{
                    height: 18,
                    fontSize: "0.68rem",
                    "& .MuiChip-label": { px: 0.75 },
                  }}
                />
              ) : null}
            </Stack>
            {contactLines.map((line) => (
              <Typography
                key={line}
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1.35 }}
              >
                {line}
              </Typography>
            ))}
          </Stack>
        );
      },
    },
    {
      field: "next_action",
      headerName: "การดำเนินการ",
      minWidth: 180,
      flex: 0.9,
      sortable: false,
      renderCell: ({ row }) => {
        if (row.nb_entry_type === "personal_activity") {
          return (
            <Box sx={{ width: "100%", py: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Personal note
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {row.nb_additional_info || "-"}
              </Typography>
            </Box>
          );
        }

        const actionLabel = getNotebookActionLabel(row.nb_action);
        const hasAction = row.nb_action;

        return (
          <Box
            onClick={(event) => {
              event.stopPropagation();
              actions.onEditWorkflow(row);
            }}
            sx={{ width: "100%", py: 1, cursor: "pointer" }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: hasAction ? 600 : 400,
                fontStyle: hasAction ? "normal" : "italic",
                color: hasAction ? "text.primary" : "text.secondary",
              }}
            >
              {hasAction ? actionLabel : "ยังไม่ระบุ"}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "status",
      headerName: "สถานะและบันทึก",
      minWidth: 240,
      flex: 1.2,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack spacing={0.5} sx={{ width: "100%", py: 1 }}>
          {row.nb_entry_type === "personal_activity" ? (
            <Chip
              label="Personal activity"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ width: "fit-content", fontWeight: 600, height: 22 }}
            />
          ) : (
            <Chip
              label={row.nb_status || "ยังไม่ได้ระบุสถานะ"}
              size="small"
              color={getStatusColor(row.nb_status)}
              sx={{ width: "fit-content", fontWeight: 600, height: 22 }}
            />
          )}
          <Typography
            variant="caption"
            color="text.secondary"
            title={getNotebookNotePreview(row)}
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.4,
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
      minWidth: 180,
      flex: 0.75,
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
        getRowClassName={(params) =>
          isUntouchedQueueClaim(params.row) ? "notebook-row--fresh-queue" : ""
        }
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
          "& .MuiDataGrid-row.notebook-row--fresh-queue": {
            bgcolor: "rgba(239, 68, 68, 0.12)",
            borderLeft: "4px solid",
            borderLeftColor: "error.main",
            "&:hover": {
              bgcolor: "rgba(239, 68, 68, 0.18)",
            },
            "& .MuiDataGrid-cell": {
              borderBottomColor: "rgba(239, 68, 68, 0.2)",
            },
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
