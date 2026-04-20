import {
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import {
  Button,
  Grid,
  TextField,
  Stack,
  Typography,
  Box,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useState, useEffect, useRef } from "react";

import { InfoCard, tokens } from "../../PricingIntegration/components/styles/quotationFormStyles";
import { groupInvoiceItemsByProduct } from "../utils/deliveryNoteGrouping";

// Component สำหรับแสดงตาราง Invoice Items แบบจัดกลุ่ม (Editable)
const InvoiceItemsTable = ({ invoice, onUpdateItems }) => {
  const [editableGroups, setEditableGroups] = useState([]);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingRow, setEditingRow] = useState(null);

  // Use ref to avoid including onUpdateItems in useEffect deps (prevents infinite loops
  // when parent creates a new function reference on every render)
  const onUpdateItemsRef = useRef(onUpdateItems);
  useEffect(() => {
    onUpdateItemsRef.current = onUpdateItems;
  });

  useEffect(() => {
    if (!invoice?.items) return;
    const grouped = groupInvoiceItemsByProduct(invoice.items);
    setEditableGroups(grouped);
    onUpdateItemsRef.current?.(grouped);
  }, [invoice?.items]);

  const handleEditGroup = (groupIndex) => {
    setEditingGroup(groupIndex);
  };

  const handleSaveGroup = () => {
    setEditingGroup(null);
    setEditableGroups((prev) => {
      const next = prev.map((g) => ({
        ...g,
        totalQty: (g.rows || []).reduce((s, r) => s + (Number(r.quantity) || 0), 0),
      }));
      onUpdateItemsRef.current?.(next);
      return next;
    });
  };

  const handleCancelGroupEdit = () => {
    setEditingGroup(null);
  };

  const handleGroupFieldChange = (groupIndex, field, value) => {
    setEditableGroups((prev) => {
      const next = prev.map((group, idx) =>
        idx === groupIndex ? { ...group, [field]: value } : group
      );
      onUpdateItemsRef.current?.(next);
      return next;
    });
  };

  const handleEditRow = (groupIndex, rowIndex) => {
    setEditingRow({ groupIndex, rowIndex });
  };

  const handleSaveRow = () => {
    setEditingRow(null);
    setEditableGroups((prev) => {
      const next = prev.map((group) => ({
        ...group,
        totalQty: (group.rows || []).reduce((s, r) => s + (Number(r.quantity) || 0), 0),
      }));
      onUpdateItemsRef.current?.(next);
      return next;
    });
  };

  const handleCancelRowEdit = () => {
    setEditingRow(null);
  };

  const handleRowFieldChange = (groupIndex, rowIndex, field, value) => {
    setEditableGroups((prev) => {
      const next = prev.map((group, gIdx) =>
        gIdx === groupIndex
          ? {
              ...group,
              rows: group.rows.map((row, rIdx) =>
                rIdx === rowIndex ? { ...row, [field]: value } : row
              ),
            }
          : group
      );
      onUpdateItemsRef.current?.(next);
      return next;
    });
  };

  const handleAddRow = (groupIndex) => {
    const newRow = {
      id: `new-${Date.now()}`,
      sequence_order: editableGroups[groupIndex].rows.length + 1,
      size: "",
      quantity: 0,
      unit: "ชิ้น",
    };
    setEditableGroups((prev) => {
      const next = prev.map((group, idx) =>
        idx === groupIndex ? { ...group, rows: [...group.rows, newRow] } : group
      );
      onUpdateItemsRef.current?.(next);
      return next;
    });
  };

  const handleDeleteRow = (groupIndex, rowIndex) => {
    setEditableGroups((prev) => {
      const next = prev.map((group, gIdx) =>
        gIdx === groupIndex
          ? { ...group, rows: group.rows.filter((_, rIdx) => rIdx !== rowIndex) }
          : group
      );
      onUpdateItemsRef.current?.(next);
      return next;
    });
  };

  return (
    <InfoCard>
      <Box sx={{ p: 2, borderBottom: `1px solid ${tokens.border}` }}>
        <Typography variant="subtitle2">รายการสินค้าจากใบแจ้งหนี้ {invoice.number}</Typography>
        <Typography variant="caption" color="text.secondary">
          แสดงข้อมูลจาก invoice_items ({editableGroups.length} กลุ่ม) - สามารถแก้ไขได้
        </Typography>
      </Box>

      {editableGroups.map((group, groupIndex) => (
        <Box key={group.key || groupIndex} sx={{ mb: 2 }}>
          <Box sx={{ p: 2, bgcolor: "grey.50", borderBottom: `1px solid ${tokens.border}` }}>
            {editingGroup === groupIndex ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="ชื่องาน"
                    value={group.name}
                    onChange={(e) => handleGroupFieldChange(groupIndex, "name", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="รายละเอียด"
                    value={group.description}
                    onChange={(e) =>
                      handleGroupFieldChange(groupIndex, "description", e.target.value)
                    }
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="แพทเทิร์น"
                    value={group.pattern}
                    onChange={(e) => handleGroupFieldChange(groupIndex, "pattern", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="ผ้า"
                    value={group.fabric}
                    onChange={(e) => handleGroupFieldChange(groupIndex, "fabric", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="สี"
                    value={group.color}
                    onChange={(e) => handleGroupFieldChange(groupIndex, "color", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={() => handleSaveGroup(groupIndex)}
                    >
                      บันทึก
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancelGroupEdit}
                    >
                      ยกเลิก
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            ) : (
              <Box>
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
                  <Tooltip title="แก้ไขข้อมูลกลุ่ม">
                    <IconButton size="small" onClick={() => handleEditGroup(groupIndex)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                  {group.pattern && (
                    <Chip size="small" label={`แพทเทิร์น: ${group.pattern}`} variant="outlined" />
                  )}
                  {group.fabric && (
                    <Chip size="small" label={`ผ้า: ${group.fabric}`} variant="outlined" />
                  )}
                  {group.color && (
                    <Chip size="small" label={`สี: ${group.color}`} variant="outlined" />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  รายละเอียด: {group.description}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  รวม {group.totalQty} ชิ้น
                </Typography>
              </Box>
            )}
          </Box>

          <Table size="small" sx={{ mt: 1 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.100" }}>
                <TableCell sx={{ fontWeight: 600, width: "30%" }}>ไซส์</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: "40%" }}>
                  จำนวน
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: "30%" }}>
                  การจัดการ
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {group.rows.map((row, rowIndex) => (
                <TableRow
                  key={row.id}
                  sx={{
                    "&:nth-of-type(odd)": { bgcolor: "grey.50" },
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <TableCell sx={{ py: 1.5 }}>
                    {editingRow?.groupIndex === groupIndex && editingRow?.rowIndex === rowIndex ? (
                      <TextField
                        value={row.size}
                        onChange={(e) =>
                          handleRowFieldChange(groupIndex, rowIndex, "size", e.target.value)
                        }
                        size="small"
                        fullWidth
                        placeholder="ระบุไซส์..."
                        sx={{
                          "& .MuiInputBase-root": {
                            borderRadius: 1.5,
                            bgcolor: "background.paper",
                          },
                        }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.size || <em style={{ color: "#999" }}>ยังไม่ระบุไซส์</em>}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.5 }}>
                    {editingRow?.groupIndex === groupIndex && editingRow?.rowIndex === rowIndex ? (
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <TextField
                          type="number"
                          value={row.quantity}
                          onChange={(e) =>
                            handleRowFieldChange(
                              groupIndex,
                              rowIndex,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                          size="small"
                          sx={{
                            width: 100,
                            "& .MuiInputBase-root": {
                              borderRadius: 1.5,
                              bgcolor: "background.paper",
                            },
                          }}
                          inputProps={{ min: 0 }}
                        />
                        <TextField
                          value={row.unit}
                          onChange={(e) =>
                            handleRowFieldChange(groupIndex, rowIndex, "unit", e.target.value)
                          }
                          size="small"
                          sx={{
                            width: 80,
                            "& .MuiInputBase-root": {
                              borderRadius: 1.5,
                              bgcolor: "background.paper",
                            },
                          }}
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
                    {editingRow?.groupIndex === groupIndex && editingRow?.rowIndex === rowIndex ? (
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="บันทึก">
                          <IconButton
                            size="small"
                            onClick={handleSaveRow}
                            sx={{
                              bgcolor: "primary.main",
                              color: "white",
                              "&:hover": { bgcolor: "primary.dark" },
                            }}
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ยกเลิก">
                          <IconButton
                            size="small"
                            onClick={handleCancelRowEdit}
                            sx={{ bgcolor: "grey.200", "&:hover": { bgcolor: "grey.300" } }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="แก้ไข">
                          <IconButton
                            size="small"
                            onClick={() => handleEditRow(groupIndex, rowIndex)}
                            sx={{
                              color: "primary.main",
                              "&:hover": { bgcolor: "primary.light", color: "primary.dark" },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบ">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteRow(groupIndex, rowIndex)}
                            sx={{ "&:hover": { bgcolor: "error.light", color: "error.dark" } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell
                  colSpan={3}
                  align="center"
                  sx={{ py: 2, borderTop: "2px dashed", borderColor: "divider" }}
                >
                  <Button
                    size="medium"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddRow(groupIndex)}
                    sx={{
                      borderRadius: 2,
                      borderStyle: "dashed",
                      textTransform: "none",
                      fontSize: "0.875rem",
                      px: 3,
                      py: 1,
                      "&:hover": {
                        borderStyle: "solid",
                        bgcolor: "primary.light",
                        color: "primary.dark",
                      },
                    }}
                  >
                    เพิ่มไซส์ใหม่
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      ))}

      <Box sx={{ p: 2, borderTop: `1px solid ${tokens.border}`, bgcolor: "grey.50" }}>
        <Typography variant="body2">
          <strong>รวมทั้งหมด:</strong>{" "}
          {editableGroups.reduce((sum, group) => sum + group.totalQty, 0)} ชิ้น
        </Typography>
      </Box>
    </InfoCard>
  );
};

export default InvoiceItemsTable;
