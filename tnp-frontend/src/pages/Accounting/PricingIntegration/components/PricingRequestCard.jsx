import React from 'react';
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

const PricingRequestCard = ({ group, onCreateQuotation, onViewDetails }) => {
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'complete':
            case 'ได้ราคาแล้ว': return 'success';
            case 'pending':
            case 'รอทำราคา': return 'warning';
            case 'in_progress':
            case 'กำลังทำราคา': return 'info';
            default: return 'primary';
        }
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

                {/* Summary Chips */}
                <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
                    <Chip label={`ทั้งหมด ${group.total_count}`} size="small" />
                    {Object.entries(group.status_counts).map(([status, count]) => (
                        <Chip
                            key={status}
                            label={`${status} ${count}`}
                            size="small"
                            color={getStatusColor(status)}
                        />
                    ))}
                    {group.quoted_count > 0 && (
                        <Chip
                            label={`มีใบเสนอราคา ${group.quoted_count}`}
                            color="warning"
                            size="small"
                        />
                    )}
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {/* List of Pricing Requests */}
                <Stack spacing={1}>
                    {group.requests.map((req) => (
                        <Box
                            key={req.pr_id}
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                        >
                            <Typography variant="body2" color="text.primary">
                                {req.pr_number || req.pr_id?.slice(-8)} - {req.pr_work_name || '-'}
                            </Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                {req.is_quoted && (
                                    <Chip label="มีใบเสนอราคาแล้ว" color="warning" size="small" />
                                )}
                                {req.pr_status && (
                                    <Chip
                                        label={req.pr_status}
                                        color={getStatusColor(req.pr_status)}
                                        size="small"
                                        icon={<CheckCircleIcon />}
                                    />
                                )}
                            </Stack>
                        </Box>
                    ))}
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

export default PricingRequestCard;
