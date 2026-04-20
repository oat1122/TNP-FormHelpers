import { Email as EmailIcon, Person as PersonIcon } from "@mui/icons-material";
import { Box, Grid, Typography } from "@mui/material";

import { formatPhoneNumber, formatTaxId } from "../../customerFormatters";
import { StyledTextField, primaryIconSx, sectionTitleSx } from "../styles/customerEditStyles";

const LabeledView = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2">{value || "-"}</Typography>
  </Box>
);

const CustomerContactFields = ({ isEditing, editData, errors, onChange, viewCustomer }) => (
  <>
    <Grid item xs={12}>
      <Typography variant="subtitle2" sx={sectionTitleSx}>
        <PersonIcon /> ข้อมูลผู้ติดต่อ
      </Typography>
    </Grid>

    <Grid item xs={12} md={4}>
      {isEditing ? (
        <StyledTextField
          fullWidth
          label="ชื่อ *"
          value={editData.cus_firstname}
          onChange={(e) => onChange("cus_firstname", e.target.value)}
          error={!!errors.cus_firstname}
          helperText={errors.cus_firstname}
          size="small"
        />
      ) : (
        <LabeledView label="ชื่อ" value={viewCustomer.cus_firstname} />
      )}
    </Grid>

    <Grid item xs={12} md={4}>
      {isEditing ? (
        <StyledTextField
          fullWidth
          label="นามสกุล *"
          value={editData.cus_lastname}
          onChange={(e) => onChange("cus_lastname", e.target.value)}
          error={!!errors.cus_lastname}
          helperText={errors.cus_lastname}
          size="small"
        />
      ) : (
        <LabeledView label="นามสกุล" value={viewCustomer.cus_lastname} />
      )}
    </Grid>

    <Grid item xs={12} md={4}>
      {isEditing ? (
        <StyledTextField
          fullWidth
          label="ชื่อเล่น *"
          value={editData.cus_name}
          onChange={(e) => onChange("cus_name", e.target.value)}
          error={!!errors.cus_name}
          helperText={errors.cus_name}
          size="small"
        />
      ) : (
        <LabeledView label="ชื่อเล่น" value={viewCustomer.cus_name} />
      )}
    </Grid>

    <Grid item xs={12} md={6}>
      {isEditing ? (
        <StyledTextField
          fullWidth
          label="ตำแหน่ง/แผนก"
          value={editData.cus_depart}
          onChange={(e) => onChange("cus_depart", e.target.value)}
          size="small"
        />
      ) : (
        <LabeledView label="ตำแหน่ง/แผนก" value={viewCustomer.cus_depart} />
      )}
    </Grid>

    <Grid item xs={12} md={6}>
      {isEditing ? (
        <StyledTextField
          fullWidth
          label="เบอร์โทรสำรอง"
          value={editData.cus_tel_2}
          onChange={(e) => onChange("cus_tel_2", e.target.value)}
          size="small"
        />
      ) : (
        <LabeledView label="เบอร์โทรสำรอง" value={formatPhoneNumber(viewCustomer.cus_tel_2)} />
      )}
    </Grid>

    <Grid item xs={12} md={6}>
      {isEditing ? (
        <StyledTextField
          fullWidth
          label="อีเมล"
          value={editData.cus_email}
          onChange={(e) => onChange("cus_email", e.target.value)}
          error={!!errors.cus_email}
          helperText={errors.cus_email}
          size="small"
          InputProps={{
            startAdornment: <EmailIcon sx={{ color: primaryIconSx.color, mr: 1 }} />,
          }}
        />
      ) : (
        <LabeledView label="อีเมล" value={viewCustomer.cus_email} />
      )}
    </Grid>

    <Grid item xs={12} md={6}>
      {isEditing ? (
        <StyledTextField
          fullWidth
          label="เลขประจำตัวผู้เสียภาษี"
          value={editData.cus_tax_id}
          onChange={(e) => onChange("cus_tax_id", e.target.value)}
          error={!!errors.cus_tax_id}
          helperText={errors.cus_tax_id}
          size="small"
        />
      ) : (
        <LabeledView label="เลขประจำตัวผู้เสียภาษี" value={formatTaxId(viewCustomer.cus_tax_id)} />
      )}
    </Grid>
  </>
);

export default CustomerContactFields;
