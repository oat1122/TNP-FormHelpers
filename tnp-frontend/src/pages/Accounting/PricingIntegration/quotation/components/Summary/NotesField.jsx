import { Card, CardContent, TextField } from '@mui/material';

export function NotesField({ value, onChange }) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="หมายเหตุ"
          placeholder="เช่น ราคานี้รวมค่าจัดส่งและติดตั้งแล้ว…"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </CardContent>
    </Card>
  );
}

export default NotesField;
