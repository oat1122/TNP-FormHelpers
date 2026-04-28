import { Phone as PhoneIcon } from "@mui/icons-material";
import { Grid, InputAdornment, TextField } from "@mui/material";

import { tokens } from "../../../../../shared/styles/quotationFormStyles";

const CompanyInfoSection = ({ formData, errors, onChange }) => (
  <>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        size="small"
        label="ชื่อบริษัท *"
        value={formData.cus_company}
        onChange={(e) => onChange("cus_company", e.target.value)}
        error={!!errors.cus_company}
        helperText={errors.cus_company || ""}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        size="small"
        label="เบอร์โทรศัพท์ *"
        value={formData.cus_tel_1}
        onChange={(e) => onChange("cus_tel_1", e.target.value)}
        error={!!errors.cus_tel_1}
        helperText={errors.cus_tel_1}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PhoneIcon sx={{ color: tokens.primary }} />
            </InputAdornment>
          ),
        }}
      />
    </Grid>
  </>
);

export default CompanyInfoSection;
