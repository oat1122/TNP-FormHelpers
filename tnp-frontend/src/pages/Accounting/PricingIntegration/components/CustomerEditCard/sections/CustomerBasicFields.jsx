import { Phone as PhoneIcon } from "@mui/icons-material";
import { Box, Grid, InputAdornment, Typography } from "@mui/material";

import { formatPhoneNumber } from "../../customerFormatters";
import { StyledTextField, primaryIconSx } from "../styles/customerEditStyles";

const CustomerBasicFields = ({ isEditing, editData, errors, onChange, viewCustomer }) => (
  <Grid container spacing={2} sx={{ mb: 2 }}>
    <Grid item xs={12} md={6}>
      {isEditing ? (
        <StyledTextField
          fullWidth
          label="ชื่อบริษัท *"
          value={editData.cus_company}
          onChange={(e) => onChange("cus_company", e.target.value)}
          error={!!errors.cus_company}
          helperText={errors.cus_company || ""}
          size="small"
        />
      ) : (
        <Box>
          <Typography variant="caption" color="text.secondary">
            ชื่อบริษัท
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {viewCustomer.cus_company || "-"}
          </Typography>
        </Box>
      )}
    </Grid>
    <Grid item xs={12} md={6}>
      {isEditing ? (
        <StyledTextField
          fullWidth
          label="เบอร์โทรศัพท์ *"
          value={editData.cus_tel_1}
          onChange={(e) => onChange("cus_tel_1", e.target.value)}
          error={!!errors.cus_tel_1}
          helperText={errors.cus_tel_1}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon sx={{ color: primaryIconSx.color }} />
              </InputAdornment>
            ),
          }}
          InputLabelProps={{
            shrink: Boolean(editData.cus_tel_1 && String(editData.cus_tel_1).length),
          }}
        />
      ) : (
        <Box>
          <Typography variant="caption" color="text.secondary">
            เบอร์โทรศัพท์
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {formatPhoneNumber(viewCustomer.cus_tel_1) || "-"}
          </Typography>
        </Box>
      )}
    </Grid>
  </Grid>
);

export default CustomerBasicFields;
