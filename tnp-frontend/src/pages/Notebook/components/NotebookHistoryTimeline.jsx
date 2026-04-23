import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { MdExpandLess, MdExpandMore, MdHistory, MdSchedule } from "react-icons/md";

const TIMELINE_FIELDS = [
  { name: "nb_additional_info", label: "บันทึกการพูดคุย", color: "primary.main" },
  { name: "nb_remarks", label: "บันทึกภายใน", color: "secondary.main" },
];

const formatTimestamp = (value) => {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const sortHistories = (histories) =>
  [...(histories || [])].sort((left, right) => {
    const leftDate = left?.created_at ? new Date(left.created_at).getTime() : 0;
    const rightDate = right?.created_at ? new Date(right.created_at).getTime() : 0;
    return rightDate - leftDate;
  });

const extractNoteEntries = (history) => {
  const values = history?.new_values || {};
  return TIMELINE_FIELDS.filter(({ name }) => {
    const value = values[name];
    return value !== undefined && value !== null && String(value).trim() !== "";
  }).map(({ name, label, color }) => ({
    fieldName: name,
    label,
    color,
    value: String(values[name]).trim(),
  }));
};

const TimelineEntry = ({ item, highlight = false }) => (
  <Box
    sx={{
      position: "relative",
      pl: 3,
      pb: 0.5,
      "&:before": {
        content: '""',
        position: "absolute",
        left: 6,
        top: 8,
        width: 10,
        height: 10,
        borderRadius: "50%",
        bgcolor: highlight ? "primary.main" : "grey.400",
        boxShadow: highlight ? "0 0 0 3px rgba(25, 118, 210, 0.18)" : "none",
      },
      "&:after": {
        content: '""',
        position: "absolute",
        left: 10,
        top: 18,
        bottom: 0,
        width: 2,
        bgcolor: "divider",
      },
      "&:last-of-type:after": {
        display: "none",
      },
    }}
  >
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={0.5}
      alignItems={{ xs: "flex-start", sm: "center" }}
      sx={{ mb: 0.75 }}
    >
      <Stack direction="row" spacing={0.75} alignItems="center">
        <MdSchedule size={14} />
        <Typography variant="caption" color="text.secondary">
          {formatTimestamp(item.createdAt)}
        </Typography>
      </Stack>
      {item.actor ? (
        <>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: { xs: "none", sm: "inline" } }}
          >
            ·
          </Typography>
          <Typography variant="caption" color="text.secondary">
            โดย {item.actor}
          </Typography>
        </>
      ) : null}
      {highlight ? (
        <Chip
          label="ล่าสุด"
          size="small"
          color="primary"
          sx={{ height: 20, fontSize: "0.7rem", ml: { sm: 0.5 } }}
        />
      ) : null}
    </Stack>

    <Stack spacing={1}>
      {item.entries.map((entry) => (
        <Box
          key={`${item.id}-${entry.fieldName}`}
          sx={{
            p: 1.25,
            borderRadius: 2,
            bgcolor: highlight ? "primary.50" : "background.paper",
            border: "1px solid",
            borderColor: highlight ? "primary.light" : "divider",
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: entry.color, display: "block", mb: 0.25 }}
          >
            {entry.label}
          </Typography>
          <Typography
            variant="body2"
            sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.55 }}
          >
            {entry.value}
          </Typography>
        </Box>
      ))}
    </Stack>
  </Box>
);

const NotebookHistoryTimeline = ({
  histories,
  isLoading,
  showAll,
  onToggle,
  pendingDrafts = [],
}) => {
  const timelineItems = useMemo(
    () =>
      sortHistories(histories)
        .map((history, index) => {
          const entries = extractNoteEntries(history);
          if (entries.length === 0) {
            return null;
          }

          return {
            id: history.id || `history-${index}`,
            actor: history.action_by?.username || history.action_by?.user_nickname || null,
            createdAt: history.created_at,
            entries,
          };
        })
        .filter(Boolean),
    [histories]
  );

  const draftItems = useMemo(
    () =>
      [...pendingDrafts]
        .filter(
          (draft) =>
            TIMELINE_FIELDS.some((field) => field.name === draft.fieldName) &&
            draft.value &&
            String(draft.value).trim() !== ""
        )
        .sort((left, right) => right.createdAt - left.createdAt)
        .map((draft, index) => {
          const fieldMeta = TIMELINE_FIELDS.find((field) => field.name === draft.fieldName);
          return {
            id: `draft-${draft.fieldName}-${index}`,
            actor: draft.actor,
            createdAt: draft.createdAt,
            isDraft: true,
            entries: [
              {
                fieldName: draft.fieldName,
                label: fieldMeta?.label || draft.label,
                color: fieldMeta?.color || "warning.main",
                value: String(draft.value).trim(),
              },
            ],
          };
        }),
    [pendingDrafts]
  );

  const latestItem = timelineItems[0];
  const remainingItems = latestItem ? timelineItems.slice(1) : [];
  const hasContent = Boolean(latestItem || draftItems.length);

  if (isLoading) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Stack spacing={1.5}>
          <Skeleton variant="text" width={140} height={28} />
          <Skeleton variant="rounded" height={92} />
          <Skeleton variant="rounded" height={72} />
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: 0.4,
              display: "flex",
              alignItems: "center",
              gap: 0.75,
            }}
          >
            <MdHistory size={16} />
            ประวัติการบันทึก
          </Typography>

          {remainingItems.length > 0 ? (
            <Button
              size="small"
              onClick={onToggle}
              startIcon={<MdHistory />}
              endIcon={showAll ? <MdExpandLess /> : <MdExpandMore />}
              sx={{ textTransform: "none" }}
            >
              {showAll ? "ซ่อนประวัติทั้งหมด" : `แสดงประวัติย้อนหลัง (${remainingItems.length})`}
            </Button>
          ) : null}
        </Stack>

        {!hasContent && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            ยังไม่มีบันทึกสำหรับรายการนี้
          </Alert>
        )}

        {draftItems.length > 0 && (
          <Stack spacing={0.5}>
            {draftItems.map((draft) => (
              <Box
                key={draft.id}
                sx={{
                  position: "relative",
                  pl: 3,
                  "&:before": {
                    content: '""',
                    position: "absolute",
                    left: 6,
                    top: 8,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: "warning.main",
                  },
                }}
              >
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
                  <Chip
                    label="ยังไม่บันทึก"
                    size="small"
                    color="warning"
                    sx={{ height: 20, fontSize: "0.7rem" }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {draft.actor || "คุณ"}
                  </Typography>
                </Stack>
                {draft.entries.map((entry) => (
                  <Box
                    key={`${draft.id}-${entry.fieldName}`}
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      bgcolor: "warning.50",
                      border: "1px solid",
                      borderColor: "warning.light",
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, color: entry.color, display: "block", mb: 0.25 }}
                    >
                      {entry.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.55 }}
                    >
                      {entry.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ))}
            {latestItem ? <Divider sx={{ my: 0.5 }} /> : null}
          </Stack>
        )}

        {latestItem ? <TimelineEntry item={latestItem} highlight /> : null}

        <Collapse in={showAll}>
          <Stack spacing={0.5} sx={{ pt: 0.5 }}>
            {remainingItems.map((item) => (
              <TimelineEntry key={item.id} item={item} />
            ))}
          </Stack>
        </Collapse>
      </Stack>
    </Box>
  );
};

export default NotebookHistoryTimeline;
