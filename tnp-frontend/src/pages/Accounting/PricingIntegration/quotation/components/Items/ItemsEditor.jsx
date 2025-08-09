import { Card, CardContent, Grid, TextField, Typography, Box, Chip } from '@mui/material';
import { formatTHB } from '../../utils/currency';

export function ItemsEditor({ items = [], onChange }) {
  const setItem = (id, patch) => {
    onChange?.(
      items.map((i) =>
        i.id === id
          ? {
              ...i,
              ...patch,
              total:
                ((patch.unitPrice ?? i.unitPrice) || 0) *
                ((patch.quantity ?? i.quantity) || 0),
            }
          : i
      )
    );
  };

  if (!items.length) {
    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography color="text.secondary">ไม่พบข้อมูลงาน</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {items.map((item, idx) => (
        <Card key={item.id} variant="outlined" sx={{ mb: 1.5 }}>
          <CardContent sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>
                  งานที่ {idx + 1}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.name}
                </Typography>
              </Box>
              <Chip label={`${item.quantity} ชิ้น`} size="small" />
            </Box>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="แพทเทิร์น"
                  value={item.pattern || ''}
                  onChange={(e) => setItem(item.id, { pattern: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="ประเภทผ้า"
                  value={item.fabricType || ''}
                  onChange={(e) => setItem(item.id, { fabricType: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="สี"
                  value={item.color || ''}
                  onChange={(e) => setItem(item.id, { color: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="ขนาด"
                  value={item.size || ''}
                  onChange={(e) => setItem(item.id, { size: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="ราคาต่อหน่วย"
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                  value={item.unitPrice ?? ''}
                  onChange={(e) =>
                    setItem(item.id, { unitPrice: Number(e.target.value || 0) })
                  }
                />
              </Grid>
              <Grid item xs={6} md={4}>
                <TextField
                  fullWidth
                  label="จำนวน"
                  type="number"
                  inputProps={{ min: 1, step: 1 }}
                  value={item.quantity ?? 1}
                  onChange={(e) =>
                    setItem(item.id, {
                      quantity: Math.max(1, parseInt(e.target.value || 1, 10)),
                    })
                  }
                />
              </Grid>
              <Grid item xs={6} md={4}>
                <Box
                  sx={{
                    p: 1.5,
                    border: (theme) => `1px dashed ${theme.palette.divider}`,
                    borderRadius: 1.5,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    ยอดรวม
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {formatTHB(item.total || 0)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default ItemsEditor;
