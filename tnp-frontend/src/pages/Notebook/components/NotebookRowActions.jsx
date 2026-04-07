import { Button, Menu, MenuItem, Stack, Tooltip } from "@mui/material";
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

const ActionButton = ({ tooltip, children }) => (
  <Tooltip title={tooltip}>
    <span>{children}</span>
  </Tooltip>
);

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
  const buttonSize = isCardVariant ? "medium" : "small";
  const isCustomerCare = row.nb_entry_type === "customer_care";
  const isQueueRow = isNotebookQueueAssignableRow(row, scopeFilter);
  const showAssignAction = isQueueRow && canReserveQueue && queueActionMode === "assign";
  const showReserveAction = isQueueRow && canReserveQueue && queueActionMode !== "assign";
  const canDelete = userRole === "admin" && !row.nb_converted_at && !isQueueRow;
  const canConvert = !isCustomerCare && !row.nb_converted_at && !isQueueRow;
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

  return (
    <Stack
      direction="row"
      spacing={1}
      flexWrap="wrap"
      useFlexGap
      onClick={(event) => event.stopPropagation()}
      sx={{ py: 0.5 }}
    >
      <ActionButton tooltip="ดูรายละเอียด">
        <Button
          variant={isCardVariant ? "contained" : "outlined"}
          color="info"
          size={buttonSize}
          startIcon={<MdVisibility />}
          onClick={handleAction(onView, row)}
          sx={{ borderRadius: 999, textTransform: "none" }}
        >
          ดู
        </Button>
      </ActionButton>

      {showAssignAction ? (
        <ActionButton tooltip="มอบหมายลูกค้ารายนี้ให้เซลส์ทีม Offline">
          <Button
            variant="contained"
            color="secondary"
            size={buttonSize}
            startIcon={<MdAssignmentInd />}
            onClick={handleAction(onAssign, row)}
            sx={{ borderRadius: 999, textTransform: "none" }}
          >
            มอบหมาย
          </Button>
        </ActionButton>
      ) : showReserveAction ? (
        <ActionButton tooltip="รับลูกค้ารายนี้เข้าดูแล">
          <Button
            variant="contained"
            color="warning"
            size={buttonSize}
            startIcon={<MdAssignmentInd />}
            onClick={handleAction(onReserve, row)}
            sx={{ borderRadius: 999, textTransform: "none" }}
          >
            รับดูแล
          </Button>
        </ActionButton>
      ) : (
        <ActionButton tooltip={canEdit ? "แก้ไขรายการ" : "รายการนี้แก้ไขไม่ได้"}>
          <Button
            variant="outlined"
            color="primary"
            size={buttonSize}
            startIcon={<MdEdit />}
            onClick={handleAction(onEdit, row)}
            disabled={!canEdit}
            sx={{ borderRadius: 999, textTransform: "none" }}
          >
            แก้ไข
          </Button>
        </ActionButton>
      )}

      <ActionButton tooltip={callHref ? `โทร ${row.nb_contact_number}` : "ไม่มีเบอร์โทร"}>
        <Button
          component={callHref ? "a" : "button"}
          href={callHref || undefined}
          variant="outlined"
          color="success"
          size={buttonSize}
          startIcon={<MdCall />}
          disabled={!callHref}
          onClick={(event) => event.stopPropagation()}
          sx={{ borderRadius: 999, textTransform: "none" }}
        >
          โทร
        </Button>
      </ActionButton>

      {isQueueRow ? null : isCardVariant ? (
        <>
          {!isCustomerCare ? (
            <ActionButton tooltip={canConvert ? "แปลงเป็นลูกค้า" : "แปลงไม่ได้"}>
              <Button
                variant="outlined"
                color="secondary"
                size={buttonSize}
                startIcon={<MdPersonAdd />}
                onClick={handleAction(onConvert, row)}
                disabled={!canConvert}
                sx={{ borderRadius: 999, textTransform: "none" }}
              >
                แปลง
              </Button>
            </ActionButton>
          ) : null}

          <ActionButton tooltip={canDelete ? "ลบรายการ" : "ลบไม่ได้"}>
            <Button
              variant="outlined"
              color="error"
              size={buttonSize}
              startIcon={<MdDelete />}
              onClick={handleAction(onDelete, row.id)}
              disabled={!canDelete}
              sx={{ borderRadius: 999, textTransform: "none" }}
            >
              ลบ
            </Button>
          </ActionButton>
        </>
      ) : (
        <>
          <Button
            variant="text"
            color="inherit"
            size="small"
            startIcon={<MdMoreHoriz />}
            onClick={handleOpenMenu}
            sx={{ borderRadius: 999, textTransform: "none" }}
          >
            เพิ่มเติม
          </Button>

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
      )}
    </Stack>
  );
};

export default NotebookRowActions;
