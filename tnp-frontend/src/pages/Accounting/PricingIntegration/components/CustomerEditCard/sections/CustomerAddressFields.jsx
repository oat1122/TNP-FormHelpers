import { LocationOn as LocationIcon } from "@mui/icons-material";
import { Autocomplete, Box, Grid, Typography } from "@mui/material";

import { StyledTextField, sectionTitleSx } from "../styles/customerEditStyles";

const titleWithTopMargin = (isEditing) => ({
  ...sectionTitleSx,
  mt: isEditing ? 2 : 0,
});

const CustomerAddressFields = ({
  isEditing,
  editData,
  onChange,
  viewCustomer,
  provinces,
  districts,
  subdistricts,
  onProvinceChange,
  onDistrictChange,
  onSubdistrictChange,
}) => (
  <>
    <Grid item xs={12}>
      <Typography variant="subtitle2" sx={titleWithTopMargin(isEditing)}>
        <LocationIcon /> ข้อมูลที่อยู่
      </Typography>
    </Grid>

    {!isEditing && (
      <Grid item xs={12} md={6}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            ผู้ดูแลลูกค้า
          </Typography>
          <Typography variant="body2" sx={{ color: sectionTitleSx.color, fontWeight: 500 }}>
            {viewCustomer.cus_manage_by?.username || viewCustomer.sales_name || "ไม่ได้กำหนด"}
          </Typography>
        </Box>
      </Grid>
    )}

    <Grid item xs={12}>
      {isEditing ? (
        <StyledTextField
          fullWidth
          label="ที่อยู่"
          value={editData.cus_address}
          onChange={(e) => onChange("cus_address", e.target.value)}
          multiline
          rows={2}
          size="small"
        />
      ) : (
        <Box>
          <Typography variant="caption" color="text.secondary">
            ที่อยู่
          </Typography>
          <Typography variant="body2">{viewCustomer.cus_address || "-"}</Typography>
        </Box>
      )}
    </Grid>

    {isEditing && (
      <>
        <Grid item xs={12} md={4}>
          <Autocomplete
            size="small"
            options={provinces}
            getOptionLabel={(option) => option.pro_name_th || ""}
            getOptionKey={(option) => `province-${option.pro_id || Math.random()}`}
            isOptionEqualToValue={(option, value) => option.pro_id === value.pro_id}
            value={provinces.find((p) => p.pro_id === editData.cus_pro_id) || null}
            onChange={onProvinceChange}
            renderInput={(params) => (
              <StyledTextField {...params} label="จังหวัด" placeholder="เลือกจังหวัด" />
            )}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Autocomplete
            size="small"
            options={districts}
            getOptionLabel={(option) => option.dis_name || option.dis_name_th || ""}
            getOptionKey={(option) => `district-${option.dis_id || Math.random()}`}
            isOptionEqualToValue={(option, value) => option.dis_id === value.dis_id}
            value={districts.find((d) => d.dis_id === editData.cus_dis_id) || null}
            onChange={onDistrictChange}
            disabled={!editData.cus_pro_id}
            renderInput={(params) => (
              <StyledTextField {...params} label="อำเภอ/เขต" placeholder="เลือกอำเภอ/เขต" />
            )}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Autocomplete
            size="small"
            options={subdistricts}
            getOptionLabel={(option) => option.sub_name || option.sub_name_th || ""}
            getOptionKey={(option) => `subdistrict-${option.sub_id || Math.random()}`}
            isOptionEqualToValue={(option, value) => option.sub_id === value.sub_id}
            value={subdistricts.find((s) => s.sub_id === editData.cus_sub_id) || null}
            onChange={onSubdistrictChange}
            disabled={!editData.cus_dis_id}
            renderInput={(params) => (
              <StyledTextField {...params} label="ตำบล/แขวง" placeholder="เลือกตำบล/แขวง" />
            )}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <StyledTextField
            fullWidth
            label="รหัสไปรษณีย์"
            value={editData.cus_zip_code}
            onChange={(e) => onChange("cus_zip_code", e.target.value)}
            size="small"
            InputLabelProps={{
              shrink: Boolean(editData.cus_zip_code && String(editData.cus_zip_code).length),
            }}
          />
        </Grid>
      </>
    )}

    {!isEditing && (
      <Grid item xs={12} md={3}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            รหัสไปรษณีย์
          </Typography>
          <Typography variant="body2">{viewCustomer.cus_zip_code || "-"}</Typography>
        </Box>
      </Grid>
    )}
  </>
);

export default CustomerAddressFields;
