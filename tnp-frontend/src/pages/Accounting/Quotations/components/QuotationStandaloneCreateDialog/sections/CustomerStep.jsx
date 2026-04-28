import {
  AddCircleOutline as AddCircleOutlineIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import { Box, Button, Divider, Grid, InputAdornment, TextField, Typography } from "@mui/material";

import { tokens } from "../../../../shared/styles/quotationFormStyles";
import CustomerSelector from "../CustomerSelector";

const READ_ONLY_BG = tokens.bgAlt;

// Read-only background for customer fields locked once a customer is picked.
const readOnlyInputProps = (selectedCustomer, extra = {}) => ({
  readOnly: !!selectedCustomer,
  sx: selectedCustomer ? { backgroundColor: READ_ONLY_BG } : {},
  ...extra,
});

const CustomerStep = ({
  formData,
  errors,
  companies,
  isLoadingCompanies,
  selectedCustomer,
  onChange,
  onSelectCustomer,
  onOpenCreateCustomer,
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <TextField
      label="เลือกบริษัท"
      value={formData.company_id}
      onChange={(e) => onChange("company_id", e.target.value)}
      required
      error={!!errors.company_id}
      helperText={errors.company_id}
      fullWidth
      select
      size="small"
      disabled={isLoadingCompanies}
      SelectProps={{ native: true }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <BusinessIcon />
          </InputAdornment>
        ),
      }}
    >
      <option value="">-- กรุณาเลือกบริษัท --</option>
      {companies.map((company) => (
        <option key={company.id} value={company.id}>
          {company.name} ({company.short_code})
        </option>
      ))}
    </TextField>

    <Divider sx={{ my: 1 }} />
    <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <PersonIcon /> ข้อมูลลูกค้า
    </Typography>

    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
      <Box sx={{ flexGrow: 1 }}>
        <CustomerSelector
          value={selectedCustomer}
          onChange={onSelectCustomer}
          error={!!errors.customer_id}
          helperText={errors.customer_id}
          required
        />
      </Box>
      <Button
        variant="outlined"
        startIcon={<AddCircleOutlineIcon />}
        onClick={onOpenCreateCustomer}
        sx={{ height: "40px", whiteSpace: "nowrap", minWidth: "fit-content" }}
      >
        สร้างลูกค้าใหม่
      </Button>
    </Box>

    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          label="ชื่อบริษัท"
          value={formData.customer_company}
          onChange={(e) => onChange("customer_company", e.target.value)}
          required
          error={!!errors.customer_company}
          helperText={errors.customer_company}
          fullWidth
          size="small"
          InputProps={readOnlyInputProps(selectedCustomer)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label="เบอร์โทรศัพท์"
          value={formData.customer_phone}
          onChange={(e) => onChange("customer_phone", e.target.value)}
          required
          error={!!errors.customer_phone}
          helperText={errors.customer_phone}
          fullWidth
          size="small"
          InputProps={readOnlyInputProps(selectedCustomer, {
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon />
              </InputAdornment>
            ),
          })}
        />
      </Grid>
    </Grid>

    <Divider sx={{ my: 1 }} />
    <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <PersonIcon /> ข้อมูลผู้ติดต่อ
    </Typography>

    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <TextField
          label="ชื่อ"
          value={formData.contact_firstname}
          onChange={(e) => onChange("contact_firstname", e.target.value)}
          fullWidth
          size="small"
          InputProps={readOnlyInputProps(selectedCustomer)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          label="นามสกุล"
          value={formData.contact_lastname}
          onChange={(e) => onChange("contact_lastname", e.target.value)}
          fullWidth
          size="small"
          InputProps={readOnlyInputProps(selectedCustomer)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          label="ชื่อเล่น"
          value={formData.contact_nickname}
          onChange={(e) => onChange("contact_nickname", e.target.value)}
          fullWidth
          size="small"
          InputProps={readOnlyInputProps(selectedCustomer)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label="ตำแหน่ง/แผนก"
          value={formData.contact_position}
          onChange={(e) => onChange("contact_position", e.target.value)}
          fullWidth
          size="small"
          InputProps={readOnlyInputProps(selectedCustomer)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label="เบอร์โทรสำรอง"
          value={formData.contact_phone_alt}
          onChange={(e) => onChange("contact_phone_alt", e.target.value)}
          fullWidth
          size="small"
          InputProps={readOnlyInputProps(selectedCustomer)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label="อีเมล"
          value={formData.customer_email}
          onChange={(e) => onChange("customer_email", e.target.value)}
          fullWidth
          size="small"
          InputProps={readOnlyInputProps(selectedCustomer, {
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon />
              </InputAdornment>
            ),
          })}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label="เลขประจำตัวผู้เสียภาษี"
          value={formData.customer_tax_id}
          onChange={(e) => onChange("customer_tax_id", e.target.value)}
          fullWidth
          size="small"
          InputProps={readOnlyInputProps(selectedCustomer)}
        />
      </Grid>
    </Grid>

    <Divider sx={{ my: 1 }} />
    <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <LocationOnIcon /> ข้อมูลที่อยู่
    </Typography>
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          label="ที่อยู่"
          value={formData.customer_address}
          onChange={(e) => onChange("customer_address", e.target.value)}
          fullWidth
          size="small"
          multiline
          rows={2}
          InputProps={readOnlyInputProps(selectedCustomer)}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <TextField
          label="รหัสไปรษณีย์"
          value={formData.customer_zip_code}
          onChange={(e) => onChange("customer_zip_code", e.target.value)}
          fullWidth
          size="small"
          InputProps={readOnlyInputProps(selectedCustomer)}
        />
      </Grid>
    </Grid>
  </Box>
);

export default CustomerStep;
