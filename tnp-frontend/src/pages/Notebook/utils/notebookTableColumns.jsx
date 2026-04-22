import { Box, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { MdDelete, MdEdit, MdPersonAdd, MdVisibility } from "react-icons/md";

import {
  formatDate,
  getNotebookFollowupChip,
  getStatusColor,
  isUntouchedQueueClaim,
} from "./notebookCommon";

const textClampSx = (lines = 2) => ({
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  whiteSpace: "normal",
  lineHeight: 1.4,
});

const disabledReasonForConvert = (row) =>
  row.nb_converted_at ? "แปลงเป็นลูกค้าแล้ว" : "สร้างลูกค้า";

const disabledReasonForEdit = (row) => (row.nb_converted_at ? "แปลงเป็นลูกค้าแล้ว" : "แก้ไข");

const disabledReasonForDelete = (row, userRole) => {
  if (row.nb_converted_at) {
    return "แปลงเป็นลูกค้าแล้วจึงลบไม่ได้";
  }

  if (userRole !== "admin") {
    return "เฉพาะ Admin";
  }

  return "ลบ";
};

const renderStatusChip = (value) =>
  value ? (
    <Chip
      label={value}
      color={getStatusColor(value)}
      size="small"
      sx={{ fontWeight: 500, maxWidth: "100%" }}
    />
  ) : (
    <Typography variant="body2" color="text.disabled">
      -
    </Typography>
  );

const renderActionChip = (value) =>
  value ? (
    <Chip
      label={value}
      size="small"
      color="primary"
      variant="outlined"
      sx={{ fontWeight: 500, maxWidth: "100%" }}
    />
  ) : (
    <Typography variant="body2" color="text.disabled">
      -
    </Typography>
  );

export const buildNotebookTableColumns = ({
  onView,
  onEdit,
  onDelete,
  onConvert,
  userRole,
  isCompact = false,
}) => {
  const dateColumn = {
    field: "nb_date",
    headerName: "วันที่ติดตาม",
    flex: isCompact ? 1 : 1.05,
    minWidth: isCompact ? 132 : 150,
    renderCell: ({ row }) => {
      const followupInfo = getNotebookFollowupChip(row);
      const followupNote = row?.nb_next_followup_note?.trim();
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 0.25,
            minWidth: 0,
            py: 0.5,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
            {formatDate(row.nb_date || row.created_at) || "-"}
          </Typography>
          <Typography variant="caption" sx={{ lineHeight: 1.35, color: "text.secondary" }}>
            อัปเดต {formatDate(row.updated_at, "dd/MM/yyyy HH:mm") || "-"}
          </Typography>
          {followupInfo ? (
            <Typography
              variant="caption"
              sx={{
                color: followupInfo.textColor,
                fontWeight: followupInfo.severity === "scheduled" ? 400 : 600,
                lineHeight: 1.35,
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
        </Box>
      );
    },
  };

  const customerColumn = {
    field: "nb_customer_name",
    headerName: "ลูกค้า",
    flex: isCompact ? 1.5 : 1.8,
    minWidth: isCompact ? 220 : 260,
    sortable: false,
    renderCell: ({ value, row }) => (
      <Stack spacing={0.75} sx={{ minWidth: 0, width: "100%", py: 0.75 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" useFlexGap flexWrap="wrap">
          <Typography variant="body2" sx={{ fontWeight: 600, ...textClampSx(2) }}>
            {value || "-"}
          </Typography>
          {isUntouchedQueueClaim(row) ? (
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
          {row.nb_is_online ? (
            <Chip
              label="Online"
              color="info"
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: "0.72rem" }}
            />
          ) : null}
        </Stack>

        {!isCompact && row.nb_additional_info ? (
          <Typography
            variant="caption"
            color="text.secondary"
            title={row.nb_additional_info}
            sx={textClampSx(2)}
          >
            {row.nb_additional_info}
          </Typography>
        ) : null}
      </Stack>
    ),
  };

  const contactColumn = {
    field: "contact_summary",
    headerName: "ติดต่อ",
    flex: isCompact ? 1.2 : 1.35,
    minWidth: isCompact ? 180 : 210,
    sortable: false,
    renderCell: ({ row }) => {
      const secondaryParts = [row.nb_contact_person, row.nb_email].filter(Boolean);

      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minWidth: 0,
            py: 0.5,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, ...textClampSx(1) }}>
            {row.nb_contact_number || "-"}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            title={secondaryParts.join(" | ")}
            sx={textClampSx(isCompact ? 1 : 2)}
          >
            {secondaryParts.length ? secondaryParts.join(" | ") : "-"}
          </Typography>
        </Box>
      );
    },
  };

  const detailsColumn = {
    field: "nb_additional_info",
    headerName: "รายละเอียด",
    flex: 1.2,
    minWidth: 180,
    sortable: false,
    renderCell: ({ value }) => (
      <Typography variant="body2" title={value || "-"} sx={textClampSx(2)}>
        {value || "-"}
      </Typography>
    ),
  };

  const workflowColumn = isCompact
    ? {
        field: "workflow",
        headerName: "สถานะ / ขั้นตอน",
        flex: 1.15,
        minWidth: 170,
        sortable: false,
        renderCell: ({ row }) => (
          <Stack spacing={0.75} sx={{ minWidth: 0, width: "100%", py: 0.75 }}>
            {renderStatusChip(row.nb_status)}
            {renderActionChip(row.nb_action)}
          </Stack>
        ),
      }
    : null;

  const nextActionColumn = {
    field: "nb_action",
    headerName: "ขั้นตอนถัดไป",
    flex: 1,
    minWidth: 150,
    sortable: false,
    renderCell: ({ value }) => renderActionChip(value),
  };

  const statusColumn = {
    field: "nb_status",
    headerName: "สถานะ",
    flex: 0.95,
    minWidth: 132,
    sortable: false,
    renderCell: ({ value }) => renderStatusChip(value),
  };

  const remarksColumn = {
    field: "nb_remarks",
    headerName: "หมายเหตุ",
    flex: 1.2,
    minWidth: 180,
    sortable: false,
    renderCell: ({ value }) => (
      <Typography variant="body2" title={value || "-"} sx={textClampSx(2)}>
        {value || "-"}
      </Typography>
    ),
  };

  const actionsColumn = {
    field: "actions",
    headerName: "จัดการ",
    flex: isCompact ? 1.05 : 1.15,
    minWidth: isCompact ? 168 : 210,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => (
      <Stack direction="row" spacing={0.25} alignItems="center" sx={{ py: 0.5 }}>
        <Tooltip title="ดูรายละเอียด">
          <span>
            <IconButton
              color="info"
              size={isCompact ? "small" : "medium"}
              onClick={() => onView(row)}
              aria-label="ดู Notebook"
            >
              <MdVisibility />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={disabledReasonForConvert(row)}>
          <span>
            <IconButton
              color="success"
              size={isCompact ? "small" : "medium"}
              onClick={() => onConvert(row)}
              disabled={Boolean(row.nb_converted_at)}
              aria-label="สร้างลูกค้า"
            >
              <MdPersonAdd />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={disabledReasonForEdit(row)}>
          <span>
            <IconButton
              color="primary"
              size={isCompact ? "small" : "medium"}
              onClick={() => onEdit(row)}
              disabled={Boolean(row.nb_converted_at)}
              aria-label="แก้ไข Notebook"
            >
              <MdEdit />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={disabledReasonForDelete(row, userRole)}>
          <span>
            <IconButton
              color="error"
              size={isCompact ? "small" : "medium"}
              onClick={() => onDelete(row.id)}
              disabled={Boolean(row.nb_converted_at) || userRole !== "admin"}
              aria-label="ลบ Notebook"
            >
              <MdDelete />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    ),
  };

  return [
    dateColumn,
    customerColumn,
    contactColumn,
    ...(isCompact
      ? [workflowColumn]
      : [detailsColumn, nextActionColumn, statusColumn, remarksColumn]),
    actionsColumn,
  ].filter(Boolean);
};
