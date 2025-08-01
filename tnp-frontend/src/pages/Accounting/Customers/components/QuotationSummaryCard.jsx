import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box
} from '@mui/material';

const QuotationSummaryCard = ({ 
  selectedRequestsCount, 
  totalAmount, 
  formatCurrency 
}) => {
  if (selectedRequestsCount === 0) return null;

  return (
    <Card sx={{ mb: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
      <CardContent sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">จำนวนรายการ</Typography>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                {selectedRequestsCount}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">ยอดรวม (ไม่รวม VAT)</Typography>
              <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                {formatCurrency(totalAmount)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">ยอดรวมทั้งสิ้น (+VAT 7%)</Typography>
              <Typography variant="h6" color="error.main" sx={{ fontWeight: 600 }}>
                {formatCurrency(totalAmount * 1.07)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default QuotationSummaryCard;
