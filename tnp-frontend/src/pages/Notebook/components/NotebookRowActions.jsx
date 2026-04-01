import { Button, Menu, MenuItem, Stack, Tooltip } from "@mui/material";
import { useMemo, useState } from "react";
import { MdCall, MdDelete, MdEdit, MdMoreHoriz, MdPersonAdd, MdVisibility } from "react-icons/md";

const getConvertLabel = (row) =>
  row.nb_converted_at ? "แปลงเป็นลูกค้าแล้ว" : "แปลงเป็นลูกค้า";

const getEditLabel = (row) => (row.nb_converted_at ? "แปลงเป็นลูกค้าแล้ว" : "แก้ไขรายการ");

const getDeleteLabel = (row, userRole) => {
  if (row.nb_converted_at) {
    return "แปลงเป็นลูกค้าแล้วจึงลบไม่ได้";
  }

  if (userRole !== "admin") {
    return "เฉพาะ Admin";
  }

  return "ลบรายการ";
};

const getCallLabel = (row) =>
  row.nb_contact_number?.trim() ? `โทร ${row.nb_contact_number}` : "ไม่มีเบอร์โทรสำหรับติดต่อ";

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
  onConvert,
  variant = "table",
}) => {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const callHref = useMemo(
    () => (row.nb_contact_number?.trim() ? getTelHref(row.nb_contact_number) : null),
    [row.nb_contact_number]
  );
  const isCardVariant = variant === "card";
  const buttonSize = isCardVariant ? "medium" : "small";

  const handleContainerClick = (event) => {
    event.stopPropagation();
  };

  const handleOpenMenu = (event) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleView = (event) => {
    event.stopPropagation();
    onView(row);
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    onEdit(row);
  };

  const handleConvert = (event) => {
    event.stopPropagation();
    onConvert(row);
    handleCloseMenu();
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    onDelete(row.id);
    handleCloseMenu();
  };

  return (
    <Stack
      direction="row"
      spacing={1}
      flexWrap="wrap"
      useFlexGap
      onClick={handleContainerClick}
      sx={{ py: 0.5 }}
    >
      <ActionButton tooltip="ดูรายละเอียด">
        <Button
          variant={isCardVariant ? "contained" : "outlined"}
          color="info"
          size={buttonSize}
          startIcon={<MdVisibility />}
          onClick={handleView}
          sx={{ borderRadius: 999, textTransform: "none" }}
        >
          ดู
        </Button>
      </ActionButton>

      <ActionButton tooltip={getEditLabel(row)}>
        <Button
          variant="outlined"
          color="primary"
          size={buttonSize}
          startIcon={<MdEdit />}
          onClick={handleEdit}
          disabled={Boolean(row.nb_converted_at)}
          sx={{ borderRadius: 999, textTransform: "none" }}
        >
          แก้ไข
        </Button>
      </ActionButton>

      <ActionButton tooltip={getCallLabel(row)}>
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

      {isCardVariant ? (
        <>
          <ActionButton tooltip={getConvertLabel(row)}>
            <Button
              variant="outlined"
              color="secondary"
              size={buttonSize}
              startIcon={<MdPersonAdd />}
              onClick={handleConvert}
              disabled={Boolean(row.nb_converted_at)}
              sx={{ borderRadius: 999, textTransform: "none" }}
            >
              แปลง
            </Button>
          </ActionButton>

          <ActionButton tooltip={getDeleteLabel(row, userRole)}>
            <Button
              variant="outlined"
              color="error"
              size={buttonSize}
              startIcon={<MdDelete />}
              onClick={handleDelete}
              disabled={Boolean(row.nb_converted_at) || userRole !== "admin"}
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
            <MenuItem onClick={handleConvert} disabled={Boolean(row.nb_converted_at)}>
              <MdPersonAdd style={{ marginRight: 8 }} />
              แปลงเป็นลูกค้า
            </MenuItem>
            <MenuItem
              onClick={handleDelete}
              disabled={Boolean(row.nb_converted_at) || userRole !== "admin"}
            >
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
