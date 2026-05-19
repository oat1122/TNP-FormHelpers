import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { tokens } from "../../../../PricingIntegration/components/styles/quotationFormStyles";

/**
 * บล็อกหัวกลุ่มสินค้า — แสดงข้อมูลกลุ่ม (ชื่องาน/แพทเทิร์น/ผ้า/สี) ทั้งโหมด
 * view (chips + edit button) และโหมด edit (ฟอร์มหลายช่อง + save/cancel).
 *
 * แยกออกจาก NoteItemsTable เพื่อให้ table file สั้นลง.
 */
const NoteItemGroupEditor = ({
  group,
  groupIndex,
  isEditing,
  canEdit,
  onStartEdit,
  onCancelEdit,
  onSave,
  onFieldChange,
}) => {
  if (isEditing) {
    return (
      <Box sx={{ p: 2, bgcolor: "grey.50", borderBottom: `1px solid ${tokens.border}` }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="ชื่องาน"
              value={group.name}
              onChange={(e) => onFieldChange(groupIndex, "name", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="รายละเอียด"
              value={group.description}
              onChange={(e) => onFieldChange(groupIndex, "description", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="แพทเทิร์น"
              value={group.pattern}
              onChange={(e) => onFieldChange(groupIndex, "pattern", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="ผ้า"
              value={group.fabric}
              onChange={(e) => onFieldChange(groupIndex, "fabric", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="สี"
              value={group.color}
              onChange={(e) => onFieldChange(groupIndex, "color", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="contained" startIcon={<SaveIcon />} onClick={onSave}>
                บันทึก
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={onCancelEdit}
              >
                ยกเลิก
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, bgcolor: "grey.50", borderBottom: `1px solid ${tokens.border}` }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          {group.name}
        </Typography>
        {canEdit && (
          <Tooltip title="แก้ไขข้อมูลกลุ่ม">
            <IconButton size="small" onClick={() => onStartEdit(groupIndex)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
        {group.pattern && (
          <Chip size="small" label={`แพทเทิร์น: ${group.pattern}`} variant="outlined" />
        )}
        {group.fabric && <Chip size="small" label={`ผ้า: ${group.fabric}`} variant="outlined" />}
        {group.color && <Chip size="small" label={`สี: ${group.color}`} variant="outlined" />}
      </Box>
      <Typography variant="body2" color="text.secondary">
        รายละเอียด: {group.description}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
        รวม {group.totalQty} ชิ้น
      </Typography>
    </Box>
  );
};

export default NoteItemGroupEditor;
