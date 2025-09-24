import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Chip,
  Card,
  CardContent,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  DeleteOutline as DeleteOutlineIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import InvoiceSizeRowsEditor from './InvoiceSizeRowsEditor';

const tokens = {
  primary: '#900F0F',
  white: '#FFFFFF',
  bg: '#F5F5F5',
};

const InvoiceCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: `0px 2px 1px -1px rgba(144, 15, 15, 0.2), 0px 1px 1px 0px rgba(144, 15, 15, 0.14), 0px 1px 3px 0px rgba(144, 15, 15, 0.12)`,
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const InvoiceChip = styled(Chip)(({ theme, variant = 'outlined' }) => ({
  fontWeight: 700,
  ...(variant === 'outlined' && {
    borderColor: tokens.primary,
    color: tokens.primary,
  }),
  ...(variant === 'error' && {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  }),
}));

const InvoiceDeleteButton = styled(Button)(({ theme }) => ({
  color: theme.palette.error.main,
  minWidth: 'auto',
  padding: theme.spacing(0.5),
}));

const InvoiceSummaryCard = React.memo(function InvoiceSummaryCard({
  item,
  index,
  isEditing = false,
  expanded = false,
  onToggleExpanded,
  onAddRow,
  onChangeRow,
  onRemoveRow,
  onDeleteItem,
  onChangeItem,
}) {
  const formatTHB = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate totals
  const hasDetailedRows = Array.isArray(item.sizeRows) && item.sizeRows.length > 0;
  let totalQuantity = 0;
  let totalAmount = 0;

  if (hasDetailedRows) {
    totalQuantity = item.sizeRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
    totalAmount = item.sizeRows.reduce((sum, row) => {
      const qty = Number(row.quantity || 0);
      const price = Number(row.unitPrice || 0);
      return sum + (qty * price);
    }, 0);
  } else {
    totalQuantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unit_price || item.unitPrice || 0);
    totalAmount = totalQuantity * unitPrice;
  }

  const unit = item.unit || 'ชิ้น';
  const workName = item.name || item.work_name || `งานที่ ${index + 1}`;
  const originalQuantity = Number(item.originalQuantity || 0);
  const hasQuantityMismatch = originalQuantity > 0 && totalQuantity !== originalQuantity;

  const knownUnits = ['ชิ้น', 'ตัว', 'ชุด', 'กล่อง', 'แพ็ค'];
  const unitSelectValue = knownUnits.includes(unit) ? unit : 'อื่นๆ';

  const handleDeleteItem = () => {
    onDeleteItem?.(index);
  };

  const handleItemChange = (field, value) => {
    onChangeItem?.(index, field, value);
  };

  return (
    <InvoiceCard elevation={1}>
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {workName}
            </Typography>
            {isEditing && (
              <TextField
                size="small"
                label="ชื่องาน"
                placeholder="กรุณาระบุชื่องาน"
                value={workName}
                onChange={(e) => handleItemChange('name', e.target.value)}
                sx={{ minWidth: 200 }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InvoiceChip
              size="small"
              variant="outlined"
              label={`${totalQuantity.toLocaleString()} ${unit}`}
            />
            {hasQuantityMismatch && (
              <InvoiceChip
                size="small"
                variant="error"
                label={`PR: ${originalQuantity.toLocaleString()} ${unit}`}
              />
            )}
            {isEditing && (
              <InvoiceDeleteButton
                size="small"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={handleDeleteItem}
              >
                ลบงานนี้
              </InvoiceDeleteButton>
            )}
          </Box>
        </Box>

        {/* Item Properties */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="แพทเทิร์น"
              value={item.pattern || ''}
              onChange={(e) => handleItemChange('pattern', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="ประเภทผ้า"
              value={item.fabricType || ''}
              onChange={(e) => handleItemChange('fabricType', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="สี"
              value={item.color || ''}
              onChange={(e) => handleItemChange('color', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="ขนาด (สรุป)"
              value={item.size || ''}
              onChange={(e) => handleItemChange('size', e.target.value)}
              disabled={!isEditing || hasDetailedRows}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small" disabled={!isEditing}>
              <InputLabel>หน่วย</InputLabel>
              <Select
                value={unitSelectValue}
                onChange={(e) => {
                  const newUnit = e.target.value === 'อื่นๆ' ? '' : e.target.value;
                  handleItemChange('unit', newUnit);
                }}
                label="หน่วย"
              >
                <MenuItem value="ชิ้น">ชิ้น</MenuItem>
                <MenuItem value="ตัว">ตัว</MenuItem>
                <MenuItem value="ชุด">ชุด</MenuItem>
                <MenuItem value="กล่อง">กล่อง</MenuItem>
                <MenuItem value="แพ็ค">แพ็ค</MenuItem>
                <MenuItem value="อื่นๆ">อื่นๆ</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Size Details Section - Use InvoiceSizeRowsEditor */}
        <Box sx={{ mt: 2 }}>
          <InvoiceSizeRowsEditor
            rows={item.sizeRows || []}
            isEditing={isEditing}
            onAddRow={onAddRow}
            onChangeRow={onChangeRow}
            onRemoveRow={onRemoveRow}
            itemIndex={index}
            unit={unit}
          />
        </Box>

        {/* Total Summary */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6} md={4}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary">ยอดรวม</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.primary }}>
                {formatTHB(totalAmount)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </InvoiceCard>
  );
});

export default InvoiceSummaryCard;