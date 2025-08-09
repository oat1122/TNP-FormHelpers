import { Card, CardContent, TextField } from '@mui/material';

export function CustomerInfoCard({ value = {}, onChange }) {
  const handle = (field) => (e) => onChange?.({ ...value, [field]: e.target.value });
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <TextField
          label="ชื่อบริษัท"
          size="small"
          fullWidth
          value={value.company || ''}
          onChange={handle('company')}
        />
        <TextField
          label="ผู้ติดต่อ"
          size="small"
          fullWidth
          value={value.contact || ''}
          onChange={handle('contact')}
        />
      </CardContent>
    </Card>
  );
}

export default CustomerInfoCard;
