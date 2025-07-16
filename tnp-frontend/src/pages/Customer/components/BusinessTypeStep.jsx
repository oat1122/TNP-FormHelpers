import React from "react";
import {
  Box,
  Typography,
  Grid2 as Grid,
  FormControl,
  InputLabel,
  MenuItem,
  IconButton,
  Chip,
  Paper,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  MdBusiness,
  MdSettings,
  MdPerson,
  MdWorkOutline,
} from "react-icons/md";
import {
  StyledTextField,
  StyledSelect,
} from "../styles/DialogStyledComponents";
import FormFieldWrapper from "./FormFieldWrapper";

// สี theme ของบริษัท
const PRIMARY_RED = "#B20000";
const LIGHT_RED = "#E36264";

/**
 * BusinessTypeStep - ขั้นตอนที่ 1: เลือกประเภทธุรกิจและข้อมูลพื้นฐาน
 */
const BusinessTypeStep = ({
  inputList = {},
  errors = {},
  handleInputChange,
  businessTypesList = [],
  handleOpenBusinessTypeManager,
  businessTypesIsFetching = false,
  mode = "create",
}) => {
  const getSelectedBusinessType = () => {
    return businessTypesList.find((type) => type.bt_id === inputList.cus_bt_id);
  };

  const selectedBusinessType = getSelectedBusinessType();

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
          background: `linear-gradient(45deg, ${PRIMARY_RED}05, ${PRIMARY_RED}10)`,
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <MdBusiness size={28} color={PRIMARY_RED} />
          <Typography
            variant="h5"
            fontWeight={600}
            color={PRIMARY_RED}
            fontFamily="Kanit"
          >
            ประเภทธุรกิจ
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" fontFamily="Kanit">
          เลือกประเภทธุรกิจและกรอกข้อมูลพื้นฐานของบริษัท
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* ประเภทธุรกิจ */}
        <Grid xs={12}>
          <FormFieldWrapper
            label="ประเภทธุรกิจ"
            name="cus_bt_id"
            required
            error={errors.cus_bt_id}
            value={inputList.cus_bt_id}
            helpText="เลือกประเภทธุรกิจที่ตรงกับลูกค้าของคุณ"
          >
            <Box display="flex" gap={1} alignItems="flex-start">
              <FormControl
                fullWidth
                error={!!errors.cus_bt_id}
                disabled={mode === "view"}
              >
                <InputLabel sx={{ fontFamily: "Kanit", fontSize: 14 }}>
                  เลือกประเภทธุรกิจ *
                </InputLabel>
                <StyledSelect
                  name="cus_bt_id"
                  value={inputList.cus_bt_id || ""}
                  onChange={handleInputChange}
                  label="เลือกประเภทธุรกิจ *"
                  disabled={businessTypesIsFetching || mode === "view"}
                  sx={{ fontFamily: "Kanit", fontSize: 14 }}
                >
                  <MenuItem value="" disabled>
                    <em>กรุณาเลือกประเภทธุรกิจ</em>
                  </MenuItem>
                  {businessTypesList.map((type) => (
                    <MenuItem key={type.bt_id} value={type.bt_id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography fontFamily="Kanit" fontSize={14}>
                          {type.bt_name}
                        </Typography>
                        {type.bt_desc && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontFamily: "Kanit",
                            }}
                          >
                            ({type.bt_desc})
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </StyledSelect>
              </FormControl>

              {mode !== "view" && (
                <Tooltip title="จัดการประเภทธุรกิจ" arrow>
                  <IconButton
                    onClick={handleOpenBusinessTypeManager}
                    sx={{
                      color: PRIMARY_RED,
                      border: `1px solid ${PRIMARY_RED}`,
                      "&:hover": {
                        backgroundColor: `${PRIMARY_RED}10`,
                      },
                    }}
                  >
                    <MdSettings />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* แสดงประเภทธุรกิจที่เลือก */}
            {selectedBusinessType && (
              <Box mt={1}>
                <Chip
                  label={selectedBusinessType.bt_name}
                  color="primary"
                  size="small"
                  sx={{
                    backgroundColor: PRIMARY_RED,
                    color: "white",
                    fontFamily: "Kanit",
                    fontSize: "0.75rem",
                  }}
                />
                {selectedBusinessType.bt_desc && (
                  <Typography
                    variant="caption"
                    sx={{ ml: 1, color: "text.secondary", fontFamily: "Kanit" }}
                  >
                    {selectedBusinessType.bt_desc}
                  </Typography>
                )}
              </Box>
            )}
          </FormFieldWrapper>
        </Grid>

        <Grid xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>

        {/* ข้อมูลบริษัท */}
        <Grid xs={12}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <MdBusiness size={20} color={PRIMARY_RED} />
            <Typography
              variant="h6"
              fontWeight={500}
              color={PRIMARY_RED}
              fontFamily="Kanit"
            >
              ข้อมูลบริษัท
            </Typography>
          </Box>
        </Grid>

        {/* ชื่อบริษัท */}
        <Grid xs={12} md={6}>
          <FormFieldWrapper
            label="ชื่อบริษัท"
            name="cus_company"
            required
            error={errors.cus_company}
            value={inputList.cus_company}
            helpText="ชื่อบริษัทหรือองค์กรเต็ม"
          >
            <StyledTextField
              name="cus_company"
              label="ชื่อบริษัท"
              value={inputList.cus_company || ""}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!errors.cus_company}
              helperText={errors.cus_company}
              disabled={mode === "view"}
              placeholder="เช่น บริษัท ABC จำกัด"
              InputProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
              InputLabelProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
            />
          </FormFieldWrapper>
        </Grid>

        {/* ชื่อเล่น */}
        <Grid xs={12} md={6}>
          <FormFieldWrapper
            label="ชื่อเล่น"
            name="cus_name"
            required
            error={errors.cus_name}
            value={inputList.cus_name}
            helpText="ชื่อย่อที่ใช้ในระบบ (ไม่เกิน 50 ตัวอักษร)"
          >
            <StyledTextField
              name="cus_name"
              label="ชื่อเล่น"
              value={inputList.cus_name || ""}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!errors.cus_name}
              helperText={errors.cus_name}
              disabled={mode === "view"}
              placeholder="เช่น ABC, บริษัท ABC"
              inputProps={{ maxLength: 50 }}
              InputProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
              InputLabelProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
            />
          </FormFieldWrapper>
        </Grid>

        <Grid xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>

        {/* ข้อมูลผู้ติดต่อ */}
        <Grid xs={12}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <MdPerson size={20} color={PRIMARY_RED} />
            <Typography
              variant="h6"
              fontWeight={500}
              color={PRIMARY_RED}
              fontFamily="Kanit"
            >
              ข้อมูลผู้ติดต่อหลัก
            </Typography>
          </Box>
        </Grid>

        {/* ชื่อจริงลูกค้า */}
        <Grid xs={12} md={6}>
          <FormFieldWrapper
            label="ชื่อจริงลูกค้า"
            name="cus_firstname"
            required
            error={errors.cus_firstname}
            value={inputList.cus_firstname}
            helpText="ชื่อของผู้ติดต่อหลัก"
          >
            <StyledTextField
              name="cus_firstname"
              label="ชื่อจริงลูกค้า"
              value={inputList.cus_firstname || ""}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!errors.cus_firstname}
              helperText={errors.cus_firstname}
              disabled={mode === "view"}
              placeholder="เช่น สมชาย"
              InputProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
              InputLabelProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
            />
          </FormFieldWrapper>
        </Grid>

        {/* นามสกุลลูกค้า */}
        <Grid xs={12} md={6}>
          <FormFieldWrapper
            label="นามสกุลลูกค้า"
            name="cus_lastname"
            required
            error={errors.cus_lastname}
            value={inputList.cus_lastname}
            helpText="นามสกุลของผู้ติดต่อหลัก"
          >
            <StyledTextField
              name="cus_lastname"
              label="นามสกุลลูกค้า"
              value={inputList.cus_lastname || ""}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!errors.cus_lastname}
              helperText={errors.cus_lastname}
              disabled={mode === "view"}
              placeholder="เช่น ใจดี"
              InputProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
              InputLabelProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
            />
          </FormFieldWrapper>
        </Grid>

        {/* ตำแหน่ง */}
        <Grid xs={12} md={6}>
          <FormFieldWrapper
            label="ตำแหน่ง"
            name="cus_depart"
            error={errors.cus_depart}
            value={inputList.cus_depart}
            helpText="ตำแหน่งงานของผู้ติดต่อ"
          >
            <StyledTextField
              name="cus_depart"
              label="ตำแหน่ง"
              value={inputList.cus_depart || ""}
              onChange={handleInputChange}
              fullWidth
              error={!!errors.cus_depart}
              helperText={errors.cus_depart}
              disabled={mode === "view"}
              placeholder="เช่น ผู้จัดการฝ่ายขาย, เจ้าของกิจการ"
              InputProps={{
                startAdornment: (
                  <MdWorkOutline
                    style={{ marginRight: 8, color: PRIMARY_RED }}
                  />
                ),
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
              InputLabelProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
            />
          </FormFieldWrapper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BusinessTypeStep;
