import React from "react";
import {
  Box,
  Typography,
  Grid2 as Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Divider,
  InputAdornment,
} from "@mui/material";
import {
  MdPerson,
  MdSupervisorAccount,
  MdNotes,
  MdAssignmentInd,
} from "react-icons/md";
import { StyledTextField, StyledSelect } from "../styles/DialogStyledComponents";
import FormFieldWrapper from "./FormFieldWrapper";

// สี theme ของบริษัท
const PRIMARY_RED = "#B20000";
const LIGHT_RED = "#E36264";

/**
 * YourDetailsStep - ขั้นตอนที่ 3: ข้อมูลของคุณ
 */
const YourDetailsStep = ({
  inputList = {},
  errors = {},
  handleInputChange,
  salesList = [],
  isAdmin = false,
  mode = "create",
  user = null,
}) => {
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
          background: `linear-gradient(45deg, ${PRIMARY_RED}05, ${PRIMARY_RED}10)`
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

      <Grid container spacing={3}>
        {/* ผู้ดูแลลูกค้า */}
        <Grid xs={12}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <MdSupervisorAccount size={20} color={PRIMARY_RED} />
            <Typography variant="h6" fontWeight={500} color={PRIMARY_RED} fontFamily="Kanit">
              การจัดการลูกค้า
            </Typography>
          </Box>
        </Grid>

        {/* ผู้ดูแลลูกค้า */}
        <Grid xs={12} md={8}>
          <FormFieldWrapper
            label="ผู้ดูแลลูกค้า"
            name="cus_manage_by"
            error={errors.cus_manage_by}
            value={inputList.cus_manage_by}
            helpText="เลือกผู้ดูแลลูกค้าหลัก (สำหรับ Admin เท่านั้น)"
          >
            <FormControl 
              fullWidth 
              error={!!errors.cus_manage_by} 
              disabled={mode === "view" || !isAdmin}
            >
              <InputLabel sx={{ fontFamily: "Kanit", fontSize: 14 }}>
                ผู้ดูแลลูกค้า
              </InputLabel>
              <StyledSelect
                name="cus_manage_by"
                value={inputList.cus_manage_by?.user_id || ""}
                onChange={handleInputChange}
                label="ผู้ดูแลลูกค้า"
                sx={{ fontFamily: "Kanit", fontSize: 14 }}
              >
                <MenuItem value="">
                  <em>กรุณาเลือกผู้ดูแลลูกค้า</em>
                </MenuItem>
                {salesList.map((sales) => (
                  <MenuItem key={sales.user_id} value={sales.user_id}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <MdAssignmentInd color={PRIMARY_RED} />
                      <Box>
                        <Typography fontFamily="Kanit" fontSize={14} fontWeight={500}>
                          {sales.username}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ color: "text.secondary", fontFamily: "Kanit" }}
                        >
                          ID: {sales.user_id}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </StyledSelect>
            </FormControl>
            
            {/* แสดงข้อมูลผู้ดูแลปัจจุบัน */}
            {!isAdmin && user && (
              <Box 
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  border: `1px solid ${PRIMARY_RED}30`,
                  borderRadius: 1,
                  backgroundColor: `${PRIMARY_RED}05`
                }}
              >
                <Typography variant="body2" fontFamily="Kanit" color={PRIMARY_RED} fontWeight={500}>
                  ผู้ดูแลลูกค้า (ไม่สามารถเปลี่ยนแปลงได้)
                </Typography>
                <Box display="flex" alignItems="center" gap={2} mt={1}>
                  <MdAssignmentInd color={PRIMARY_RED} />
                  <Box>
                    <Typography fontFamily="Kanit" fontSize={14} fontWeight={500}>
                      {user.username}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ color: "text.secondary", fontFamily: "Kanit" }}
                    >
                      ID: {user.user_id}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </FormFieldWrapper>
        </Grid>

        <Grid xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>

        {/* บันทึกเพิ่มเติม */}
        <Grid xs={12}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <MdNotes size={20} color={PRIMARY_RED} />
            <Typography variant="h6" fontWeight={500} color={PRIMARY_RED} fontFamily="Kanit">
              บันทึกเพิ่มเติม
            </Typography>
          </Box>
        </Grid>

        {/* หมายเหตุ */}
        <Grid xs={12}>
          <FormFieldWrapper
            label="หมายเหตุ"
            name="cd_note"
            error={errors.cd_note}
            value={inputList.cd_note}
            helpText="บันทึกข้อมูลสำคัญเกี่ยวกับลูกค้า"
          >
            <StyledTextField
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
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}>
                    <MdNotes color={PRIMARY_RED} />
                  </InputAdornment>
                ),
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
              InputLabelProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
            />
          </FormFieldWrapper>
        </Grid>

        {/* ข้อมูลเพิ่มเติม */}
        <Grid xs={12}>
          <FormFieldWrapper
            label="ข้อมูลเพิ่มเติม"
            name="cd_remark"
            error={errors.cd_remark}
            value={inputList.cd_remark}
            helpText="ข้อมูลเพิ่มเติมที่อาจมีประโยชน์"
          >
            <StyledTextField
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
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}>
                    <MdNotes color={PRIMARY_RED} />
                  </InputAdornment>
                ),
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
              InputLabelProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
            />
          </FormFieldWrapper>
        </Grid>

        {/* เคล็ดลับการกรอกข้อมูล */}
        <Grid xs={12}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, 
              mt: 2,
              border: `1px solid ${LIGHT_RED}`,
              borderRadius: 1,
              backgroundColor: `${LIGHT_RED}10`
            }}
          >
            <Typography variant="h6" fontFamily="Kanit" color={PRIMARY_RED} fontWeight={600} mb={1}>
              💡 เคล็ดลับการกรอกข้อมูล
            </Typography>
            
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" fontFamily="Kanit" color="text.secondary" mb={0.5}>
                <strong>หมายเหตุ:</strong> ข้อมูลสำคัญที่ต้องจำ เช่น ความต้องการพิเศษ, ข้อจำกัด
              </Typography>
              <Typography component="li" variant="body2" fontFamily="Kanit" color="text.secondary" mb={0.5}>
                <strong>ข้อมูลเพิ่มเติม:</strong> ข้อมูลที่อาจมีประโยชน์ เช่น เวลาที่เหมาะสำหรับติดต่อ
              </Typography>
              <Typography component="li" variant="body2" fontFamily="Kanit" color="text.secondary">
                <strong>ผู้ดูแล:</strong> Admin สามารถกำหนดผู้ดูแลลูกค้าได้ Sales จะเป็นผู้ดูแลอัตโนมัติ
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default YourDetailsStep; 