import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  Box,
  TextField,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Button,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";

const tokens = {
  primary: "#900F0F",
  white: "#FFFFFF",
  bg: "#F5F5F5",
};

const InvoiceTable = styled(Table)(({ theme }) => ({
  "& .MuiTableHead-root": {
    backgroundColor: tokens.bg,
  },
  "& .MuiTableCell-head": {
    fontWeight: 600,
    fontSize: "0.875rem",
    color: tokens.primary,
  },
  "& .MuiTableRow-root:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const InvoiceAddButton = styled(Button)(({ theme }) => ({
  color: tokens.primary,
  borderColor: tokens.primary,
  "&:hover": {
    borderColor: tokens.primary,
    backgroundColor: `${tokens.primary}08`,
  },
}));

const InvoiceSizeRowsEditor = React.memo(function InvoiceSizeRowsEditor({
  rows = [],
  isEditing = false,
  onAddRow,
  onChangeRow,
  onRemoveRow,
  itemIndex = 0,
  unit = "ชิ้น",
}) {
  const formatTHB = (amount) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Helper function to format number for display in input
  const formatNumberForInput = (value, isPrice = false) => {
    if (value === 0 || value === "0") return "";
    if (isPrice) {
      return value.toString();
    }
    return value.toString();
  };

  // Helper function to parse input value
  const parseInputValue = (value, isPrice = false) => {
    if (!value || value === "") return 0;

    // Remove any non-numeric characters except decimal point for prices
    let cleanValue;
    if (isPrice) {
      cleanValue = value.toString().replace(/[^\d.]/g, "");
      // Ensure only one decimal point
      const parts = cleanValue.split(".");
      if (parts.length > 2) {
        cleanValue = parts[0] + "." + parts.slice(1).join("");
      }
    } else {
      cleanValue = value.toString().replace(/[^\d]/g, "");
    }

    const numValue = cleanValue === "" ? 0 : Number(cleanValue);
    return Math.max(0, numValue || 0);
  };

  const handleQuantityChange = (rowIndex, value) => {
    const numValue = parseInputValue(value, false);
    onChangeRow?.(itemIndex, rowIndex, "quantity", numValue);
  };

  const handleUnitPriceChange = (rowIndex, value) => {
    const numValue = parseInputValue(value, true);
    onChangeRow?.(itemIndex, rowIndex, "unitPrice", numValue);
  };

  const handleSizeChange = (rowIndex, value) => {
    onChangeRow?.(itemIndex, rowIndex, "size", value);
  };

  const handleAddRow = () => {
    onAddRow?.(itemIndex, {
      size: "",
      quantity: 0,
      unitPrice: 0,
    });
  };

  const handleRemoveRow = (rowIndex) => {
    onRemoveRow?.(itemIndex, rowIndex);
  };

  const totalQuantity = rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const totalAmount = rows.reduce((sum, row) => {
    const qty = Number(row.quantity || 0);
    const price = Number(row.unitPrice || 0);
    return sum + qty * price;
  }, 0);

  if (!isEditing && rows.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
        <Typography variant="body2">ไม่มีรายละเอียดขนาด</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {rows.length > 0 && (
        <InvoiceTable size="small">
          <TableHead>
            <TableRow>
              <TableCell>ขนาด</TableCell>
              <TableCell align="right">จำนวน</TableCell>
              <TableCell align="right">ราคาต่อหน่วย</TableCell>
              <TableCell align="right">รวม</TableCell>
              {isEditing && (
                <TableCell align="center" width={60}>
                  ลบ
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rowIndex) => {
              const qty = Number(row.quantity || 0);
              const unitPrice = Number(row.unitPrice || 0);
              const lineTotal = qty * unitPrice;

              return (
                <TableRow key={rowIndex}>
                  <TableCell>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        value={row.size || ""}
                        onChange={(e) => handleSizeChange(rowIndex, e.target.value)}
                        placeholder="ระบุขนาด"
                      />
                    ) : (
                      <Typography variant="body2">{row.size || "-"}</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {isEditing ? (
                      <TextField
                        size="small"
                        type="text"
                        value={formatNumberForInput(qty)}
                        onChange={(e) => handleQuantityChange(rowIndex, e.target.value)}
                        placeholder="จำนวน"
                        inputProps={{
                          inputMode: "numeric",
                          pattern: "[0-9]*",
                          style: { textAlign: "right" },
                        }}
                        sx={{
                          width: 100,
                          "& .MuiOutlinedInput-input": {
                            padding: "8.5px 14px",
                          },
                        }}
                      />
                    ) : (
                      <Typography variant="body2">
                        {qty.toLocaleString()} {unit}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {isEditing ? (
                      <TextField
                        size="small"
                        type="text"
                        value={formatNumberForInput(unitPrice, true)}
                        onChange={(e) => handleUnitPriceChange(rowIndex, e.target.value)}
                        placeholder="ราคา"
                        inputProps={{
                          inputMode: "decimal",
                          style: { textAlign: "right" },
                        }}
                        sx={{
                          width: 120,
                          "& .MuiOutlinedInput-input": {
                            padding: "8.5px 14px",
                          },
                        }}
                      />
                    ) : (
                      <Typography variant="body2">{formatTHB(unitPrice)}</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.primary }}>
                      {formatTHB(lineTotal)}
                    </Typography>
                  </TableCell>
                  {isEditing && (
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveRow(rowIndex)}
                        sx={{ color: "error.main" }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {/* Summary Row */}
            <TableRow sx={{ backgroundColor: tokens.bg }}>
              <TableCell sx={{ fontWeight: 700 }}>รวม</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {totalQuantity.toLocaleString()} {unit}
              </TableCell>
              <TableCell align="right">-</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: tokens.primary }}>
                {formatTHB(totalAmount)}
              </TableCell>
              {isEditing && <TableCell />}
            </TableRow>
          </TableBody>
        </InvoiceTable>
      )}

      {isEditing && (
        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-start" }}>
          <InvoiceAddButton
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddRow}
          >
            เพิ่มขนาด
          </InvoiceAddButton>
        </Box>
      )}

      {!isEditing && rows.length === 0 && (
        <Box sx={{ p: 3, textAlign: "center", bgcolor: tokens.bg, borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            ยังไม่มีรายละเอียดขนาด
          </Typography>
        </Box>
      )}
    </Box>
  );
});

export default InvoiceSizeRowsEditor;
