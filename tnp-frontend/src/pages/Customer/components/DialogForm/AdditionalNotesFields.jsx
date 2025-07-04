import React from "react";
import { Grid, Typography, Box } from "@mui/material";
import { StyledTextField } from "./StyledComponents";

function AdditionalNotesFields({ inputList, handleInputChange, mode }) {
  return (
    <Box sx={{ p: 2, backgroundColor: "#fafafa", border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Box mb={2}>
        <Typography variant="subtitle1" fontWeight="500" gutterBottom>
          Additional Notes
        </Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <StyledTextField
            fullWidth
            label="Note"
            multiline
            minRows={3}
            size="small"
            name="cd_note"
            value={inputList.cd_note || ""}
            onChange={handleInputChange}
            InputProps={{
              readOnly: mode === "view",
              sx: { backgroundColor: "#ffffff" },
            }}
            placeholder="Enter general notes here"
          />
        </Grid>
        <Grid item xs={12}>
          <StyledTextField
            fullWidth
            label="รายละเอียดเพิ่มเติม"
            multiline
            minRows={5}
            size="small"
            name="cd_remark"
            value={inputList.cd_remark || ""}
            onChange={handleInputChange}
            InputProps={{
              readOnly: mode === "view",
              sx: { backgroundColor: "#ffffff" },
            }}
            placeholder="กรุณากรอกรายละเอียดเพิ่มเติม"
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default AdditionalNotesFields;
