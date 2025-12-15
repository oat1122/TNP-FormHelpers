import React, { useMemo } from "react";
import moment from "moment";
import { styled } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import { formatCustomRelativeTime } from "../../../../features/Customer/customerUtils";

// Styled DataGrid component
const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  border: "none",

  // --- Header Styling ---
  "& .MuiDataGrid-columnHeader": {
    backgroundColor: theme.palette.error.dark,
    color: theme.palette.common.white,
    transition: "all 0.2s ease",
    "&:hover": { backgroundColor: theme.palette.error.main },
    "&:focus, &:focus-within": { outline: "none" },
  },

  "& .MuiDataGrid-columnHeaderTitleContainer": {
    justifyContent: "center",
    fontSize: "0.95rem",
    fontWeight: "bold",
  },

  "& .MuiDataGrid-columnHeader[aria-colindex='1']": {
    borderBottomLeftRadius: theme.shape.borderRadius,
  },

  "& .MuiDataGrid-columnHeader--last": {
    borderBottomRightRadius: theme.shape.borderRadius,
  },

  "& .MuiDataGrid-iconSeparator": { display: "none" },

  // --- Row Styling (ไม่ใช้ margin - ใช้ getRowSpacing แทน) ---
  "& .MuiDataGrid-row": {
    backgroundColor: theme.vars?.palette?.grey?.main || "#f5f5f5",
    borderRadius: theme.shape.borderRadius,
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#ffffff",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      zIndex: 2,
    },
  },

  // --- Cell Styling ---
  "& .MuiDataGrid-cell": {
    borderBottom: "none",
    display: "flex",
    alignItems: "center",
    "&:focus": { outline: "none" },
  },

  // Default center alignment for cells without specific alignment
  "& .MuiDataGrid-cell:not(.MuiDataGrid-cell--textLeft):not(.MuiDataGrid-cell--textRight)": {
    justifyContent: "center",
  },

  // Left-aligned cells
  "& .MuiDataGrid-cell--textLeft": {
    justifyContent: "flex-start",
  },

  "& .MuiDataGrid-menuIcon > button > svg, & .MuiDataGrid-iconButtonContainer > button > svg": {
    color: "#fff",
  },

  "& .MuiDataGrid-actionsCell > .MuiIconButton-root:not(.Mui-disabled) > svg": {
    color: theme.vars?.palette?.grey?.dark || "#666",
  },

  // ซ่อน cellOffsetLeft element ที่ไม่ต้องการ
  "& .MuiDataGrid-cellOffsetLeft": { display: "none" },

  // --- Footer Styling ---
  "& .MuiDataGrid-footerContainer": {
    borderTop: "none",
    justifyContent: "center",
    padding: "16px 0",
    backgroundColor: "#ffffff",
  },

  // --- Toolbar ---
  "& .MuiDataGrid-toolbarContainer": {
    gap: 2,
    padding: "12px 20px",
    justifyContent: "space-between",
    backgroundColor: theme.palette.error.dark,
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius,
    marginBottom: 10,
    color: "#fff",
    "& button": { color: "#fff" },
  },

  // --- Priority Row Styling ---
  "& .expired-row": {
    backgroundColor: `${theme.palette.error.light}44`,
    borderLeft: `6px solid ${theme.palette.error.main}`,
    "&:hover": { backgroundColor: `${theme.palette.error.light}66` },
  },
  "& .high-priority-row": {
    backgroundColor: `${theme.palette.error.light}33`,
    borderLeft: `6px solid ${theme.palette.error.main}`,
    "&:hover": { backgroundColor: `${theme.palette.error.light}55` },
  },
  "& .medium-priority-row": {
    backgroundColor: `${theme.palette.warning.light}33`,
    borderLeft: `6px solid ${theme.palette.warning.main}`,
    "&:hover": { backgroundColor: `${theme.palette.warning.light}55` },
  },
}));

/**
 * Helper function to check if recall date is expired
 */
export const isRecallExpired = (dateString) => {
  if (!dateString) return false;
  const recallDate = moment(dateString).startOf("day");
  const today = moment().startOf("day");
  return recallDate.diff(today, "days") <= 0;
};

/**
 * Get row class name based on priority
 */
export const getRowClassName = (params) => {
  const classes = [];
  if (params.indexRelativeToCurrentPage % 2 === 0) {
    classes.push("even-row");
  } else {
    classes.push("odd-row");
  }

  const expired = isRecallExpired(params.row.cd_last_datetime);
  const daysLeft = formatCustomRelativeTime(params.row.cd_last_datetime);

  if (expired) {
    classes.push("expired-row");
  } else if (daysLeft <= 7) {
    classes.push("high-priority-row");
  } else if (daysLeft <= 15) {
    classes.push("medium-priority-row");
  }

  return classes.join(" ");
};

/**
 * DataGrid wrapper สำหรับจัดการ row ID
 * แก้ปัญหา duplicate key และ missing ID
 */
export const DataGridWithRowIdFix = (props) => {
  const getRowId = (row) => {
    if (!row) return `row-${Math.random().toString(36).substring(2, 15)}`;
    return row.cus_id || row.id || `row-${Math.random().toString(36).substring(2, 15)}`;
  };

  // ใช้ getRowSpacing แทน margin เพื่อให้ DataGrid คำนวณความสูงได้ถูกต้อง
  const getRowSpacing = (params) => ({
    top: params.isFirstVisible ? 0 : 5,
    bottom: params.isLastVisible ? 0 : 5,
  });

  const dataGridKey = useMemo(() => {
    if (!props.rows || !Array.isArray(props.rows)) return "datagrid-empty";
    const rowIds = props.rows.map((row) => row?.cus_id || row?.id || "no-id").join(",");
    return `datagrid-${rowIds.substring(0, 50)}-${props.rows.length}`;
  }, [props.rows]);

  return (
    <StyledDataGrid
      key={dataGridKey}
      {...props}
      getRowId={getRowId}
      getRowSpacing={getRowSpacing}
    />
  );
};
