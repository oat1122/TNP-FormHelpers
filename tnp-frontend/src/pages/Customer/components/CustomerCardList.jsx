import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  useTheme,
  useMediaQuery,
  Grid,
  IconButton,
  Chip,
  Badge,
  Avatar,
  Stack,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

// Import required utilities for recall functionality
import { dialog_delete_by_id as swal_delete_by_id } from '../../../utils/dialog_swal2/dialog_delete_by_id';
import { 
  open_dialog_loading, 
  open_dialog_ok_timer, 
  open_dialog_error 
} from '../../../utils/dialog_swal2/alart_one_line';

// Safe import with try-catch wrapper
const safeFormatCustomRelativeTime = (dateString) => {
  try {
    // ใช้ moment หรือ dayjs เพื่อคำนวณวันที่
    if (!dateString) return 0;
    
    // Handle object case
    let dateValue = dateString;
    if (typeof dateString === 'object') {
      dateValue = dateString?.date || dateString?.datetime || dateString?.last_datetime || null;
    }
    
    if (!dateValue) return 0;
    
    const recallDate = new Date(dateValue);
    const today = new Date();
    
    // Reset time to start of day
    recallDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = recallDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.warn('Error calculating relative time:', error);
    return 0;
  }
};

// Error Boundary Component
class CustomerCardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CustomerCard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card sx={{ mb: 2, p: 2, backgroundColor: '#ffebee' }}>
          <Typography variant="body2" color="error">
            ⚠️ เกิดข้อผิดพลาดในการแสดงข้อมูลลูกค้า
          </Typography>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Simple address parser fallback
const parseFullAddress = (fullAddress) => {
  if (!fullAddress || typeof fullAddress !== 'string') {
    return {
      address: '',
      subdistrict: '',
      district: '',
      province: '',
      zipCode: ''
    };
  }

  try {
    // ใช้วิธีง่ายๆ แยกที่อยู่
    const parts = fullAddress.trim().split(' ');
    
    // หารหัสไปรษณีย์ (5 หลักสุดท้าย)
    const zipCode = parts[parts.length - 1];
    const isZipCode = /^\d{5}$/.test(zipCode);
    
    if (isZipCode) {
      const addressParts = parts.slice(0, -1);
      const province = addressParts[addressParts.length - 1] || '';
      const district = addressParts[addressParts.length - 2] || '';
      const subdistrict = addressParts[addressParts.length - 3] || '';
      const address = addressParts.slice(0, -3).join(' ') || '';
      
      return {
        address: address,
        subdistrict: subdistrict,
        district: district,
        province: province,
        zipCode: zipCode
      };
    }
    
    // ถ้าไม่มีรหัสไปรษณีย์ ให้แสดงที่อยู่ทั้งหมด
    return {
      address: fullAddress,
      subdistrict: '',
      district: '',
      province: '',
      zipCode: ''
    };
  } catch (error) {
    console.warn('Error parsing address:', error);
    return {
      address: fullAddress,
      subdistrict: '',
      district: '',
      province: '',
      zipCode: ''
    };
  }
};

// 🔹 แสดงการ์ดลูกค้ารายบุคคล
const CustomerCard = ({ customer, onView, onEdit, handleRecall }) => {
  const theme = useTheme();
  
  // Defensive programming - ตรวจสอบ customer object
  if (!customer || typeof customer !== 'object') {
    console.warn('Invalid customer object:', customer);
    return null;
  }

  const parsedAddress = customer.cus_address
    ? parseFullAddress(typeof customer.cus_address === 'object' ? 
        (customer.cus_address?.address || customer.cus_address?.full_address || JSON.stringify(customer.cus_address)) : 
        customer.cus_address
      )
    : {};

  let relativeRecall = 0;
  try {
    relativeRecall = safeFormatCustomRelativeTime(customer.cd_last_datetime);
  } catch (error) {
    console.warn('Error formatting relative time:', error);
    relativeRecall = 0;
  }
  
  // กำหนดสีตาม recall status
  const getRecallStatus = () => {
    if (!customer.cd_last_datetime) return { color: 'default', text: 'ไม่ได้นัด' };
    
    if (relativeRecall === 0) return { color: 'warning', text: 'นัดวันนี้' };
    if (relativeRecall < 0) return { color: 'error', text: `เกิน ${Math.abs(relativeRecall)} วัน` }; // Only use "เกิน" for overdue
    return { color: 'success', text: `${relativeRecall} วัน` }; // Normal future dates without "อีก" or "เกิน"
  };

  const recallStatus = getRecallStatus();

  // ย่อชื่อเป็นตัวอักษรย่อสำหรับ Avatar
  const getInitials = (name) => {
    if (!name) return 'N/A';
    
    // Handle object case
    if (typeof name === 'object') {
      const nameValue = name?.name || name?.user_name || name?.username || 'N/A';
      const words = nameValue.toString().trim().split(' ');
      if (words.length >= 2) {
        return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
      }
      return words[0].charAt(0).toUpperCase();
    }
    
    // Handle string case
    const words = name.toString().trim().split(' ');
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return words[0].charAt(0).toUpperCase();
  };

  // แปลงเกรดแสดงเป็นภาษาไทย
  const getGradeDisplay = () => {
    const gradeMapping = {
      'A': 'เกรด A',
      'B': 'เกรด B', 
      'C': 'เกรด C',
      'D': 'เกรด D',
    };
    
    // หาเกรดจาก customer group name - handle object case
    let groupName = '';
    if (typeof customer.mcg_name === 'object') {
      groupName = customer.mcg_name?.name || customer.mcg_name?.group_name || '';
    } else {
      groupName = customer.mcg_name || '';
    }
    
    const grade = groupName.match(/Grade\s*([A-D])/i)?.[1];
    return grade ? gradeMapping[grade.toUpperCase()] : (groupName || 'ไม่ระบุ');
  };

  return (
    <CustomerCardErrorBoundary>
      <Card
        sx={{
          mb: 2,
          boxShadow: 2,
          borderRadius: 3,
          borderLeft: `4px solid #9e0000`, // เปลี่ยนเป็นสีหลัก
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-2px)',
          },
          backgroundColor: '#fffaf9', // พื้นหลัง Card ใหม่
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Header Row */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            mb: 1.5 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar 
                sx={{ 
                  bgcolor: '#9e0000', // สีหลักใหม่
                  width: 40, 
                  height: 40,
                  fontSize: '0.9rem',
                  color: 'white' // ตรวจสอบให้ตัวอักษรเห็นชัด
                }}
              >
                {getInitials(customer.cus_name)}
              </Avatar>
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '1rem',
                    lineHeight: 1.2,
                    color: '#9e0000' // สีหลักสำหรับชื่อ
                  }}
                >
                  {typeof customer.cus_name === 'object' ? 
                    (customer.cus_name?.name || customer.cus_name?.user_name || 'ไม่ระบุชื่อ') : 
                    (customer.cus_name || 'ไม่ระบุชื่อ')
                  }
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.75rem'
                  }}
                >
                  รหัส: {typeof customer.cus_no === 'object' ? 
                    (customer.cus_no?.code || customer.cus_no?.number || 'N/A') : 
                    (customer.cus_no || 'N/A')
                  }
                </Typography>
              </Box>
            </Box>
            
            {/* Action Buttons */}
            <Stack direction="row" spacing={0.5}>
              <IconButton 
                size="small"
                onClick={() => {
                  try {
                    if (typeof onView === 'function') {
                      onView(customer.cus_id);
                    }
                  } catch (error) {
                    console.error('Error calling onView:', error);
                  }
                }}
                sx={{ 
                  bgcolor: theme.palette.action.hover,
                  '&:hover': { bgcolor: '#9e0000', color: 'white' } // สีหลักเมื่อ hover
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small"
                onClick={() => {
                  try {
                    if (typeof onEdit === 'function') {
                      onEdit(customer.cus_id);
                    }
                  } catch (error) {
                    console.error('Error calling onEdit:', error);
                  }
                }}
                sx={{ 
                  bgcolor: theme.palette.action.hover,
                  '&:hover': { bgcolor: '#d32f2f', color: 'white' } // สีรองสำหรับปุ่ม Edit
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          <Divider sx={{ my: 1.5, borderColor: '#9e000022' }} /> {/* เส้น Divider สีใหม่ */}

          {/* Info Section */}
          <Stack spacing={1}>
            {/* Company */}
            {customer.cus_company && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon 
                  fontSize="small" 
                  sx={{ color: '#9e0000', minWidth: 20 }} // สีหลักสำหรับ icon
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.8rem',
                    color: theme.palette.text.primary
                  }}
                >
                  {typeof customer.cus_company === 'object' ? 
                    (customer.cus_company?.name || customer.cus_company?.company_name || 'ไม่ระบุ') : 
                    (customer.cus_company || 'ไม่ระบุ')
                  }
                </Typography>
              </Box>
            )}

            {/* Phone */}
            {customer.cus_tel_1 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <PhoneIcon 
                  fontSize="small" 
                  sx={{ color: '#9e0000', minWidth: 20 }} // สีหลักสำหรับ icon
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.8rem',
                    color: theme.palette.text.primary
                  }}
                >
                  {typeof customer.cus_tel_1 === 'object' ? 
                    (customer.cus_tel_1?.number || customer.cus_tel_1?.phone || 'ไม่ระบุ') : 
                    (customer.cus_tel_1 || 'ไม่ระบุ')
                  }
                </Typography>
                {/* Call Button */}
                <IconButton
                  size="small"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const phoneNumber = typeof customer.cus_tel_1 === 'object' ? 
                      (customer.cus_tel_1?.number || customer.cus_tel_1?.phone) : 
                      customer.cus_tel_1;
                    
                    if (phoneNumber && phoneNumber !== 'ไม่ระบุ') {
                      try {
                        // 1. Make the phone call first
                        const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
                        window.open(`tel:${cleanPhone}`, '_self');
                        
                        // 2. Ask for recall reset confirmation
                        const confirmed = await swal_delete_by_id(
                          `โทรเรียบร้อยแล้ว ต้องการรีเซตเวลานัดของ ${customer.cus_name || 'ลูกค้า'} หรือไม่?`
                        );

                        if (confirmed && handleRecall) {
                          // 3. Reset recall if confirmed
                          await handleRecall({
                            cus_mcg_id: customer.cus_mcg_id,
                            cd_id: customer.cd_id,
                            cus_name: customer.cus_name
                          });
                        }
                      } catch (error) {
                        console.error('Error in call/recall process:', error);
                        open_dialog_error('เกิดข้อผิดพลาดในการดำเนินการ', error);
                      }
                    }
                  }}
                  sx={{
                    backgroundColor: '#9e0000',
                    color: 'white',
                    width: 28,
                    height: 28,
                    ml: 0.5,
                    '&:hover': {
                      backgroundColor: '#d32f2f',
                    },
                    '&:active': {
                      backgroundColor: '#7d0000',
                    }
                  }}
                  title="โทรออก + รีเซตเวลานัด"
                >
                  <PhoneIcon sx={{ fontSize: 14 }} />
                </IconButton>
                
                {/* Recall Date Display */}
                {customer.cd_last_datetime && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    ml: 'auto', // Push to right side
                    bgcolor: recallStatus.color === 'error' ? 'rgba(211, 47, 47, 0.1)' : 
                             recallStatus.color === 'warning' ? 'rgba(237, 108, 2, 0.1)' : 
                             'rgba(46, 125, 50, 0.1)',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    border: `1px solid ${
                      recallStatus.color === 'error' ? 'rgba(211, 47, 47, 0.3)' : 
                      recallStatus.color === 'warning' ? 'rgba(237, 108, 2, 0.3)' : 
                      'rgba(46, 125, 50, 0.3)'
                    }`
                  }}>
                    <CalendarTodayIcon 
                      fontSize="small" 
                      sx={{ 
                        fontSize: '0.75rem',
                        color: recallStatus.color === 'error' ? '#d32f2f' : 
                               recallStatus.color === 'warning' ? '#ed6c02' : 
                               '#2e7d32'
                      }} 
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        color: recallStatus.color === 'error' ? '#d32f2f' : 
                               recallStatus.color === 'warning' ? '#ed6c02' : 
                               '#2e7d32'
                      }}
                    >
                      {recallStatus.text}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Address */}
            {customer.cus_address && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <LocationOnIcon 
                  fontSize="small" 
                  sx={{ 
                    color: '#9e0000', // สีหลักสำหรับ icon
                    minWidth: 20,
                    mt: 0.1
                  }} 
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.8rem',
                    color: theme.palette.text.primary,
                    lineHeight: 1.3
                  }}
                >
                  {parsedAddress.address && `${parsedAddress.address} `}
                  {parsedAddress.subdistrict && `${parsedAddress.subdistrict} `}
                  {parsedAddress.district && `${parsedAddress.district} `}
                  {parsedAddress.province && `${parsedAddress.province} `}
                  {parsedAddress.zipCode && parsedAddress.zipCode}
                </Typography>
              </Box>
            )}

            {/* Sales Person */}
            {customer.cus_manage_by && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon 
                  fontSize="small" 
                  sx={{ color: '#9e0000', minWidth: 20 }} // สีหลักสำหรับ icon
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.8rem',
                    color: theme.palette.text.primary
                  }}
                >
                  ดูแลโดย: {typeof customer.cus_manage_by === 'object' ? 
                    (customer.cus_manage_by?.username || customer.cus_manage_by?.user_name || 'ไม่ระบุ') : 
                    (customer.cus_manage_by || 'ไม่ระบุ')
                  }
                </Typography>
              </Box>
            )}

            {/* Notes */}
            {customer.cd_note && (
              <Box sx={{ 
                bgcolor: '#fffaf9', // พื้นหลังเดียวกับ card
                p: 1,
                borderRadius: 1,
                borderLeft: `3px solid #d32f2f` // ใช้สีรองสำหรับ accent
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.75rem',
                    color: theme.palette.text.secondary,
                    fontStyle: 'italic'
                  }}
                >
                  💬 {typeof customer.cd_note === 'object' ? 
                    (customer.cd_note?.note || customer.cd_note?.comment || 'ไม่มีหมายเหตุ') : 
                    (customer.cd_note || 'ไม่มีหมายเหตุ')
                  }
                </Typography>
              </Box>
            )}
          </Stack>

          {/* Footer - Created Date */}
          {customer.cus_created_date && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              mt: 1.5,
              pt: 1,
              borderTop: `1px solid #9e000022` // เส้น divider สีใหม่
            }}>
              <CalendarTodayIcon 
                fontSize="small" 
                sx={{ color: '#9e0000', fontSize: '0.9rem' }} // สีหลักสำหรับ icon
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.disabled,
                  fontSize: '0.7rem'
                }}
              >
                สร้างเมื่อ: {(() => {
                  try {
                    const dateValue = typeof customer.cus_created_date === 'object' ? 
                      (customer.cus_created_date?.date || customer.cus_created_date?.created_at || new Date().toISOString()) : 
                      customer.cus_created_date;
                    return new Date(dateValue).toLocaleDateString('th-TH');
                  } catch (error) {
                    console.warn('Error formatting date:', error);
                    return 'ไม่ระบุ';
                  }
                })()}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </CustomerCardErrorBoundary>
  );
};

// 🔸 แสดงรายการลูกค้าทั้งหมดเป็น Card บนมือถือ
const CustomerCardList = ({ 
  customers, 
  onView, 
  onEdit, 
  handleRecall,
  loading = false,
  totalCount = 0,
  paginationModel = { page: 0, pageSize: 30 },
  onPaginationChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // แสดงเฉพาะบน mobile และ tablet
  if (!isMobile && !isTablet) return null;

  // Loading state
  if (loading) {
    return (
      <Box sx={{ px: 2, py: 6, textAlign: 'center' }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 2 
        }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: `3px solid ${theme.palette.primary.light}`,
              borderTop: `3px solid ${theme.palette.primary.main}`,
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
          <Typography 
            variant="body2" 
            color="text.secondary"
          >
            กำลังโหลดข้อมูล...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Empty state
  if (!customers || customers.length === 0) {
    return (
      <Box sx={{ px: 2, py: 6, textAlign: 'center' }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 2 
        }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: theme.palette.grey[100],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1
            }}
          >
            <PersonIcon sx={{ fontSize: 40, color: theme.palette.grey[400] }} />
          </Box>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ mb: 1 }}
          >
            ไม่พบข้อมูลลูกค้า
          </Typography>
          <Typography 
            variant="body2" 
            color="text.disabled"
          >
            ลองเปลี่ยนตัวกรองหรือค้นหาใหม่อีกครั้ง
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1, sm: 2 }, py: 2 }}>
      {/* Summary */}
      <Box sx={{ mb: 2, px: 1 }}>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: '0.85rem' }}
        >
          แสดง {customers.length} จากทั้งหมด {totalCount} รายการ
          {paginationModel && (
            <span style={{ marginLeft: '8px' }}>
              (หน้า {paginationModel.page + 1})
            </span>
          )}
        </Typography>
      </Box>

      {/* Cards Grid */}
      <Grid container spacing={{ xs: 1, sm: 2 }}>
        {customers.map((customer) => (
          <Grid 
            item 
            xs={12} 
            sm={isTablet ? 6 : 12} // 2 columns on tablet, 1 column on mobile
            key={customer?.cus_id || `customer-${Math.random()}`}
          >
            <CustomerCardErrorBoundary>
              <CustomerCard 
                customer={customer} 
                onView={onView} 
                onEdit={onEdit} 
                handleRecall={handleRecall}
              />
            </CustomerCardErrorBoundary>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Default export with error handling
const SafeCustomerCardList = (props) => {
  try {
    return <CustomerCardList {...props} />;
  } catch (error) {
    console.error('CustomerCardList Error:', error);
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="error">
          ⚠️ เกิดข้อผิดพลาดในการแสดงรายการลูกค้า
        </Typography>
      </Box>
    );
  }
};

export default SafeCustomerCardList;
