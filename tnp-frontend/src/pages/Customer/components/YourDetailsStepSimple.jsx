import React, { useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import {
  MdPerson,
  MdSupervisorAccount,
} from "react-icons/md";

// สี theme ของบริษัท
const PRIMARY_RED = "#B20000";

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
    <Box sx={{ maxWidth: 800, mx: "auto", py: 2 }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          border: `2px solid ${PRIMARY_RED}`,
          borderRadius: 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <MdPerson size={28} color={PRIMARY_RED} />
          <Typography variant="h5" fontWeight={600} color={PRIMARY_RED} fontFamily="Kanit">
            ข้อมูลของคุณ
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" fontFamily="Kanit">
          ข้อมูลผู้ดูแลลูกค้าและบันทึกเพิ่มเติม
        </Typography>
      </Paper>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* ผู้ดูแลลูกค้า */}
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <MdSupervisorAccount color={PRIMARY_RED} />
            <Typography variant="body2" fontFamily="Kanit" color={PRIMARY_RED} fontWeight={500}>
              ผู้ดูแลลูกค้า
            </Typography>
          </Box>

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
            <>
              <TextField
                name="cus_manage_by_display"
                label="ผู้ดูแลลูกค้า"
                value={inputList.cus_manage_by?.username || currentUser.username || currentUser.user_nickname || "คุณ"}
                fullWidth
                disabled
                InputProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
                InputLabelProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
              />
              <Alert severity="info" sx={{ mt: 1, fontFamily: "Kanit" }}>
                คุณจะเป็นผู้ดูแลลูกค้ารายนี้โดยอัตโนมัติ
              </Alert>
            </>
          )}
        </Box>

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
          InputProps={{
            style: { fontFamily: "Kanit", fontSize: 14 },
          }}
          InputLabelProps={{
            style: { fontFamily: "Kanit", fontSize: 14 },
          }}
        />

        {/* คำแนะนำสำหรับ Sales */}
        {!isAdmin && (
          <Alert severity="success" sx={{ fontFamily: "Kanit" }}>
            <Typography variant="body2" sx={{ fontFamily: "Kanit" }}>
              💡 <strong>เคล็ดลับการดูแลลูกค้า:</strong><br/>
              • บันทึกความชอบและข้อกำหนดพิเศษของลูกค้า<br/>
              • ระบุเวลาที่เหมาะสมในการติดต่อ<br/>
              • อัปเดตข้อมูลเมื่อมีการเปลี่ยนแปลง
            </Typography>
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default YourDetailsStepSimple; 