import React, { memo } from 'react';
import {
    Box,
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Chip,
    Avatar,
    Stack,
    Divider,
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Assignment as AssignmentIcon,
    CheckCircle as CheckCircleIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';

/**
 * 🎯 PricingRequestCard Component
 * 
 * แสดงการ์สำหรับแต่ละลูกค้าที่มี pricing requests
 * 
 * @param {Object} props
 * @param {Object} props.group - ข้อมูลกลุ่ม pricing requests ของลูกค้า
 * @param {string} props.group._customerId - ID ลูกค้า
 * @param {Object} props.group.customer - ข้อมูลลูกค้า (cus_company, cus_firstname, cus_lastname)
 * @param {Array} props.group.requests - รายการ pricing requests (pr_id, pr_no, pr_work_name, pr_status, is_quoted)
 * @param {number} props.group.total_count - จำนวน requests ทั้งหมด
 * @param {number} props.group.quoted_count - จำนวน requests ที่มีใบเสนอราคา
 * @param {boolean} props.group.is_quoted - สถานะว่าทุก requests มีใบเสนอราคาหรือไม่
 * @param {Object} props.group.status_counts - จำนวนแยกตามสถานะ
 * @param {Function} props.onCreateQuotation - ฟังก์ชันสำหรับสร้างใบเสนอราคา
 * @param {Function} props.onViewDetails - ฟังก์ชันสำหรับดูรายละเอียด
 */
const PricingRequestCard = ({ group, onCreateQuotation, onViewDetails }) => {
    // 🎨 Helper Functions for Status Management
    const getStatusColor = (status) => {
        const statusMap = {
            'complete': 'success',
            'ได้ราคาแล้ว': 'success',
            'pending': 'warning', 
            'รอทำราคา': 'warning',
            'in_progress': 'info',
            'กำลังทำราคา': 'info',
            'submitted': 'primary',
            'ส่งคำขอสร้างใบเสนอราคาแล้ว': 'primary'
        };
        return statusMap[status?.toLowerCase()] || 'primary';
    };

    // 🔍 Helper Function to get display PR number with fallback
    const getPRDisplayNumber = (req) => {
        return req.pr_no || req.pr_number || req.pr_id?.slice(-8) || 'N/A';
    };

    // 🏷️ Helper Function to determine primary status for display
    const getPrimaryStatus = (req) => {
        if (req.is_quoted) {
            return {
                label: 'มีใบเสนอราคาแล้ว',
                color: 'warning',
                showIcon: false
            };
        }
        
        if (req.pr_status) {
            return {
                label: req.pr_status,
                color: getStatusColor(req.pr_status),
                showIcon: true
            };
        }
        
        return null;
    };

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 20px rgba(144, 15, 15, 0.15)',
                },
                transition: 'all 0.3s ease-in-out',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
            }}
        >
            <CardContent sx={{ flexGrow: 1 }}>
                {/* Customer Info */}
                <Box display="flex" alignItems="center" mb={2}>
                    <Avatar
                        sx={{ bgcolor: 'secondary.main', width: 40, height: 40, mr: 2 }}
                    >
                        <BusinessIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={500}>
                            {group.customer?.cus_company || 'ไม่ระบุบริษัท'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {[
                                group.customer?.cus_firstname,
                                group.customer?.cus_lastname,
                            ].filter(Boolean).join(' ') || 'ไม่ระบุชื่อ'}
                        </Typography>
                    </Box>
                </Box>

                {/* 📊 Summary Chips - แสดงสรุปข้อมูลโดยรวม */}
                <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
                    <Chip 
                        label={`ทั้งหมด ${group.total_count}`} 
                        size="small" 
                        sx={{ 
                            bgcolor: 'primary.50',
                            color: 'primary.700',
                            fontWeight: 600
                        }}
                    />
                    {Object.entries(group.status_counts).map(([status, count]) => (
                        <Chip
                            key={status}
                            label={`${status} ${count}`}
                            size="small"
                            color={getStatusColor(status)}
                            sx={{ fontWeight: 500 }}
                        />
                    ))}
                    {group.quoted_count > 0 && (
                        <Chip
                            label={`มีใบเสนอราคา ${group.quoted_count}`}
                            color="warning"
                            size="small"
                            sx={{ fontWeight: 500 }}
                        />
                    )}
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {/* List of Pricing Requests */}
                <Stack spacing={1}>
                    {group.requests.map((req) => {
                        const primaryStatus = getPrimaryStatus(req);
                        
                        return (
                            <Box
                                key={req.pr_id}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{
                                    py: 0.5,
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                        borderRadius: 1,
                                        transition: 'background-color 0.2s ease-in-out'
                                    }
                                }}
                            >
                                <Typography 
                                    variant="body2" 
                                    color="text.primary"
                                    sx={{ 
                                        fontWeight: 500,
                                        flex: 1,
                                        mr: 1
                                    }}
                                >
                                    {getPRDisplayNumber(req)} - {req.pr_work_name || '-'}
                                </Typography>
                                
                                {/* แสดงสถานะเดียว - ป้องกันการซ้ำซ้อน */}
                                {primaryStatus && (
                                    <Chip 
                                        label={primaryStatus.label}
                                        color={primaryStatus.color}
                                        size="small"
                                        icon={primaryStatus.showIcon ? <CheckCircleIcon /> : undefined}
                                        sx={{ 
                                            fontWeight: 500,
                                            minWidth: 'auto',
                                            '& .MuiChip-label': {
                                                fontSize: '0.75rem'
                                            }
                                        }}
                                    />
                                )}
                            </Box>
                        );
                    })}
                </Stack>
            </CardContent>

            <Divider />

              <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
                  <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => onViewDetails(group)}
                      color="inherit"
                  >
                      ดูรายละเอียด
                  </Button>
                  <Button
                      variant="contained"
                      size="small"
                      startIcon={<AssignmentIcon />}
                      onClick={() => onCreateQuotation(group)}
                      disabled={group.is_quoted}
                      sx={{
                          borderRadius: 2,
                          fontWeight: 600,
                          textTransform: 'none',
                          '&:hover': {
                              transform: group.is_quoted ? 'none' : 'translateY(-1px)',
                              boxShadow: group.is_quoted ? 'none' : '0 6px 12px rgba(144, 15, 15, 0.25)',
                          },
                          transition: 'all 0.2s ease-in-out',
                      }}
                  >
                      สร้างใบเสนอราคา
                  </Button>
              </CardActions>
        </Card>
    );
};

// � ป้องกันการ re-render ที่ไม่จำเป็นด้วย React.memo
// Component จะ re-render เฉพาะเมื่อ props เปลี่ยนแปลงเท่านั้น
export default memo(PricingRequestCard);
