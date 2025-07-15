import React from "react";
import { Grid2 as Grid } from "@mui/material";
import { StyledTextField } from "../styles/DialogStyledComponents";

const BasicInfoTab = ({ inputList, errors, handleInputChange, mode }) => {
  return (
    <Grid container spacing={2}>
      <Grid size={12} md={4}>
        <StyledTextField
          fullWidth
          required
          label="ชื่อจริง"
          size="small"
          name="cus_firstname"
          placeholder="ชื่อจริง"
          value={inputList.cus_firstname || ""}
          onChange={handleInputChange}
          error={!!errors.cus_firstname}
          helperText={errors.cus_firstname}
          InputProps={{
            readOnly: mode === "view",
          }}
        />
      </Grid>

      <Grid size={12} md={4}>
        <StyledTextField
          fullWidth
          required
          label="นามสกุล"
          size="small"
          name="cus_lastname"
          placeholder="นามสกุล"
          value={inputList.cus_lastname || ""}
          onChange={handleInputChange}
          error={!!errors.cus_lastname}
          helperText={errors.cus_lastname}
          InputProps={{
            readOnly: mode === "view",
          }}
        />
      </Grid>

      <Grid size={12} md={4}>
        <StyledTextField
          fullWidth
          required
          label="ชื่อเล่น"
          size="small"
          name="cus_name"
          placeholder="ชื่อเล่น"
          value={inputList.cus_name || ""}
          onChange={handleInputChange}
          error={!!errors.cus_name}
          helperText={errors.cus_name}
          InputProps={{
            readOnly: mode === "view",
          }}
        />
      </Grid>

      <Grid size={12}>
        <StyledTextField
          fullWidth
          label="ตำแหน่ง"
          size="small"
          name="cus_depart"
          placeholder="ตำแหน่ง"
          value={inputList.cus_depart || ""}
          onChange={handleInputChange}
          InputProps={{
            readOnly: mode === "view",
          }}
        />
      </Grid>
    </Grid>
  );
};

export default BasicInfoTab; 