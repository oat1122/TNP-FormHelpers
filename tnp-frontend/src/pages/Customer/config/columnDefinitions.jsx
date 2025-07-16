import React from "react";
import {
  Box,
  Typography,
  Tooltip,
  Chip,
  useTheme,
} from "@mui/material";
import { GridActionsCellItem } from "@mui/x-data-grid";
import { MdOutlineManageSearch } from "react-icons/md";
import { CiEdit } from "react-icons/ci";
import { BsTrash3 } from "react-icons/bs";
import { PiClockClockwise, PiArrowFatLinesUpFill, PiArrowFatLinesDownFill } from "react-icons/pi";
import moment from "moment";
import { formatCustomRelativeTime } from "../../../features/Customer/customerUtils";
import { channelMap } from "../components/UtilityComponents";
import CustomerRecallTimer from "../../../components/CustomerRecallTimer";

// Helper function to check if recall date is expired
const isRecallExpired = (dateString) => {
  if (!dateString) return false;
  const recallDate = moment(dateString).startOf('day');
  const today = moment().startOf('day');
  return recallDate.diff(today, 'days') <= 0;
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
      width: 120,
      sortable: true,
      renderCell: (params) => <span>{params.value}</span>,
    },
    {
      field: "cus_channel",
      headerName: "CHANNEL",
      width: 120,
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
      width: 160,
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
            <Typography variant="body2" sx={{ textTransform: "uppercase" }}>
              {params.value.username}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "cus_name",
      headerName: "CUSTOMER",
      width: 200,
      sortable: true,
      renderCell: (params) => {
        const fullName = params.value;
        const company = params.row.cus_company || "";
        const tooltipText = company ? `${fullName}\n${company}` : fullName;

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
              <Typography variant="body2" fontWeight="bold">
                {fullName}
              </Typography>
              {params.row.cus_company && (
                <Typography variant="caption" color="text.secondary">
                  {params.row.cus_company}
                </Typography>
              )}
            </Box>
          </Tooltip>
        );
      },
    },
    {
      field: "cus_company",
      headerName: "COMPANY NAME",
      width: 280,
      sortable: true,
      renderCell: (params) => {
        return <span>{params.value || "—"}</span>;
      },
    },
    {
      field: "cus_tel_1",
      headerName: "TEL",
      width: 140,
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
                  <Typography variant="body2">{tel1 || "—"}</Typography>
                </Box>
                {tel2 && (
                  <Typography variant="caption" color="text.secondary">
                    {tel2}
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="body2" sx={{ color: "text.disabled" }}>
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
      width: 280,
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
                variant="body2"
                sx={{
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
      width: 180,
      sortable: true,
      sortComparator: (v1, v2, param1, param2) => {
        const cellParams = {
          id: param1.api.getCellParams(param1.id, "cus_bt_id"),
        };
        const cellParams2 = {
          id: param2.api.getCellParams(param2.id, "cus_bt_id"),
        };
        return (
          param1.api.sortRowsLookup[cellParams.id] -
          param1.api.sortRowsLookup[cellParams2.id]
        );
      },
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
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
      width: 160,
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
      width: 180,
      sortable: true,
      renderCell: (params) => {
        try {
          if (!params.value) return "—";

          return moment(params.value).isValid()
            ? moment(params.value).format("D MMMM YYYY")
            : "—";
        } catch (error) {
          console.error("Error formatting date:", error);
          return "—";
        }
      },
    },
    {
      field: "cus_email",
      headerName: "EMAIL",
      width: 200,
      sortable: true,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
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
      field: "cus_address",
      headerName: "ADDRESS",
      width: 200,
      sortable: true,
      renderCell: (params) => {
        const address = params.value;
        const province = params.row.province_name;
        const district = params.row.district_name;

        const fullAddress = [address, district, province]
          .filter(Boolean)
          .join(", ");

        return (
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 180,
              textAlign: "left",
            }}
          >
            {fullAddress || "—"}
          </Typography>
        );
      },
    },
    {
      field: "tools",
      headerName: "TOOLS",
      flex: 1,
      minWidth: 280,
      sortable: false,
      type: "actions",
      getActions: (params) => [
        <GridActionsCellItem
          key="recall"
          icon={
            <PiClockClockwise
              style={{ fontSize: 22, color: theme.palette.info.main }}
            />
          }
          label="Recall"
          onClick={() => handleRecall(params.row)}
          showInMenu={false}
          title="Reset recall timer"
          sx={{
            border: `1px solid ${theme.palette.info.main}22`,
            borderRadius: "50%",
            padding: "4px",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: `${theme.palette.info.main}22`,
              transform: "scale(1.1)",
            },
          }}
        />,
        handleDisableChangeGroupBtn(true, params.row) ? (
          <GridActionsCellItem
            key="grade-up-disabled"
            icon={<PiArrowFatLinesUpFill style={{ fontSize: 22 }} />}
            label="Change Grade Up"
            onClick={() => {}}
            disabled={true}
          />
        ) : (
          <GridActionsCellItem
            key="grade-up"
            icon={
              <PiArrowFatLinesUpFill
                style={{ fontSize: 22, color: theme.palette.success.main }}
              />
            }
            label="Change Grade Up"
            onClick={() => handleChangeGroup(true, params.row)}
            disabled={false}
            showInMenu={false}
            title="Change grade up"
            sx={{
              border: `1px solid ${theme.palette.success.main}22`,
              borderRadius: "50%",
              padding: "4px",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: `${theme.palette.success.main}22`,
                transform: "scale(1.1)",
              },
            }}
          />
        ),
        handleDisableChangeGroupBtn(false, params.row) || userRole !== "admin" ? (
          <GridActionsCellItem
            key="grade-down-disabled"
            icon={<PiArrowFatLinesDownFill style={{ fontSize: 22 }} />}
            label="Change Grade Down"
            onClick={() => {}}
            disabled={true}
            sx={{ visibility: userRole !== "admin" ? "hidden" : "visible" }}
          />
        ) : (
          <GridActionsCellItem
            key="grade-down"
            icon={
              <PiArrowFatLinesDownFill
                style={{ fontSize: 22, color: theme.palette.warning.main }}
              />
            }
            label="Change Grade Down"
            onClick={() => handleChangeGroup(false, params.row)}
            disabled={false}
            showInMenu={false}
            title="Change grade down"
            sx={{
              border: `1px solid ${theme.palette.warning.main}22`,
              borderRadius: "50%",
              padding: "4px",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: `${theme.palette.warning.main}22`,
                transform: "scale(1.1)",
              },
            }}
          />
        ),
        <GridActionsCellItem
          key="view"
          icon={
            <MdOutlineManageSearch
              style={{ fontSize: 26, color: theme.palette.primary.main }}
            />
          }
          label="View"
          onClick={() => handleOpenDialog("view", params.id)}
          showInMenu={false}
          title="View details"
          sx={{
            border: `1px solid ${theme.palette.primary.main}22`,
            borderRadius: "50%",
            padding: "4px",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: `${theme.palette.primary.main}22`,
              transform: "scale(1.1)",
            },
          }}
        />,
        <GridActionsCellItem
          key="edit"
          icon={
            <CiEdit
              style={{ fontSize: 26, color: theme.palette.secondary.main }}
            />
          }
          label="Edit"
          onClick={() => handleOpenDialog("edit", params.id)}
          showInMenu={false}
          title="Edit customer"
          sx={{
            border: `1px solid ${theme.palette.secondary.main}22`,
            borderRadius: "50%",
            padding: "4px",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: `${theme.palette.secondary.main}22`,
              transform: "scale(1.1)",
            },
          }}
        />,
        <GridActionsCellItem
          key="delete"
          icon={
            <BsTrash3
              style={{ fontSize: 22, color: theme.palette.error.main }}
            />
          }
          label="Delete"
          onClick={() => handleDelete(params.row)}
          showInMenu={false}
          title="Delete customer"
          sx={{
            border: `1px solid ${theme.palette.error.main}22`,
            borderRadius: "50%",
            padding: "4px",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: `${theme.palette.error.main}22`,
              transform: "scale(1.1)",
            },
          }}
        />,
      ],
    },
  ];
}; 