import { Add as AddIcon, DeleteOutline as DeleteOutlineIcon } from "@mui/icons-material";
import { Box, Grid, TextField, Typography } from "@mui/material";
import React from "react";

import {
  createDecimalInputHandler,
  createIntegerInputHandler,
} from "../../../../../shared/inputSanitizers";
import { tokens } from "../../../../../shared/styles/tokens";
import { SecondaryButton } from "../../../styles/quotationFormStyles";
import { formatTHB } from "../../utils/currency";

const toSafeNumber = (value) => {
  const n = typeof value === "string" ? parseFloat(value || "0") : Number(value || 0);
  return isNaN(n) ? 0 : n;
};

const SizeRowsEditor = ({ item, rows, isEditing, onAddRow, onUpdateRow, onRemoveRow }) => (
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
        <SecondaryButton size="small" startIcon={<AddIcon />} onClick={() => onAddRow(item.id)}>
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
        {rows.map((row) => {
          const sum = toSafeNumber(row.quantity) * toSafeNumber(row.unitPrice);
          return (
            <React.Fragment key={row.uuid}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="ขนาด"
                  value={row.size || ""}
                  disabled={!isEditing}
                  onChange={(e) => onUpdateRow(item.id, row.uuid, { size: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="จำนวน"
                  type="text"
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  value={String(row.quantity ?? "")}
                  disabled={!isEditing}
                  onChange={createIntegerInputHandler((value) =>
                    onUpdateRow(item.id, row.uuid, { quantity: value })
                  )}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="ราคาต่อหน่วย"
                  type="text"
                  inputProps={{ inputMode: "decimal" }}
                  value={String(row.unitPrice ?? "")}
                  disabled={!isEditing}
                  onChange={createDecimalInputHandler((value) =>
                    onUpdateRow(item.id, row.uuid, { unitPrice: value })
                  )}
                />
              </Grid>
              <Grid item xs={10} md={2}>
                <Box
                  sx={{
                    p: 1,
                    bgcolor: tokens.white,
                    border: `1px solid ${tokens.border}`,
                    borderRadius: 1,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={800}>
                    {formatTHB(sum)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={2} md={1}>
                {isEditing && (
                  <SecondaryButton
                    size="small"
                    color="error"
                    onClick={() => onRemoveRow(item.id, row.uuid)}
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
                  onChange={(e) => onUpdateRow(item.id, row.uuid, { notes: e.target.value })}
                />
              </Grid>
            </React.Fragment>
          );
        })}
      </Grid>
    )}
  </Box>
);

export default SizeRowsEditor;
