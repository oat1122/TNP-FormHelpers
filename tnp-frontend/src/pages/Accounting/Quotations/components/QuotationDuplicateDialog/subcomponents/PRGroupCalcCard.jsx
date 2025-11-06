// 📁subcomponents/PRGroupCalcCard.jsx
import React from "react";
import { 
  Box, 
  Typography, 
  Grid, 
  Chip, 
  TextField 
} from "@mui/material";
import {
  Add as AddIcon,
  DeleteOutline as DeleteOutlineIcon,
} from "@mui/icons-material";
// ❌ ลบการ import useGetPricingRequestAutofillQuery ออก
import { formatTHB } from "../utils/formatters";

// Temporary fallback styles - replace with actual import
const InfoCard = ({ children, sx, ...props }) => (
  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, ...sx }} {...props}>
    {children}
  </Box>
);

const SecondaryButton = ({ children, sx, ...props }) => (
  <Box 
    component="button" 
    sx={{ 
      border: '1px solid #ccc', 
      borderRadius: 1, 
      padding: '6px 12px',
      background: '#fff',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 1,
      fontSize: '0.875rem',
      ...sx 
    }} 
    {...props}
  >
    {children}
  </Box>
);

const tokens = {
  primary: '#1976d2',
  border: '#e0e0e0',
  bg: '#fafafa',
};

// Child: Calculation card per PR group
export const PRGroupCalcCard = React.memo(function PRGroupCalcCard({
  group,
  index,
  isEditing,
  prAutofillData, // 👈 รับ prop ใหม่
  onAddRow,
  onChangeRow,
  onRemoveRow,
  onDeleteGroup,
  onChangeGroup,
}) {
  // ✅ ใช้ข้อมูลจาก props แทน
  const pr = prAutofillData || {};
  const name =
    group.name && group.name !== "-" ? group.name : pr.pr_work_name || pr.work_name || "-";
  const pattern = group.pattern || pr.pr_pattern || "";
  const fabric = group.fabricType || pr.pr_fabric_type || "";
  const color = group.color || pr.pr_color || "";
  const size = group.size || pr.pr_sizes || "";
  const rows = Array.isArray(group.sizeRows) ? group.sizeRows : [];
  const unit = group.unit || "ชิ้น";
  const knownUnits = ["ชิ้น", "ตัว", "ชุด", "กล่อง", "แพ็ค"];
  const unitSelectValue = knownUnits.includes(group.unit) ? group.unit : "อื่นๆ";
  const totalQty = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);
  const itemTotal = rows.reduce(
    (s, r) => s + Number(r.quantity || 0) * Number(r.unitPrice || 0),
    0
  );
  const prQty = Number(pr?.pr_quantity ?? pr?.quantity ?? 0) || 0;
  const hasPrQty = prQty > 0;
  const qtyMatches = hasPrQty ? totalQty === prQty : true;

  return (
    <Box component={InfoCard} sx={{ p: 2, mb: 1.5 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Box display="flex" alignItems="center" gap={1.5} sx={{ flex: 1, minWidth: 0 }}>
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
              placeholder="กรุณาระบุชื่องาน"
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
          {isEditing && (
            <SecondaryButton
              size="small"
              color="error"
              onClick={() => onDeleteGroup(group.id)}
            >
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

        {/* Unit editor */}
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            select
            SelectProps={{ native: true }}
            label="หน่วย"
            value={unitSelectValue}
            disabled={!isEditing}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "อื่นๆ") {
                onChangeGroup(
                  group.id,
                  "unit",
                  group.unit && !knownUnits.includes(group.unit) ? group.unit : ""
                );
              } else {
                onChangeGroup(group.id, "unit", val);
              }
            }}
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
          <Box
            sx={{
              p: 1.5,
              border: `1px dashed ${tokens.border}`,
              borderRadius: 1,
              bgcolor: tokens.bg,
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle2" fontWeight={700}>
                แยกตามขนาด
              </Typography>
              {isEditing && (
                <SecondaryButton
                  size="small"
                  onClick={() => onAddRow(group.id)}
                >
                  <AddIcon fontSize="small" />
                  เพิ่มแถว
                </SecondaryButton>
              )}
            </Box>
            <Grid container spacing={1} sx={{ px: 0.5, pb: 0.5 }}>
              <Grid item xs={12} md={3}>
                <Typography variant="caption" color="text.secondary">
                  ขนาด
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  จำนวน
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  ราคาต่อหน่วย
                </Typography>
              </Grid>
              <Grid item xs={10} md={2}>
                <Typography variant="caption" color="text.secondary">
                  ยอดรวม
                </Typography>
              </Grid>
              <Grid item xs={2} md={1}></Grid>
            </Grid>
            {rows.length === 0 ? (
              <Box sx={{ p: 1, color: "text.secondary" }}>
                <Typography variant="body2">ไม่มีรายละเอียดรายการสำหรับงานนี้</Typography>
              </Box>
            ) : (
              <Grid container spacing={1}>
                {rows.map((row) => (
                  <React.Fragment key={row.uuid}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        inputProps={{ inputMode: "text" }}
                        label="ขนาด"
                        value={row.size || ""}
                        disabled={!isEditing}
                        onChange={(e) => onChangeRow(group.id, row.uuid, "size", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="จำนวน"
                        type="text"
                        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                        value={row.quantity ?? ""}
                        disabled={!isEditing}
                        onChange={(e) =>
                          onChangeRow(group.id, row.uuid, "quantity", e.target.value)
                        }
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="ราคาต่อหน่วย"
                        type="text"
                        inputProps={{ inputMode: "decimal" }}
                        value={row.unitPrice ?? ""}
                        disabled={!isEditing}
                        onChange={(e) =>
                          onChangeRow(group.id, row.uuid, "unitPrice", e.target.value)
                        }
                      />
                    </Grid>
                    <Grid item xs={10} md={2}>
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: "#fff",
                          border: `1px solid ${tokens.border}`,
                          borderRadius: 1,
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={800}>
                          {(() => {
                            const q =
                              typeof row.quantity === "string"
                                ? parseFloat(row.quantity || "0")
                                : Number(row.quantity || 0);
                            const p =
                              typeof row.unitPrice === "string"
                                ? parseFloat(row.unitPrice || "0")
                                : Number(row.unitPrice || 0);
                            const val = isNaN(q) || isNaN(p) ? 0 : q * p;
                            return formatTHB(val);
                          })()}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={2} md={1}>
                      {isEditing && (
                        <SecondaryButton
                          size="small"
                          color="error"
                          onClick={() => onRemoveRow(group.id, row.uuid)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </SecondaryButton>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="หมายเหตุ (บรรทัดนี้)"
                        multiline
                        minRows={1}
                        value={row.notes || ""}
                        disabled={!isEditing}
                        onChange={(e) => onChangeRow(group.id, row.uuid, "notes", e.target.value)}
                      />
                    </Grid>
                  </React.Fragment>
                ))}
                {hasPrQty && !qtyMatches && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: "error.main" }}>
                      จำนวนรวมทุกขนาด ({totalQty} {unit}){" "}
                      {totalQty > prQty ? "มากกว่า" : "น้อยกว่า"} จำนวนในงาน Pricing ({prQty} {unit}
                      )
                    </Typography>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
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
    </Box>
  );
});