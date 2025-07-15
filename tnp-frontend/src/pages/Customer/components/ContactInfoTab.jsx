import React from "react";
import { Grid2 as Grid, InputAdornment } from "@mui/material";
import { MdPhone, MdEmail } from "react-icons/md";
import { StyledTextField } from "../styles/DialogStyledComponents";

const ContactInfoTab = ({ inputList, errors, handleInputChange, mode }) => {
  return (
    <Grid container spacing={2}>
      <Grid size={12} md={6}>
        <StyledTextField
          fullWidth
          required
          label="เบอร์โทรศัพท์"
          size="small"
          name="cus_tel_1"
          placeholder="เบอร์"
          value={inputList.cus_tel_1 || ""}
          onChange={handleInputChange}
          error={!!errors.cus_tel_1}
          helperText={errors.cus_tel_1}
          InputProps={{
            readOnly: mode === "view",
            startAdornment: (
              <InputAdornment position="start">
                <MdPhone />
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      <Grid size={12} md={6}>
        <StyledTextField
          fullWidth
          label="เบอร์สำรอง"
          size="small"
          name="cus_tel_2"
          placeholder="เบอร์สำรอง"
          value={inputList.cus_tel_2 || ""}
          onChange={handleInputChange}
          InputProps={{
            readOnly: mode === "view",
            startAdornment: (
              <InputAdornment position="start">
                <MdPhone />
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      <Grid size={12}>
        <StyledTextField
          fullWidth
          label="อีเมล"
          size="small"
          name="cus_email"
          placeholder="อีเมล"
          value={inputList.cus_email || ""}
          onChange={handleInputChange}
          InputProps={{
            readOnly: mode === "view",
            startAdornment: (
              <InputAdornment position="start">
                <MdEmail />
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      <Grid size={12}>
        <StyledTextField
          fullWidth
          label="เลขผู้เสียภาษี"
          size="small"
          name="cus_tax_id"
          placeholder="เลขผู้เสียภาษี"
          value={inputList.cus_tax_id || ""}
          onChange={handleInputChange}
          InputProps={{
            readOnly: mode === "view",
          }}
        />
      </Grid>
    </Grid>
  );
};

export default ContactInfoTab; 