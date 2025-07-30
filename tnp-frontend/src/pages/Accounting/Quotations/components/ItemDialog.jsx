import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  TextField, Button, InputAdornment, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';

const units = ['ชิ้น', 'อัน', 'ตัว', 'ชุด', 'กก.'];

export default function ItemDialog({ open, item, onChange, onClose, onSave, isEdit }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="ชื่อสินค้า/บริการ"
              value={item.item_name}
              onChange={(e) => onChange('item_name', e.target.value)}
              required
              placeholder="สินค้า A"
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="จำนวน"
              type="number"
              value={item.quantity}
              onChange={(e) => onChange('quantity', parseFloat(e.target.value) || 0)}
              inputProps={{ min: 1, step: 1 }}
              required
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>หน่วย</InputLabel>
              <Select
                value={item.unit}
                label="หน่วย"
                onChange={(e) => onChange('unit', e.target.value)}
              >
                {units.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="ราคาต่อหน่วย"
              type="number"
              value={item.unit_price}
              onChange={(e) => onChange('unit_price', parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: <InputAdornment position="start">฿</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.01 }}
              required
              variant="outlined"
              size="small"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          ยกเลิก
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={!item.item_name || item.quantity <= 0 || item.unit_price <= 0}
        >
          {isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
