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
  Avatar,
  IconButton,
  Collapse,
  Stack,
  Tooltip,
  useTheme,
  useMediaQuery,
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
} from "react-icons/md";
import { styled } from "@mui/material/styles";
import { formatCustomRelativeTime } from "../../../features/Customer/customerUtils";
import { parseFullAddress } from "./BusinessDetailStepSimple";

// Styled components - ปรับสีตาม theme
const ViewCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  boxShadow: "0 2px 8px rgba(158, 0, 0, 0.1)",
  border: `1px solid #9e000022`,
  maxWidth: "100%",
  margin: "0 auto",
  "&:hover": {
    boxShadow: "0 4px 16px rgba(158, 0, 0, 0.15)",
  },
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(1.5),
    boxShadow: "0 1px 4px rgba(158, 0, 0, 0.1)",
  },
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1, 0),
  borderBottom: `2px solid #9e0000`,
}));

const InfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(1.5),
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  "&:hover": {
    backgroundColor: "rgba(158, 0, 0, 0.05)",
  },
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(0.5),
  },
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: "#212429",
  minWidth: 120,
  fontSize: "0.875rem",
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.8rem",
    minWidth: 100,
  },
}));

const InfoValue = styled(Typography)(({ theme }) => ({
  color: "#212429",
  fontWeight: 400,
  wordBreak: "break-word",
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.8rem",
  },
}));

const CustomerAvatar = styled(Avatar)(({ theme }) => ({
  width: 64,
  height: 64,
  backgroundColor: "#9e0000", // ใช้สีแดงที่สอดคล้องกับ theme
  fontSize: "1.5rem",
  fontWeight: 600,
  [theme.breakpoints.down("sm")]: {
    width: 48,
    height: 48,
    fontSize: "1.2rem",
  },
}));

/**
 * CustomerViewDialog - Dialog สำหรับดูข้อมูลลูกค้าแบบ read-only
 * @param {Object} props
 * @param {boolean} props.open - เปิด/ปิด dialog
 * @param {Function} props.onClose - callback เมื่อปิด dialog
 * @param {Object} props.customerData - ข้อมูลลูกค้า
 * @param {Function} props.onEdit - callback เมื่อกดปุ่มแก้ไข
 */
const CustomerViewDialog = ({ open, onClose, customerData, onEdit }) => {
  // ✅ ย้าย hooks มาไว้ก่อน early return
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    contact: false,
    address: false,
    notes: false,
  });

  // Early return หลังจาก hooks แล้ว
  if (!customerData || !open) {
    return null;
  }

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Generate customer initials - ป้องกัน null/undefined
  const getInitials = (firstName, lastName) => {
    const first =
      firstName && typeof firstName === "string"
        ? firstName.charAt(0)?.toUpperCase()
        : "";
    const last =
      lastName && typeof lastName === "string"
        ? lastName.charAt(0)?.toUpperCase()
        : "";
    return first + last || "?";
  };

  // Format relative time - ป้องกัน null/undefined
  const formattedRelativeTime = customerData?.cd_last_datetime
    ? formatCustomRelativeTime(customerData.cd_last_datetime)
    : 0;

  // Check if recall is overdue
  const isOverdue = formattedRelativeTime <= 0;

  // Parse address from combined string to separated components
  const parsedAddress = customerData.cus_address
    ? parseFullAddress(customerData.cus_address)
    : {
        address: "",
        subdistrict: "",
        district: "",
        province: "",
        zipCode: "",
      };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          overflow: "hidden",
          height: isMobile ? "100vh" : "auto",
        },
      }}
    >
      {/* Dialog Header - ใช้สีตาม theme */}
      <DialogTitle
        component="div"
        sx={{
          background: "linear-gradient(135deg, #9e0000 0%, #d32f2f 100%)", // ใช้สีแดงที่สอดคล้องกับ theme
          color: "white",
          pb: 2,
          p: isMobile ? 2 : 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CustomerAvatar>
              {getInitials(
                customerData.cus_firstname,
                customerData.cus_lastname
              )}
            </CustomerAvatar>
            <Box>
              <Typography
                variant={isMobile ? "h6" : "h5"}
                fontWeight={600}
                sx={{ fontSize: isMobile ? "1.1rem" : "1.5rem" }}
              >
                {customerData.cus_company || "ไม่ระบุบริษัท"}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  opacity: 0.9,
                  fontSize: isMobile ? "0.9rem" : "1rem",
                }}
              >
                {customerData.cus_name ||
                  `${customerData.cus_firstname || ""} ${
                    customerData.cus_lastname || ""
                  }`}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                <Chip
                  label={`รหัส: ${customerData.cus_no || "N/A"}`}
                  size="small"
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "white",
                    fontSize: isMobile ? "0.6rem" : "0.75rem",
                    px: isMobile ? 1 : 1.5
                  }}
                />
                <Chip
                  label={`${formattedRelativeTime} วัน`}
                  size="small"
                  sx={{
                    backgroundColor: isOverdue ? "#E36264" : "#2e7d32",
                    color: "white",
                    fontSize: isMobile ? "0.6rem" : "0.75rem",
                    px: isMobile ? 1 : 1.5
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
      <DialogContent
        sx={{
          p: isMobile ? 2 : 3,
          backgroundColor: "#fffaf9",
        }}
      >
        <Grid container spacing={2} direction="column">
          {/* Notes & Additional Info */}
          {(customerData.cd_note || customerData.cd_remark) && (
            <Grid xs={12}>
              <ViewCard>
                <CardContent>
                  <SectionHeader>
                    <MdNotes color="#9e0000" />
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#9e0000",
                        fontSize: isMobile ? "1rem" : "1.25rem",
                      }}
                    >
                      บันทึกเพิ่มเติม
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => toggleSection("notes")}
                      sx={{ ml: "auto" }}
                    >
                      {expandedSections.notes ? (
                        <MdExpandLess />
                      ) : (
                        <MdExpandMore />
                      )}
                    </IconButton>
                  </SectionHeader>

                  <Collapse in={expandedSections.notes}>
                    <Stack spacing={2}>
                      {customerData.cd_note && (
                        <Box
                          sx={{
                            p: isMobile ? 1.5 : 2,
                            backgroundColor: "rgba(158, 0, 0, 0.1)",
                            borderRadius: 1,
                            borderLeft: "4px solid #9e0000",
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              color: "#9e0000",
                              fontWeight: 600,
                              mb: 1,
                              fontSize: isMobile ? "0.8rem" : "0.875rem",
                            }}
                          >
                            📝 หมายเหตุสำคัญ
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              lineHeight: 1.6,
                              whiteSpace: "pre-wrap",
                              fontSize: isMobile ? "0.8rem" : "0.875rem",
                            }}
                          >
                            {customerData.cd_note}
                          </Typography>
                        </Box>
                      )}

                      {customerData.cd_remark && (
                        <Box
                          sx={{
                            p: isMobile ? 1.5 : 2,
                            backgroundColor: "rgba(158, 0, 0, 0.05)",
                            borderRadius: 1,
                            borderLeft: "4px solid #d32f2f",
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              color: "#d32f2f",
                              fontWeight: 600,
                              mb: 1,
                              fontSize: isMobile ? "0.8rem" : "0.875rem",
                            }}
                          >
                            💡 ข้อมูลเพิ่มเติม
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              lineHeight: 1.6,
                              whiteSpace: "pre-wrap",
                              fontSize: isMobile ? "0.8rem" : "0.875rem",
                            }}
                          >
                            {customerData.cd_remark}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Collapse>
                </CardContent>
              </ViewCard>
            </Grid>
          )}

          {/* Basic Information */}
          <Grid xs={12}>
            <ViewCard>
              <CardContent>
                <SectionHeader>
                  <MdPerson color="#9e0000" />
                  <Typography
                    variant="h6"
                    sx={{
                      color: "#9e0000",
                      fontSize: isMobile ? "1rem" : "1.25rem",
                    }}
                  >
                    ข้อมูลพื้นฐาน
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => toggleSection("basic")}
                    sx={{ ml: "auto" }}
                  >
                    {expandedSections.basic ? (
                      <MdExpandLess />
                    ) : (
                      <MdExpandMore />
                    )}
                  </IconButton>
                </SectionHeader>

                <Collapse in={expandedSections.basic}>
                  <Stack spacing={1}>
                    <InfoRow>
                      <InfoLabel>รหัสลูกค้า:</InfoLabel>
                      <InfoValue>
                        <Chip
                          label={customerData.cus_no || "ไม่ระบุ"}
                          size="small"
                          sx={{
                            backgroundColor: "#9e0000",
                            color: "white",
                            fontWeight: 600,
                            fontSize: isMobile ? "0.6rem" : "0.75rem",
                            px: isMobile ? 1 : 1.5
                          }}
                        />
                      </InfoValue>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel>ชื่อบริษัท:</InfoLabel>
                      <InfoValue sx={{ fontWeight: 600, color: "#9e0000" }}>
                        {customerData.cus_company || "-"}
                      </InfoValue>
                    </InfoRow>

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
                      <InfoLabel>ช่องทางติดต่อ:</InfoLabel>
                      <InfoValue>
                        {customerData.cus_channel === 1 && (
                          <Chip
                            label="Sales"
                            size="small"
                            sx={{ backgroundColor: "#4CAF50", color: "white" }}
                          />
                        )}
                        {customerData.cus_channel === 2 && (
                          <Chip
                            label="Online"
                            size="small"
                            sx={{ backgroundColor: "#2196F3", color: "white" }}
                          />
                        )}
                        {customerData.cus_channel === 3 && (
                          <Chip
                            label="Office"
                            size="small"
                            sx={{ backgroundColor: "#FF9800", color: "white" }}
                          />
                        )}
                        {!customerData.cus_channel && (
                          <Typography variant="body2">-</Typography>
                        )}
                      </InfoValue>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel>ประเภทธุรกิจ:</InfoLabel>
                      <InfoValue>
                        {customerData.business_type ? (
                          <Chip
                            label={customerData.business_type}
                            size="small"
                            sx={{
                              backgroundColor: "#d32f2f",
                              color: "white",
                              fontSize: isMobile ? "0.6rem" : "0.75rem",
                              px: isMobile ? 1 : 1.5
                            }}
                          />
                        ) : (
                          "-"
                        )}
                      </InfoValue>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel>เลขผู้เสียภาษี:</InfoLabel>
                      <InfoValue>
                        {customerData.cus_tax_id ? (
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace", fontWeight: 600 }}
                          >
                            {customerData.cus_tax_id}
                          </Typography>
                        ) : (
                          "-"
                        )}
                      </InfoValue>
                    </InfoRow>
                  </Stack>
                </Collapse>
              </CardContent>
            </ViewCard>
          </Grid>

          {/* Contact Information */}
          <Grid xs={12}>
            <ViewCard>
              <CardContent>
                <SectionHeader>
                  <MdContactPhone color="#9e0000" />
                  <Typography
                    variant="h6"
                    sx={{
                      color: "#9e0000",
                      fontSize: isMobile ? "1rem" : "1.25rem",
                    }}
                  >
                    ข้อมูลติดต่อ
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => toggleSection("contact")}
                    sx={{ ml: "auto" }}
                  >
                    {expandedSections.contact ? (
                      <MdExpandLess />
                    ) : (
                      <MdExpandMore />
                    )}
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
                              backgroundColor: "#9e0000",
                              color: "white",
                              fontSize: isMobile ? "0.7rem" : "0.75rem",
                              "&:hover": {
                                backgroundColor: "#d32f2f",
                              },
                            }}
                            onClick={() =>
                              window.open(`tel:${customerData.cus_tel_1}`)
                            }
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
                              backgroundColor: "#9e0000",
                              color: "white",
                              fontSize: isMobile ? "0.7rem" : "0.75rem",
                              "&:hover": {
                                backgroundColor: "#d32f2f",
                              },
                            }}
                            onClick={() =>
                              window.open(`tel:${customerData.cus_tel_2}`)
                            }
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
                              backgroundColor: "#9e0000",
                              color: "white",
                              fontSize: isMobile ? "0.7rem" : "0.75rem",
                              "&:hover": {
                                backgroundColor: "#d32f2f",
                              },
                            }}
                            onClick={() =>
                              window.open(`mailto:${customerData.cus_email}`)
                            }
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

          {/* Address Information */}
          <Grid xs={12}>
            <ViewCard>
              <CardContent>
                <SectionHeader>
                  <MdLocationOn color="#9e0000" />
                  <Typography
                    variant="h6"
                    sx={{
                      color: "#9e0000",
                      fontSize: isMobile ? "1rem" : "1.25rem",
                    }}
                  >
                    ที่อยู่
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => toggleSection("address")}
                    sx={{ ml: "auto" }}
                  >
                    {expandedSections.address ? (
                      <MdExpandLess />
                    ) : (
                      <MdExpandMore />
                    )}
                  </IconButton>
                </SectionHeader>

                <Collapse in={expandedSections.address}>
                  <Stack spacing={1}>
                    <InfoRow>
                      <InfoLabel>ที่อยู่:</InfoLabel>
                      <InfoValue sx={{ lineHeight: 1.6 }}>
                        {parsedAddress.address ||
                          customerData.cus_address_detail ||
                          "-"}
                      </InfoValue>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel>จังหวัด:</InfoLabel>
                      <InfoValue>
                        {parsedAddress.province ||
                          customerData.cus_province_text ||
                          "-"}
                      </InfoValue>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel>อำเภอ:</InfoLabel>
                      <InfoValue>
                        {parsedAddress.district ||
                          customerData.cus_district_text ||
                          "-"}
                      </InfoValue>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel>ตำบล:</InfoLabel>
                      <InfoValue>
                        {parsedAddress.subdistrict ||
                          customerData.cus_subdistrict_text ||
                          "-"}
                      </InfoValue>
                    </InfoRow>

                    <InfoRow>
                      <InfoLabel>รหัสไปรษณีย์:</InfoLabel>
                      <InfoValue>
                        {parsedAddress.zipCode ||
                          customerData.cus_zip_code ||
                          "-"}
                      </InfoValue>
                    </InfoRow>

                    {/* แสดงที่อยู่แบบรวมสำหรับอ้างอิง */}
                    {customerData.cus_address && (
                      <InfoRow>
                        <InfoLabel>ที่อยู่แบบรวม:</InfoLabel>
                        <InfoValue
                          sx={{
                            lineHeight: 1.6,
                            fontSize: "0.8rem",
                            color: "#666",
                            fontStyle: "italic",
                            backgroundColor: "#f5f5f5",
                            padding: "8px",
                            borderRadius: "4px",
                          }}
                        >
                          {customerData.cus_address}
                        </InfoValue>
                      </InfoRow>
                    )}
                  </Stack>
                </Collapse>
              </CardContent>
            </ViewCard>
          </Grid>
        </Grid>
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions
        sx={{
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          gap: isMobile ? 1.5 : 1,
          p: isMobile ? 2 : 2,
          backgroundColor: "#fffaf9",
          justifyContent: isMobile ? "center" : "flex-end",
        }}
      >
        {onEdit && (
          <Button
            variant="contained"
            startIcon={<MdEdit />}
            onClick={() => onEdit(customerData.cus_id)}
            fullWidth={isMobile}
            sx={{
              mr: isMobile ? 0 : 1,
              mb: isMobile ? 1 : 0,
              backgroundColor: "#9e0000",
              fontSize: isMobile ? "0.9rem" : "0.875rem",
              "&:hover": {
                backgroundColor: "#d32f2f",
              },
            }}
          >
            แก้ไขข้อมูล
          </Button>
        )}
        <Button
          variant="outlined"
          onClick={onClose}
          startIcon={<MdClose />}
          fullWidth={isMobile}
          sx={{
            borderColor: "#9e0000",
            color: "#9e0000",
            fontSize: isMobile ? "0.9rem" : "0.875rem",
            "&:hover": {
              borderColor: "#d32f2f",
              backgroundColor: "rgba(158, 0, 0, 0.05)",
            },
          }}
        >
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerViewDialog;
