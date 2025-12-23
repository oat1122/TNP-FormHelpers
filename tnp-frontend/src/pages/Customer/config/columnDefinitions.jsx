import { Box, Typography, Tooltip, Chip, useTheme } from "@mui/material";
import { GridActionsCellItem } from "@mui/x-data-grid";
import moment from "moment";
import React from "react";
import { BsTrash3 } from "react-icons/bs";
import { CiEdit } from "react-icons/ci";
import { MdOutlineManageSearch } from "react-icons/md";
import { PiClockClockwise, PiArrowFatLinesUpFill, PiArrowFatLinesDownFill } from "react-icons/pi";

import CustomerRecallTimer from "../../../components/CustomerRecallTimer";
import {
  formatCustomRelativeTime,
  getSourceDisplayName,
  getSourceColor,
  getAllocationStatusDisplayName,
  getAllocationStatusColor,
} from "../../../features/Customer/customerUtils";
import { channelMap } from "../components/Common";

// ============================================
// Standardized Style Constants - สำหรับ scale ที่สม่ำเสมอทั้ง row
// ============================================
const CELL_STYLES = {
  // Font sizes - ใช้ขนาดเดียวกันทั้ง row
  fontSize: {
    primary: "0.8rem", // ข้อความหลัก
    secondary: "0.7rem", // ข้อความรอง (caption)
    chip: "0.7rem", // ข้อความใน Chip
  },
  // Icon sizes - ใช้ขนาดเดียวกันทั้งหมด
  iconSize: {
    action: 16, // Action buttons (recall, grade, view, edit, delete)
    indicator: 14, // Small indicator icons
  },
  // Button styling
  actionButton: {
    padding: "3px",
    minWidth: 26,
    borderRadius: "50%",
  },
};

// Helper function to check if recall date is expired
const isRecallExpired = (dateString) => {
  if (!dateString) return false;
  const recallDate = moment(dateString).startOf("day");
  const today = moment().startOf("day");
  return recallDate.diff(today, "days") <= 0;
};

export const useColumnDefinitions = ({
  handleOpenDialog,
  handleDelete,
  handleRecall,
  handleChangeGroup,
  handleDisableChangeGroupBtn,
  userRole,
}) => {
  const theme = useTheme();

  return [
    {
      field: "cus_no",
      headerName: "ID",
      flex: 0.3,
      minWidth: 50,
      maxWidth: 70,
      sortable: true,
      renderCell: (params) => (
        <span style={{ fontSize: CELL_STYLES.fontSize.primary }}>{params.value}</span>
      ),
    },
    {
      field: "cus_channel",
      headerName: "CHANNEL",
      flex: 0.4,
      minWidth: 75,
      maxWidth: 100,
      sortable: true,
      cellClassName: "uppercase-cell",
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Chip
            label={channelMap[params.value]}
            size="small"
            sx={{
              textTransform: "uppercase",
              fontSize: CELL_STYLES.fontSize.chip,
              height: 22,
              backgroundColor: (theme) =>
                params.value === 1
                  ? theme.palette.info.light
                  : params.value === 2
                    ? theme.palette.success.light
                    : theme.palette.warning.light,
              color: (theme) => theme.palette.common.white,
              fontWeight: "bold",
            }}
          />
        </Box>
      ),
    },
    {
      field: "cus_manage_by",
      headerName: "SALES NAME",
      sortable: true,
      flex: 0.6,
      minWidth: 90,
      maxWidth: 140,
      cellClassName: "uppercase-cell",
      hideable: false,
      renderCell: (params) => {
        return (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Typography sx={{ fontSize: CELL_STYLES.fontSize.primary, textTransform: "uppercase" }}>
              {params.value.username}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "cus_name",
      headerName: "CUSTOMER",
      flex: 0.9,
      minWidth: 130,
      maxWidth: 200,
      sortable: true,
      renderCell: (params) => {
        const fullName = params.value;
        const company = params.row.cus_company || "";
        const tooltipText = company
          ? `ชื่อเล่น : ${fullName}\nชื่อบริษัท : ${company}`
          : `ชื่อเล่น : ${fullName}`;

        return (
          <Tooltip
            title={tooltipText}
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: "rgba(0, 0, 0, 0.8)",
                  "& .MuiTooltip-arrow": {
                    color: "rgba(0, 0, 0, 0.8)",
                  },
                  fontSize: "0.875rem",
                  padding: "8px 12px",
                  maxWidth: "400px",
                  whiteSpace: "pre-line",
                },
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <Typography sx={{ fontSize: CELL_STYLES.fontSize.primary, fontWeight: "bold" }}>
                {fullName}
              </Typography>
              {params.row.cus_company && (
                <Typography
                  sx={{ fontSize: CELL_STYLES.fontSize.secondary, color: "text.secondary" }}
                >
                  {params.row.cus_company}
                </Typography>
              )}
            </Box>
          </Tooltip>
        );
      },
    },
    {
      field: "cus_tel_1",
      headerName: "TEL",
      flex: 0.6,
      minWidth: 95,
      maxWidth: 130,
      sortable: true,
      renderCell: (params) => {
        const tel1 = params.value;
        const tel2 = params.row.cus_tel_2;
        const hasTel = tel1 || tel2;

        return (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
            }}
          >
            {hasTel ? (
              <>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    transition: "all 0.2s ease",
                    borderRadius: "4px",
                    padding: "2px 6px",
                    "&:hover": {
                      backgroundColor: `${theme.palette.primary.light}22`,
                    },
                  }}
                >
                  <Typography sx={{ fontSize: CELL_STYLES.fontSize.primary }}>
                    {tel1 || "—"}
                  </Typography>
                </Box>
                {tel2 && (
                  <Typography
                    sx={{ fontSize: CELL_STYLES.fontSize.secondary, color: "text.secondary" }}
                  >
                    {tel2}
                  </Typography>
                )}
              </>
            ) : (
              <Typography sx={{ fontSize: CELL_STYLES.fontSize.primary, color: "text.disabled" }}>
                — ไม่มีเบอร์โทร —
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: "cd_note",
      headerName: "NOTE",
      flex: 1.0,
      minWidth: 130,
      maxWidth: 250,
      sortable: true,
      renderCell: (params) => {
        const hasNote = params.value && params.value.trim().length > 0;
        return (
          <Tooltip
            title={params.value || "ไม่มีหมายเหตุ"}
            placement="top-start"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: "rgba(0, 0, 0, 0.8)",
                  "& .MuiTooltip-arrow": {
                    color: "rgba(0, 0, 0, 0.8)",
                  },
                  fontSize: "0.875rem",
                  padding: "8px 12px",
                  maxWidth: "400px",
                },
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: "100%",
              }}
            >
              {hasNote && (
                <Box
                  component="span"
                  sx={{
                    width: 4,
                    height: "100%",
                    borderRadius: "2px",
                    backgroundColor: theme.palette.info.main,
                    flexShrink: 0,
                    marginRight: 1,
                  }}
                />
              )}
              <Typography
                sx={{
                  fontSize: CELL_STYLES.fontSize.primary,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 230,
                  textAlign: "left",
                }}
              >
                {params.value || "—"}
              </Typography>
            </Box>
          </Tooltip>
        );
      },
    },
    {
      field: "business_type",
      headerName: "BUSINESS TYPE",
      flex: 0.7,
      minWidth: 110,
      maxWidth: 160,
      sortable: true,
      sortComparator: (v1, v2, param1, param2) => {
        const cellParams = {
          id: param1.api.getCellParams(param1.id, "cus_bt_id"),
        };
        const cellParams2 = {
          id: param2.api.getCellParams(param2.id, "cus_bt_id"),
        };
        return param1.api.sortRowsLookup[cellParams.id] - param1.api.sortRowsLookup[cellParams2.id];
      },
      renderCell: (params) => (
        <Typography
          sx={{
            fontSize: CELL_STYLES.fontSize.primary,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 160,
            textAlign: "left",
          }}
        >
          {params.value || "—"}
        </Typography>
      ),
    },
    {
      field: "cd_last_datetime",
      headerName: "RECALL",
      flex: 0.6,
      minWidth: 90,
      maxWidth: 140,
      sortable: true,
      renderCell: (params) => {
        return (
          <CustomerRecallTimer
            cd_last_datetime={params.value}
            showIcon={true}
            size="body2"
            urgentThreshold={7}
          />
        );
      },
      cellClassName: (params) => {
        const expired = isRecallExpired(params.value);
        const daysLeft = formatCustomRelativeTime(params.value);

        if (expired) {
          return "expired-days";
        } else if (daysLeft <= 7) {
          return "danger-days";
        } else if (daysLeft <= 15) {
          return "warning-days";
        }
      },
    },
    {
      field: "cus_created_date",
      headerName: "CUSTOMER CREATE AT",
      flex: 0.8,
      minWidth: 120,
      maxWidth: 180,
      sortable: true,
      renderCell: (params) => {
        try {
          if (!params.value)
            return <span style={{ fontSize: CELL_STYLES.fontSize.primary }}>—</span>;

          return (
            <span style={{ fontSize: CELL_STYLES.fontSize.primary }}>
              {moment(params.value).isValid() ? moment(params.value).format("D MMMM YYYY") : "—"}
            </span>
          );
        } catch (error) {
          console.error("Error formatting date:", error);
          return <span style={{ fontSize: CELL_STYLES.fontSize.primary }}>—</span>;
        }
      },
    },
    {
      field: "cus_email",
      headerName: "EMAIL",
      flex: 0.9,
      minWidth: 140,
      maxWidth: 200,
      sortable: true,
      renderCell: (params) => (
        <Typography
          sx={{
            fontSize: CELL_STYLES.fontSize.primary,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 180,
          }}
        >
          {params.value || "—"}
        </Typography>
      ),
    },

    {
      field: "tools",
      headerName: "TOOLS",
      flex: 1.0,
      minWidth: 200,
      maxWidth: 240,
      sortable: false,
      type: "actions",
      getActions: (params) => [
        <GridActionsCellItem
          key="recall"
          icon={
            <PiClockClockwise
              style={{ fontSize: CELL_STYLES.iconSize.action, color: theme.palette.info.main }}
            />
          }
          label="Recall"
          onClick={() => handleRecall(params.row)}
          showInMenu={false}
          title="Reset recall timer"
          sx={{
            border: `1px solid ${theme.palette.info.main}22`,
            borderRadius: CELL_STYLES.actionButton.borderRadius,
            padding: CELL_STYLES.actionButton.padding,
            minWidth: CELL_STYLES.actionButton.minWidth,
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: `${theme.palette.info.main}22`,
              transform: "scale(1.05)",
            },
          }}
        />,
        handleDisableChangeGroupBtn(true, params.row) ? (
          <GridActionsCellItem
            key="grade-up-disabled"
            icon={<PiArrowFatLinesUpFill style={{ fontSize: CELL_STYLES.iconSize.action }} />}
            label="Change Grade Up"
            onClick={() => {}}
            disabled={true}
            sx={{ minWidth: CELL_STYLES.actionButton.minWidth }}
          />
        ) : (
          <GridActionsCellItem
            key="grade-up"
            icon={
              <PiArrowFatLinesUpFill
                style={{ fontSize: CELL_STYLES.iconSize.action, color: theme.palette.success.main }}
              />
            }
            label="Change Grade Up"
            onClick={() => handleChangeGroup(true, params.row)}
            disabled={false}
            showInMenu={false}
            title="Change grade up"
            sx={{
              border: `1px solid ${theme.palette.success.main}22`,
              borderRadius: CELL_STYLES.actionButton.borderRadius,
              padding: CELL_STYLES.actionButton.padding,
              minWidth: CELL_STYLES.actionButton.minWidth,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: `${theme.palette.success.main}22`,
                transform: "scale(1.05)",
              },
            }}
          />
        ),
        handleDisableChangeGroupBtn(false, params.row) || userRole !== "admin" ? (
          <GridActionsCellItem
            key="grade-down-disabled"
            icon={<PiArrowFatLinesDownFill style={{ fontSize: CELL_STYLES.iconSize.action }} />}
            label="Change Grade Down"
            onClick={() => {}}
            disabled={true}
            sx={{
              visibility: userRole !== "admin" ? "hidden" : "visible",
              minWidth: CELL_STYLES.actionButton.minWidth,
            }}
          />
        ) : (
          <GridActionsCellItem
            key="grade-down"
            icon={
              <PiArrowFatLinesDownFill
                style={{ fontSize: CELL_STYLES.iconSize.action, color: theme.palette.warning.main }}
              />
            }
            label="Change Grade Down"
            onClick={() => handleChangeGroup(false, params.row)}
            disabled={false}
            showInMenu={false}
            title="Change grade down"
            sx={{
              border: `1px solid ${theme.palette.warning.main}22`,
              borderRadius: CELL_STYLES.actionButton.borderRadius,
              padding: CELL_STYLES.actionButton.padding,
              minWidth: CELL_STYLES.actionButton.minWidth,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: `${theme.palette.warning.main}22`,
                transform: "scale(1.05)",
              },
            }}
          />
        ),
        <GridActionsCellItem
          key="view"
          icon={
            <MdOutlineManageSearch
              style={{ fontSize: CELL_STYLES.iconSize.action, color: theme.palette.primary.main }}
            />
          }
          label="View"
          onClick={() => handleOpenDialog("view", params.id)}
          showInMenu={false}
          title="View details"
          sx={{
            border: `1px solid ${theme.palette.primary.main}22`,
            borderRadius: CELL_STYLES.actionButton.borderRadius,
            padding: CELL_STYLES.actionButton.padding,
            minWidth: CELL_STYLES.actionButton.minWidth,
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: `${theme.palette.primary.main}22`,
              transform: "scale(1.05)",
            },
          }}
        />,
        <GridActionsCellItem
          key="edit"
          icon={
            <CiEdit
              style={{ fontSize: CELL_STYLES.iconSize.action, color: theme.palette.secondary.main }}
            />
          }
          label="Edit"
          onClick={() => handleOpenDialog("edit", params.id)}
          showInMenu={false}
          title="Edit customer"
          sx={{
            border: `1px solid ${theme.palette.secondary.main}22`,
            borderRadius: CELL_STYLES.actionButton.borderRadius,
            padding: CELL_STYLES.actionButton.padding,
            minWidth: CELL_STYLES.actionButton.minWidth,
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: `${theme.palette.secondary.main}22`,
              transform: "scale(1.05)",
            },
          }}
        />,
        <GridActionsCellItem
          key="delete"
          icon={
            <BsTrash3
              style={{ fontSize: CELL_STYLES.iconSize.action, color: theme.palette.error.main }}
            />
          }
          label="Delete"
          onClick={() => handleDelete(params.row)}
          showInMenu={false}
          title="Delete customer"
          sx={{
            border: `1px solid ${theme.palette.error.main}22`,
            borderRadius: CELL_STYLES.actionButton.borderRadius,
            padding: CELL_STYLES.actionButton.padding,
            minWidth: CELL_STYLES.actionButton.minWidth,
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: `${theme.palette.error.main}22`,
              transform: "scale(1.05)",
            },
          }}
        />,
      ],
    },
  ];
};
