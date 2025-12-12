import React, { useMemo } from "react";
import moment from "moment";

import { StyledDataGrid } from "../../styles/StyledComponents";
import { formatCustomRelativeTime } from "../../../../features/Customer/customerUtils";

/**
 * Helper function to check if recall date is expired
 * @param {string} dateString - Date string to check
 * @returns {boolean} True if expired
 */
export const isRecallExpired = (dateString) => {
  if (!dateString) return false;
  const recallDate = moment(dateString).startOf("day");
  const today = moment().startOf("day");
  return recallDate.diff(today, "days") <= 0;
};

/**
 * Get row class name based on priority
 * @param {Object} params - DataGrid row params
 * @returns {string} Class names
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

  // สร้าง key ที่เปลี่ยนไปตาม rows เพื่อ force re-render DataGrid
  const dataGridKey = useMemo(() => {
    if (!props.rows || !Array.isArray(props.rows)) return "datagrid-empty";
    const rowIds = props.rows.map((row) => row?.cus_id || row?.id || "no-id").join(",");
    return `datagrid-${rowIds.substring(0, 50)}-${props.rows.length}`;
  }, [props.rows]);

  return <StyledDataGrid key={dataGridKey} {...props} getRowId={getRowId} />;
};
