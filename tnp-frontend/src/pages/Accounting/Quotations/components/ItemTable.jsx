import React from 'react';
import {
  Box, Typography, Button, Table, TableHead, TableBody, TableRow,
  TableCell, TextField, InputAdornment, Select, MenuItem, IconButton, Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Description as DescriptionIcon } from '@mui/icons-material';

export default function ItemTable({ items, onAddItem, onItemChange, onDeleteItem, getItemSubtotal }) {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          รายการสินค้า/บริการ
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={onAddItem}
          variant="contained"
        >
          เพิ่มรายการ
        </Button>
      </Box>

      {items && items.length > 0 ? (
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>รายการ</TableCell>
                <TableCell align="center">จำนวน</TableCell>
                <TableCell align="center">หน่วย</TableCell>
                <TableCell align="right">ราคาต่อหน่วย</TableCell>
                <TableCell align="right">จำนวนเงิน</TableCell>
                <TableCell align="center" width={120}>จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <TextField
                      fullWidth
                      value={item.item_name}
                      onChange={(e) => onItemChange(index, 'item_name', e.target.value)}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      InputProps={{
                        inputProps: { min: 1 }
                      }}
                      variant="outlined"
                      size="small"
                      sx={{ width: '80px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Select
                      value={item.unit}
                      onChange={(e) => onItemChange(index, 'unit', e.target.value)}
                      size="small"
                      sx={{ minWidth: '80px' }}
                    >
                      <MenuItem value="ชิ้น">ชิ้น</MenuItem>
                      <MenuItem value="อัน">อัน</MenuItem>
                      <MenuItem value="ตัว">ตัว</MenuItem>
                      <MenuItem value="ชุด">ชุด</MenuItem>
                      <MenuItem value="กก.">กก.</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => onItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      InputProps={{
                        inputProps: { min: 0, step: "0.01" },
                        startAdornment: <InputAdornment position="start">฿</InputAdornment>
                      }}
                      variant="outlined"
                      size="small"
                      sx={{ width: '120px' }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    ฿{getItemSubtotal(item).toLocaleString()}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => onDeleteItem(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : (
        <Alert severity="warning">
          <Typography variant="subtitle1" fontWeight="bold">
            ยังไม่มีรายการสินค้า
          </Typography>
          <Typography variant="body2">
            กรุณาเพิ่มรายการสินค้าหรือบริการอย่างน้อย 1 รายการ
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
