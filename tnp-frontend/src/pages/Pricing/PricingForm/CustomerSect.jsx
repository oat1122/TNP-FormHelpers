import { useState } from "react";
import { useSelector } from "react-redux";
import {
  Button,
  Grid2 as Grid,
  Typography,
  OutlinedInput,
  styled,
  InputLabel,
} from "@mui/material";

import CustomerSectDialog from "./CustomerSectDialog.jsx";
import { MdManageSearch } from "react-icons/md";

const StyledOutlinedInput = styled(OutlinedInput)(({ theme }) => ({
  backgroundColor: theme.vars.palette.grey.outlinedInput,
  height: 34,

  "& fieldset": {
    borderColor: theme.vars.palette.grey.outlinedInput,
  },

  "&.Mui-disabled": {
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.vars.palette.grey.outlinedInput,
    },

    "& .MuiOutlinedInput-input": {
      WebkitTextFillColor: theme.vars.palette.text.primary,
    },
  },
}));

const StyledLabel = styled(InputLabel)(({ theme }) => ({
  backgroundColor: theme.vars.palette.grey.main,
  color: theme.vars.palette.grey.dark,
  borderRadius: theme.vars.shape.borderRadius,
  fontFamily: "Kanit",
  fontSize: 16,
  height: 34,
  alignContent: "center",
  maxHeight: 40,
}));

function CustomerSect(props) {
  const mode = useSelector((state) => state.pricing.mode);
  const [openDialog, setOpenDialog] = useState(false);
  const user = JSON.parse(localStorage.getItem("userData"));

  const handleClose = () => {
    setOpenDialog(false);
  };

  return (
    <>
      <CustomerSectDialog 
        open={openDialog} 
        close={handleClose}
        setValue={props.setValue} 
      />

      <Typography 
        variant="h5" 
        color="error" 
        sx={{ 
          marginLeft: 1, 
          marginBottom: 1, 
        }}
      >
        ข้อมูลลูกค้า

        { (mode !== "view") && (user.role === "sale" || user.role === "admin") ? (
        <Button
          variant="icon-contained"
          color="grey"
          onClick={() => setOpenDialog(true)}
          sx={{
            marginLeft: 2,
            minWidth: 34,
            width: "fit-content",
            height: 34,
            padding: 0,
          }}
        >
          <MdManageSearch style={{ fontSize: "1.5rem" }} />
        </Button>
        ) : null }

      </Typography>
      <Grid container spacing={1}>
        <Grid size={{ xs: 12 }} p={1}>
          <StyledOutlinedInput
            fullWidth
            size="small"
            placeholder="บริษัท ธนพลัส 153 จำกัด"
            inputProps={{ style: { textAlign: "center" } }}
            disabled
            { ...props.register("cus_company") }
          />
        </Grid>
      </Grid>
      <Grid container spacing={0} pt={0.1}>
        <Grid size={{ xs: 4 }} p={1}>
          <StyledOutlinedInput
            fullWidth
            size="small"
            placeholder="ชื่อลูกค้า"
            inputProps={{ style: { textAlign: "center" } }}
            disabled
            { ...props.register("cus_name") }
          />
        </Grid>
        <Grid size={{ xs: 8 }} p={1}>
          <StyledOutlinedInput
            fullWidth
            size="small"
            placeholder="เบอร์โทรศัพท์"
            inputProps={{ style: { textAlign: "center" } }}
            disabled
            { ...props.register("cus_tel_1") }
          />
        </Grid>
      </Grid>
      <Grid container spacing={0}>
        <Grid size={{ xs: 12 }} p={1}>
          <StyledOutlinedInput
            fullWidth
            size="small"
            placeholder="อีเมล"
            inputProps={{ style: { textAlign: "center" } }}
            disabled
            { ...props.register("cus_email") }
          />
        </Grid>
        <Grid 
          size={{ xs: 4 }}
          sx={{ 
            padding: 1,
            display: { xs: "none", xl: "block" } 
          }} 
        >
          <StyledLabel sx={{ textAlign: "center" }}>ชื่อ - นามสกุล</StyledLabel>
        </Grid>
        <Grid size={{ xs: 12, xl: 8 }} p={1}>
          <StyledOutlinedInput
            fullWidth
            size="small"
            placeholder="ชื่อ - นามสกุล"
            inputProps={{ style: { textAlign: "center" } }}
            disabled
            { ...props.register("cus_fullname") }
          />
        </Grid>
      </Grid>
    </>
  );
}

export default CustomerSect;
