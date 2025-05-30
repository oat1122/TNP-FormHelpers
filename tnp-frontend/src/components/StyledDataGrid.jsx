import { styled } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  "& .MuiDataGrid-columnHeader": {
    backgroundColor: theme.palette.error.dark,
    color: theme.palette.common.white,
  },

  "& .MuiDataGrid-columnHeaderTitleContainer": {
    justifyContent: "center",
  },

  "& .MuiDataGrid-row--borderBottom .MuiDataGrid-columnHeader": {
    borderBottom: `1px solid ${theme.palette.error.dark}`,
  },

  "& .MuiDataGrid-columnHeader[aria-colindex='1']": {
    borderBottomLeftRadius: theme.shape.borderRadius,
  },

  "& .MuiDataGrid-columnHeader--last": {
    borderBottomRightRadius: theme.shape.borderRadius,
  },

  "& .MuiDataGrid-iconSeparator": {
    display: "none",
  },

  "& .MuiDataGrid-row": {
    backgroundColor: theme.vars.palette.grey.main,
    borderRadius: theme.shape.borderRadius,
    marginTop: 10,
  },

  "& .MuiDataGrid-cell, .MuiDataGrid-filler > div": {
    textAlign: "center",
    borderWidth: 0,
    color: theme.vars.palette.grey.dark,
  },

  "& .MuiDataGrid-menuIcon > button > svg": {
    color: "#fff",
  },

  "& .MuiDataGrid-iconButtonContainer > button > svg": {
    color: "#fff",
  },

  "& .MuiDataGrid-actionsCell > .MuiIconButton-root:not(.Mui-disabled) > svg": {
    color: theme.vars.palette.grey.dark,
  },

  "& .MuiDataGrid-footerContainer": {
    borderWidth: 0,
    justifyContent: "center",
  },

  "& .uppercase-cell": {
    // Target the cell by class
    textTransform: "uppercase",
  },

  "& .danger-days": {
    color: theme.vars.palette.error.main,
  },
}));

export default StyledDataGrid;
