import React from "react";
import {
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  InputAdornment,
  Typography,
  Box,
  Paper,
  Divider,
} from "@mui/material";
import { MdLocationOn } from "react-icons/md";
import { StyledTextField, StyledSelect } from "./StyledComponents";

function AddressFields({
  inputList,
  handleInputChange,
  mode,
  handleSelectLocation,
  provincesList,
  districtList,
  subDistrictList,
  isFetching,
}) {
  return (
    <Paper elevation={0} sx={{ p: 2, backgroundColor: "#fafafa" }}>
      <Box mb={2}>
        <Typography variant="subtitle1" fontWeight="500" gutterBottom>
          ข้อมูลที่อยู่
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <StyledTextField
            fullWidth
            label="ที่อยู่"
            size="small"
            name="cus_address"
            placeholder="บ้านเลขที่/ถนน/ซอย/หมู่บ้าน"
            value={inputList.cus_address || ""}
            onChange={handleInputChange}
            InputProps={{
              readOnly: mode === "view",
              startAdornment: (
                <InputAdornment position="start">
                  <MdLocationOn color="#1976d2" />
                </InputAdornment>
              ),
              sx: { backgroundColor: "#ffffff" },
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            รายละเอียดตำแหน่งที่ตั้ง
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel>จังหวัด</InputLabel>
            <StyledSelect
              label="จังหวัด"
              name="cus_pro_id"
              value={inputList.cus_pro_id || ""}
              onChange={handleSelectLocation}
              readOnly={mode === "view"}
              sx={{ backgroundColor: "#ffffff" }}
            >
              <MenuItem disabled value="">
                จังหวัด
              </MenuItem>
              {provincesList.map((item, index) => (
                <MenuItem key={index} value={item.pro_id}>
                  {item.pro_name_th}
                </MenuItem>
              ))}
            </StyledSelect>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel>เขต/อำเภอ</InputLabel>
            <StyledSelect
              label="เขต/อำเภอ"
              name="cus_dis_id"
              value={inputList.cus_dis_id || ""}
              onChange={handleSelectLocation}
              readOnly={mode === "view" || isFetching}
              sx={{ backgroundColor: "#ffffff" }}
            >
              <MenuItem disabled value="">
                เขต/อำเภอ
              </MenuItem>
              {districtList.map((item, index) => (
                <MenuItem key={index} value={item.dis_id}>
                  {item.dis_name_th}
                </MenuItem>
              ))}
            </StyledSelect>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel>แขวง/ตำบล</InputLabel>
            <StyledSelect
              label="แขวง/ตำบล"
              name="cus_sub_id"
              value={inputList.cus_sub_id || ""}
              onChange={handleSelectLocation}
              readOnly={mode === "view" || isFetching}
              sx={{ backgroundColor: "#ffffff" }}
            >
              <MenuItem disabled value="">
                แขวง/ตำบล
              </MenuItem>
              {subDistrictList.map((item, index) => (
                <MenuItem key={index} value={item.sub_id}>
                  {item.sub_name_th}
                </MenuItem>
              ))}
            </StyledSelect>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <StyledTextField
            fullWidth
            label="รหัสไปรษณีย์"
            size="small"
            name="cus_zip_code"
            placeholder="รหัสไปรษณีย์"
            value={inputList.cus_zip_code || ""}
            onChange={handleInputChange}
            InputProps={{
              readOnly: mode === "view",
              sx: { backgroundColor: "#ffffff" },
            }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}

export default AddressFields;
