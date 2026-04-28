import { DeleteOutline as DeleteOutlineIcon } from "@mui/icons-material";
import { Box, Chip, Grid, TextField, Typography } from "@mui/material";
import React from "react";

import SizeRowsEditor from "./PRGroupCalcCard/SizeRowsEditor";
import { resolvePRGroupFields } from "./utils/prAutofillResolver";
import { formatTHB } from "./utils/quotationFormatters";
import { InfoCard, SecondaryButton, tokens } from "../../../shared/styles/quotationFormStyles";

const KNOWN_UNITS = ["ชิ้น", "ตัว", "ชุด", "กล่อง", "แพ็ค"];

const computeItemTotal = (rows) =>
  rows.reduce((s, r) => s + Number(r.quantity || 0) * Number(r.unitPrice || 0), 0);

export const PRGroupCalcCard = React.memo(function PRGroupCalcCard({
  group,
  index,
  isEditing,
  prAutofillData,
  onAddRow,
  onChangeRow,
  onRemoveRow,
  onDeleteGroup,
  onChangeGroup,
}) {
  const { name, pattern, fabric, color, size } = resolvePRGroupFields(group, prAutofillData);
  const rows = Array.isArray(group.sizeRows) ? group.sizeRows : [];
  const unit = group.unit || "ชิ้น";
  const unitSelectValue = KNOWN_UNITS.includes(group.unit) ? group.unit : "อื่นๆ";
  const totalQty = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);
  const itemTotal = computeItemTotal(rows);
  const prQty = Number(prAutofillData?.pr_quantity ?? prAutofillData?.quantity ?? 0) || 0;
  const hasPrQty = prQty > 0;
  const qtyMatches = hasPrQty ? totalQty === prQty : true;

  const handleUnitChange = (val) => {
    if (val === "อื่นๆ") {
      onChangeGroup(
        group.id,
        "unit",
        group.unit && !KNOWN_UNITS.includes(group.unit) ? group.unit : ""
      );
    } else {
      onChangeGroup(group.id, "unit", val);
    }
  };

  return (
    <Box
      component={InfoCard}
      sx={{
        p: 2,
        mb: 1.5,
        border: group.isManual ? `2px dashed ${tokens.primary}` : undefined,
        bgcolor: group.isManual ? `${tokens.primary}08` : undefined,
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Box display="flex" alignItems="center" gap={1.5} sx={{ flex: 1, minWidth: 0 }}>
          {group.isManual && (
            <Chip label="งานใหม่" size="small" color="secondary" sx={{ fontWeight: 600 }} />
          )}
          <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
            งานที่ {index + 1}
          </Typography>
          {isEditing ? (
            <TextField
              size="small"
              label="ชื่องาน"
              value={name}
              onChange={(e) => onChangeGroup(group.id, "name", e.target.value)}
              sx={{ flex: 1, minWidth: 200 }}
              placeholder={group.isManual ? "กรุณาระบุชื่องาน *" : "กรุณาระบุชื่องาน"}
              required={!!group.isManual}
            />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0 }} noWrap>
              {name}
            </Typography>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={`${totalQty} ${unit}`}
            size="small"
            variant="outlined"
            sx={{ borderColor: tokens.primary, color: tokens.primary, fontWeight: 700 }}
          />
          {hasPrQty && (
            <Chip
              label={`PR: ${prQty} ${unit}`}
              size="small"
              color={qtyMatches ? "success" : "error"}
              variant={qtyMatches ? "outlined" : "filled"}
            />
          )}
          {isEditing && group.isManual && (
            <SecondaryButton size="small" color="error" onClick={() => onDeleteGroup(group.id)}>
              <DeleteOutlineIcon fontSize="small" />
              ลบงานนี้
            </SecondaryButton>
          )}
        </Box>
      </Box>

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="แพทเทิร์น"
            value={pattern}
            disabled={!isEditing}
            onChange={(e) => onChangeGroup(group.id, "pattern", e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="ประเภทผ้า"
            value={fabric}
            disabled={!isEditing}
            onChange={(e) => onChangeGroup(group.id, "fabricType", e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="สี"
            value={color}
            disabled={!isEditing}
            onChange={(e) => onChangeGroup(group.id, "color", e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField fullWidth size="small" label="ขนาด (สรุป)" value={size} disabled />
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
            onChange={(e) => handleUnitChange(e.target.value)}
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
              value={group.unit || ""}
              disabled={!isEditing}
              onChange={(e) => onChangeGroup(group.id, "unit", e.target.value)}
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <SizeRowsEditor
            groupId={group.id}
            rows={rows}
            unit={unit}
            isEditing={isEditing}
            hasPrQty={hasPrQty}
            qtyMatches={qtyMatches}
            totalQty={totalQty}
            prQty={prQty}
            onAddRow={onAddRow}
            onChangeRow={onChangeRow}
            onRemoveRow={onRemoveRow}
          />
        </Grid>

        <Grid item xs={6} md={4}>
          <Box
            sx={{
              p: 1.5,
              border: `1px solid ${tokens.border}`,
              borderRadius: 1.5,
              textAlign: "center",
              bgcolor: tokens.bgAlt,
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
    </Box>
  );
});
