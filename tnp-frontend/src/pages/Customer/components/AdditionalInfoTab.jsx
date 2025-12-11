import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  useTheme,
  useMediaQuery,
  Grid2 as Grid,
} from "@mui/material";
import React, { useEffect } from "react";
import { MdLocationOn, MdNote, MdSupervisorAccount, MdInfo } from "react-icons/md";
import { HiIdentification } from "react-icons/hi";

// สี theme ของบริษัท
const PRIMARY_RED = "#9e0000";
const BACKGROUND_COLOR = "#fffaf9";

// Section Header Component (outside main component to prevent re-creation)
const SectionHeader = ({ icon: Icon, title, subtitle, optional }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      mb: 2,
      pb: 1,
      borderBottom: `2px solid ${PRIMARY_RED}20`,
    }}
  >
    <Box
      sx={{
        p: 1,
        borderRadius: 1,
        bgcolor: `${PRIMARY_RED}10`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={20} color={PRIMARY_RED} />
    </Box>
    <Box sx={{ flex: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontFamily: "Kanit",
            fontWeight: 600,
            color: PRIMARY_RED,
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        {optional && (
          <Typography
            variant="caption"
            sx={{
              fontFamily: "Kanit",
              color: "text.secondary",
              bgcolor: "#f5f5f5",
              px: 1,
              py: 0.25,
              borderRadius: 1,
            }}
          >
            ไม่บังคับ
          </Typography>
        )}
      </Box>
      {subtitle && (
        <Typography
          variant="caption"
          sx={{
            fontFamily: "Kanit",
            color: "text.secondary",
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);

// Styled TextField Component (outside main component to prevent re-creation)
const StyledTextField = ({ label, mode, onBlur, ...props }) => (
  <TextField
    {...props}
    label={label}
    size="small"
    fullWidth
    disabled={mode === "view"}
    onBlur={onBlur}
    sx={{
      bgcolor: "white",
      "& .MuiOutlinedInput-root": {
        "&:hover fieldset": {
          borderColor: PRIMARY_RED,
        },
        "&.Mui-focused fieldset": {
          borderColor: PRIMARY_RED,
        },
      },
      "& .MuiInputLabel-root": {
        "&:hover": {
          color: PRIMARY_RED,
        },
        "&.Mui-focused": {
          color: PRIMARY_RED,
        },
      },
      ...props.sx,
    }}
    InputProps={{
      style: { fontFamily: "Kanit", fontSize: 14 },
      ...props.InputProps,
    }}
    InputLabelProps={{
      style: { fontFamily: "Kanit", fontSize: 14 },
      ...props.InputLabelProps,
    }}
  />
);

/**
 * AdditionalInfoTab - Tab 2: ที่อยู่และข้อมูลเพิ่มเติม (ไม่บังคับ)
 * รวมฟิลด์: ที่อยู่, เลขภาษี, ผู้ดูแล, หมายเหตุ
 */
const AdditionalInfoTab = ({
  inputList = {},
  errors = {},
  handleInputChange,
  handleSelectLocation,
  mode = "create",
  salesList = [],
  provincesList = [],
  districtList = [],
  subDistrictList = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ดึงข้อมูล user ปัจจุบัน
  const currentUser = JSON.parse(localStorage.getItem("userData") || "{}");
  const isAdmin = currentUser.role === "admin";

  // ตั้งค่าผู้ดูแลเริ่มต้นสำหรับ user ปกติ
  useEffect(() => {
    if (!isAdmin && currentUser.user_id && mode === "create") {
      if (!inputList.cus_manage_by?.user_id) {
        const managedBy = {
          user_id: currentUser.user_id,
          username: currentUser.username || currentUser.user_nickname || "คุณ",
        };

        setTimeout(() => {
          const syntheticEvent = {
            target: {
              name: "cus_manage_by",
              value: managedBy,
            },
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
      const managedBy = { user_id: "", username: "" };
      handleInputChange({
        target: { name: "cus_manage_by", value: managedBy },
      });
    } else {
      const selectedUser = salesList.find(
        (user) => String(user.user_id) === String(selectedUserId)
      );

      if (selectedUser) {
        const managedBy = {
          user_id: selectedUser.user_id,
          username:
            selectedUser.username || selectedUser.user_nickname || `User ${selectedUser.user_id}`,
        };
        handleInputChange({
          target: { name: "cus_manage_by", value: managedBy },
        });
      }
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* SECTION 1: ที่อยู่ธุรกิจ */}
      <Box sx={{ mb: 4 }}>
        <SectionHeader
          icon={MdLocationOn}
          title="ที่อยู่ธุรกิจ"
          subtitle="ที่อยู่สำหรับการติดต่อและจัดส่ง"
          optional
        />

        <Stack spacing={2.5}>
          {/* ที่อยู่ */}
          <StyledTextField
            mode={mode}
            name="cus_address_detail"
            label="บ้านเลขที่/หมู่บ้าน/ถนน"
            value={inputList.cus_address_detail || ""}
            onChange={handleInputChange}
            error={!!errors.cus_address_detail}
            helperText={errors.cus_address_detail}
            placeholder="เช่น 39/3 หมู่ 3 ถนนสุโขทัย"
          />

          {/* จังหวัด + อำเภอ + ตำบล (Dropdowns) */}
          <Grid container spacing={2}>
            {/* จังหวัด */}
            <Grid xs={12} sm={4}>
              <FormControl fullWidth size="small" disabled={mode === "view"}>
                <InputLabel sx={{ fontFamily: "Kanit", fontSize: 14 }}>จังหวัด</InputLabel>
                <Select
                  name="cus_pro_id"
                  value={inputList.cus_pro_id || ""}
                  onChange={handleSelectLocation}
                  label="จังหวัด"
                  error={!!errors.cus_pro_id}
                  sx={{
                    fontFamily: "Kanit",
                    fontSize: 14,
                    bgcolor: "white",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: PRIMARY_RED,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: PRIMARY_RED,
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: { maxHeight: 300 },
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontFamily: "Kanit" }}>
                    -- เลือกจังหวัด --
                  </MenuItem>
                  {provincesList.map((province) => (
                    <MenuItem
                      key={province.pro_id}
                      value={province.pro_id}
                      sx={{ fontFamily: "Kanit" }}
                    >
                      {province.pro_name_th}
                    </MenuItem>
                  ))}
                </Select>
                {errors.cus_pro_id && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, fontFamily: "Kanit" }}>
                    {errors.cus_pro_id}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* อำเภอ */}
            <Grid xs={12} sm={4}>
              <FormControl
                fullWidth
                size="small"
                disabled={mode === "view" || !inputList.cus_pro_id}
              >
                <InputLabel sx={{ fontFamily: "Kanit", fontSize: 14 }}>เขต/อำเภอ</InputLabel>
                <Select
                  name="cus_dis_id"
                  value={inputList.cus_dis_id || ""}
                  onChange={handleSelectLocation}
                  label="เขต/อำเภอ"
                  error={!!errors.cus_dis_id}
                  sx={{
                    fontFamily: "Kanit",
                    fontSize: 14,
                    bgcolor: "white",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: PRIMARY_RED,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: PRIMARY_RED,
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: { maxHeight: 300 },
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontFamily: "Kanit" }}>
                    {inputList.cus_pro_id ? "-- เลือกอำเภอ --" : "กรุณาเลือกจังหวัดก่อน"}
                  </MenuItem>
                  {districtList.map((district) => (
                    <MenuItem
                      key={district.dis_id}
                      value={district.dis_id}
                      sx={{ fontFamily: "Kanit" }}
                    >
                      {district.dis_name_th}
                    </MenuItem>
                  ))}
                </Select>
                {errors.cus_dis_id && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, fontFamily: "Kanit" }}>
                    {errors.cus_dis_id}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* ตำบล */}
            <Grid xs={12} sm={4}>
              <FormControl
                fullWidth
                size="small"
                disabled={mode === "view" || !inputList.cus_dis_id}
              >
                <InputLabel sx={{ fontFamily: "Kanit", fontSize: 14 }}>แขวง/ตำบล</InputLabel>
                <Select
                  name="cus_sub_id"
                  value={inputList.cus_sub_id || ""}
                  onChange={handleSelectLocation}
                  label="แขวง/ตำบล"
                  error={!!errors.cus_sub_id}
                  sx={{
                    fontFamily: "Kanit",
                    fontSize: 14,
                    bgcolor: "white",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: PRIMARY_RED,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: PRIMARY_RED,
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: { maxHeight: 300 },
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontFamily: "Kanit" }}>
                    {inputList.cus_dis_id ? "-- เลือกตำบล --" : "กรุณาเลือกอำเภอก่อน"}
                  </MenuItem>
                  {subDistrictList.map((subDistrict) => (
                    <MenuItem
                      key={subDistrict.sub_id}
                      value={subDistrict.sub_id}
                      sx={{ fontFamily: "Kanit" }}
                    >
                      {subDistrict.sub_name_th}
                    </MenuItem>
                  ))}
                </Select>
                {errors.cus_sub_id && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, fontFamily: "Kanit" }}>
                    {errors.cus_sub_id}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>

          {/* รหัสไปรษณีย์ (Auto-filled) */}
          <StyledTextField
            mode={mode}
            name="cus_zip_code"
            label="รหัสไปรษณีย์"
            value={inputList.cus_zip_code || ""}
            onChange={handleInputChange}
            error={!!errors.cus_zip_code}
            helperText={errors.cus_zip_code || "รหัสไปรษณีย์จะถูกกรอกอัตโนมัติเมื่อเลือกตำบล"}
            placeholder="เช่น 13260"
            inputProps={{
              maxLength: 5,
              pattern: "[0-9]*",
            }}
            sx={{ maxWidth: { xs: "100%", sm: "200px" } }}
          />
        </Stack>
      </Box>

      {/* SECTION 2: ข้อมูลเพิ่มเติม */}
      <Box sx={{ mb: 4 }}>
        <SectionHeader
          icon={HiIdentification}
          title="ข้อมูลทางธุรกิจ"
          subtitle="เลขภาษีและข้อมูลสำหรับออกใบกำกับ"
          optional
        />

        <StyledTextField
          mode={mode}
          name="cus_tax_id"
          label="เลขประจำตัวผู้เสียภาษี"
          value={inputList.cus_tax_id || ""}
          onChange={handleInputChange}
          error={!!errors.cus_tax_id}
          helperText={errors.cus_tax_id || "เลข 13 หลัก"}
          placeholder="เช่น 1234567890123"
          inputProps={{
            maxLength: 13,
            pattern: "[0-9]*",
          }}
        />
      </Box>

      {/* SECTION 3: ผู้ดูแลลูกค้า */}
      <Box sx={{ mb: 4 }}>
        <SectionHeader
          icon={MdSupervisorAccount}
          title="ผู้ดูแลลูกค้า"
          subtitle="กำหนดผู้รับผิดชอบดูแลลูกค้ารายนี้"
        />

        {isAdmin ? (
          <FormControl fullWidth disabled={mode === "view"} size="small">
            <InputLabel sx={{ fontFamily: "Kanit", fontSize: 14 }}>เลือกผู้ดูแลลูกค้า</InputLabel>
            <Select
              name="cus_manage_by_select"
              value={inputList.cus_manage_by?.user_id || ""}
              onChange={handleManagerChange}
              label="เลือกผู้ดูแลลูกค้า"
              error={!!errors.cus_manage_by}
              sx={{
                fontFamily: "Kanit",
                fontSize: 14,
                bgcolor: "white",
              }}
            >
              <MenuItem value="" sx={{ fontFamily: "Kanit" }}>
                ไม่มีผู้ดูแล
              </MenuItem>
              {salesList.map((user) => (
                <MenuItem
                  key={user.user_id}
                  value={String(user.user_id)}
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
          <Stack spacing={2}>
            <StyledTextField
              mode={mode}
              name="cus_manage_by_display"
              label="ผู้ดูแลลูกค้า"
              value={
                inputList.cus_manage_by?.username ||
                currentUser.username ||
                currentUser.user_nickname ||
                "คุณ"
              }
              disabled
            />
            <Alert severity="info" sx={{ fontFamily: "Kanit" }}>
              คุณจะเป็นผู้ดูแลลูกค้ารายนี้โดยอัตโนมัติ
            </Alert>
          </Stack>
        )}
      </Box>

      {/* SECTION 4: หมายเหตุ */}
      <Box>
        <SectionHeader
          icon={MdNote}
          title="บันทึกและหมายเหตุ"
          subtitle="ข้อมูลเพิ่มเติมสำหรับการดูแลลูกค้า"
          optional
        />

        <Stack spacing={2.5}>
          <StyledTextField
            mode={mode}
            name="cd_note"
            label="หมายเหตุ"
            value={inputList.cd_note || ""}
            onChange={handleInputChange}
            error={!!errors.cd_note}
            helperText={errors.cd_note}
            placeholder="เช่น ลูกค้าใหม่, ต้องการสินค้าคุณภาพดี"
            multiline
            rows={2}
          />

          <StyledTextField
            mode={mode}
            name="cd_remark"
            label="ข้อมูลเพิ่มเติม"
            value={inputList.cd_remark || ""}
            onChange={handleInputChange}
            error={!!errors.cd_remark}
            helperText={errors.cd_remark}
            placeholder="เช่น วันเวลาที่เหมาะแก่การติดต่อ"
            multiline
            rows={2}
          />
        </Stack>
      </Box>
    </Box>
  );
};

export default AdditionalInfoTab;
