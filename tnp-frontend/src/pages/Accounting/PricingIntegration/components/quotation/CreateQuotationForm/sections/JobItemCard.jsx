import { DeleteOutline as DeleteOutlineIcon } from "@mui/icons-material";
import { Alert, Box, Chip, Grid, IconButton, TextField, Tooltip, Typography } from "@mui/material";

import SizeRowsEditor from "./SizeRowsEditor";
import { tokens } from "../../../../../shared/styles/tokens";
import PricingRequestNotesButton from "../../../PricingRequestNotesButton";
import { InfoCard } from "../../../styles/quotationFormStyles";
import { formatTHB } from "../../utils/currency";

const KNOWN_UNITS = ["ชิ้น", "ตัว", "ชุด", "กล่อง", "แพ็ค"];

const JobItemCard = ({
  item,
  index,
  isEditing,
  validationErrors,
  onSetItem,
  onRemoveJob,
  onAddSizeRow,
  onUpdateSizeRow,
  onRemoveSizeRow,
}) => {
  const rows = Array.isArray(item.sizeRows) ? item.sizeRows : [];
  const totalQty = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);
  const itemTotal = rows.reduce(
    (s, r) => s + Number(r.quantity || 0) * Number(r.unitPrice || 0),
    0
  );
  const unitSelectValue = KNOWN_UNITS.includes(item.unit) ? item.unit : "อื่นๆ";
  const isManual = !item.isFromPR;
  const itemErrors = validationErrors || [];

  const handleUnitChange = (e) => {
    const val = e.target.value;
    if (val === "อื่นๆ") {
      onSetItem(item.id, {
        unit: item.unit && !KNOWN_UNITS.includes(item.unit) ? item.unit : "",
      });
    } else {
      onSetItem(item.id, { unit: val });
    }
  };

  return (
    <InfoCard
      sx={{
        p: 2,
        mb: 1.5,
        border: isManual ? `2px dashed ${tokens.primary}` : undefined,
        bgcolor: isManual ? `${tokens.primary}08` : undefined,
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Box display="flex" alignItems="center" gap={1.5}>
          {isManual && (
            <Chip label="งานใหม่" size="small" color="secondary" sx={{ fontWeight: 600 }} />
          )}
          <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
            งานที่ {index + 1}
          </Typography>
          <TextField
            size="small"
            placeholder={isManual ? "กรอกชื่องาน *" : "ชื่องาน"}
            value={item.name}
            onChange={(e) => onSetItem(item.id, { name: e.target.value })}
            error={isManual && itemErrors.some((err) => err.includes("ชื่องาน"))}
            sx={{ minWidth: 200 }}
          />
          {item.pricingRequestId && (
            <PricingRequestNotesButton
              pricingRequestId={item.pricingRequestId}
              workName={item.name}
              variant="icon"
              size="small"
            />
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={`${totalQty} ${item.unit || "ชิ้น"}`}
            size="small"
            variant="outlined"
            sx={{ borderColor: tokens.primary, color: tokens.primary, fontWeight: 700 }}
          />
          {isManual && (
            <Tooltip title="ลบงานนี้">
              <IconButton size="small" color="error" onClick={() => onRemoveJob(item.id)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {itemErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {itemErrors.map((err, i) => (
            <div key={i}>• {err}</div>
          ))}
        </Alert>
      )}

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="แพทเทิร์น"
            value={item.pattern}
            disabled={!isEditing}
            onChange={(e) => onSetItem(item.id, { pattern: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="ประเภทผ้า"
            value={item.fabricType}
            disabled={!isEditing}
            onChange={(e) => onSetItem(item.id, { fabricType: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="สี"
            value={item.color}
            disabled={!isEditing}
            onChange={(e) => onSetItem(item.id, { color: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="ขนาด (สรุป)"
            value={item.size}
            disabled={!isEditing}
            onChange={(e) => onSetItem(item.id, { size: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            select
            SelectProps={{ native: true }}
            label="หน่วย"
            value={unitSelectValue}
            disabled={!isEditing}
            onChange={handleUnitChange}
          >
            <option value="ชิ้น">ชิ้น</option>
            <option value="ตัว">ตัว</option>
            <option value="ชุด">ชุด</option>
            <option value="กล่อง">กล่อง</option>
            <option value="แพ็ค">แพ็ค</option>
            <option value="อื่นๆ">อื่นๆ</option>
          </TextField>
        </Grid>
        {unitSelectValue === "อื่นๆ" && (
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="หน่วย (กำหนดเอง)"
              placeholder="พิมพ์หน่วย เช่น โหล, ตร.ม., แผ่น"
              value={item.unit || ""}
              disabled={!isEditing}
              onChange={(e) => onSetItem(item.id, { unit: e.target.value })}
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <SizeRowsEditor
            item={item}
            rows={rows}
            isEditing={isEditing}
            onAddRow={onAddSizeRow}
            onUpdateRow={onUpdateSizeRow}
            onRemoveRow={onRemoveSizeRow}
          />
        </Grid>

        <Grid item xs={6} md={4}>
          <Box
            sx={{
              p: 1.5,
              border: `1px solid ${tokens.border}`,
              borderRadius: 1.5,
              textAlign: "center",
              bgcolor: tokens.bg,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              ยอดรวม
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {formatTHB(itemTotal)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </InfoCard>
  );
};

export default JobItemCard;
