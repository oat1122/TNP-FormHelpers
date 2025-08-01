import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Typography,
  TextField,
  IconButton,
  Box,
  Tooltip
} from '@mui/material';
import {
  History as HistoryIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

const PricingRequestTable = ({
  availableRequests,
  selectedRequests,
  handleSelectAll,
  handleToggleRequest,
  getQuantity,
  getEffectiveUnitPrice,
  getEffectiveTotalPrice,
  handleUnitPriceChange,
  formatCurrency,
  handleViewNotes,
  handleViewDetails
}) => {
  return (
    <TableContainer component={Paper} sx={{ mb: 3, maxHeight: '60vh', overflow: 'auto' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" sx={{ minWidth: 50 }}>
              <Checkbox
                checked={selectedRequests.length === availableRequests.length && availableRequests.length > 0}
                indeterminate={selectedRequests.length > 0 && selectedRequests.length < availableRequests.length}
                onChange={handleSelectAll}
                size="small"
              />
            </TableCell>
            <TableCell sx={{ minWidth: 120, fontWeight: 600 }}>เลขที่</TableCell>
            <TableCell sx={{ minWidth: 200, fontWeight: 600 }}>ชื่องาน</TableCell>
            <TableCell align="right" sx={{ minWidth: 100, fontWeight: 600 }}>จำนวน</TableCell>
            <TableCell align="right" sx={{ minWidth: 140, fontWeight: 600 }}>ราคา/ชิ้น</TableCell>
            <TableCell align="right" sx={{ minWidth: 120, fontWeight: 600 }}>ราคารวม</TableCell>
            <TableCell align="center" sx={{ minWidth: 120, fontWeight: 600 }}>การดำเนินการ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {availableRequests.map((request) => {
            const requestId = request.id || request.pr_id;
            const quantity = getQuantity(request);
            
            return (
              <TableRow 
                key={requestId}
                selected={selectedRequests.includes(requestId)}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => handleToggleRequest(requestId)}
              >
                {/* Checkbox */}
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedRequests.includes(requestId)}
                    onChange={() => handleToggleRequest(requestId)}
                    size="small"
                  />
                </TableCell>
                
                {/* เลขที่ */}
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {request.pr_no || request.id || request.pr_id}
                  </Typography>
                </TableCell>
                
                {/* ชื่องาน */}
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {request.pr_work_name || request.product_name}
                  </Typography>
                  {request.pr_pattern && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {request.pr_pattern}
                    </Typography>
                  )}
                </TableCell>
                
                {/* จำนวน */}
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {quantity.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    ชิ้น
                  </Typography>
                </TableCell>
                
                {/* ราคาต่อชิ้น */}
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    value={getEffectiveUnitPrice(request)}
                    onChange={(e) => handleUnitPriceChange(requestId, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    InputProps={{
                      startAdornment: <span style={{ marginRight: 4, fontSize: '0.75rem' }}>฿</span>,
                      inputProps: { 
                        min: 0, 
                        step: 0.01,
                        style: { 
                          textAlign: 'right',
                          fontWeight: 600,
                          color: '#1976d2',
                          fontSize: '0.8rem'
                        }
                      }
                    }}
                    sx={{ 
                      width: 120,
                      '& .MuiOutlinedInput-root': {
                        height: 32,
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        }
                      }
                    }}
                    placeholder="กรอกราคา"
                  />
                </TableCell>
                
                {/* ราคารวม */}
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {formatCurrency(getEffectiveTotalPrice(request))}
                  </Typography>
                </TableCell>
                
                {/* การดำเนินการ */}
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    <Tooltip title="ดู Notes และประวัติ" arrow>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewNotes(request);
                        }}
                        sx={{ 
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'primary.50' }
                        }}
                      >
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="ดูรายละเอียดเพิ่มเติม" arrow>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(request);
                        }}
                        sx={{ 
                          color: 'info.main',
                          '&:hover': { bgcolor: 'info.50' }
                        }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PricingRequestTable;
