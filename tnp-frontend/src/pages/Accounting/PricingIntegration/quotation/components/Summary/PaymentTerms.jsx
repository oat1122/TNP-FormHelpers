import { Card, CardContent, Grid, Typography, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { formatDateTH } from '../../utils/date';

export function PaymentTerms({ value, onChange }) {
  const { paymentMethod, depositPercentage, customDepositPercentage, dueDate } = value;

  const onMethod = (method) => {
    const now = new Date();
    let due = null;
    if (method === 'credit_30') {
      now.setDate(now.getDate() + 30);
      due = now;
    }
    if (method === 'credit_60') {
      now.setDate(now.getDate() + 60);
      due = now;
    }
    onChange((p) => ({ ...p, paymentMethod: method, dueDate: due }));
  };

  const customError =
    depositPercentage === 'custom' &&
    (Number(customDepositPercentage) < 0 || Number(customDepositPercentage) > 100);

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          เงื่อนไขการชำระเงิน
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl>
              <FormLabel>การชำระเงิน</FormLabel>
              <RadioGroup value={paymentMethod} onChange={(e) => onMethod(e.target.value)}>
                <FormControlLabel value="cash" control={<Radio />} label="เงินสด" />
                <FormControlLabel value="credit_30" control={<Radio />} label="เครดิต 30 วัน" />
                <FormControlLabel value="credit_60" control={<Radio />} label="เครดิต 60 วัน" />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl>
              <FormLabel>เงินมัดจำ</FormLabel>
              <RadioGroup
                value={depositPercentage}
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    depositPercentage: e.target.value,
                    customDepositPercentage:
                      e.target.value === 'custom' ? p.customDepositPercentage : '',
                  }))
                }
              >
                <FormControlLabel value="0" control={<Radio />} label="ไม่มี" />
                <FormControlLabel value="50" control={<Radio />} label="50%" />
                <FormControlLabel value="100" control={<Radio />} label="100%" />
                <FormControlLabel
                  value="custom"
                  control={<Radio />}
                  label={
                    <TextField
                      size="small"
                      sx={{ width: 120 }}
                      disabled={depositPercentage !== 'custom'}
                      value={customDepositPercentage}
                      onChange={(e) =>
                        onChange((p) => ({ ...p, customDepositPercentage: e.target.value }))
                      }
                      InputProps={{ endAdornment: <span>%</span> }}
                      error={customError}
                      helperText={customError ? '0–100 เท่านั้น' : ' '}
                    />
                  }
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          {paymentMethod !== 'cash' && (
            <Grid item xs={12}>
              <DatePicker
                label="วันครบกำหนด"
                value={dueDate}
                onChange={(d) => onChange((p) => ({ ...p, dueDate: d }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <Typography variant="caption" color="text.secondary">
                {formatDateTH(dueDate)}
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default PaymentTerms;
