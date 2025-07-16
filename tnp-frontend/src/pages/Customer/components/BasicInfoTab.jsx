import React from "react";
import { Grid2 as Grid, Box, Typography } from "@mui/material";
import { MdPerson, MdBusiness, MdWork, MdContactPhone } from "react-icons/md";
import { StyledTextField } from "../styles/DialogStyledComponents";
import FormFieldWrapper from "./FormFieldWrapper";

const BasicInfoTab = ({ inputList, errors, handleInputChange, mode }) => {
  const isViewMode = mode === "view";

  return (
    <Box sx={{ p: 1 }}>
      {/* Section Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" color="primary" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <MdPerson />
          ข้อมูลพื้นฐาน
        </Typography>
        <Typography variant="body2" color="text.secondary">
          กรอกข้อมูลส่วนตัวและข้อมูลองค์กรของลูกค้า
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* ชื่อจริง */}
        <Grid size={12} md={4}>
          <FormFieldWrapper
            label="ชื่อจริง"
            required={true}
            error={errors.cus_firstname}
            value={inputList.cus_firstname}
            icon={<MdPerson size={16} />}
            tooltip="กรอกชื่อจริงของลูกค้า"
            showProgress={!isViewMode}
          >
            <StyledTextField
              fullWidth
              name="cus_firstname"
              placeholder="เช่น สมชาย"
              value={inputList.cus_firstname || ""}
              onChange={handleInputChange}
              InputProps={{
                readOnly: isViewMode,
              }}
              size="small"
            />
          </FormFieldWrapper>
        </Grid>

        {/* นามสกุล */}
        <Grid size={12} md={4}>
          <FormFieldWrapper
            label="นามสกุล"
            required={true}
            error={errors.cus_lastname}
            value={inputList.cus_lastname}
            icon={<MdPerson size={16} />}
            tooltip="กรอกนามสกุลของลูกค้า"
            showProgress={!isViewMode}
          >
            <StyledTextField
              fullWidth
              name="cus_lastname"
              placeholder="เช่น ใจดี"
              value={inputList.cus_lastname || ""}
              onChange={handleInputChange}
              InputProps={{
                readOnly: isViewMode,
              }}
              size="small"
            />
          </FormFieldWrapper>
        </Grid>

        {/* ชื่อเล่น */}
        <Grid size={12} md={4}>
          <FormFieldWrapper
            label="ชื่อเล่น"
            required={true}
            error={errors.cus_name}
            value={inputList.cus_name}
            icon={<MdContactPhone size={16} />}
            tooltip="ชื่อที่ใช้เรียกในการติดต่อ"
            showProgress={!isViewMode}
          >
            <StyledTextField
              fullWidth
              name="cus_name"
              placeholder="เช่น คุณชาย"
              value={inputList.cus_name || ""}
              onChange={handleInputChange}
              InputProps={{
                readOnly: isViewMode,
              }}
              size="small"
            />
          </FormFieldWrapper>
        </Grid>

        {/* ตำแหน่ง */}
        <Grid size={12} md={6}>
          <FormFieldWrapper
            label="ตำแหน่ง"
            required={false}
            error={errors.cus_depart}
            value={inputList.cus_depart}
            icon={<MdWork size={16} />}
            tooltip="ตำแหน่งงานหรือแผนกของลูกค้า"
            helperText="ระบุตำแหน่งงานหรือหน้าที่ความรับผิดชอบ"
            showProgress={!isViewMode}
          >
            <StyledTextField
              fullWidth
              name="cus_depart"
              placeholder="เช่น ผู้จัดการฝ่ายจัดซื้อ"
              value={inputList.cus_depart || ""}
              onChange={handleInputChange}
              InputProps={{
                readOnly: isViewMode,
              }}
              size="small"
            />
          </FormFieldWrapper>
        </Grid>

        {/* รหัสลูกค้า */}
        <Grid size={12} md={6}>
          <FormFieldWrapper
            label="รหัสลูกค้า"
            required={false}
            value={inputList.cus_no}
            icon={<MdBusiness size={16} />}
            tooltip="รหัสลูกค้าจะถูกสร้างอัตโนมัติ"
            helperText="รหัสลูกค้าจะถูกกำหนดให้อัตโนมัติ"
            showProgress={false}
          >
            <StyledTextField
              fullWidth
              name="cus_no"
              value={inputList.cus_no || ""}
              InputProps={{
                readOnly: true,
              }}
              size="small"
              disabled
            />
          </FormFieldWrapper>
        </Grid>
      </Grid>

      {/* Additional Info Section */}
      {!isViewMode && (
        <Box sx={{ mt: 4, p: 2, backgroundColor: "primary.lighter", borderRadius: 2 }}>
          <Typography variant="body2" color="primary.main" fontWeight={500}>
            💡 เคล็ดลับการกรอกข้อมูล
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            • ชื่อจริง-นามสกุล และชื่อเล่น เป็นข้อมูลที่จำเป็นต้องกรอก
            <br />
            • ชื่อเล่นจะใช้สำหรับการติดต่อและแสดงในระบบ
            <br />
            • ตำแหน่งงานจะช่วยในการติดต่อและการประสานงาน
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BasicInfoTab; 