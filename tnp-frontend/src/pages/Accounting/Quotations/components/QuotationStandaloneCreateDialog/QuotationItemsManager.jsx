import React, { useCallback } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  MenuItem,
  Tooltip,
  InputAdornment,
  Collapse,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";

/**
 * QuotationItemsManager Component
 * จัดการรายการสินค้าในใบเสนอราคา
 */
const QuotationItemsManager = ({ items = [], onChange, errors = {} }) => {
  const [expandedRows, setExpandedRows] = React.useState({});

  // เพิ่มรายการใหม่
  const handleAddItem = useCallback(() => {
    const newItem = {
      id: `temp_${Date.now()}`,
      item_name: "",
      item_description: "",
      pattern: "",
      fabric_type: "",
      color: "",
      size: "",
      unit_price: 0,
      quantity: 1,
      unit: "ชิ้น",
      discount_percentage: 0,
      discount_amount: 0,
      notes: "",
      sequence_order: items.length + 1,
    };
    onChange([...items, newItem]);
    // Auto-expand new row
    setExpandedRows((prev) => ({ ...prev, [newItem.id]: true }));
  }, [items, onChange]);

  // ลบรายการ
  const handleDeleteItem = useCallback(
    (index) => {
      const newItems = items.filter((_, i) => i !== index);
      // Reorder sequence
      const reordered = newItems.map((item, i) => ({
        ...item,
        sequence_order: i + 1,
      }));
      onChange(reordered);
    },
    [items, onChange]
  );

  // อัพเดตรายการ
  const handleUpdateItem = useCallback(
    (index, field, value) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [field]: value };

      // คำนวณ discount_amount ถ้า discount_percentage เปลี่ยน
      if (field === "discount_percentage") {
        const subtotal = newItems[index].unit_price * newItems[index].quantity;
        newItems[index].discount_amount = (subtotal * parseFloat(value || 0)) / 100;
      }
      // คำนวณ discount_percentage ถ้า discount_amount เปลี่ยน
      else if (field === "discount_amount") {
        const subtotal = newItems[index].unit_price * newItems[index].quantity;
        newItems[index].discount_percentage =
          subtotal > 0 ? (parseFloat(value || 0) / subtotal) * 100 : 0;
      }

      onChange(newItems);
    },
    [items, onChange]
  );

  // Toggle expanded row
  const toggleRow = useCallback((id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // คำนวณ subtotal ของแต่ละรายการ
  const calculateItemSubtotal = useCallback((item) => {
    const gross = (item.unit_price || 0) * (item.quantity || 0);
    const discount = item.discount_amount || 0;
    return Math.max(0, gross - discount);
  }, []);

  // Format currency
  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  }, []);

  if (items.length === 0) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          ยังไม่มีรายการสินค้า กรุณาเพิ่มรายการอย่างน้อย 1 รายการ
        </Alert>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddItem} fullWidth>
          เพิ่มรายการสินค้า
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={40}>#</TableCell>
              <TableCell>ชื่อสินค้า/งาน</TableCell>
              <TableCell width={100}>ขนาด</TableCell>
              <TableCell width={100} align="right">
                ราคา/หน่วย
              </TableCell>
              <TableCell width={80} align="right">
                จำนวน
              </TableCell>
              <TableCell width={80}>หน่วย</TableCell>
              <TableCell width={100} align="right">
                ส่วนลด
              </TableCell>
              <TableCell width={120} align="right">
                ยอดรวม
              </TableCell>
              <TableCell width={100} align="center">
                จัดการ
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => {
              const isExpanded = expandedRows[item.id];
              const itemSubtotal = calculateItemSubtotal(item);

              return (
                <React.Fragment key={item.id || index}>
                  {/* Main Row */}
                  <TableRow hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <DragIcon
                          fontSize="small"
                          sx={{ color: "text.disabled", cursor: "grab" }}
                        />
                        {item.sequence_order}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={item.item_name}
                        onChange={(e) => handleUpdateItem(index, "item_name", e.target.value)}
                        placeholder="ชื่อสินค้า/งาน"
                        size="small"
                        fullWidth
                        required
                        error={!!errors[`items.${index}.item_name`]}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={item.size}
                        onChange={(e) => handleUpdateItem(index, "size", e.target.value)}
                        placeholder="S, M, L, XL"
                        size="small"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.unit_price}
                        onChange={(e) =>
                          handleUpdateItem(index, "unit_price", parseFloat(e.target.value) || 0)
                        }
                        size="small"
                        fullWidth
                        inputProps={{ min: 0, step: 0.01 }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">฿</InputAdornment>,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(index, "quantity", parseInt(e.target.value) || 0)
                        }
                        size="small"
                        fullWidth
                        inputProps={{ min: 1 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        value={item.unit}
                        onChange={(e) => handleUpdateItem(index, "unit", e.target.value)}
                        size="small"
                        fullWidth
                      >
                        <MenuItem value="ชิ้น">ชิ้น</MenuItem>
                        <MenuItem value="ตัว">ตัว</MenuItem>
                        <MenuItem value="ชุด">ชุด</MenuItem>
                        <MenuItem value="แผ่น">แผ่น</MenuItem>
                        <MenuItem value="เมตร">เมตร</MenuItem>
                        <MenuItem value="กิโลกรัม">กิโลกรัม</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.discount_percentage}
                        onChange={(e) =>
                          handleUpdateItem(
                            index,
                            "discount_percentage",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        size="small"
                        fullWidth
                        inputProps={{ min: 0, max: 100, step: 0.01 }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        ฿{formatCurrency(itemSubtotal)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={isExpanded ? "ซ่อนรายละเอียด" : "แสดงรายละเอียด"}>
                        <IconButton size="small" onClick={() => toggleRow(item.id)}>
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ลบรายการ">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteItem(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Details Row */}
                  <TableRow>
                    <TableCell colSpan={9} sx={{ py: 0 }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, px: 2, bgcolor: "grey.50" }}>
                          <Typography variant="subtitle2" gutterBottom color="primary">
                            รายละเอียดเพิ่มเติม
                          </Typography>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3, 1fr)",
                              gap: 2,
                              mb: 2,
                            }}
                          >
                            <TextField
                              label="แพทเทิร์น"
                              value={item.pattern}
                              onChange={(e) => handleUpdateItem(index, "pattern", e.target.value)}
                              size="small"
                              fullWidth
                            />
                            <TextField
                              label="ประเภทผ้า"
                              value={item.fabric_type}
                              onChange={(e) =>
                                handleUpdateItem(index, "fabric_type", e.target.value)
                              }
                              size="small"
                              fullWidth
                            />
                            <TextField
                              label="สี"
                              value={item.color}
                              onChange={(e) => handleUpdateItem(index, "color", e.target.value)}
                              size="small"
                              fullWidth
                            />
                          </Box>
                          <TextField
                            label="รายละเอียดสินค้า"
                            value={item.item_description}
                            onChange={(e) =>
                              handleUpdateItem(index, "item_description", e.target.value)
                            }
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            label="หมายเหตุรายการ"
                            value={item.notes}
                            onChange={(e) => handleUpdateItem(index, "notes", e.target.value)}
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                          />
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAddItem}
        fullWidth
        sx={{ mt: 2 }}
      >
        เพิ่มรายการสินค้า
      </Button>
    </Box>
  );
};

export default QuotationItemsManager;
