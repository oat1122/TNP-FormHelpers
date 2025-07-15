import React from "react";
import {
  Grid2 as Grid,
  FormControl,
  InputLabel,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import { MdLocationOn } from "react-icons/md";
import { StyledTextField, StyledSelect } from "../styles/DialogStyledComponents";

const AddressInfoTab = ({
  inputList,
  errors,
  handleInputChange,
  handleSelectLocation,
  provincesList,
  districtList,
  subDistrictList,
  mode,
  isLoading,
}) => {
  return (
    <Grid container spacing={2}>
      <Grid size={12}>
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
                <MdLocationOn />
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      <Grid size={12} md={6}>
        <FormControl fullWidth size="small">
          <InputLabel>จังหวัด</InputLabel>
          <StyledSelect
            label="จังหวัด"
            name="cus_pro_id"
            value={inputList.cus_pro_id || ""}
            onChange={handleSelectLocation}
            readOnly={mode === "view"}
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

      <Grid size={12} md={6}>
        <FormControl fullWidth size="small">
          <InputLabel>เขต/อำเภอ</InputLabel>
          <StyledSelect
            label="เขต/อำเภอ"
            name="cus_dis_id"
            value={inputList.cus_dis_id || ""}
            onChange={handleSelectLocation}
            readOnly={mode === "view" || isLoading}
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

      <Grid size={12} md={6}>
        <FormControl fullWidth size="small">
          <InputLabel>แขวง/ตำบล</InputLabel>
          <StyledSelect
            label="แขวง/ตำบล"
            name="cus_sub_id"
            value={inputList.cus_sub_id || ""}
            onChange={handleSelectLocation}
            readOnly={mode === "view" || isLoading}
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

      <Grid size={12} md={6}>
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
          }}
        />
      </Grid>
    </Grid>
  );
};

export default AddressInfoTab; 