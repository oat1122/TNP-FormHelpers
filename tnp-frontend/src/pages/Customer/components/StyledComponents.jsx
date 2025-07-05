import { styled } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Pagination } from "@mui/material";

export const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  "& .MuiDataGrid-columnHeader": {
    backgroundColor: theme.palette.error.dark,
    color: theme.palette.common.white,
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: theme.palette.error.main,
    },
  },
  "& .MuiDataGrid-columnHeaderTitleContainer": {
    justifyContent: "center",
    fontSize: "0.95rem",
    fontWeight: "bold",
    letterSpacing: "0.5px",
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
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: theme.vars.palette.grey.light,
      transform: "translateY(-2px)",
      boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
    },
  },
  "& .MuiDataGrid-cell, .MuiDataGrid-filler > div": {
    textAlign: "center",
    borderWidth: 0,
    color: theme.vars.palette.grey.dark,
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
    fontSize: "0.95rem",
    transition: "all 0.15s ease-in-out",
    position: "relative",
    "&:hover": {
      transform: "scale(1.02)",
    },
    "&:focus": {
      outline: "none",
      backgroundColor: `${theme.palette.primary.light}11`,
    },
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: 0,
      left: "10%",
      width: "80%",
      height: "1px",
      backgroundColor: `${theme.palette.divider}`,
      opacity: 0.5,
    },
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
    padding: "16px 0",
  },
  "& .uppercase-cell": { textTransform: "uppercase" },
  "& .danger-days": {
    color: theme.vars.palette.error.main,
    fontWeight: "bold",
    padding: "4px 8px",
    borderRadius: "12px",
    backgroundColor: `${theme.palette.error.light}22`,
  },
  "& .warning-days": {
    color: theme.vars.palette.warning.main,
    fontWeight: "bold",
    padding: "4px 8px",
    borderRadius: "12px",
    backgroundColor: `${theme.palette.warning.light}22`,
  },
  "& .MuiDataGrid-toolbarContainer": {
    gap: 2,
    padding: "12px 20px",
    justifyContent: "space-between",
    backgroundColor: theme.palette.error.dark,
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius,
    marginBottom: 10,
    borderBottom: "2px solid rgba(255,255,255,0.1)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  "@keyframes glow-border": {
    "0%": {
      boxShadow: `0 0 5px rgba(244, 67, 54, 0.5), inset 0 0 5px rgba(244, 67, 54, 0.1)`,
    },
    "50%": {
      boxShadow: `0 0 20px rgba(244, 67, 54, 0.8), inset 0 0 10px rgba(244, 67, 54, 0.3)`,
    },
    "100%": {
      boxShadow: `0 0 5px rgba(244, 67, 54, 0.5), inset 0 0 5px rgba(244, 67, 54, 0.1)`,
    },
  },
  "@keyframes subtle-pulse": {
    "0%, 100%": { opacity: 1, transform: "scale(1)" },
    "50%": { opacity: 0.95, transform: "scale(1.02)" },
  },
  "@keyframes slide-in-left": {
    from: { transform: "translateX(-100%)", opacity: 0 },
    to: { transform: "translateX(0)", opacity: 1 },
  },
  "& .high-priority-row": {
    backgroundColor: `${theme.palette.error.light}33`,
    animation: "glow-border 2s ease-in-out infinite",
    border: `2px solid ${theme.palette.error.main}`,
    borderRadius: theme.shape.borderRadius,
    position: "relative",
    zIndex: 1,
    "&:hover": {
      backgroundColor: `${theme.palette.error.light}66`,
      transform: "translateY(-3px)",
      boxShadow: `0 6px 12px ${theme.palette.error.light}66`,
    },
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: -8,
      height: "100%",
      width: "4px",
      backgroundColor: theme.palette.error.main,
      borderRadius: "2px",
    },
  },
  "& .medium-priority-row": {
    backgroundColor: `${theme.palette.warning.light}33`,
    border: `1px solid ${theme.palette.warning.main}66`,
    borderRadius: theme.shape.borderRadius,
    position: "relative",
    zIndex: 0,
    "&:hover": {
      backgroundColor: `${theme.palette.warning.light}66`,
      transform: "translateY(-2px)",
      boxShadow: `0 4px 10px ${theme.palette.warning.light}66`,
    },
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: -8,
      height: "100%",
      width: "4px",
      backgroundColor: theme.palette.warning.main,
      borderRadius: "2px",
    },
  },
}));

export const StyledPagination = styled(Pagination)(({ theme }) => ({
  "& .MuiPaginationItem-previousNext": {
    backgroundColor: theme.vars.palette.error.dark,
    color: "#fff",
    height: 30,
    width: 38,
    "&:hover": {
      backgroundColor: theme.vars.palette.error.main,
    },
  },
  "& .MuiPaginationItem-page": {
    backgroundColor: theme.vars.palette.grey.outlinedInput,
    borderColor: theme.vars.palette.grey.outlinedInput,
    height: 30,
    width: 38,
    "&:hover": {
      backgroundColor: theme.vars.palette.grey.light,
      borderColor: theme.vars.palette.grey.light,
    },
  },
  "& .MuiPaginationItem-ellipsis": {
    backgroundColor: theme.vars.palette.grey.outlinedInput,
    borderColor: theme.vars.palette.grey.outlinedInput,
    borderRadius: theme.vars.shape.borderRadius,
    height: 30,
    width: 38,
    alignContent: "center",
  },
  "& .MuiPaginationItem-page.Mui-selected": {
    backgroundColor: theme.vars.palette.error.light,
    borderColor: theme.vars.palette.error.light,
    color: theme.palette.common.white,
    fontWeight: "bold",
    transform: "scale(1.05)",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: theme.vars.palette.error.main,
    },
  },
}));
