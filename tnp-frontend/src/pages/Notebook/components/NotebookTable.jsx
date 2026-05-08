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

import NotebookActionTable from "./NotebookActionTable";
import NotebookCardList from "./NotebookCardList";

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
      {Array.from({ length: isCompact ? 4 : 6 }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={isCompact ? 176 : 104} />
      ))}
    </Stack>
  </Box>
);

const SCOPE_EMPTY_COPY = {
  queue: {
    title: "คิวกลางว่าง",
    body: "ยังไม่มี lead รอจัดสรรในคิวกลาง เมื่อ supportsales สร้าง lead ใหม่จะปรากฏที่นี่",
  },
  mine: {
    title: "ยังไม่มีลูกค้าในการดูแล",
    body: "คุณยังไม่มี lead ที่ถูก assign — กดปุ่ม 'จดบันทึก' หรือ 'เพิ่มลูกค้าเข้าตัวเอง' ที่ด้านบนเพื่อสร้าง",
  },
  all: {
    title: "ยังไม่มีรายการในระบบ",
    body: "ยังไม่มี Notebook ในระบบ ลองสร้างรายการแรกได้เลย",
  },
};

const NotebookTableEmptyState = ({ filterSummary, scopeFilter }) => {
  if (filterSummary?.hasCustomFilters) {
    return (
      <Stack
        sx={{ height: "100%", alignItems: "center", justifyContent: "center", px: 3, py: 4 }}
        spacing={1.25}
      >
        <Typography variant="h6" color="text.secondary" sx={{ textAlign: "center" }}>
          ไม่พบรายการ Notebook ในเงื่อนไขที่เลือก
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", maxWidth: 480 }}
        >
          ลองเปลี่ยนคำค้นหา สถานะ วันที่ หรือผู้ดูแล แล้วตรวจสอบอีกครั้ง
        </Typography>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="center">
          {filterSummary.chips.map((chip) => (
            <Chip key={chip.key} label={chip.label} size="small" variant="outlined" />
          ))}
        </Stack>
      </Stack>
    );
  }

  const copy = SCOPE_EMPTY_COPY[scopeFilter] || SCOPE_EMPTY_COPY.all;

  return (
    <Stack
      sx={{ height: "100%", alignItems: "center", justifyContent: "center", px: 3, py: 4 }}
      spacing={1.25}
    >
      <Typography variant="h6" color="text.secondary" sx={{ textAlign: "center" }}>
        {copy.title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: "center", maxWidth: 480 }}
      >
        {copy.body}
      </Typography>
    </Stack>
  );
};

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

const NotebookTableContextBar = ({ rowsCount, total, filterSummary, onClearFilters }) => (
  <Stack
    direction={{ xs: "column", md: "row" }}
    spacing={2}
    justifyContent="space-between"
    alignItems={{ xs: "flex-start", md: "center" }}
    sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}
  >
    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
      แสดง {rowsCount} รายการ
      {typeof total === "number" ? ` จากทั้งหมด ${total} รายการ` : ""}
    </Typography>

    {filterSummary.hasCustomFilters ? (
      <Button variant="text" onClick={onClearFilters} sx={{ textTransform: "none" }}>
        ล้างตัวกรอง
      </Button>
    ) : null}
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
  viewMode,
  scopeFilter,
  canReserveQueue,
  queueActionMode,
  selectionState,
  onClearFilters,
  onRetry,
}) => {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));
  const isInitialLoading = loadingState.isLoading && rows.length === 0;
  const isRefreshing = loadingState.isFetching && rows.length > 0;
  const hasStaleRows = Boolean(error) && rows.length > 0;
  const effectiveViewMode = isCompact ? "card" : viewMode;

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
          <NotebookTableContextBar
            rowsCount={rows.length}
            total={total}
            filterSummary={filterSummary}
            onClearFilters={onClearFilters}
          />

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
                อัปเดตข้อมูลล่าสุดไม่สำเร็จ ตอนนี้กำลังแสดงข้อมูลชุดล่าสุดที่ยังใช้งานได้
              </Alert>
            </Box>
          ) : null}

          {effectiveViewMode === "card" ? (
            rows.length > 0 ? (
              <NotebookCardList
                rows={rows}
                total={total}
                pagination={pagination}
                actions={actions}
                userRole={userRole}
                scopeFilter={scopeFilter}
                canReserveQueue={canReserveQueue}
                queueActionMode={queueActionMode}
                selectionState={selectionState}
              />
            ) : (
              <NotebookTableEmptyState filterSummary={filterSummary} scopeFilter={scopeFilter} />
            )
          ) : (
            <NotebookActionTable
              rows={rows}
              total={total}
              pagination={pagination}
              actions={actions}
              userRole={userRole}
              scopeFilter={scopeFilter}
              canReserveQueue={canReserveQueue}
              queueActionMode={queueActionMode}
              selectionState={selectionState}
              onNoRowsOverlay={() => (
                <NotebookTableEmptyState filterSummary={filterSummary} scopeFilter={scopeFilter} />
              )}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default NotebookTable;
