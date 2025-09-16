/**
 * Component for displaying deposit information cards based on mode
 */

import React from 'react';
import { Box, Card, Typography, Stack } from '@mui/material';
import { formatTHB } from '../utils/invoiceFormatters';
import LabeledSwitch from '../../../shared/components/LabeledSwitch';

const DepositCard = ({ 
  mode, 
  depositAmount, 
  paidAmount, 
  remaining, 
  activeSideStatus,
  hasEvidence,
  onModeChange
}) => {
  if (depositAmount <= 0) return null;

  return (
    <Box sx={{ ml: 4.5 }}>
      {/* Mode Toggle */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <LabeledSwitch
          value={mode}
          disabled={!hasEvidence} // ปิดใช้งานเมื่อยังไม่มีหลักฐานการชำระ
          onChange={onModeChange}
          options={[
            { value: 'before', label: 'มัดจำก่อน' },
            { value: 'after', label: 'มัดจำหลัง' }
          ]}
          size="small"
          customColor={(theme)=> theme.palette.warning.main}
          selectedTextColor="#f1c40f"
          sx={{ ml: 1 }}
        />
      </Box>

      {mode === 'before' ? (
        /* Deposit Before Card - Original Style */
        <Card sx={{ 
          p: 2, 
          mb: 2, 
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h6" sx={{ mb: 1.5, color: 'text.primary', fontSize: '1rem' }}>
            💰 มัดจำก่อน
          </Typography>
          <Stack spacing={1}>
            {depositAmount > 0 && (
              <Typography sx={{ 
                color: 'warning.main', 
                fontWeight: 500,
                fontSize: '0.9rem',
                lineHeight: 1.45
              }}>
                มัดจำ: {formatTHB(depositAmount)}
              </Typography>
            )}
            {paidAmount > 0 && (
              <Typography sx={{ 
                color: 'success.main', 
                fontWeight: 500,
                fontSize: '0.9rem',
                lineHeight: 1.45
              }}>
                ✓ ชำระแล้ว: {formatTHB(paidAmount)}
              </Typography>
            )}
            {remaining > 0 && (
              <Typography sx={{ 
                color: 'error.main', 
                fontWeight: 700,
                fontSize: '0.95rem',
                lineHeight: 1.45
              }}>
                ⚠ ยอดคงเหลือ: {formatTHB(remaining)}
              </Typography>
            )}
          </Stack>
        </Card>
      ) : (
        /* Deposit After Card - Special #E36264 Background */
        <Card sx={{ 
          p: 2, 
          mb: 2, 
          bgcolor: '#E36264',
          color: 'white',
          '& .MuiTypography-root': { color: 'white' }
        }}>
          <Typography variant="h6" sx={{ mb: 1.5, color: 'white !important', fontSize: '1rem' }}>
            มัดจำหลัง
          </Typography>
          <Stack spacing={1}>
            {paidAmount > 0 && (
              <Typography sx={{ 
                color: 'rgba(255,255,255,0.9) !important', 
                fontWeight: 500,
                fontSize: '0.9rem',
                lineHeight: 1.45
              }}>
                ✓ ชำระแล้ว: {formatTHB(paidAmount)}
              </Typography>
            )}
            {depositAmount > 0 && (
              <Typography sx={{ 
                color: 'rgba(255,255,255,0.9) !important', 
                fontWeight: 500,
                fontSize: '0.9rem',
                lineHeight: 1.45
              }}>
                มัดจำ: {formatTHB(depositAmount)}
              </Typography>
            )}
            {remaining > 0 && (
              <Typography sx={{ 
                color: 'white !important', 
                fontWeight: 700,
                fontSize: '0.95rem',
                lineHeight: 1.45
              }}>
                ⚠ ยอดคงเหลือ: {formatTHB(remaining)}
              </Typography>
            )}
            {activeSideStatus === 'pending' && (
              <Typography sx={{ 
                color: 'rgba(255,255,255,0.8) !important', 
                fontWeight: 400,
                fontSize: '0.85rem',
                fontStyle: 'italic'
              }}>
                สถานะ: รออนุมัติ{mode === 'after' ? 'มัดจำหลัง' : ''}
              </Typography>
            )}
          </Stack>
        </Card>
      )}
    </Box>
  );
};

export default DepositCard;