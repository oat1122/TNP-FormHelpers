import { Button, IconButton, Menu, MenuItem, Stack, Tooltip } from "@mui/material";
import { useMemo, useState } from "react";
import {
  MdAssignmentInd,
  MdCall,
  MdDelete,
  MdEdit,
  MdMoreHoriz,
  MdPersonAdd,
  MdVisibility,
} from "react-icons/md";

import { isNotebookQueueAssignableRow } from "../utils/notebookCommon";

const getTelHref = (phoneNumber) => `tel:${String(phoneNumber || "").replace(/[^\d+]/g, "")}`;

const NotebookRowActions = ({
  row,
  userRole,
  onView,
  onEdit,
  onDelete,
  onAssign,
  onReserve,
  onConvert,
  variant = "table",
  scopeFilter = "all",
  canReserveQueue = false,
  queueActionMode = null,
}) => {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const callHref = useMemo(
    () => (row.nb_contact_number?.trim() ? getTelHref(row.nb_contact_number) : null),
    [row.nb_contact_number]
  );
  const isCardVariant = variant === "card";
  const isCustomerCare = row.nb_entry_type === "customer_care";
  const isPersonalActivity = row.nb_entry_type === "personal_activity";
  const isQueueRow = isNotebookQueueAssignableRow(row, scopeFilter);
  const showAssignAction = isQueueRow && canReserveQueue && queueActionMode === "assign";
  const showReserveAction = isQueueRow && canReserveQueue && queueActionMode === "reserve";
  const canDelete = userRole === "admin" && !row.nb_converted_at && !isQueueRow;
  const canConvert = !isCustomerCare && !isPersonalActivity && !row.nb_converted_at && !isQueueRow;
  const canEdit = !row.nb_converted_at && !isQueueRow;

  const handleOpenMenu = (event) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleAction = (callback, payload) => (event) => {
    event.stopPropagation();
    callback?.(payload);
    handleCloseMenu();
  };

  if (isCardVariant) {
    return (
      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        onClick={(event) => event.stopPropagation()}
        sx={{ py: 0.5 }}
      >
        <Tooltip title="ดูรายละเอียด">
          <span>
            <Button
              variant="contained"
              color="info"
              size="medium"
              startIcon={<MdVisibility />}
              onClick={handleAction(onView, row)}
              sx={{ borderRadius: 999, textTransform: "none" }}
            >
              ดู
            </Button>
          </span>
        </Tooltip>

        {showAssignAction ? (
          <Tooltip title="มอบหมายลูกค้ารายนี้ให้เซลส์ทีม Offline">
            <span>
              <Button
                variant="contained"
                color="secondary"
                size="medium"
                startIcon={<MdAssignmentInd />}
                onClick={handleAction(onAssign, row)}
                sx={{ borderRadius: 999, textTransform: "none" }}
              >
                มอบหมาย
              </Button>
            </span>
          </Tooltip>
        ) : showReserveAction ? (
          <Tooltip title="รับลูกค้ารายนี้เข้าดูแล">
            <span>
              <Button
                variant="contained"
                color="warning"
                size="medium"
                startIcon={<MdAssignmentInd />}
                onClick={handleAction(onReserve, row)}
                sx={{ borderRadius: 999, textTransform: "none" }}
              >
                รับดูแล
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Tooltip title={canEdit ? "แก้ไขรายการ" : "รายการนี้แก้ไขไม่ได้"}>
            <span>
              <Button
                variant="outlined"
                color="primary"
                size="medium"
                startIcon={<MdEdit />}
                onClick={handleAction(onEdit, row)}
                disabled={!canEdit}
                sx={{ borderRadius: 999, textTransform: "none" }}
              >
                แก้ไข
              </Button>
            </span>
          </Tooltip>
        )}

        <Tooltip title={callHref ? `โทร ${row.nb_contact_number}` : "ไม่มีเบอร์โทร"}>
          <span>
            <Button
              component={callHref ? "a" : "button"}
              href={callHref || undefined}
              variant="outlined"
              color="success"
              size="medium"
              startIcon={<MdCall />}
              disabled={!callHref}
              onClick={(event) => event.stopPropagation()}
              sx={{ borderRadius: 999, textTransform: "none" }}
            >
              โทร
            </Button>
          </span>
        </Tooltip>

        {isQueueRow ? null : (
          <>
            {!isCustomerCare ? (
              <Tooltip title={canConvert ? "แปลงเป็นลูกค้า" : "แปลงไม่ได้"}>
                <span>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="medium"
                    startIcon={<MdPersonAdd />}
                    onClick={handleAction(onConvert, row)}
                    disabled={!canConvert}
                    sx={{ borderRadius: 999, textTransform: "none" }}
                  >
                    แปลง
                  </Button>
                </span>
              </Tooltip>
            ) : null}

            <Tooltip title={canDelete ? "ลบรายการ" : "ลบไม่ได้"}>
              <span>
                <Button
                  variant="outlined"
                  color="error"
                  size="medium"
                  startIcon={<MdDelete />}
                  onClick={handleAction(onDelete, row.id)}
                  disabled={!canDelete}
                  sx={{ borderRadius: 999, textTransform: "none" }}
                >
                  ลบ
                </Button>
              </span>
            </Tooltip>
          </>
        )}
      </Stack>
    );
  }

  const iconBtnSx = {
    width: 32,
    height: 32,
    borderRadius: 1.5,
    border: "1px solid",
    borderColor: "divider",
    bgcolor: "background.paper",
    "&:hover": { bgcolor: "action.hover" },
  };

  return (
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="center"
      onClick={(event) => event.stopPropagation()}
      sx={{ py: 0.5 }}
    >
      <Tooltip title="ดูรายละเอียด">
        <IconButton size="small" color="info" onClick={handleAction(onView, row)} sx={iconBtnSx}>
          <MdVisibility size={16} />
        </IconButton>
      </Tooltip>

      {showAssignAction ? (
        <Tooltip title="มอบหมายให้เซลส์ Offline">
          <IconButton
            size="small"
            color="secondary"
            onClick={handleAction(onAssign, row)}
            sx={{
              ...iconBtnSx,
              bgcolor: "secondary.main",
              color: "#fff",
              "&:hover": { bgcolor: "secondary.dark" },
            }}
          >
            <MdAssignmentInd size={16} />
          </IconButton>
        </Tooltip>
      ) : showReserveAction ? (
        <Tooltip title="รับดูแล">
          <IconButton
            size="small"
            color="warning"
            onClick={handleAction(onReserve, row)}
            sx={{
              ...iconBtnSx,
              bgcolor: "warning.main",
              color: "#fff",
              "&:hover": { bgcolor: "warning.dark" },
            }}
          >
            <MdAssignmentInd size={16} />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title={canEdit ? "แก้ไข" : "แก้ไขไม่ได้"}>
          <span>
            <IconButton
              size="small"
              color="primary"
              onClick={handleAction(onEdit, row)}
              disabled={!canEdit}
              sx={iconBtnSx}
            >
              <MdEdit size={16} />
            </IconButton>
          </span>
        </Tooltip>
      )}

      <Tooltip title={callHref ? `โทร ${row.nb_contact_number}` : "ไม่มีเบอร์โทร"}>
        <span>
          <IconButton
            size="small"
            color="success"
            component={callHref ? "a" : "button"}
            href={callHref || undefined}
            disabled={!callHref}
            onClick={(event) => event.stopPropagation()}
            sx={iconBtnSx}
          >
            <MdCall size={16} />
          </IconButton>
        </span>
      </Tooltip>

      {!isQueueRow ? (
        <>
          <Tooltip title="เพิ่มเติม">
            <IconButton size="small" onClick={handleOpenMenu} sx={iconBtnSx}>
              <MdMoreHoriz size={16} />
            </IconButton>
          </Tooltip>

          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleCloseMenu}>
            {!isCustomerCare ? (
              <MenuItem onClick={handleAction(onConvert, row)} disabled={!canConvert}>
                <MdPersonAdd style={{ marginRight: 8 }} />
                แปลงเป็นลูกค้า
              </MenuItem>
            ) : null}
            <MenuItem onClick={handleAction(onDelete, row.id)} disabled={!canDelete}>
              <MdDelete style={{ marginRight: 8 }} />
              ลบรายการ
            </MenuItem>
          </Menu>
        </>
      ) : null}
    </Stack>
  );
};

export default NotebookRowActions;
