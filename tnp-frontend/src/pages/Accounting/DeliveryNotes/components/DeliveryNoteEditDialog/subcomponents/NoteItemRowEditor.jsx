import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from "@mui/icons-material";
import {
  Box,
  IconButton,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

/**
 * 1 แถวของตารางไซส์ใน NoteItemsTable — toggle ระหว่าง view กับ edit
 * พร้อมปุ่ม edit/save/cancel/delete. คุม UI ของ row เท่านั้น
 * ไม่ถือ state — parent ส่ง isEditingRow + handlers มาให้.
 */
const NoteItemRowEditor = ({
  row,
  groupIndex,
  rowIndex,
  isEditingRow,
  canEdit,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onFieldChange,
}) => {
  return (
    <TableRow>
      <TableCell sx={{ py: 1.5 }}>
        {isEditingRow ? (
          <TextField
            value={row.size}
            onChange={(e) => onFieldChange(groupIndex, rowIndex, "size", e.target.value)}
            size="small"
            fullWidth
            placeholder="ระบุไซส์..."
          />
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {row.size || <em style={{ color: "#999" }}>ยังไม่ระบุไซส์</em>}
          </Typography>
        )}
      </TableCell>

      <TableCell align="center" sx={{ py: 1.5 }}>
        {isEditingRow ? (
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
            <TextField
              type="number"
              value={row.quantity}
              onChange={(e) =>
                onFieldChange(groupIndex, rowIndex, "quantity", Number(e.target.value))
              }
              size="small"
              sx={{ width: 100 }}
              inputProps={{ min: 0 }}
            />
            <TextField
              value={row.unit}
              onChange={(e) => onFieldChange(groupIndex, rowIndex, "unit", e.target.value)}
              size="small"
              sx={{ width: 80 }}
              placeholder="หน่วย"
            />
          </Stack>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
              {Number(row.quantity).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.unit}
            </Typography>
          </Box>
        )}
      </TableCell>

      <TableCell align="center" sx={{ py: 1.5 }}>
        {isEditingRow ? (
          <Stack direction="row" spacing={0.5} justifyContent="center">
            <Tooltip title="บันทึก">
              <IconButton size="small" color="primary" onClick={onSave}>
                <SaveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="ยกเลิก">
              <IconButton size="small" onClick={onCancel}>
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ) : canEdit ? (
          <Stack direction="row" spacing={0.5} justifyContent="center">
            <Tooltip title="แก้ไข">
              <IconButton size="small" onClick={() => onEdit(groupIndex, rowIndex)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="ลบ">
              <IconButton size="small" color="error" onClick={() => onDelete(groupIndex, rowIndex)}>
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ) : (
          <Typography variant="caption" color="text.disabled">
            -
          </Typography>
        )}
      </TableCell>
    </TableRow>
  );
};

export default NoteItemRowEditor;
