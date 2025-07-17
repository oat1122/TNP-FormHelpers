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
          <Typography
            fontWeight={600}
            fontFamily="Kanit"
            color={PRIMARY_RED}
          >
            ที่อยู่ติดต่อ (ไม่บังคับ)
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            fontFamily="Kanit"
          >
            ที่อยู่สำหรับการติดต่อและจัดส่ง (สามารถใช้ GPS ช่วยเติมได้)
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ bgcolor: BACKGROUND_COLOR }}>
        <Stack spacing={3}>
          {/* Full Address */}
          <TextField
            name="cus_address"
            label="ที่อยู่เต็ม (ไม่บังคับ)"
            value={inputList.cus_address || ""}
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={3}
            error={!!errors.cus_address}
            helperText={
              errors.cus_address ||
              "ที่อยู่ตามบัตรประชาชนหรือที่อยู่ที่สามารถติดต่อได้ (สามารถใช้ GPS ช่วยเติมได้)"
            }
            disabled={mode === "view"}
            placeholder="เช่น 123 ซอยสุขุมวิท 21 ถนนสุขุมวิท แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพมหานคร 10110"
            size="small"
            sx={{ bgcolor: "white" }}
            InputProps={{
              style: { fontFamily: "Kanit", fontSize: 14 },
            }}
            InputLabelProps={{
              style: { fontFamily: "Kanit", fontSize: 14 },
            }}
          />

          {/* Address Components Row */}
          <Grid container spacing={2}>
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
                placeholder="เช่น กรุงเทพมหานคร"
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
                placeholder="เช่น วัฒนา"
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
                placeholder="เช่น คลองเตยเหนือ"
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
                placeholder="เช่น 10110"
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
