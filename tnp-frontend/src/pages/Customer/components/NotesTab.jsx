import React from "react";
import { Grid2 as Grid } from "@mui/material";
import { StyledTextField } from "../styles/DialogStyledComponents";

const NotesTab = ({ inputList, handleInputChange, mode }) => {
  return (
    <Grid container spacing={2}>
      <Grid size={12}>
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
          }}
        />
      </Grid>

      <Grid size={12}>
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
          }}
        />
      </Grid>
    </Grid>
  );
};

export default NotesTab; 