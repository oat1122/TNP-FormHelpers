import React from "react";
import { Grid2 as Grid, Box, Typography, InputAdornment } from "@mui/material";
import { MdPhone, MdEmail, MdBusiness, MdContactMail } from "react-icons/md";
import { StyledTextField } from "../styles/DialogStyledComponents";
import FormFieldWrapper from "./FormFieldWrapper";

const ContactInfoTab = ({ inputList, errors, handleInputChange, mode }) => {
  const isViewMode = mode === "view";

  return (
    <Box sx={{ p: 1 }}>
      {/* Section Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" color="primary" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <MdContactMail />
          ข้อมูลติดต่อ
        </Typography>
        <Typography variant="body2" color="text.secondary">
          กรอกข้อมูลการติดต่อและข้อมูลธุรกิจของลูกค้า
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* เบอร์โทรศัพท์หลัก */}
        <Grid size={12} md={6}>
          <FormFieldWrapper
            label="เบอร์โทรศัพท์หลัก"
            required={true}
            error={errors.cus_tel_1}
            value={inputList.cus_tel_1}
            icon={<MdPhone size={16} />}
            tooltip="เบอร์โทรศัพท์สำหรับการติดต่อหลัก"
            showProgress={!isViewMode}
          >
            <StyledTextField
              fullWidth
              name="cus_tel_1"
              placeholder="เช่น 02-123-4567 หรือ 081-234-5678"
              value={inputList.cus_tel_1 || ""}
              onChange={handleInputChange}
              InputProps={{
                readOnly: isViewMode,
                startAdornment: (
                  <InputAdornment position="start">
                    <MdPhone />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </FormFieldWrapper>
        </Grid>

        {/* เบอร์โทรสำรอง */}
        <Grid size={12} md={6}>
          <FormFieldWrapper
            label="เบอร์โทรศัพท์สำรอง"
            required={false}
            error={errors.cus_tel_2}
            value={inputList.cus_tel_2}
            icon={<MdPhone size={16} />}
            tooltip="เบอร์โทรศัพท์สำรองเพื่อการติดต่อ"
            helperText="เบอร์โทรศัพท์สำรองสำหรับกรณีติดต่อไม่ได้"
            showProgress={!isViewMode}
          >
            <StyledTextField
              fullWidth
              name="cus_tel_2"
              placeholder="เช่น 081-234-5678"
              value={inputList.cus_tel_2 || ""}
              onChange={handleInputChange}
              InputProps={{
                readOnly: isViewMode,
                startAdornment: (
                  <InputAdornment position="start">
                    <MdPhone />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </FormFieldWrapper>
        </Grid>

        {/* อีเมล */}
        <Grid size={12} md={6}>
          <FormFieldWrapper
            label="อีเมล"
            required={false}
            error={errors.cus_email}
            value={inputList.cus_email}
            icon={<MdEmail size={16} />}
            tooltip="อีเมลสำหรับการติดต่อและส่งเอกสาร"
            helperText="อีเมลจะใช้สำหรับส่งใบเสนอราคาและเอกสารสำคัญ"
            showProgress={!isViewMode}
          >
            <StyledTextField
              fullWidth
              name="cus_email"
              type="email"
              placeholder="เช่น customer@example.com"
              value={inputList.cus_email || ""}
              onChange={handleInputChange}
              InputProps={{
                readOnly: isViewMode,
                startAdornment: (
                  <InputAdornment position="start">
                    <MdEmail />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </FormFieldWrapper>
        </Grid>

        {/* เลขผู้เสียภาษี */}
        <Grid size={12} md={6}>
          <FormFieldWrapper
            label="เลขผู้เสียภาษี"
            required={false}
            error={errors.cus_tax_id}
            value={inputList.cus_tax_id}
            icon={<MdBusiness size={16} />}
            tooltip="เลขประจำตัวผู้เสียภาษีของบริษัท"
            helperText="13 หลัก สำหรับออกใบกำกับภาษี"
            showProgress={!isViewMode}
          >
            <StyledTextField
              fullWidth
              name="cus_tax_id"
              placeholder="เช่น 1234567890123"
              value={inputList.cus_tax_id || ""}
              onChange={handleInputChange}
              inputProps={{
                maxLength: 13,
                pattern: "[0-9]*",
              }}
              InputProps={{
                readOnly: isViewMode,
                startAdornment: (
                  <InputAdornment position="start">
                    <MdBusiness />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </FormFieldWrapper>
        </Grid>
      </Grid>

      {/* Additional Info Section */}
      {!isViewMode && (
        <Box sx={{ mt: 4, p: 2, backgroundColor: "info.lighter", borderRadius: 2 }}>
          <Typography variant="body2" color="info.main" fontWeight={500}>
            📞 เคล็ดลับการกรอกข้อมูลติดต่อ
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            • เบอร์โทรศัพท์หลักเป็นข้อมูลจำเป็นสำหรับการติดต่อ
            <br />
            • อีเมลจะใช้สำหรับส่งใบเสนอราคาและเอกสารทางธุรกิจ
            <br />
            • เลขผู้เสียภาษีจำเป็นสำหรับการออกใบกำกับภาษี
            <br />
            • ข้อมูลที่ครบถ้วนจะช่วยให้การติดต่อมีประสิทธิภาพมากขึ้น
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ContactInfoTab; 