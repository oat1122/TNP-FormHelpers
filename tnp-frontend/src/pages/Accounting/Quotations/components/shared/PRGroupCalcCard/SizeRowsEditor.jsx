import { Add as AddIcon, DeleteOutline as DeleteOutlineIcon } from "@mui/icons-material";
import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import React from "react";

import { SecondaryButton, tokens } from "../../../../shared/styles/quotationFormStyles";
import { formatTHB } from "../utils/quotationFormatters";

const ERROR_ROW_BG = "rgba(211, 47, 47, 0.02)";

const computeRowTotal = (row) => {
  const q =
    typeof row.quantity === "string" ? parseFloat(row.quantity || "0") : Number(row.quantity || 0);
  const p =
    typeof row.unitPrice === "string"
      ? parseFloat(row.unitPrice || "0")
      : Number(row.unitPrice || 0);
  if (Number.isNaN(q) || Number.isNaN(p)) return 0;
  return q * p;
};

const SizeRowsEditor = ({
  groupId,
  rows,
  unit,
  isEditing,
  hasPrQty,
  qtyMatches,
  totalQty,
  prQty,
  onAddRow,
  onChangeRow,
  onRemoveRow,
}) => (
  <Box
    sx={{
      p: 1.5,
      border: `1px dashed ${tokens.border}`,
      borderRadius: 1,
      bgcolor: tokens.bgAlt,
    }}
  >
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
      <Typography variant="subtitle2" fontWeight={700}>
        แยกตามขนาด
      </Typography>
      {isEditing && (
        <SecondaryButton size="small" onClick={() => onAddRow(groupId)}>
          <AddIcon fontSize="small" />
          เพิ่มแถว
        </SecondaryButton>
      )}
    </Box>

    <Grid container spacing={1} sx={{ px: 0.5, pb: 0.5, display: { xs: "none", md: "flex" } }}>
      <Grid item md={3}>
        <Typography variant="caption" color="text.secondary">
          ขนาด
        </Typography>
      </Grid>
      <Grid item md={2}>
        <Typography variant="caption" color="text.secondary">
          จำนวน
        </Typography>
      </Grid>
      <Grid item md={3}>
        <Typography variant="caption" color="text.secondary">
          ราคาต่อหน่วย
        </Typography>
      </Grid>
      <Grid item md={3}>
        <Typography variant="caption" color="text.secondary">
          ยอดรวม
        </Typography>
      </Grid>
      <Grid item md={1} />
    </Grid>

    {rows.length === 0 ? (
      <Box sx={{ p: 1, color: "text.secondary" }}>
        <Typography variant="body2">ไม่มีรายละเอียดรายการสำหรับงานนี้</Typography>
      </Box>
    ) : (
      <>
        {rows.map((row, rowIndex) => (
          <React.Fragment key={row.uuid}>
            {rowIndex > 0 && (
              <Grid item xs={12} sx={{ pt: 2, pb: 1.5 }}>
                <Divider sx={{ borderColor: "error.main", borderWidth: "1.5px", opacity: 0.7 }} />
              </Grid>
            )}

            <Box
              sx={{
                bgcolor: rowIndex % 2 === 0 ? ERROR_ROW_BG : "transparent",
                borderRadius: 1,
                p: 0.5,
                mt: rowIndex > 0 ? 0.5 : 0,
              }}
            >
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="ขนาด"
                    inputProps={{ inputMode: "text" }}
                    value={row.size || ""}
                    disabled={!isEditing}
                    onChange={(e) => onChangeRow(groupId, row.uuid, "size", e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="จำนวน"
                    type="text"
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                    value={row.quantity ?? ""}
                    disabled={!isEditing}
                    onChange={(e) => onChangeRow(groupId, row.uuid, "quantity", e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} sm={3} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="ราคาต่อหน่วย"
                    type="text"
                    inputProps={{ inputMode: "decimal" }}
                    value={row.unitPrice ?? ""}
                    disabled={!isEditing}
                    onChange={(e) => onChangeRow(groupId, row.uuid, "unitPrice", e.target.value)}
                  />
                </Grid>
                <Grid item xs={9} sm={9} md={3}>
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: tokens.white,
                      border: `1px solid ${tokens.border}`,
                      borderRadius: 1,
                      textAlign: "center",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={800} noWrap>
                      {formatTHB(computeRowTotal(row))}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={3} sm={3} md={1}>
                  {isEditing && (
                    <SecondaryButton
                      size="small"
                      color="error"
                      onClick={() => onRemoveRow(groupId, row.uuid)}
                      sx={{ width: "100%", height: "40px" }}
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
                    onChange={(e) => onChangeRow(groupId, row.uuid, "notes", e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>
          </React.Fragment>
        ))}

        {hasPrQty && !qtyMatches && (
          <Grid item xs={12} sx={{ mt: 1.5 }}>
            <Typography variant="caption" sx={{ color: "error.main" }}>
              จำนวนรวมทุกขนาด ({totalQty} {unit}) {totalQty > prQty ? "มากกว่า" : "น้อยกว่า"}{" "}
              จำนวนในงาน Pricing ({prQty} {unit})
            </Typography>
          </Grid>
        )}
      </>
    )}
  </Box>
);

export default SizeRowsEditor;
