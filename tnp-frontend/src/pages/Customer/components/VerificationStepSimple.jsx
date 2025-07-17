import React from "react";
import { 
  Box, 
  Typography, 
  Container,
  Stack,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from "@mui/material";
import { 
  MdVerifiedUser, 
  MdExpandMore,
  MdBusiness,
  MdPhone,
  MdLocationOn,
  MdSupervisorAccount,
  MdNote,
} from "react-icons/md";
import { HiOfficeBuilding, HiUser } from "react-icons/hi";

// สี theme ของบริษัท
const PRIMARY_RED = "#9e0000";
const SECONDARY_RED = "#d32f2f";
const BACKGROUND_COLOR = "#fffaf9";
const DIVIDER_COLOR = "#9e000022";

/**
 * VerificationStep - ขั้นตอนที่ 4: การยืนยัน (Simple Version)
 */
const VerificationStepSimple = ({ inputList = {}, mode = "create" }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Gradient Header with Step Progress */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${PRIMARY_RED} 0%, ${SECONDARY_RED} 100%)`,
          borderRadius: 2,
          p: 3,
          mb: 3,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MdVerifiedUser size={isMobile ? 24 : 28} />
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              sx={{ 
                fontWeight: 600,
                fontFamily: 'Kanit'
              }}
            >
              การยืนยัน
            </Typography>
          </Box>
          
          {/* Progress Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.9, fontFamily: 'Kanit' }}>
              ขั้นตอนที่ 4 จาก 4 (สำเร็จ)
            </Typography>
            <Box 
              sx={{ 
                flex: 1, 
                height: 4, 
                bgcolor: 'rgba(255,255,255,0.3)', 
                borderRadius: 2, 
                overflow: 'hidden' 
              }}
            >
              <Box 
                sx={{ 
                  height: '100%', 
                  width: '100%', 
                  bgcolor: 'white', 
                  borderRadius: 2,
                  transition: 'width 0.3s ease'
                }} 
              />
            </Box>
          </Box>
          
          <Typography variant="body2" sx={{ opacity: 0.9, fontFamily: 'Kanit' }}>
            ตรวจสอบข้อมูลทั้งหมดก่อนบันทึก
          </Typography>
        </Stack>
      </Box>

      {/* Business Information Summary */}
      <Accordion 
        defaultExpanded={true}
        sx={{ 
          mb: 2,
          boxShadow: isMobile ? 1 : 2,
          borderRadius: 2,
          '&:before': { display: 'none' },
          border: `1px solid ${DIVIDER_COLOR}`,
        }}
      >
        <AccordionSummary 
          expandIcon={<MdExpandMore />}
          sx={{
            bgcolor: BACKGROUND_COLOR,
            '&:hover': { bgcolor: `${PRIMARY_RED}05` },
            borderRadius: '8px 8px 0 0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <HiOfficeBuilding size={20} color={PRIMARY_RED} />
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600,
                fontFamily: 'Kanit',
                color: PRIMARY_RED
              }}
            >
              ข้อมูลธุรกิจ
            </Typography>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontFamily="Kanit"
                sx={{ fontWeight: 500 }}
              >
                ชื่อบริษัท
              </Typography>
              <Typography variant="body2" fontFamily="Kanit" sx={{ fontWeight: 500, mt: 0.5 }}>
                {inputList.cus_company || "-"}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontFamily="Kanit"
                sx={{ fontWeight: 500 }}
              >
                ชื่อจริงลูกค้า
              </Typography>
              <Typography variant="body2" fontFamily="Kanit" sx={{ fontWeight: 500, mt: 0.5 }}>
                {`${inputList.cus_firstname || ""} ${inputList.cus_lastname || ""}`.trim() || "-"}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontFamily="Kanit"
                sx={{ fontWeight: 500 }}
              >
                ประเภทธุรกิจ
              </Typography>
              <Typography variant="body2" fontFamily="Kanit" sx={{ fontWeight: 500, mt: 0.5 }}>
                {inputList.cus_business_type || "-"}
              </Typography>
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Contact Information Summary */}
      <Accordion 
        defaultExpanded={true}
        sx={{ 
          mb: 2,
          boxShadow: isMobile ? 1 : 2,
          borderRadius: 2,
          '&:before': { display: 'none' },
          border: `1px solid ${DIVIDER_COLOR}`,
        }}
      >
        <AccordionSummary 
          expandIcon={<MdExpandMore />}
          sx={{
            bgcolor: BACKGROUND_COLOR,
            '&:hover': { bgcolor: `${PRIMARY_RED}05` },
            borderRadius: '8px 8px 0 0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MdPhone size={20} color={PRIMARY_RED} />
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600,
                fontFamily: 'Kanit',
                color: PRIMARY_RED
              }}
            >
              ข้อมูลการติดต่อ
            </Typography>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontFamily="Kanit"
                sx={{ fontWeight: 500 }}
              >
                เบอร์โทรหลัก
              </Typography>
              <Typography variant="body2" fontFamily="Kanit" sx={{ fontWeight: 500, mt: 0.5 }}>
                {inputList.cus_tel_1 || "-"}
              </Typography>
            </Box>

            {inputList.cus_tel_2 && (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontFamily="Kanit"
                  sx={{ fontWeight: 500 }}
                >
                  เบอร์โทรสำรอง
                </Typography>
                <Typography variant="body2" fontFamily="Kanit" sx={{ fontWeight: 500, mt: 0.5 }}>
                  {inputList.cus_tel_2}
                </Typography>
              </Box>
            )}

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontFamily="Kanit"
                sx={{ fontWeight: 500 }}
              >
                อีเมล
              </Typography>
              <Typography variant="body2" fontFamily="Kanit" sx={{ fontWeight: 500, mt: 0.5 }}>
                {inputList.cus_email || "-"}
              </Typography>
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Address Information Summary */}
      {(inputList.cus_address || inputList.cus_province_text || inputList.cus_district_text || inputList.cus_subdistrict_text || inputList.cus_zip_code) && (
        <Accordion 
          defaultExpanded={false}
          sx={{ 
            mb: 2,
            boxShadow: isMobile ? 1 : 2,
            borderRadius: 2,
            '&:before': { display: 'none' },
            border: `1px solid ${DIVIDER_COLOR}`,
          }}
        >
          <AccordionSummary 
            expandIcon={<MdExpandMore />}
            sx={{
              bgcolor: BACKGROUND_COLOR,
              '&:hover': { bgcolor: `${PRIMARY_RED}05` },
              borderRadius: '8px 8px 0 0',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MdLocationOn size={20} color={PRIMARY_RED} />
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600,
                  fontFamily: 'Kanit',
                  color: PRIMARY_RED
                }}
              >
                ที่อยู่ธุรกิจ
              </Typography>
            </Box>
          </AccordionSummary>
          
          <AccordionDetails sx={{ p: 3 }}>
            <Stack spacing={2}>
              {inputList.cus_address && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontFamily="Kanit"
                    sx={{ fontWeight: 500 }}
                  >
                    ที่อยู่
                  </Typography>
                  <Typography variant="body2" fontFamily="Kanit" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {inputList.cus_address}
                  </Typography>
                </Box>
              )}

              {(inputList.cus_province_text || inputList.cus_district_text || inputList.cus_subdistrict_text) && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontFamily="Kanit"
                    sx={{ fontWeight: 500 }}
                  >
                    จังหวัด / อำเภอ / ตำบล
                  </Typography>
                  <Typography variant="body2" fontFamily="Kanit" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {[inputList.cus_province_text, inputList.cus_district_text, inputList.cus_subdistrict_text]
                      .filter(Boolean)
                      .join(" / ") || "-"}
                  </Typography>
                </Box>
              )}

              {inputList.cus_zip_code && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontFamily="Kanit"
                    sx={{ fontWeight: 500 }}
                  >
                    รหัสไปรษณีย์
                  </Typography>
                  <Typography variant="body2" fontFamily="Kanit" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {inputList.cus_zip_code}
                  </Typography>
                </Box>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Management and Notes Summary */}
      <Accordion 
        defaultExpanded={false}
        sx={{ 
          mb: 2,
          boxShadow: isMobile ? 1 : 2,
          borderRadius: 2,
          '&:before': { display: 'none' },
          border: `1px solid ${DIVIDER_COLOR}`,
        }}
      >
        <AccordionSummary 
          expandIcon={<MdExpandMore />}
          sx={{
            bgcolor: BACKGROUND_COLOR,
            '&:hover': { bgcolor: `${PRIMARY_RED}05` },
            borderRadius: '8px 8px 0 0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <HiUser size={20} color={PRIMARY_RED} />
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600,
                fontFamily: 'Kanit',
                color: PRIMARY_RED
              }}
            >
              การจัดการและบันทึก
            </Typography>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontFamily="Kanit"
                sx={{ fontWeight: 500 }}
              >
                ผู้ดูแลลูกค้า
              </Typography>
              <Typography variant="body2" fontFamily="Kanit" sx={{ fontWeight: 500, mt: 0.5 }}>
                {inputList.cus_manage_by?.username || "ไม่มีผู้ดูแล"}
              </Typography>
            </Box>

            {inputList.cd_note && (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontFamily="Kanit"
                  sx={{ fontWeight: 500 }}
                >
                  หมายเหตุ
                </Typography>
                <Typography variant="body2" fontFamily="Kanit" sx={{ fontWeight: 500, mt: 0.5 }}>
                  {inputList.cd_note}
                </Typography>
              </Box>
            )}

            {inputList.cd_remark && (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontFamily="Kanit"
                  sx={{ fontWeight: 500 }}
                >
                  ข้อมูลเพิ่มเติม
                </Typography>
                <Typography variant="body2" fontFamily="Kanit" sx={{ fontWeight: 500, mt: 0.5 }}>
                  {inputList.cd_remark}
                </Typography>
              </Box>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Final Confirmation Alert */}
      <Alert 
        severity="info"
        sx={{ 
          fontFamily: "Kanit",
          borderRadius: 2,
          border: `1px solid ${PRIMARY_RED}30`,
          backgroundColor: `${PRIMARY_RED}05`,
        }}
      >
        <Typography
          variant="body2"
          fontFamily="Kanit"
          color={PRIMARY_RED}
          sx={{ fontWeight: 500 }}
        >
          กรุณาตรวจสอบข้อมูลทั้งหมดก่อนกดปุ่ม "บันทึก"
        </Typography>
      </Alert>
    </Container>
  );
};

export default VerificationStepSimple;
