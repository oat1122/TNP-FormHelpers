import {
  Delete as DeleteIcon,
  DeleteOutline as DeleteOutlineIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import {
  Box,
  Grid,
  Typography,
  Chip,
  Card,
  CardContent,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";

const tokens = {
  primary: "#900F0F",
  white: "#FFFFFF",
  bg: "#F5F5F5",
  border: "#E0E0E0",
};

const InvoiceCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: `0px 2px 1px -1px rgba(144, 15, 15, 0.2), 0px 1px 1px 0px rgba(144, 15, 15, 0.14), 0px 1px 3px 0px rgba(144, 15, 15, 0.12)`,
  "&:hover": {
    boxShadow: theme.shadows[4],
  },
}));

const InvoiceChip = styled(Chip)(({ theme, variant = "outlined" }) => ({
  fontWeight: 700,
  ...(variant === "outlined" && {
    borderColor: tokens.primary,
    color: tokens.primary,
  }),
  ...(variant === "error" && {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  }),
}));

const InvoiceDeleteButton = styled(Button)(({ theme }) => ({
  color: theme.palette.error.main,
  minWidth: "auto",
  padding: theme.spacing(0.5),
}));

const InvoiceSummaryCard = React.memo(function InvoiceSummaryCard({
  item,
  index,
  isEditing = false,
  expanded = false,
  onToggleExpanded,
  onAddRow,
  onChangeRow,
  onRemoveRow,
  onDeleteItem,
  onChangeItem,
}) {
  const formatTHB = (amount) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate totals
  const hasDetailedRows = Array.isArray(item.sizeRows) && item.sizeRows.length > 0;
  let totalQuantity = 0;
  let totalAmount = 0;

  if (hasDetailedRows) {
    totalQuantity = item.sizeRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
    totalAmount = item.sizeRows.reduce((sum, row) => {
      const qty = Number(row.quantity || 0);
      const price = Number(row.unitPrice || 0);
      return sum + qty * price;
    }, 0);
  } else {
    totalQuantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unit_price || item.unitPrice || 0);
    totalAmount = totalQuantity * unitPrice;
  }

  const unit = item.unit || "ชิ้น";
  const workName = item.name || item.work_name || `งานที่ ${index + 1}`;
  const originalQuantity = Number(item.originalQuantity || 0);
  const hasQuantityMismatch = originalQuantity > 0 && totalQuantity !== originalQuantity;

  const knownUnits = ["ชิ้น", "ตัว", "ชุด", "กล่อง", "แพ็ค"];
  const unitSelectValue = knownUnits.includes(unit) ? unit : "อื่นๆ";

  const handleDeleteItem = () => {
    onDeleteItem?.(index);
  };

  const handleItemChange = (field, value) => {
    onChangeItem?.(index, field, value);
  };

  // Sanitizer helpers
  const sanitizeInt = (val) => {
    if (val == null) return "";
    let s = String(val);
    s = s.replace(/[^0-9]/g, "");
    return s;
  };

  const sanitizeDecimal = (val) => {
    if (val == null) return "";
    let s = String(val);
    s = s.replace(/,/g, ".");
    s = s.replace(/[^0-9.]/g, "");
    const parts = s.split(".");
    if (parts.length <= 1) return s;
    return `${parts[0]}.${parts.slice(1).join("").replace(/\./g, "")}`;
  };

  return (
    <InvoiceCard elevation={1}>
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {workName}
            </Typography>
            {isEditing && (
              <TextField
                size="small"
                label="ชื่องาน"
                placeholder="กรุณาระบุชื่องาน"
                value={workName}
                onChange={(e) => handleItemChange("name", e.target.value)}
                sx={{ minWidth: 200 }}
              />
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <InvoiceChip
              size="small"
              variant="outlined"
              label={`${totalQuantity.toLocaleString()} ${unit}`}
            />
            {hasQuantityMismatch && (
              <InvoiceChip
                size="small"
                variant="error"
                label={`PR: ${originalQuantity.toLocaleString()} ${unit}`}
              />
            )}
            {isEditing && (
              <InvoiceDeleteButton
                size="small"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={handleDeleteItem}
              >
                ลบงานนี้
              </InvoiceDeleteButton>
            )}
          </Box>
        </Box>

        {/* Item Properties */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="แพทเทิร์น"
              value={item.pattern || ""}
              onChange={(e) => handleItemChange("pattern", e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="ประเภทผ้า"
              value={item.fabricType || ""}
              onChange={(e) => handleItemChange("fabricType", e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="สี"
              value={item.color || ""}
              onChange={(e) => handleItemChange("color", e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="ขนาด (สรุป)"
              value={item.size || ""}
              onChange={(e) => handleItemChange("size", e.target.value)}
              disabled={!isEditing || hasDetailedRows}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small" disabled={!isEditing}>
              <InputLabel>หน่วย</InputLabel>
              <Select
                value={unitSelectValue}
                onChange={(e) => {
                  const newUnit = e.target.value === "อื่นๆ" ? "" : e.target.value;
                  handleItemChange("unit", newUnit);
                }}
                label="หน่วย"
              >
                <MenuItem value="ชิ้น">ชิ้น</MenuItem>
                <MenuItem value="ตัว">ตัว</MenuItem>
                <MenuItem value="ชุด">ชุด</MenuItem>
                <MenuItem value="กล่อง">กล่อง</MenuItem>
                <MenuItem value="แพ็ค">แพ็ค</MenuItem>
                <MenuItem value="อื่นๆ">อื่นๆ</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Size Details Section - Grid Layout */}
        <Box
          sx={{
            mt: 2,
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
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon fontSize="small" />}
                onClick={() => onAddRow?.(index)}
              >
                เพิ่มแถว
              </Button>
            )}
          </Box>

          {/* Grid Header */}
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

          {/* Grid Rows */}
          {(item.sizeRows || []).length === 0 ? (
            <Box sx={{ p: 1, color: "text.secondary" }}>
              <Typography variant="body2">ไม่มีรายละเอียดรายการสำหรับงานนี้</Typography>
            </Box>
          ) : (
            <Grid container spacing={1}>
              {(item.sizeRows || []).map((row, rowIndex) => (
                <React.Fragment key={row.uuid || rowIndex}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      inputProps={{ inputMode: "text" }}
                      label="ขนาด"
                      value={row.size || ""}
                      disabled={!isEditing}
                      onChange={(e) => onChangeRow?.(index, rowIndex, "size", e.target.value)}
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
                        onChangeRow?.(index, rowIndex, "quantity", sanitizeInt(e.target.value))
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
                        onChangeRow?.(index, rowIndex, "unitPrice", sanitizeDecimal(e.target.value))
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
                        minHeight: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="body2" fontWeight={700}>
                        {(() => {
                          const q = Number(row.quantity || 0);
                          const p = Number(row.unitPrice || 0);
                          const val = isNaN(q) || isNaN(p) ? 0 : q * p;
                          return formatTHB(val);
                        })()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={2} md={1}>
                    {isEditing && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onRemoveRow?.(index, rowIndex)}
                        sx={{ mt: 0.5 }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
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
                      onChange={(e) => onChangeRow?.(index, rowIndex, "notes", e.target.value)}
                    />
                  </Grid>
                </React.Fragment>
              ))}
            </Grid>
          )}
        </Box>

        {/* Total Summary */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={4} sx={{ ml: "auto" }}>
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
              <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.primary }}>
                {formatTHB(totalAmount)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </InvoiceCard>
  );
});

export default InvoiceSummaryCard;
