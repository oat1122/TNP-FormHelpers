import { Alert, Box, Button, Chip, Collapse, Skeleton, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { MdExpandLess, MdExpandMore, MdHistory, MdSchedule } from "react-icons/md";

import {
  NOTEBOOK_HISTORY_FIELD_LABELS,
  formatNotebookHistoryValue,
} from "../utils/notebookDialogConfig";

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

const normalizeFields = (history) =>
  Object.entries(history?.new_values || {})
    .filter(([fieldName]) => NOTEBOOK_HISTORY_FIELD_LABELS[fieldName])
    .map(([fieldName, value]) => ({
      fieldName,
      label: NOTEBOOK_HISTORY_FIELD_LABELS[fieldName],
      oldValue: formatNotebookHistoryValue(
        fieldName,
        history?.display_old_values?.[fieldName] ?? history?.old_values?.[fieldName]
      ),
      value: formatNotebookHistoryValue(
        fieldName,
        history?.display_new_values?.[fieldName] ?? value
      ),
    }));

const hasValueChanged = (field) =>
  field.oldValue && field.oldValue !== "-" && field.oldValue !== field.value;

const renderFieldBlock = (item, field) => (
  <Box key={`${item.id}-${field.fieldName}-preview`}>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {field.label}
    </Typography>
    {hasValueChanged(field) ? (
      <Stack spacing={0.25} sx={{ mt: 0.25 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          Before: {field.oldValue}
        </Typography>
        <Typography
          variant="body2"
          color="text.primary"
          sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        >
          Now: {field.value}
        </Typography>
      </Stack>
    ) : (
      <Typography
        variant="body2"
        color="text.primary"
        sx={{ mt: 0.25, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {field.value}
      </Typography>
    )}
  </Box>
);

const HistoryCard = ({ item, index, highlight = false }) => {
  const fieldCount = item.fields.length;
  const [showMoreFields, setShowMoreFields] = useState(false);
  const previewFields = item.fields.slice(0, 2);
  const extraFields = item.fields.slice(2);

  return (
    <Box
      key={item.id || `${item.type}-${index}`}
      sx={{
        p: 1.5,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: highlight
          ? item.type === "draft"
            ? "warning.light"
            : "primary.light"
          : "divider",
        bgcolor:
          item.type === "draft" ? "warning.50" : highlight ? "primary.50" : "background.paper",
      }}
    >
      <Stack spacing={1}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              color={item.type === "draft" ? "warning" : "info"}
              label={item.type === "draft" ? "Draft update" : "Saved activity"}
            />
            <Typography variant="caption" color="text.secondary">
              {item.actor || "Unknown user"}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <MdSchedule size={14} />
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(item.createdAt)}
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
          {item.fields.map((field) => (
            <Chip
              key={`${item.id}-${field.fieldName}`}
              size="small"
              variant="outlined"
              label={field.label}
            />
          ))}
        </Stack>

        <Stack spacing={1}>{previewFields.map((field) => renderFieldBlock(item, field))}</Stack>

        {fieldCount > 2 && (
          <>
            <Button
              size="small"
              variant="text"
              onClick={() => setShowMoreFields((previous) => !previous)}
              endIcon={showMoreFields ? <MdExpandLess /> : <MdExpandMore />}
              sx={{ alignSelf: "flex-start", px: 0, textTransform: "none" }}
            >
              {showMoreFields
                ? "Hide extra field updates"
                : `Show ${fieldCount - 2} more field updates`}
            </Button>

            <Collapse in={showMoreFields}>
              <Stack spacing={1} sx={{ pt: 0.5 }}>
                {extraFields.map((field) => renderFieldBlock(item, field))}
              </Stack>
            </Collapse>
          </>
        )}
      </Stack>
    </Box>
  );
};

const NotebookHistoryTimeline = ({
  histories,
  isLoading,
  showAll,
  onToggle,
  pendingDrafts = [],
}) => {
  const historyItems = useMemo(
    () =>
      sortHistories(histories).map((history, index) => ({
        id: history.id || `history-${index}`,
        type: "saved",
        actor: history.action_by?.username || history.action_by?.user_nickname || null,
        createdAt: history.created_at,
        fields: normalizeFields(history),
      })),
    [histories]
  );

  const draftItems = useMemo(
    () =>
      [...pendingDrafts]
        .sort((left, right) => right.createdAt - left.createdAt)
        .map((draft, index) => ({
          id: `draft-${draft.fieldName}-${index}`,
          type: "draft",
          actor: draft.actor,
          createdAt: draft.createdAt,
          fields: [
            {
              fieldName: draft.fieldName,
              label: draft.label,
              value: draft.value,
            },
          ],
        })),
    [pendingDrafts]
  );

  const latestSavedItem = historyItems[0];
  const remainingHistoryItems = latestSavedItem ? historyItems.slice(1) : historyItems;
  const hasContent = Boolean(latestSavedItem || draftItems.length);

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
          <Skeleton variant="rounded" height={100} />
          <Skeleton variant="rounded" height={72} />
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, md: 2.25 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Keep the latest follow-up visible and expand the timeline only when needed.
            </Typography>
          </Box>

          <Button
            size="small"
            onClick={onToggle}
            startIcon={<MdHistory />}
            endIcon={showAll ? <MdExpandLess /> : <MdExpandMore />}
            disabled={!historyItems.length}
            sx={{ textTransform: "none" }}
          >
            {showAll ? "Hide full history" : "Show full history"}
          </Button>
        </Stack>

        {draftItems.length > 0 && (
          <Stack spacing={1}>
            {draftItems.map((draft, index) => (
              <HistoryCard
                key={draft.id || `draft-${index}`}
                item={draft}
                index={index}
                highlight
              />
            ))}
          </Stack>
        )}

        {latestSavedItem ? (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              Latest saved activity
            </Typography>
            <HistoryCard item={latestSavedItem} index={0} highlight />
          </Box>
        ) : null}

        {!hasContent && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No activity has been recorded for this note yet.
          </Alert>
        )}

        <Collapse in={showAll}>
          <Stack spacing={1.25} sx={{ pt: 1 }}>
            {remainingHistoryItems.map((item, index) => (
              <HistoryCard key={item.id || `history-${index}`} item={item} index={index} />
            ))}
          </Stack>
        </Collapse>
      </Stack>
    </Box>
  );
};

export default NotebookHistoryTimeline;
