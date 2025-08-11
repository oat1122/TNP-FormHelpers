import React, { memo } from 'react';
import {
    Box,
    CardActions,
    Avatar,
    Stack,
} from '@mui/material';
import {
    Assignment as AssignmentIcon,
    CheckCircle as CheckCircleIcon,
    Business as BusinessIcon,
    Edit as EditIcon,
} from '@mui/icons-material';

// 🎨 Import TNP Styled Components สำหรับ UI ที่อ่านง่าย
import {
    TNPCard,
    TNPCardContent,
    TNPHeading,
    TNPSubheading,
    TNPBodyText,
    TNPPRNumber,
    TNPStatusChip,
    TNPCountChip,
    TNPPrimaryButton,
    TNPSecondaryButton,
    TNPListItem,
    TNPDivider,
} from './styles/StyledComponents';

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
const PricingRequestCard = ({ group, onCreateQuotation, onEditCustomer }) => {
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
        <TNPCard>
            <TNPCardContent>
                {/* 👤 Customer Info - ปรับปรุงให้อ่านง่ายและสวยงาม */}
                <Box display="flex" alignItems="center" mb={2.5}>
                    <Avatar
                        sx={{ 
                            bgcolor: 'secondary.main', 
                            width: 48, 
                            height: 48, 
                            mr: 2,
                            boxShadow: '0 2px 8px rgba(178, 0, 0, 0.2)',
                        }}
                    >
                        <BusinessIcon sx={{ fontSize: '1.5rem' }} />
                    </Avatar>
                    <Box flex={1}>
                        <TNPHeading variant="h6">
                            {group.customer?.cus_company || 'ไม่ระบุบริษัท'}
                        </TNPHeading>
                        <TNPSubheading>
                            {[
                                group.customer?.cus_firstname,
                                group.customer?.cus_lastname,
                            ].filter(Boolean).join(' ') || 'ไม่ระบุชื่อ'}
                        </TNPSubheading>
                    </Box>
                </Box>

                {/* 📊 Summary Chips - ปรับปรุงให้เป็นระบบและอ่านง่าย */}
                <Stack direction="row" spacing={1} flexWrap="wrap" mb={2.5}>
                    <TNPCountChip 
                        label={`ทั้งหมด ${group.total_count} งาน`} 
                        size="small" 
                    />
                    {Object.entries(group.status_counts).map(([status, count]) => (
                        <TNPStatusChip
                            key={status}
                            label={`${status} (${count})`}
                            size="small"
                            statuscolor={getStatusColor(status)}
                        />
                    ))}
                    {group.quoted_count > 0 && (
                        <TNPStatusChip
                            label={`มีใบเสนอราคา ${group.quoted_count} งาน`}
                            statuscolor="warning"
                            size="small"
                        />
                    )}
                </Stack>

                <TNPDivider />

                {/* 📋 List of Pricing Requests - ปรับปรุงให้อ่านง่ายขึ้น */}
                <Stack spacing={1.5}>
                    {group.requests.map((req) => {
                        const primaryStatus = getPrimaryStatus(req);
                        
                        return (
                            <TNPListItem key={req.pr_id}>
                                {/* หมายเลข PR และชื่องาน */}
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                    <TNPPRNumber>
                                        #{getPRDisplayNumber(req)}
                                    </TNPPRNumber>
                                    
                                    {/* แสดงสถานะอย่างชัดเจน */}
                                    {primaryStatus && (
                                        <TNPStatusChip 
                                            label={primaryStatus.label}
                                            statuscolor={primaryStatus.color}
                                            size="small"
                                            icon={primaryStatus.showIcon ? <CheckCircleIcon sx={{ fontSize: '0.875rem' }} /> : undefined}
                                        />
                                    )}
                                </Box>
                                
                                {/* ชื่องาน */}
                                <TNPBodyText>
                                    {req.pr_work_name || 'ไม่ระบุชื่องาน'}
                                </TNPBodyText>
                            </TNPListItem>
                        );
                    })}
                </Stack>
            </TNPCardContent>

            <TNPDivider />

              <CardActions sx={{ p: 2.5, justifyContent: 'space-between', bgcolor: 'background.light' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                      <TNPSecondaryButton
                          size="medium"
                          startIcon={<EditIcon />}
                          onClick={() => onEditCustomer?.(group)}
                      >
                          แก้ไขลูกค้า
                      </TNPSecondaryButton>
                  </Box>
                  <TNPPrimaryButton
                      variant="contained"
                      size="medium"
                      startIcon={<AssignmentIcon />}
                      onClick={() => onCreateQuotation(group)}
                      disabled={group.is_quoted}
                  >
                      สร้างใบเสนอราคา
                  </TNPPrimaryButton>
              </CardActions>
        </TNPCard>
    );
};

// � ป้องกันการ re-render ที่ไม่จำเป็นด้วย React.memo
// Component จะ re-render เฉพาะเมื่อ props เปลี่ยนแปลงเท่านั้น
export default memo(PricingRequestCard);
