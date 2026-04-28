import { Email as EmailIcon, Person as PersonIcon } from "@mui/icons-material";
import { Grid, InputAdornment, TextField, Typography } from "@mui/material";

import { tokens } from "../../../../../shared/styles/quotationFormStyles";

const sectionHeaderSx = {
  color: tokens.primary,
  mb: 1,
  mt: 2,
  display: "flex",
  alignItems: "center",
  gap: 1,
};

const ContactInfoSection = ({ formData, errors, onChange }) => (
  <>
    <Grid item xs={12}>
      <Typography variant="subtitle2" sx={sectionHeaderSx}>
        <PersonIcon /> ข้อมูลผู้ติดต่อ
      </Typography>
    </Grid>
    <Grid item xs={12} md={4}>
      <TextField
        fullWidth
        size="small"
        label="ชื่อ *"
        value={formData.cus_firstname}
        onChange={(e) => onChange("cus_firstname", e.target.value)}
        error={!!errors.cus_firstname}
        helperText={errors.cus_firstname}
      />
    </Grid>
    <Grid item xs={12} md={4}>
      <TextField
        fullWidth
        size="small"
        label="นามสกุล *"
        value={formData.cus_lastname}
        onChange={(e) => onChange("cus_lastname", e.target.value)}
        error={!!errors.cus_lastname}
        helperText={errors.cus_lastname}
      />
    </Grid>
    <Grid item xs={12} md={4}>
      <TextField
        fullWidth
        size="small"
        label="ชื่อเล่น *"
        value={formData.cus_name}
        onChange={(e) => onChange("cus_name", e.target.value)}
        error={!!errors.cus_name}
        helperText={errors.cus_name}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        size="small"
        label="ตำแหน่ง/แผนก"
        value={formData.cus_depart}
        onChange={(e) => onChange("cus_depart", e.target.value)}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        size="small"
        label="เบอร์โทรสำรอง"
        value={formData.cus_tel_2}
        onChange={(e) => onChange("cus_tel_2", e.target.value)}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        size="small"
        label="อีเมล"
        value={formData.cus_email}
        onChange={(e) => onChange("cus_email", e.target.value)}
        error={!!errors.cus_email}
        helperText={errors.cus_email}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailIcon sx={{ color: tokens.primary }} />
            </InputAdornment>
          ),
        }}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        size="small"
        label="เลขประจำตัวผู้เสียภาษี"
        value={formData.cus_tax_id}
        onChange={(e) => onChange("cus_tax_id", e.target.value)}
        error={!!errors.cus_tax_id}
        helperText={errors.cus_tax_id}
      />
    </Grid>
  </>
);

export default ContactInfoSection;
