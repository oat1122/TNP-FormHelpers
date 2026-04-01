import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Stack,
  TablePagination,
  Typography,
} from "@mui/material";

import NotebookRowActions from "./NotebookRowActions";
import {
  formatDate,
  getNotebookActionHighlightSx,
  getNotebookContactLines,
  getNotebookNotePreview,
  getStatusColor,
} from "../utils/notebookCommon";
import { getNotebookActionLabel } from "../utils/notebookDialogConfig";

const NotebookCardList = ({ rows, total, pagination, actions, userRole }) => (
  <Stack spacing={1.5} sx={{ px: { xs: 1.25, md: 1.5 }, py: 1.5 }}>
    {rows.map((row) => {
      const contactLines = getNotebookContactLines(row);
      const notePreview = getNotebookNotePreview(row);

      return (
        <Card
          key={row.id}
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "rgba(15, 23, 42, 0.08)",
            boxShadow: "0 14px 28px rgba(15, 23, 42, 0.06)",
            overflow: "hidden",
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
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.3 }}>
                      ติดตาม {formatDate(row.nb_date || row.created_at) || "-"}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                      {row.nb_customer_name || "-"}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {row.nb_is_online ? (
                      <Chip label="Online" size="small" color="info" variant="outlined" />
                    ) : null}
                    <Chip
                      label={row.nb_status || "ยังไม่ระบุสถานะ"}
                      size="small"
                      color={getStatusColor(row.nb_status)}
                    />
                  </Stack>
                </Stack>

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
              onConvert={actions.onConvert}
              variant="card"
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
  </Stack>
);

export default NotebookCardList;
