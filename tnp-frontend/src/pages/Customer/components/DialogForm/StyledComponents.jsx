import { styled, TextField, Select, Typography } from "@mui/material";

export const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: theme.vars.palette.grey.outlinedInput,
    "&.Mui-disabled": {
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.vars.palette.grey.outlinedInput,
      },
      "& .MuiOutlinedInput-input": {
        WebkitTextFillColor: theme.vars.palette.text.primary,
      },
    },
  },
  "& .MuiInputLabel-root": {
    color: theme.vars.palette.grey.dark,
    fontFamily: "Kanit",
    fontSize: 14,
  },
}));

export const StyledSelect = styled(Select)(({ theme }) => ({
  backgroundColor: theme.vars.palette.grey.outlinedInput,
  "& fieldset": {
    borderColor: theme.vars.palette.grey.outlinedInput,
  },
  "&.Mui-disabled": {
    "& .MuiSelect-select": {
      WebkitTextFillColor: theme.vars.palette.text.primary,
      backgroundColor: theme.vars.palette.grey.outlinedInput,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.vars.palette.grey.outlinedInput,
    },
  },
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  marginBottom: theme.spacing(1),
  color: theme.vars.palette.primary.main,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));
