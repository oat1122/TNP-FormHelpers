import { Card, CardContent, Grid, Typography, Divider } from '@mui/material';
import { formatTHB } from '../../utils/currency';

export function TotalsCard({ numbers }) {
  const { subtotal = 0, vat = 0, total = 0 } = numbers || {};
  return (
    <Card variant="outlined" sx={{ mb: 2 }} aria-live="polite">
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          สรุปยอดเงิน
        </Typography>
        <Grid container>
          <Grid item xs={6}>
            <Typography>ยอดก่อนภาษี</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography textAlign="right" fontWeight={700}>
              {formatTHB(subtotal)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>VAT 7%</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography textAlign="right" fontWeight={700}>
              {formatTHB(vat)}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight={800}>
              ยอดรวมทั้งสิ้น
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight={800} textAlign="right">
              {formatTHB(total)}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default TotalsCard;
