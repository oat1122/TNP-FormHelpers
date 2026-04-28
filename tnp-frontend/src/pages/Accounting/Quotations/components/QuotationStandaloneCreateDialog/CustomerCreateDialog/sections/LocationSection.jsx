import { LocationOn as LocationIcon } from "@mui/icons-material";
import { Autocomplete, Grid, TextField, Typography } from "@mui/material";

import { tokens } from "../../../../../shared/styles/quotationFormStyles";

const sectionHeaderSx = {
  color: tokens.primary,
  mb: 1,
  mt: 2,
  display: "flex",
  alignItems: "center",
  gap: 1,
};

const LocationSection = ({ formData, onChange, locations }) => {
  const {
    provinces,
    districts,
    subdistricts,
    selectedProvince,
    selectedDistrict,
    selectedSubdistrict,
    handleProvinceChange,
    handleDistrictChange,
    handleSubdistrictChange,
  } = locations;

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="subtitle2" sx={sectionHeaderSx}>
          <LocationIcon /> ข้อมูลที่อยู่
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          size="small"
          label="ที่อยู่"
          value={formData.cus_address}
          onChange={(e) => onChange("cus_address", e.target.value)}
          multiline
          rows={2}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Autocomplete
          size="small"
          options={provinces}
          getOptionLabel={(option) => option.pro_name_th || ""}
          isOptionEqualToValue={(option, value) => option.pro_id === value.pro_id}
          value={selectedProvince}
          onChange={handleProvinceChange}
          renderInput={(params) => (
            <TextField {...params} label="จังหวัด" placeholder="เลือกจังหวัด" />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Autocomplete
          size="small"
          options={districts}
          getOptionLabel={(option) => option.dis_name || option.dis_name_th || ""}
          isOptionEqualToValue={(option, value) => option.dis_id === value.dis_id}
          value={selectedDistrict}
          onChange={handleDistrictChange}
          disabled={!formData.cus_pro_id}
          renderInput={(params) => (
            <TextField {...params} label="อำเภอ/เขต" placeholder="เลือกอำเภอ/เขต" />
          )}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Autocomplete
          size="small"
          options={subdistricts}
          getOptionLabel={(option) => option.sub_name || option.sub_name_th || ""}
          isOptionEqualToValue={(option, value) => option.sub_id === value.sub_id}
          value={selectedSubdistrict}
          onChange={handleSubdistrictChange}
          disabled={!formData.cus_dis_id}
          renderInput={(params) => (
            <TextField {...params} label="ตำบล/แขวง" placeholder="เลือกตำบล/แขวง" />
          )}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <TextField
          fullWidth
          size="small"
          label="รหัสไปรษณีย์"
          value={formData.cus_zip_code}
          onChange={(e) => onChange("cus_zip_code", e.target.value)}
        />
      </Grid>
    </>
  );
};

export default LocationSection;
