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
  CircularProgress,
} from "@mui/material";
import {
  MdAssignment,
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdReceiptLong,
  MdContactPhone,
} from "react-icons/md";
import {
  StyledTextField,
  StyledSelect,
} from "../styles/DialogStyledComponents";
import FormFieldWrapper from "./FormFieldWrapper";
import { selectList } from "../constants/dialogConstants";

// สี theme ของบริษัท
const PRIMARY_RED = "#B20000";
const LIGHT_RED = "#E36264";

/**
 * BusinessDetailStep - ขั้นตอนที่ 2: รายละเอียดธุรกิจ
 */
const BusinessDetailStep = ({
  inputList = {},
  errors = {},
  handleInputChange,
  handleSelectLocation,
  provincesList = [],
  districtList = [],
  subDistrictList = [],
  mode = "create",
  isLoading = false,
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
          background: `linear-gradient(45deg, ${PRIMARY_RED}05, ${PRIMARY_RED}10)`,
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <MdAssignment size={28} color={PRIMARY_RED} />
          <Typography
            variant="h5"
            fontWeight={600}
            color={PRIMARY_RED}
            fontFamily="Kanit"
          >
            รายละเอียดธุรกิจ
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" fontFamily="Kanit">
          ข้อมูลติดต่อ ที่อยู่ และช่องทางการติดต่อของธุรกิจ
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* ข้อมูลติดต่อ */}
        <Grid xs={12}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <MdContactPhone size={20} color={PRIMARY_RED} />
            <Typography
              variant="h6"
              fontWeight={500}
              color={PRIMARY_RED}
              fontFamily="Kanit"
            >
              ข้อมูลติดต่อ
            </Typography>
          </Box>
        </Grid>

        {/* เบอร์โทรหลัก */}
        <Grid xs={12} md={6}>
          <FormFieldWrapper
            label="เบอร์โทรหลัก"
            name="cus_tel_1"
            required
            error={errors.cus_tel_1}
            value={inputList.cus_tel_1}
            helpText="เบอร์โทรที่สามารถติดต่อได้แน่นอน"
          >
            <StyledTextField
              name="cus_tel_1"
              label="เบอร์โทรหลัก"
              value={inputList.cus_tel_1 || ""}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!errors.cus_tel_1}
              helperText={errors.cus_tel_1}
              disabled={mode === "view"}
              placeholder="เช่น 02-123-4567, 081-234-5678"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdPhone color={PRIMARY_RED} />
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

        {/* เบอร์โทรสำรอง */}
        <Grid xs={12} md={6}>
          <FormFieldWrapper
            label="เบอร์โทรสำรอง"
            name="cus_tel_2"
            error={errors.cus_tel_2}
            value={inputList.cus_tel_2}
            helpText="เบอร์โทรสำรองหรือแฟกซ์ (ถ้ามี)"
          >
            <StyledTextField
              name="cus_tel_2"
              label="เบอร์โทรสำรอง"
              value={inputList.cus_tel_2 || ""}
              onChange={handleInputChange}
              fullWidth
              error={!!errors.cus_tel_2}
              helperText={errors.cus_tel_2}
              disabled={mode === "view"}
              placeholder="เช่น 02-123-4568, 081-234-5679"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdPhone color={PRIMARY_RED} />
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

        {/* อีเมล */}
        <Grid xs={12} md={6}>
          <FormFieldWrapper
            label="อีเมล"
            name="cus_email"
            error={errors.cus_email}
            value={inputList.cus_email}
            helpText="อีเมลสำหรับติดต่อและส่งเอกสาร"
          >
            <StyledTextField
              name="cus_email"
              label="อีเมล"
              type="email"
              value={inputList.cus_email || ""}
              onChange={handleInputChange}
              fullWidth
              error={!!errors.cus_email}
              helperText={errors.cus_email}
              disabled={mode === "view"}
              placeholder="เช่น contact@company.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdEmail color={PRIMARY_RED} />
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

        {/* ช่องทางการรู้จัก */}
        <Grid xs={12} md={6}>
          <FormFieldWrapper
            label="ช่องทางการรู้จัก"
            name="cus_channel"
            error={errors.cus_channel}
            value={inputList.cus_channel}
            helpText="ลูกค้ารู้จักเราผ่านช่องทางใด"
          >
            <FormControl
              fullWidth
              error={!!errors.cus_channel}
              disabled={mode === "view"}
            >
              <InputLabel sx={{ fontFamily: "Kanit", fontSize: 14 }}>
                ช่องทางการรู้จัก
              </InputLabel>
              <StyledSelect
                name="cus_channel"
                value={inputList.cus_channel || ""}
                onChange={handleInputChange}
                label="ช่องทางการรู้จัก"
                sx={{ fontFamily: "Kanit", fontSize: 14 }}
              >
                <MenuItem value="">
                  <em>กรุณาเลือกช่องทางการรู้จัก</em>
                </MenuItem>
                {selectList.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Typography fontFamily="Kanit" fontSize={14}>
                      {option.label}
                    </Typography>
                  </MenuItem>
                ))}
              </StyledSelect>
            </FormControl>
          </FormFieldWrapper>
        </Grid>

        {/* เลขประจำตัวผู้เสียภาษี */}
        <Grid xs={12} md={6}>
          <FormFieldWrapper
            label="เลขประจำตัวผู้เสียภาษี"
            name="cus_tax_id"
            error={errors.cus_tax_id}
            value={inputList.cus_tax_id}
            helpText="เลขประจำตัวผู้เสียภาษี 13 หลัก (ถ้ามี)"
          >
            <StyledTextField
              name="cus_tax_id"
              label="เลขประจำตัวผู้เสียภาษี"
              value={inputList.cus_tax_id || ""}
              onChange={handleInputChange}
              fullWidth
              error={!!errors.cus_tax_id}
              helperText={errors.cus_tax_id}
              disabled={mode === "view"}
              placeholder="เช่น 1234567890123"
              inputProps={{
                maxLength: 13,
                pattern: "[0-9]*",
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdReceiptLong color={PRIMARY_RED} />
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

        <Grid xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>

        {/* ที่อยู่ */}
        <Grid xs={12}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <MdLocationOn size={20} color={PRIMARY_RED} />
            <Typography
              variant="h6"
              fontWeight={500}
              color={PRIMARY_RED}
              fontFamily="Kanit"
            >
              ที่อยู่ธุรกิจ
            </Typography>
          </Box>
        </Grid>

        {/* ที่อยู่เต็ม */}
        <Grid xs={12}>
          <FormFieldWrapper
            label="ที่อยู่เต็ม"
            name="cus_address"
            required
            error={errors.cus_address}
            value={inputList.cus_address}
            helpText="บ้านเลขที่ ซอย ถนน"
          >
            <StyledTextField
              name="cus_address"
              label="ที่อยู่เต็ม"
              value={inputList.cus_address || ""}
              onChange={handleInputChange}
              fullWidth
              required
              multiline
              rows={2}
              error={!!errors.cus_address}
              helperText={errors.cus_address}
              disabled={mode === "view"}
              placeholder="เช่น 123/45 ซอย ABC ถนน XYZ"
              InputProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
              InputLabelProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
            />
          </FormFieldWrapper>
        </Grid>

        {/* จังหวัด */}
        <Grid xs={12} md={6}>
          <FormFieldWrapper
            label="จังหวัด"
            name="cus_pro_id"
            required
            error={errors.cus_pro_id}
            value={inputList.cus_pro_id}
            helpText="เลือกจังหวัด"
          >
            <FormControl
              fullWidth
              error={!!errors.cus_pro_id}
              disabled={mode === "view"}
            >
              <InputLabel sx={{ fontFamily: "Kanit", fontSize: 14 }}>
                จังหวัด *
              </InputLabel>
              <StyledSelect
                name="cus_pro_id"
                value={inputList.cus_pro_id || ""}
                onChange={(e) => handleSelectLocation(e, "province")}
                label="จังหวัด *"
                disabled={isLoading}
                sx={{ fontFamily: "Kanit", fontSize: 14 }}
              >
                <MenuItem value="">
                  <em>กรุณาเลือกจังหวัด</em>
                </MenuItem>
                {provincesList.map((province) => (
                  <MenuItem key={province.pro_id} value={province.pro_id}>
                    <Typography fontFamily="Kanit" fontSize={14}>
                      {province.pro_name}
                    </Typography>
                  </MenuItem>
                ))}
              </StyledSelect>
              {isLoading && (
                <Box display="flex" justifyContent="center" mt={1}>
                  <CircularProgress size={20} />
                </Box>
              )}
            </FormControl>
          </FormFieldWrapper>
        </Grid>

        {/* อำเภอ */}
        <Grid xs={12} md={6}>
          <FormFieldWrapper
            label="อำเภอ/เขต"
            name="cus_dis_id"
            required
            error={errors.cus_dis_id}
            value={inputList.cus_dis_id}
            helpText="เลือกอำเภอหรือเขต"
          >
            <FormControl
              fullWidth
              error={!!errors.cus_dis_id}
              disabled={mode === "view"}
            >
              <InputLabel sx={{ fontFamily: "Kanit", fontSize: 14 }}>
                อำเภอ/เขต *
              </InputLabel>
              <StyledSelect
                name="cus_dis_id"
                value={inputList.cus_dis_id || ""}
                onChange={(e) => handleSelectLocation(e, "district")}
                label="อำเภอ/เขต *"
                disabled={!inputList.cus_pro_id || isLoading}
                sx={{ fontFamily: "Kanit", fontSize: 14 }}
              >
                <MenuItem value="">
                  <em>กรุณาเลือกอำเภอ/เขต</em>
                </MenuItem>
                {districtList.map((district) => (
                  <MenuItem key={district.dis_id} value={district.dis_id}>
                    <Typography fontFamily="Kanit" fontSize={14}>
                      {district.dis_name}
                    </Typography>
                  </MenuItem>
                ))}
              </StyledSelect>
            </FormControl>
          </FormFieldWrapper>
        </Grid>

        {/* ตำบล */}
        <Grid xs={12} md={6}>
          <FormFieldWrapper
            label="ตำบล/แขวง"
            name="cus_sub_id"
            required
            error={errors.cus_sub_id}
            value={inputList.cus_sub_id}
            helpText="เลือกตำบลหรือแขวง"
          >
            <FormControl
              fullWidth
              error={!!errors.cus_sub_id}
              disabled={mode === "view"}
            >
              <InputLabel sx={{ fontFamily: "Kanit", fontSize: 14 }}>
                ตำบล/แขวง *
              </InputLabel>
              <StyledSelect
                name="cus_sub_id"
                value={inputList.cus_sub_id || ""}
                onChange={(e) => handleSelectLocation(e, "subdistrict")}
                label="ตำบล/แขวง *"
                disabled={!inputList.cus_dis_id || isLoading}
                sx={{ fontFamily: "Kanit", fontSize: 14 }}
              >
                <MenuItem value="">
                  <em>กรุณาเลือกตำบล/แขวง</em>
                </MenuItem>
                {subDistrictList.map((subDistrict) => (
                  <MenuItem key={subDistrict.sub_id} value={subDistrict.sub_id}>
                    <Typography fontFamily="Kanit" fontSize={14}>
                      {subDistrict.sub_name}
                    </Typography>
                  </MenuItem>
                ))}
              </StyledSelect>
            </FormControl>
          </FormFieldWrapper>
        </Grid>

        {/* รหัสไปรษณีย์ */}
        <Grid xs={12} md={6}>
          <FormFieldWrapper
            label="รหัสไปรษณีย์"
            name="cus_zip_code"
            error={errors.cus_zip_code}
            value={inputList.cus_zip_code}
            helpText="รหัสไปรษณีย์ 5 หลัก"
          >
            <StyledTextField
              name="cus_zip_code"
              label="รหัสไปรษณีย์"
              value={inputList.cus_zip_code || ""}
              onChange={handleInputChange}
              fullWidth
              error={!!errors.cus_zip_code}
              helperText={errors.cus_zip_code}
              disabled={mode === "view"}
              placeholder="เช่น 10110"
              inputProps={{
                maxLength: 5,
                pattern: "[0-9]*",
              }}
              InputProps={{
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

export default BusinessDetailStep;
