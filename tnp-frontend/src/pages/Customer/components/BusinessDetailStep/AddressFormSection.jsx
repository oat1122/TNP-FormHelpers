import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  Stack,
  Grid2 as Grid,
  Box,
} from "@mui/material";
import { MdExpandMore, MdHome } from "react-icons/md";

const AddressFormSection = ({
  inputList = {},
  errors = {},
  handleInputChange,
  mode = "create",
  PRIMARY_RED,
  BACKGROUND_COLOR,
}) => {
  return (
    <Accordion
      sx={{
        mb: 2,
        borderRadius: 2,
        "&:before": { display: "none" },
        boxShadow: "0 2px 8px rgba(158, 0, 0, 0.1)",
      }}
    >
      <AccordionSummary
        expandIcon={<MdExpandMore size={24} />}
        sx={{
          bgcolor: "white",
          "& .MuiAccordionSummary-content": {
            alignItems: "center",
            gap: 2,
          },
        }}
      >
        <MdHome size={24} color={PRIMARY_RED} />
        <Box>
          <Typography fontWeight={600} fontFamily="Kanit" color={PRIMARY_RED}>
            ที่อยู่ติดต่อ (ไม่บังคับ)
          </Typography>
          <Typography variant="caption" color="text.secondary" fontFamily="Kanit">
            ที่อยู่สำหรับการติดต่อและจัดส่ง (สามารถใช้ GPS ช่วยเติมได้)
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ bgcolor: BACKGROUND_COLOR }}>
        <Stack spacing={3}>
          {/* Address Components Row */}
          <Grid container spacing={2}>
            <Grid xs={12}>
              <TextField
                name="cus_address_detail"
                label="บ้านเลขที่/หมู่บ้าน/ถนน"
                value={inputList.cus_address_detail || ""}
                onChange={handleInputChange}
                fullWidth
                error={!!errors.cus_address_detail}
                helperText={errors.cus_address_detail}
                disabled={mode === "view"}
                placeholder="เช่น 39/3 หมู่ 3 ถนนสุโขทัย"
                size="small"
                sx={{ bgcolor: "white" }}
                InputProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
                InputLabelProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                name="cus_province_text"
                label="จังหวัด"
                value={inputList.cus_province_text || ""}
                onChange={handleInputChange}
                fullWidth
                error={!!errors.cus_province_text}
                helperText={errors.cus_province_text}
                disabled={mode === "view"}
                placeholder="เช่น พระนครศรีอยุธยา"
                size="small"
                sx={{ bgcolor: "white" }}
                InputProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
                InputLabelProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                name="cus_district_text"
                label="เขต/อำเภอ"
                value={inputList.cus_district_text || ""}
                onChange={handleInputChange}
                fullWidth
                error={!!errors.cus_district_text}
                helperText={errors.cus_district_text}
                disabled={mode === "view"}
                placeholder="เช่น นครหลวง"
                size="small"
                sx={{ bgcolor: "white" }}
                InputProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
                InputLabelProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                name="cus_subdistrict_text"
                label="แขวง/ตำบล"
                value={inputList.cus_subdistrict_text || ""}
                onChange={handleInputChange}
                fullWidth
                error={!!errors.cus_subdistrict_text}
                helperText={errors.cus_subdistrict_text}
                disabled={mode === "view"}
                placeholder="เช่น บ่อโพง"
                size="small"
                sx={{ bgcolor: "white" }}
                InputProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
                InputLabelProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                name="cus_zip_code"
                label="รหัสไปรษณีย์"
                value={inputList.cus_zip_code || ""}
                onChange={handleInputChange}
                fullWidth
                error={!!errors.cus_zip_code}
                helperText={errors.cus_zip_code}
                disabled={mode === "view"}
                placeholder="เช่น 13260"
                size="small"
                sx={{ bgcolor: "white" }}
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
            </Grid>
          </Grid>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

export default AddressFormSection;
