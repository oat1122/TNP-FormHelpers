import React, { useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Container,
  Stack,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  MdPerson,
  MdSupervisorAccount,
  MdExpandMore,
  MdNote,
  MdInfo,
} from "react-icons/md";
import { HiUser } from "react-icons/hi";

// สี theme ของบริษัท
const PRIMARY_RED = "#9e0000";
const SECONDARY_RED = "#d32f2f";
const BACKGROUND_COLOR = "#fffaf9";
const DIVIDER_COLOR = "#9e000022";

/**
 * YourDetailsStep - ขั้นตอนที่ 3: ข้อมูลของคุณ (Simple Version)
 */
const YourDetailsStepSimple = ({
  inputList = {},
  errors = {},
  handleInputChange,
  mode = "create",
  salesList = [], // รับ salesList จาก parent
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  
  // ดึงข้อมูล user ปัจจุบัน
  const currentUser = JSON.parse(localStorage.getItem("userData") || "{}");
  const isAdmin = currentUser.role === "admin";

  // ตั้งค่าผู้ดูแลเริ่มต้นสำหรับ user ปกติ
  useEffect(() => {
    if (!isAdmin && currentUser.user_id && mode === "create") {
      // ถ้าไม่ใช่ admin และยังไม่มีการกำหนดผู้ดูแล ให้ตั้งเป็นตัวเอง
      if (!inputList.cus_manage_by?.user_id) {
        const managedBy = {
          user_id: currentUser.user_id,
          username: currentUser.username || currentUser.user_nickname || "คุณ"
        };
        
        // ใช้ setTimeout เพื่อป้องกัน race condition
        setTimeout(() => {
          const syntheticEvent = {
            target: {
              name: "cus_manage_by",
              value: managedBy
            }
          };
          
          handleInputChange(syntheticEvent);
        }, 100);
      }
    }
  }, [isAdmin, currentUser.user_id, mode]);

  // จัดการการเปลี่ยนแปลง dropdown ผู้ดูแล
  const handleManagerChange = (event) => {
    const selectedUserId = event.target.value;
    
    if (selectedUserId === "" || selectedUserId === null || selectedUserId === undefined) {
      // ไม่มีผู้ดูแล
      const managedBy = { user_id: "", username: "" };
      handleInputChange({
        target: { name: "cus_manage_by", value: managedBy }
      });
    } else {
      // หาข้อมูล user ที่เลือก
      const selectedUser = salesList.find(user => 
        String(user.user_id) === String(selectedUserId)
      );
      
      if (selectedUser) {
        const managedBy = {
          user_id: selectedUser.user_id,
          username: selectedUser.username || selectedUser.user_nickname || `User ${selectedUser.user_id}`
        };
        handleInputChange({
          target: { name: "cus_manage_by", value: managedBy }
        });
      }
    }
  };

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
            <HiUser size={isMobile ? 24 : 28} />
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              sx={{ 
                fontWeight: 600,
                fontFamily: 'Kanit'
              }}
            >
              ข้อมูลของคุณ
            </Typography>
          </Box>
          
          {/* Progress Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.9, fontFamily: 'Kanit' }}>
              ขั้นตอนที่ 3 จาก 4
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
                  width: '75%', 
                  bgcolor: 'white', 
                  borderRadius: 2,
                  transition: 'width 0.3s ease'
                }} 
              />
            </Box>
          </Box>
          
          <Typography variant="body2" sx={{ opacity: 0.9, fontFamily: 'Kanit' }}>
            ข้อมูลผู้ดูแลลูกค้าและบันทึกเพิ่มเติม
          </Typography>
        </Stack>
      </Box>

      {/* Sales Assignment Section */}
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
            <MdSupervisorAccount size={20} color={PRIMARY_RED} />
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600,
                fontFamily: 'Kanit',
                color: PRIMARY_RED
              }}
            >
              ผู้ดูแลลูกค้า
            </Typography>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails sx={{ p: 3 }}>
          {isAdmin ? (
            // Admin สามารถเลือกผู้ดูแลได้
            <FormControl fullWidth disabled={mode === "view"}>
              <InputLabel sx={{ fontFamily: "Kanit", fontSize: 14 }}>
                เลือกผู้ดูแลลูกค้า
              </InputLabel>
              <Select
                name="cus_manage_by_select"
                value={inputList.cus_manage_by?.user_id || ""} // แสดง user_id เป็น value
                onChange={handleManagerChange}
                label="เลือกผู้ดูแลลูกค้า"
                error={!!errors.cus_manage_by}
                sx={{
                  fontFamily: "Kanit",
                  fontSize: 14,
                }}
              >
                <MenuItem value="" sx={{ fontFamily: "Kanit" }}>
                  ไม่มีผู้ดูแล
                </MenuItem>
                {salesList.map((user) => (
                  <MenuItem 
                    key={user.user_id} 
                    value={String(user.user_id)} // แปลงเป็น string เพื่อ comparison
                    sx={{ fontFamily: "Kanit" }}
                  >
                    {user.username || user.user_nickname || `User ${user.user_id}`}
                  </MenuItem>
                ))}
              </Select>
              {errors.cus_manage_by && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, fontFamily: "Kanit" }}>
                  {errors.cus_manage_by}
                </Typography>
              )}
            </FormControl>
          ) : (
            // User ปกติแสดงชื่อตัวเองและไม่สามารถแก้ได้
            <Stack spacing={2}>
              <TextField
                name="cus_manage_by_display"
                label="ผู้ดูแลลูกค้า"
                value={inputList.cus_manage_by?.username || currentUser.username || currentUser.user_nickname || "คุณ"}
                fullWidth
                disabled
                size="small"
                InputProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
                InputLabelProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
              />
              <Alert severity="info" sx={{ fontFamily: "Kanit" }}>
                คุณจะเป็นผู้ดูแลลูกค้ารายนี้โดยอัตโนมัติ
              </Alert>
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Notes and Additional Information Section */}
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
            <MdNote size={20} color={PRIMARY_RED} />
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600,
                fontFamily: 'Kanit',
                color: PRIMARY_RED
              }}
            >
              บันทึกและข้อมูลเพิ่มเติม
            </Typography>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* หมายเหตุ */}
            <TextField
              name="cd_note"
              label="หมายเหตุ"
              value={inputList.cd_note || ""}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              error={!!errors.cd_note}
              helperText={errors.cd_note}
              disabled={mode === "view"}
              placeholder="เช่น ลูกค้าใหม่, ต้องการสินค้าคุณภาพดี, ชอบสีน้ำเงิน"
              size="small"
              InputProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
              InputLabelProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
            />

            {/* ข้อมูลเพิ่มเติม */}
            <TextField
              name="cd_remark"
              label="ข้อมูลเพิ่มเติม"
              value={inputList.cd_remark || ""}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              error={!!errors.cd_remark}
              helperText={errors.cd_remark}
              disabled={mode === "view"}
              placeholder="เช่น วันเวลาที่เหมาะแก่การติดต่อ, ข้อมูลเพิ่มเติมที่สำคัญ"
              size="small"
              InputProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
              InputLabelProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Tips Section for Sales (Non-admin users) */}
      {!isAdmin && (
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
              <MdInfo size={20} color={PRIMARY_RED} />
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600,
                  fontFamily: 'Kanit',
                  color: PRIMARY_RED
                }}
              >
                เคล็ดลับการดูแลลูกค้า
              </Typography>
            </Box>
          </AccordionSummary>
          
          <AccordionDetails sx={{ p: 3 }}>
            <Alert severity="success" sx={{ fontFamily: "Kanit" }}>
              <Typography variant="body2" sx={{ fontFamily: "Kanit" }}>
                <strong>เคล็ดลับการดูแลลูกค้า:</strong><br/>
                • บันทึกความชอบและข้อกำหนดพิเศษของลูกค้า<br/>
                • ระบุเวลาที่เหมาะสมในการติดต่อ<br/>
                • อัปเดตข้อมูลเมื่อมีการเปลี่ยนแปลง
              </Typography>
            </Alert>
          </AccordionDetails>
        </Accordion>
      )}
    </Container>
  );
};

export default YourDetailsStepSimple; 