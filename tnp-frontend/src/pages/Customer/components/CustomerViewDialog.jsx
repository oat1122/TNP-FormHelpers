import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Grid2 as Grid,
  Chip,
  Divider,
  Avatar,
  IconButton,
  Collapse,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  MdClose,
  MdPerson,
  MdBusiness,
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdNotes,
  MdExpandMore,
  MdExpandLess,
  MdEdit,
  MdContactPhone,
  MdHistory,
  MdInfo,
} from "react-icons/md";
import { styled } from "@mui/material/styles";
import { formatCustomRelativeTime } from "../../../features/Customer/customerUtils";

// Styled components - ปรับสีตาม theme
const ViewCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  boxShadow: "0 2px 8px rgba(178, 0, 0, 0.1)", // ใช้สีแดงของ theme
  border: `1px solid #EBEBEB`, // สีเทาของ theme
  "&:hover": {
    boxShadow: "0 4px 16px rgba(178, 0, 0, 0.15)",
  },
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1, 0),
  borderBottom: `2px solid #B20000`, // สีแดงหลักของ theme
}));

const InfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(1.5),
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  "&:hover": {
    backgroundColor: "rgba(178, 0, 0, 0.05)", // hover สีแดงอ่อน
  },
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: "#212429", // สีเทาเข้มของ theme
  minWidth: 120,
  fontSize: "0.875rem",
}));

const InfoValue = styled(Typography)(({ theme }) => ({
  color: "#212429", // สีเทาเข้มของ theme
  fontWeight: 400,
  wordBreak: "break-word",
}));

const CustomerAvatar = styled(Avatar)(({ theme }) => ({
  width: 64,
  height: 64,
  backgroundColor: "#B20000", // สีแดงหลักของ theme
  fontSize: "1.5rem",
  fontWeight: 600,
}));

/**
 * CustomerViewDialog - Dialog สำหรับดูข้อมูลลูกค้าแบบ read-only
 * @param {Object} props
 * @param {boolean} props.open - เปิด/ปิด dialog
 * @param {Function} props.onClose - callback เมื่อปิด dialog
 * @param {Object} props.customerData - ข้อมูลลูกค้า
 * @param {Function} props.onEdit - callback เมื่อกดปุ่มแก้ไข
 */
const CustomerViewDialog = ({ 
  open, 
  onClose, 
  customerData, 
  onEdit 
}) => {
  // Early return if no customer data
  if (!customerData || !open) {
    return null;
  }

  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    contact: true,
    address: true,
    notes: false,
  });

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Generate customer initials - ป้องกัน null/undefined
  const getInitials = (firstName, lastName) => {
    const first = (firstName && typeof firstName === 'string') ? firstName.charAt(0)?.toUpperCase() : "";
    const last = (lastName && typeof lastName === 'string') ? lastName.charAt(0)?.toUpperCase() : "";
    return (first + last) || "?";
  };

  // Format relative time - ป้องกัน null/undefined
  const formattedRelativeTime = customerData?.cd_last_datetime 
    ? formatCustomRelativeTime(customerData.cd_last_datetime)
    : 0;
  
  // Check if recall is overdue
  const isOverdue = formattedRelativeTime <= 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: { borderRadius: 2, overflow: "hidden" }
      }}
    >
      {/* Dialog Header - ใช้สีตาม theme */}
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #B20000 0%, #900F0F 100%)", // สีแดงตาม theme
          color: "white",
          pb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CustomerAvatar>
              {getInitials(customerData.cus_firstname, customerData.cus_lastname)}
            </CustomerAvatar>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                {customerData.cus_company || "ไม่ระบุบริษัท"}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {customerData.cus_name || `${customerData.cus_firstname || ""} ${customerData.cus_lastname || ""}`}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Chip
                  label={`รหัส: ${customerData.cus_no || "N/A"}`}
                  size="small"
                  sx={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
                />
                <Chip
                  label={`${formattedRelativeTime} วัน`}
                  size="small"
                  sx={{
                    backgroundColor: isOverdue ? "#E36264" : "#2e7d32", // ใช้สีตาม theme
                    color: "white"
                  }}
                  icon={<MdHistory />}
                />
              </Box>
            </Box>
          </Box>
          <Box>
            {onEdit && (
              <Tooltip title="แก้ไขข้อมูล">
                <IconButton
                  onClick={() => onEdit(customerData.cus_id)}
                  sx={{ color: "white", mr: 1 }}
                >
                  <MdEdit />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={onClose} sx={{ color: "white" }}>
              <MdClose />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent sx={{ p: 3, backgroundColor: "#EBEBEB" }}>
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid size={12} md={6}>
            {/* Basic Information */}
            <ViewCard>
              <CardContent>
                <SectionHeader>
                  <MdPerson color="#B20000" />
                  <Typography variant="h6" sx={{ color: "#B20000" }}>
                    ข้อมูลพื้นฐาน
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => toggleSection("basic")}
                    sx={{ ml: "auto" }}
                  >
                    {expandedSections.basic ? <MdExpandLess /> : <MdExpandMore />}
                  </IconButton>
                </SectionHeader>
                
                <Collapse in={expandedSections.basic}>
                  <Stack spacing={1}>
                    <InfoRow>
                      <InfoLabel>ชื่อจริง:</InfoLabel>
                      <InfoValue>{customerData.cus_firstname || "-"}</InfoValue>
                    </InfoRow>
                    
                    <InfoRow>
                      <InfoLabel>นามสกุล:</InfoLabel>
                      <InfoValue>{customerData.cus_lastname || "-"}</InfoValue>
                    </InfoRow>
                    
                    <InfoRow>
                      <InfoLabel>ชื่อเล่น:</InfoLabel>
                      <InfoValue>{customerData.cus_name || "-"}</InfoValue>
                    </InfoRow>
                    
                    <InfoRow>
                      <InfoLabel>ตำแหน่ง:</InfoLabel>
                      <InfoValue>{customerData.cus_depart || "-"}</InfoValue>
                    </InfoRow>
                    
                    <InfoRow>
                      <InfoLabel>ประเภทธุรกิจ:</InfoLabel>
                      <InfoValue>
                        {customerData.business_type || "-"}
                      </InfoValue>
                    </InfoRow>
                  </Stack>
                </Collapse>
              </CardContent>
            </ViewCard>

            {/* Contact Information */}
            <ViewCard>
              <CardContent>
                <SectionHeader>
                  <MdContactPhone color="#B20000" />
                  <Typography variant="h6" sx={{ color: "#B20000" }}>
                    ข้อมูลติดต่อ
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => toggleSection("contact")}
                    sx={{ ml: "auto" }}
                  >
                    {expandedSections.contact ? <MdExpandLess /> : <MdExpandMore />}
                  </IconButton>
                </SectionHeader>
                
                <Collapse in={expandedSections.contact}>
                  <Stack spacing={1}>
                    <InfoRow>
                      <MdPhone size={16} />
                      <InfoLabel>เบอร์หลัก:</InfoLabel>
                      <InfoValue>
                        {customerData.cus_tel_1 || "-"}
                        {customerData.cus_tel_1 && (
                          <Chip 
                            label="โทร" 
                            size="small" 
                            sx={{
                              ml: 1,
                              cursor: "pointer",
                              backgroundColor: "#B20000",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "#900F0F"
                              }
                            }}
                            onClick={() => window.open(`tel:${customerData.cus_tel_1}`)}
                          />
                        )}
                      </InfoValue>
                    </InfoRow>
                    
                    <InfoRow>
                      <MdPhone size={16} />
                      <InfoLabel>เบอร์สำรอง:</InfoLabel>
                      <InfoValue>
                        {customerData.cus_tel_2 || "-"}
                        {customerData.cus_tel_2 && (
                          <Chip 
                            label="โทร" 
                            size="small" 
                            sx={{
                              ml: 1,
                              cursor: "pointer",
                              backgroundColor: "#B20000",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "#900F0F"
                              }
                            }}
                            onClick={() => window.open(`tel:${customerData.cus_tel_2}`)}
                          />
                        )}
                      </InfoValue>
                    </InfoRow>
                    
                    <InfoRow>
                      <MdEmail size={16} />
                      <InfoLabel>อีเมล:</InfoLabel>
                      <InfoValue>
                        {customerData.cus_email || "-"}
                        {customerData.cus_email && (
                          <Chip 
                            label="ส่งเมล" 
                            size="small" 
                            sx={{
                              ml: 1,
                              cursor: "pointer",
                              backgroundColor: "#B20000",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "#900F0F"
                              }
                            }}
                            onClick={() => window.open(`mailto:${customerData.cus_email}`)}
                          />
                        )}
                      </InfoValue>
                    </InfoRow>
                    
                    <InfoRow>
                      <MdBusiness size={16} />
                      <InfoLabel>เลขผู้เสียภาษี:</InfoLabel>
                      <InfoValue>{customerData.cus_tax_id || "-"}</InfoValue>
                    </InfoRow>
                  </Stack>
                </Collapse>
              </CardContent>
            </ViewCard>
          </Grid>

          {/* Right Column */}
          <Grid size={12} md={6}>
            {/* Address Information */}
            <ViewCard>
              <CardContent>
                <SectionHeader>
                  <MdLocationOn color="#B20000" />
                  <Typography variant="h6" sx={{ color: "#B20000" }}>
                    ที่อยู่
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => toggleSection("address")}
                    sx={{ ml: "auto" }}
                  >
                    {expandedSections.address ? <MdExpandLess /> : <MdExpandMore />}
                  </IconButton>
                </SectionHeader>
                
                <Collapse in={expandedSections.address}>
                  <Stack spacing={1}>
                    <InfoRow>
                      <InfoLabel>ที่อยู่:</InfoLabel>
                      <InfoValue sx={{ lineHeight: 1.6 }}>
                        {customerData.cus_address || "-"}
                      </InfoValue>
                    </InfoRow>
                    
                    <InfoRow>
                      <InfoLabel>จังหวัด:</InfoLabel>
                      <InfoValue>{customerData.province_name || "-"}</InfoValue>
                    </InfoRow>
                    
                    <InfoRow>
                      <InfoLabel>อำเภอ:</InfoLabel>
                      <InfoValue>{customerData.district_name || "-"}</InfoValue>
                    </InfoRow>
                    
                    <InfoRow>
                      <InfoLabel>ตำบล:</InfoLabel>
                      <InfoValue>{customerData.sub_district_name || "-"}</InfoValue>
                    </InfoRow>
                    
                    <InfoRow>
                      <InfoLabel>รหัสไปรษณีย์:</InfoLabel>
                      <InfoValue>{customerData.cus_zip_code || "-"}</InfoValue>
                    </InfoRow>
                  </Stack>
                </Collapse>
              </CardContent>
            </ViewCard>

            {/* Notes & Additional Info */}
            {(customerData.cd_note || customerData.cd_remark) && (
              <ViewCard>
                <CardContent>
                  <SectionHeader>
                    <MdNotes color="#B20000" />
                    <Typography variant="h6" sx={{ color: "#B20000" }}>
                      บันทึกเพิ่มเติม
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => toggleSection("notes")}
                      sx={{ ml: "auto" }}
                    >
                      {expandedSections.notes ? <MdExpandLess /> : <MdExpandMore />}
                    </IconButton>
                  </SectionHeader>
                  
                  <Collapse in={expandedSections.notes}>
                    <Stack spacing={2}>
                      {customerData.cd_note && (
                        <Box sx={{ 
                          p: 2, 
                          backgroundColor: "rgba(178, 0, 0, 0.1)", // ใช้สีแดงของ theme
                          borderRadius: 1,
                          borderLeft: "4px solid #B20000"
                        }}>
                          <Typography variant="subtitle2" sx={{ color: "#B20000", fontWeight: 600 }}>
                            หมายเหตุสำคัญ
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.6 }}>
                            {customerData.cd_note}
                          </Typography>
                        </Box>
                      )}
                      
                      {customerData.cd_remark && (
                        <Box sx={{ 
                          p: 2, 
                          backgroundColor: "rgba(178, 0, 0, 0.05)", 
                          borderRadius: 1,
                          borderLeft: "4px solid #E36264" // สีแดงอ่อนของ theme
                        }}>
                          <Typography variant="subtitle2" sx={{ color: "#E36264", fontWeight: 600 }}>
                            ข้อมูลเพิ่มเติม
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.6 }}>
                            {customerData.cd_remark}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Collapse>
                </CardContent>
              </ViewCard>
            )}

            {/* System Information */}
            <ViewCard>
              <CardContent>
                <SectionHeader>
                  <MdInfo color="#B20000" />
                  <Typography variant="h6" sx={{ color: "#B20000" }}>
                    ข้อมูลระบบ
                  </Typography>
                </SectionHeader>
                
                <Stack spacing={1}>
                  <InfoRow>
                    <InfoLabel>ผู้ดูแล:</InfoLabel>
                    <InfoValue>
                      {customerData.cus_manage_by?.username || customerData.manage_by_name || "-"}
                    </InfoValue>
                  </InfoRow>
                  
                  <InfoRow>
                    <InfoLabel>วันที่สร้าง:</InfoLabel>
                    <InfoValue>
                      {customerData.cus_created_date ? 
                        new Date(customerData.cus_created_date).toLocaleDateString('th-TH') : "-"}
                    </InfoValue>
                  </InfoRow>
                  
                  <InfoRow>
                    <InfoLabel>ติดต่อครั้งล่าสุด:</InfoLabel>
                    <InfoValue>
                      {customerData.cd_last_datetime ? 
                        new Date(customerData.cd_last_datetime).toLocaleDateString('th-TH') : "-"}
                    </InfoValue>
                  </InfoRow>
                </Stack>
              </CardContent>
            </ViewCard>
          </Grid>
        </Grid>
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions sx={{ p: 2, backgroundColor: "#EBEBEB" }}>
        {onEdit && (
          <Button
            variant="contained"
            startIcon={<MdEdit />}
            onClick={() => onEdit(customerData.cus_id)}
            sx={{ 
              mr: 1,
              backgroundColor: "#B20000",
              "&:hover": {
                backgroundColor: "#900F0F"
              }
            }}
          >
            แก้ไขข้อมูล
          </Button>
        )}
        <Button
          variant="outlined"
          onClick={onClose}
          startIcon={<MdClose />}
          sx={{
            borderColor: "#B20000",
            color: "#B20000",
            "&:hover": {
              borderColor: "#900F0F",
              backgroundColor: "rgba(178, 0, 0, 0.05)"
            }
          }}
        >
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerViewDialog; 