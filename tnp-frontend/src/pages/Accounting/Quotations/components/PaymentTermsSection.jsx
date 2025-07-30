import React from 'react';
import {
  Typography, FormControl, Select, MenuItem, TextField,
  InputAdornment, Grid
} from '@mui/material';
import { Controller } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const PAYMENT_TERMS = [
  { value: 'Cash on Delivery', label: 'เงินสดเมื่อจัดส่ง', deposit_percent: 0 },
  { value: 'Advance Payment', label: 'เงินสดล่วงหน้า 100%', deposit_percent: 100 },
  { value: '50% Advance', label: 'มัดจำ 50% ชำระที่เหลือเมื่อจัดส่ง', deposit_percent: 50 }
];

export default function PaymentTermsSection({ control, setValue, totals }) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        เงื่อนไขการชำระเงิน
      </Typography>
      <Controller
        name="payment_terms"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <FormControl fullWidth error={!!error} size="small" sx={{ mb: 2 }}>
            <Select
              {...field}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <em>เลือกเงื่อนไขการชำระเงิน</em>;
                }
                const term = PAYMENT_TERMS.find(t => t.value === selected);
                return term ? term.label : selected;
              }}
            >
              <MenuItem disabled value="">
                <em>เลือกเงื่อนไขการชำระเงิน</em>
              </MenuItem>
              {PAYMENT_TERMS.map((term) => (
                <MenuItem key={term.value} value={term.value}>
                  {term.label}
                </MenuItem>
              ))}
            </Select>
            {error && <Typography variant="caption" color="error">{error.message}</Typography>}
          </FormControl>
        )}
      />
      
      <Typography variant="subtitle2" gutterBottom>
        เงินมัดจำ (ถ้ามี)
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Controller
            name="deposit_amount"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                fullWidth
                size="small"
                placeholder="จำนวนเงิน"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">฿</InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
                error={!!error}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  field.onChange(value);
                  // Auto-calculate percentage
                  if (totals.total > 0) {
                    setValue('deposit_percent', (value / totals.total) * 100);
                  }
                }}
              />
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <Controller
            name="valid_until"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                minDate={dayjs().add(1, 'day')}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    required 
                    size="small"
                    placeholder="วันที่ใช้ได้ถึง"
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            )}
          />
        </Grid>
      </Grid>
    </>
  );
}
