import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import { buildNotebookTableColumns } from "../utils/notebookTableColumns.jsx";

const THAI_LOCALE_TEXT = {
  noRowsLabel: "ไม่พบข้อมูล",
  MuiTablePagination: {
    labelRowsPerPage: "รายการต่อหน้า:",
    labelDisplayedRows: ({ from, to, count }) =>
      `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`,
  },
};

const NotebookTableSkeleton = ({ isCompact }) => (
  <Box sx={{ p: { xs: 2, md: 2.5 } }}>
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1.5}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", md: "center" }}
      sx={{ mb: 2 }}
    >
      <Stack spacing={1} sx={{ width: "100%", maxWidth: 360 }}>
        <Skeleton variant="text" width="45%" height={34} />
        <Skeleton variant="text" width="85%" height={24} />
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Skeleton variant="rounded" width={isCompact ? 110 : 140} height={32} />
        <Skeleton variant="rounded" width={isCompact ? 140 : 180} height={32} />
      </Stack>
    </Stack>

    <Divider sx={{ mb: 2 }} />

    <Stack spacing={1.25}>
      {Array.from({ length: isCompact ? 5 : 7 }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={isCompact ? 72 : 64} />
      ))}
    </Stack>
  </Box>
);

const NotebookTableEmptyState = ({ filterSummary }) => (
  <Stack
    sx={{ height: "100%", alignItems: "center", justifyContent: "center", px: 3, py: 4 }}
    spacing={1.25}
  >
    <Typography variant="h6" color="text.secondary" sx={{ textAlign: "center" }}>
      ไม่พบรายการ Notebook ในช่วงที่เลือก
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", maxWidth: 480 }}>
      ลองปรับคำค้นหา ช่วงเวลา หรือประเภทวันที่ แล้วตรวจสอบอีกครั้ง
    </Typography>

    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="center">
      {[filterSummary?.keywordLabel, filterSummary?.typeLabel, filterSummary?.dateLabel]
        .filter(Boolean)
        .map((label) => (
          <Chip
            key={label}
            label={label}
            size="small"
            variant="outlined"
            sx={{
              maxWidth: "100%",
              "& .MuiChip-label": {
                display: "block",
              },
            }}
          />
        ))}
    </Stack>
  </Stack>
);

const NotebookTableErrorState = ({ onRetry }) => (
  <Box sx={{ p: 3 }}>
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          ลองใหม่
        </Button>
      }
    >
      ไม่สามารถโหลดข้อมูล Notebook ได้
    </Alert>
  </Box>
);

const NotebookTableContextBar = ({ rowsCount, total }) => (
  <Stack
    direction={{ xs: "column", md: "row" }}
    spacing={2}
    justifyContent="space-between"
    alignItems={{ xs: "flex-start", md: "center" }}
    sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}
  >
    <Stack spacing={0.75}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary" }}>
        แสดง {rowsCount} รายการ
        {typeof total === "number" ? ` จากทั้งหมด ${total} รายการ` : ""}
      </Typography>
    </Stack>
  </Stack>
);

const NotebookTable = ({
  rows,
  total,
  loadingState,
  error,
  pagination,
  actions,
  userRole,
  filterSummary,
  onRetry,
}) => {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));

  const columns = buildNotebookTableColumns({
    onView: actions.onView,
    onEdit: actions.onEdit,
    onDelete: actions.onDelete,
    onConvert: actions.onConvert,
    userRole,
    isCompact,
  });

  const isInitialLoading = loadingState.isLoading && rows.length === 0;
  const isRefreshing = loadingState.isFetching && rows.length > 0;
  const hasStaleRows = Boolean(error) && rows.length > 0;
  const tableHeight = isCompact ? 540 : 640;

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "white",
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
      }}
    >
      {isRefreshing ? <LinearProgress /> : null}

      {error && rows.length === 0 ? (
        <NotebookTableErrorState onRetry={onRetry} />
      ) : isInitialLoading ? (
        <NotebookTableSkeleton isCompact={isCompact} />
      ) : (
        <Box>
          <NotebookTableContextBar rowsCount={rows.length} total={total} />

          <Divider />

          {hasStaleRows ? (
            <Box sx={{ px: { xs: 2, md: 2.5 }, pt: 2 }}>
              <Alert
                severity="warning"
                action={
                  <Button color="inherit" size="small" onClick={onRetry}>
                    ลองใหม่
                  </Button>
                }
              >
                ไม่สามารถอัปเดตข้อมูลล่าสุดได้ ตอนนี้กำลังแสดงข้อมูลชุดล่าสุดที่ยังมีอยู่
              </Alert>
            </Box>
          ) : null}

          <Box sx={{ height: tableHeight, width: "100%", p: { xs: 1, md: 1.5 } }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={false}
              rowCount={total || 0}
              paginationMode="server"
              paginationModel={pagination.model}
              onPaginationModelChange={pagination.onChange}
              pageSizeOptions={[15, 30, 50]}
              disableRowSelectionOnClick
              hideFooterSelectedRowCount
              localeText={THAI_LOCALE_TEXT}
              slots={{
                noRowsOverlay: () => <NotebookTableEmptyState filterSummary={filterSummary} />,
              }}
              getRowHeight={() => "auto"}
              getEstimatedRowHeight={() => (isCompact ? 92 : 76)}
              getRowClassName={(params) =>
                params.indexRelativeToCurrentPage % 2 === 0
                  ? "notebook-row-even"
                  : "notebook-row-odd"
              }
              sx={{
                border: "none",
                "& .MuiDataGrid-main": {
                  borderRadius: 2,
                },
                "& .MuiDataGrid-columnHeader": {
                  py: 1.25,
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: "1px solid",
                  borderColor: "rgba(15, 23, 42, 0.08)",
                  alignItems: "center",
                  py: 1.25,
                  px: 1.5,
                },
                "& .MuiDataGrid-columnHeaders": {
                  bgcolor: "#f7f8fa",
                  borderBottom: "1px solid",
                  borderColor: "rgba(15, 23, 42, 0.08)",
                  color: "text.secondary",
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
                "& .notebook-row-even": {
                  bgcolor: "#ffffff",
                },
                "& .notebook-row-odd": {
                  bgcolor: "#fbfbfc",
                },
                "& .MuiDataGrid-row:hover": {
                  bgcolor: "#fff8f8",
                },
                "& .MuiDataGrid-overlay": {
                  bgcolor: "#fff",
                },
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default NotebookTable;
