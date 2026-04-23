import { AssignmentInd as AssignmentIndIcon } from "@mui/icons-material";
import {
  Badge,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  Fab,
  IconButton,
  Stack,
  TablePagination,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdStar, MdStarBorder } from "react-icons/md";

import NotebookRowActions from "./NotebookRowActions";
import {
  formatDate,
  getNotebookActionHighlightSx,
  getNotebookContactLines,
  getNotebookFollowupChip,
  getNotebookNotePreview,
  getStatusColor,
  isNotebookQueueAssignableRow,
  isUntouchedQueueClaim,
} from "../utils/notebookCommon";
import { getNotebookActionLabel, getNotebookEntryTypeLabel } from "../utils/notebookDialogConfig";

const NotebookCardList = ({
  rows,
  total,
  pagination,
  actions,
  userRole,
  scopeFilter,
  canReserveQueue,
  queueActionMode,
  selectionState,
}) => (
  <Stack spacing={1.5} sx={{ px: { xs: 1.25, md: 1.5 }, py: 1.5 }}>
    {rows.map((row) => {
      const contactLines = getNotebookContactLines(row);
      const notePreview = getNotebookNotePreview(row);
      const followupChip = getNotebookFollowupChip(row);
      const isFreshQueueClaim = isUntouchedQueueClaim(row);
      const isSelectionEnabled = Boolean(selectionState?.enabled);
      const isSelectable = isNotebookQueueAssignableRow(row, scopeFilter);
      const isSelected = selectionState?.selectedIds?.includes(row.id);

      return (
        <Card
          key={row.id}
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: isFreshQueueClaim ? "error.light" : "rgba(15, 23, 42, 0.08)",
            borderLeft: isFreshQueueClaim ? "4px solid" : "1px solid",
            borderLeftColor: isFreshQueueClaim ? "error.main" : "rgba(15, 23, 42, 0.08)",
            boxShadow: "0 14px 28px rgba(15, 23, 42, 0.06)",
            overflow: "hidden",
            bgcolor: isFreshQueueClaim ? "rgba(239, 68, 68, 0.12)" : "background.paper",
          }}
        >
          <CardActionArea onClick={() => actions.onView(row)}>
            <CardContent sx={{ p: { xs: 2, md: 2.25 } }}>
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="flex-start"
                    sx={{ minWidth: 0, flex: 1 }}
                  >
                    {isSelectionEnabled ? (
                      <Checkbox
                        checked={Boolean(isSelected)}
                        disabled={!isSelectable}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) =>
                          selectionState?.onToggleSelectedRow?.(row.id, event.target.checked)
                        }
                        inputProps={{
                          "aria-label": `เลือก Notebook ${row.nb_customer_name || row.id}`,
                        }}
                        sx={{ mt: -0.5, ml: -1 }}
                      />
                    ) : null}

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ letterSpacing: 0.3 }}
                      >
                        ติดตาม {formatDate(row.nb_date || row.created_at) || "-"}
                      </Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {scopeFilter === "mine" &&
                        row.nb_entry_type !== "personal_activity" &&
                        actions?.onToggleFavorite ? (
                          <Tooltip
                            title={
                              row.nb_is_favorite ? "เอาออกจากรายการโปรด" : "เพิ่มเป็นรายการโปรด"
                            }
                          >
                            <IconButton
                              size="small"
                              onClick={(event) => {
                                event.stopPropagation();
                                actions.onToggleFavorite(row);
                              }}
                              sx={{
                                p: 0.25,
                                color: row.nb_is_favorite ? "warning.main" : "action.disabled",
                                "&:hover": { color: "warning.dark" },
                              }}
                            >
                              {row.nb_is_favorite ? (
                                <MdStar size={22} />
                              ) : (
                                <MdStarBorder size={22} />
                              )}
                            </IconButton>
                          </Tooltip>
                        ) : null}
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                          {row.nb_entry_type === "personal_activity"
                            ? row.nb_additional_info || row.nb_customer_name || "-"
                            : row.nb_customer_name || "-"}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {isFreshQueueClaim ? (
                      <Chip
                        label="🆕 ใหม่จากคิวกลาง"
                        size="small"
                        color="error"
                        sx={{ fontWeight: 700 }}
                      />
                    ) : null}
                    <Chip
                      label={getNotebookEntryTypeLabel(row.nb_entry_type)}
                      size="small"
                      color={
                        row.nb_entry_type === "customer_care"
                          ? "secondary"
                          : row.nb_entry_type === "personal_activity"
                            ? "warning"
                            : "default"
                      }
                      variant="outlined"
                    />
                    {row.nb_is_online ? (
                      <Chip label="Online" size="small" color="info" variant="outlined" />
                    ) : null}
                    <Chip
                      label={
                        row.nb_entry_type === "personal_activity"
                          ? "Personal activity"
                          : row.nb_status || "ยังไม่ได้ระบุสถานะ"
                      }
                      size="small"
                      color={
                        row.nb_entry_type === "personal_activity"
                          ? "warning"
                          : getStatusColor(row.nb_status)
                      }
                    />
                  </Stack>
                </Stack>

                {followupChip ? (
                  <Typography
                    variant="caption"
                    sx={{
                      color: followupChip.textColor,
                      fontWeight: followupChip.severity === "scheduled" ? 400 : 600,
                    }}
                  >
                    {followupChip.label}
                  </Typography>
                ) : null}

                {row.nb_next_followup_note?.trim() ? (
                  <Typography
                    variant="caption"
                    title={row.nb_next_followup_note.trim()}
                    sx={{
                      color: "text.secondary",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: 1.4,
                    }}
                  >
                    {row.nb_next_followup_note.trim()}
                  </Typography>
                ) : null}

                {row.nb_entry_type === "personal_activity" ? (
                  <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: "#fff8e1" }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                      Personal note
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {row.nb_additional_info || "-"}
                    </Typography>
                  </Box>
                ) : (
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
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#7c2d12" }}>
                      {getNotebookActionLabel(row.nb_action)}
                    </Typography>
                  </Box>
                )}

                <Stack spacing={0.5}>
                  {contactLines.map((line) => (
                    <Typography key={line} variant="body2" color="text.secondary">
                      {line}
                    </Typography>
                  ))}
                </Stack>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                    บันทึกล่าสุด
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.35,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {notePreview}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </CardActionArea>

          <Divider />

          <Box sx={{ px: { xs: 2, md: 2.25 }, py: 1.5 }}>
            <NotebookRowActions
              row={row}
              userRole={userRole}
              onView={actions.onView}
              onEdit={actions.onEdit}
              onDelete={actions.onDelete}
              onAssign={actions.onAssign}
              onReserve={actions.onReserve}
              onConvert={actions.onConvert}
              variant="card"
              scopeFilter={scopeFilter}
              canReserveQueue={canReserveQueue}
              queueActionMode={queueActionMode}
              canTransferMineToSales={actions.canTransferMineToSales}
            />
          </Box>
        </Card>
      );
    })}

    <Box
      sx={{
        borderTop: "1px solid rgba(15, 23, 42, 0.08)",
        pt: 0.5,
        "& .MuiTablePagination-toolbar, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
          {
            fontFamily: "Kanit, sans-serif",
          },
      }}
    >
      <TablePagination
        component="div"
        count={total || 0}
        page={pagination.model.page}
        onPageChange={(_, page) =>
          pagination.onChange({
            page,
            pageSize: pagination.model.pageSize,
          })
        }
        rowsPerPage={pagination.model.pageSize}
        onRowsPerPageChange={(event) =>
          pagination.onChange({
            page: 0,
            pageSize: Number(event.target.value),
          })
        }
        rowsPerPageOptions={[15, 30, 50]}
        labelRowsPerPage="รายการต่อหน้า:"
      />
    </Box>

    {selectionState?.enabled ? (
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
  </Stack>
);

export default NotebookCardList;
