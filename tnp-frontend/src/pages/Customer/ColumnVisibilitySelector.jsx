import React, { useState, useMemo } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Divider,
  Typography,
  Paper,
  Box,
  Tooltip,
  Badge,
} from "@mui/material";
import {
  MdViewColumn,
  MdSettings,
  MdDragIndicator,
  MdOutlineInfo,
  MdRestartAlt,
} from "react-icons/md";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { PiClockClockwise } from "react-icons/pi";
import {
  BsCardHeading,
  BsArrowsCollapse,
  BsPerson,
  BsPeople,
  BsBuilding,
  BsTelephone,
  BsCalendarDate,
  BsJournalText,
  BsEnvelope,
  BsPinMap,
} from "react-icons/bs";
import {
  gridColumnVisibilityModelSelector,
  useGridApiContext,
} from "@mui/x-data-grid";

/**
 * ColumnVisibilitySelector component allows users to toggle the visibility of table columns.
 *
 * @param {Object} props
 * @param {Array} props.columns - Array of column definitions
 * @param {Function} props.onColumnVisibilityChange - Callback when column visibility changes
 */
const ColumnVisibilitySelector = ({ columns = [] }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const apiRef = useGridApiContext();
  const open = Boolean(anchorEl);
  // Get current visibility model from DataGrid
  const columnVisibilityModel = gridColumnVisibilityModelSelector(apiRef);

  // Count visible columns
  const visibleColumnsCount = columns.reduce((count, column) => {
    // If column is visible (not explicitly set to false) and not the tools column
    if (
      column.field !== "tools" &&
      columnVisibilityModel[column.field] !== false
    ) {
      return count + 1;
    }
    return count;
  }, 0);

  // Handle menu open
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle menu close
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // Column names in English for consistency with table headers
  const columnLabels = useMemo(
    () => ({
      cus_no: "ID",
      cus_channel: "CHANNEL",
      cus_manage_by: "SALES NAME",
      cus_name: "CUSTOMER",
      cus_company: "COMPANY NAME",
      cus_tel_1: "TEL",
      cd_last_datetime: "RECALL",
      cd_note: "NOTE",
      cus_created_date: "CUSTOMER CREATE AT",
      cus_email: "EMAIL",
      cus_address: "ADDRESS",
      tools: "TOOLS",
    }),
    []
  );
  
  // Column descriptions for tooltips
  const columnDescriptions = useMemo(
    () => ({
      cus_no: "Customer identification number",
      cus_channel: "Sales channel or contact method",
      cus_manage_by: "Sales representative assigned to customer",
      cus_name: "Customer's name",
      cus_company: "Customer's company name",
      cus_tel_1: "Primary contact phone number",
      cd_last_datetime: "Date for next customer follow-up",
      cd_note: "Additional notes about the customer",
      cus_created_date: "Date when the customer was created",
      cus_email: "Customer's contact email address",
      cus_address: "Customer's or company's address",
    }),
    []
  );
  
  // Column icons for visual identification
  const columnIcons = useMemo(
    () => ({
      cus_no: <BsCardHeading size={16} />,
      cus_channel: <BsArrowsCollapse size={16} />,
      cus_manage_by: <BsPerson size={16} />,
      cus_name: <BsPeople size={16} />,
      cus_company: <BsBuilding size={16} />,
      cus_tel_1: <BsTelephone size={16} />,
      cd_last_datetime: <BsCalendarDate size={16} />,
      cd_note: <BsJournalText size={16} />,
      cus_created_date: <PiClockClockwise size={16} />,
      cus_email: <BsEnvelope size={16} />,
      cus_address: <BsPinMap size={16} />,
      tools: <MdSettings size={16} />,
    }),
    []
  );

  // Toggle column visibility
  const handleToggleColumn = (field) => {
    const newModel = {
      ...columnVisibilityModel,
      [field]: !columnVisibilityModel[field],
    };
    
    apiRef.current.setColumnVisibilityModel(newModel);
  };
  
  // Default column visibility model
  const defaultColumnVisibilityModel = useMemo(
    () => ({
      cus_no: true,
      cus_channel: true,
      cus_manage_by: true,
      cus_name: true,
      cus_company: true,
      cus_tel_1: true,
      cd_last_datetime: true,
      cd_note: true,
      cus_created_date: true,
      cus_email: false,
      cus_address: false,
      tools: true,
    }),
    []
  );

  // Handle "Show All" action
  const handleShowAll = () => {
    const allVisible = {};
    columns.forEach((column) => {
      if (column.field !== "tools") {
        // Always keep tools column
        allVisible[column.field] = true;
      }
    });
    apiRef.current.setColumnVisibilityModel(allVisible);
  };

  // Handle "Hide All" action (except required columns)
  const handleHideAll = () => {
    const allHidden = {};
    columns.forEach((column) => {
      if (column.field !== "tools" && column.field !== "cus_name") {
        // Don't hide essential columns like tools and customer name
        allHidden[column.field] = false;
      } else {
        allHidden[column.field] = true; // Keep essential columns visible
      }
    });
    apiRef.current.setColumnVisibilityModel(allHidden);
  };

  // Handle "Reset to Default" action
  const handleResetToDefault = () => {
    apiRef.current.setColumnVisibilityModel(defaultColumnVisibilityModel);
  };  return (
    <>
      <Tooltip title="Show/Hide Columns">
        <Badge
          badgeContent={visibleColumnsCount}
          color="primary"
          sx={{
            "& .MuiBadge-badge": {
              top: 5,
              right: 5,
              minWidth: "18px",
              height: "18px",
              fontSize: "0.7rem",
            },
          }}
        >
          <Button
            variant="contained"
            color="inherit"
            startIcon={<MdViewColumn size={20} />}
            aria-label="Column options"
            aria-controls={open ? "column-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleClick}
            sx={{
              color: (theme) => theme.palette.common.white,
              ml: 1,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.3)",
              },
              borderRadius: "4px",
              textTransform: "none",
              fontWeight: "medium",
              fontSize: "0.9rem",
              py: 0.5,
            }}
          >
            Columns
          </Button>
        </Badge>
      </Tooltip>
      <Menu
        id="column-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          elevation: 3,
          style: {
            maxHeight: "70vh",
            width: "280px",
          },
        }}
      >
        <Box
          sx={{
            bgcolor: (theme) => theme.palette.primary.main,
            color: "white",
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MdSettings size={20} />
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              Column Settings
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: "16px",
              px: 1.5,
              py: 0.5,
              fontSize: "0.75rem",
              fontWeight: "bold",
            }}
          >
            {visibleColumnsCount}/{columns.length - 1}
          </Box>
        </Box>
        <Divider />
        {/* Show/Hide All Controls */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            p: 2,
            bgcolor: "background.default",
            justifyContent: "space-between",
          }}
        >
          <Button
            size="small"
            onClick={handleShowAll}
            variant="outlined"
            color="primary"
            startIcon={<FiEye />}
          >
            Show All
          </Button>
          <Button
            size="small"
            onClick={handleHideAll}
            variant="outlined"
            color="secondary"
            startIcon={<FiEyeOff />}
          >
            Hide All
          </Button>
          <Button
            size="small"
            onClick={handleResetToDefault}
            variant="outlined"
            color="info"
            fullWidth
            startIcon={<MdRestartAlt />}
            sx={{ mt: 1 }}
          >
            Reset to Default
          </Button>
        </Box>
        <Divider />
        <Box
          sx={{
            py: 1.5,
            px: 2,
            backgroundColor: (theme) => theme.palette.grey[50],
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <MdOutlineInfo size={16} color="#666" />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Click on an item or checkbox to toggle column visibility
          </Typography>
        </Box>
        {/* Column List */}
        <Paper
          variant="outlined"
          sx={{ mx: 1, mb: 1, overflow: "auto", maxHeight: "60vh" }}
        >
          {columns.map((column) => {
            // Skip columns that shouldn't be toggleable
            if (column.field === "tools") return null;
            
            const isVisible = columnVisibilityModel[column.field] !== false;
            // Use English column labels if available, otherwise use header name or field
            const displayName =
              columnLabels[column.field] ||
              column.headerName ||
              column.field;

            return (
              <Tooltip
                key={column.field}
                title={columnDescriptions[column.field] || ""}
                placement="left"
                arrow
              >
                <MenuItem
                  onClick={() => handleToggleColumn(column.field)}
                  dense
                  sx={{
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&:last-child": {
                      borderBottom: "none",
                    },
                    bgcolor: isVisible
                      ? "rgba(25, 118, 210, 0.04)"
                      : "transparent",
                    transition: "all 0.2s ease",
                    py: 1,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {columnIcons[column.field] || (
                      <MdDragIndicator color="action" size={16} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={displayName}
                    sx={{
                      "& .MuiTypography-root": {
                        fontWeight: isVisible ? 500 : 400,
                        opacity: isVisible ? 1 : 0.7,
                      },
                    }}
                  />
                  <Checkbox
                    edge="end"
                    checked={isVisible}
                    tabIndex={-1}
                    color="primary"
                    size="small"
                  />
                </MenuItem>
              </Tooltip>
            );
          })}
        </Paper>
      </Menu>
    </>
  );
};

export default ColumnVisibilitySelector;
