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
  MdBusiness,
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
      business_type: "BUSINESS TYPE",
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
      business_type: "Type of customer's business",
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
      business_type: <MdBusiness size={16} />,
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
      cus_no: false,  // Hide ID column
      cus_channel: true,
      business_type: true, // business type
      cus_manage_by: true, // sales name
      cus_name: true,  // customer
      cus_company: false,
      cus_tel_1: true,
      cd_last_datetime: true, // recall
      cd_note: true,
      cus_created_date: true, // customer create at
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
      <Tooltip title="Show/Hide Columns">        <Badge
          badgeContent={visibleColumnsCount}
          sx={{
            "& .MuiBadge-badge": {
              top: 5,
              right: 5,
              minWidth: "18px",
              height: "18px",
              fontSize: "0.7rem",
              backgroundColor: "#900f0f",
              color: "#ffffff",
            },
          }}
        >          <Button
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
              backgroundColor: "#900f0f",
              "&:hover": {
                backgroundColor: "#a61212",
              },
              borderRadius: "4px",
              textTransform: "none",
              fontWeight: "medium",
              fontSize: "0.9rem",
              py: 0.5,
              boxShadow: '0 2px 5px rgba(144, 15, 15, 0.3)',
            }}
          >
            Columns
          </Button>
        </Badge>
      </Tooltip>      <Menu
        id="column-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transitionDuration={200}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(144, 15, 15, 0.15))',
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: '#900f0f',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            }
          }
        }}
        PaperProps={{
          elevation: 5,
          style: {
            maxHeight: "70vh",
            width: "280px",
            border: "1px solid rgba(144, 15, 15, 0.12)",
            borderRadius: "8px",
            overflow: "hidden",
          },
        }}
      >        <Box
          sx={{
            bgcolor: "#900f0f",
            color: "white",
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTopLeftRadius: "4px",
            borderTopRightRadius: "4px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MdSettings size={20} />
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              Column Settings
            </Typography>
          </Box>          <Box
            sx={{
              backgroundColor: "rgba(255,255,255,0.25)",
              borderRadius: "16px",
              px: 1.5,
              py: 0.5,
              fontSize: "0.75rem",
              fontWeight: "bold",
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Box 
              component="span" 
              sx={{ 
                backgroundColor: 'white', 
                color: '#900f0f',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.7rem'
              }}
            >
              {visibleColumnsCount}
            </Box>
            <Box component="span">of {columns.length - 1}</Box>
          </Box>
        </Box>        <Divider sx={{ borderColor: 'rgba(144, 15, 15, 0.15)' }} />
        {/* Show/Hide All Controls */}        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            p: 2,
            bgcolor: "#fff4f4",
            justifyContent: "space-between",
          }}
        ><Button
            size="small"
            onClick={handleShowAll}
            variant="contained"
            startIcon={<FiEye />}
            sx={{
              backgroundColor: "#900f0f",
              color: "white",
              "&:hover": {
                backgroundColor: "#a61212",
              }
            }}
          >
            Show All
          </Button>
          <Button
            size="small"
            onClick={handleHideAll}
            variant="outlined"
            startIcon={<FiEyeOff />}
            sx={{
              borderColor: "#900f0f",
              color: "#900f0f",
              "&:hover": {
                borderColor: "#a61212",
                backgroundColor: "rgba(144, 15, 15, 0.04)",
              }
            }}
          >
            Hide All
          </Button>
          <Button
            size="small"
            onClick={handleResetToDefault}
            variant="contained"
            fullWidth
            startIcon={<MdRestartAlt />}
            sx={{ 
              mt: 1,
              backgroundColor: "#737373",
              color: "white",
              "&:hover": {
                backgroundColor: "#5c5c5c",
              }
            }}
          >
            Reset to Default
          </Button>
        </Box>
        <Divider sx={{ borderColor: 'rgba(144, 15, 15, 0.15)' }} />        <Box
          sx={{
            py: 1.5,
            px: 2,
            backgroundColor: "#fef2f2", // Light red background
            borderBottom: "1px solid",
            borderColor: "rgba(144, 15, 15, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <MdOutlineInfo size={16} color="#900f0f" />
          <Typography variant="caption" sx={{ color: "#900f0f", fontWeight: 500 }}>
            Click on an item or checkbox to toggle column visibility
          </Typography>
        </Box>
        {/* Column List */}        <Paper
          variant="outlined"
          sx={{ 
            mx: 1, 
            mb: 1, 
            overflow: "auto", 
            maxHeight: "60vh",
            borderColor: "rgba(144, 15, 15, 0.12)",
            borderRadius: "4px",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
            backgroundColor: "#fffafa"
          }}
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
              >                <MenuItem
                  onClick={() => handleToggleColumn(column.field)}
                  dense
                  sx={{
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&:last-child": {
                      borderBottom: "none",
                    },
                    bgcolor: isVisible
                      ? "rgba(144, 15, 15, 0.04)"
                      : "transparent",
                    transition: "all 0.2s ease",
                    py: 1,
                    "&:hover": {
                      bgcolor: "rgba(144, 15, 15, 0.08)",
                    },
                  }}
                >                  <ListItemIcon sx={{ minWidth: 36, color: isVisible ? "#900f0f" : "text.secondary" }}>
                    {columnIcons[column.field] || (
                      <MdDragIndicator size={16} />
                    )}
                  </ListItemIcon>                  <ListItemText
                    primary={displayName}
                    sx={{
                      "& .MuiTypography-root": {
                        fontWeight: isVisible ? 600 : 400,
                        opacity: isVisible ? 1 : 0.7,
                        color: isVisible ? "#900f0f" : "text.primary",
                      },
                    }}
                  />                  <Checkbox
                    edge="end"
                    checked={isVisible}
                    tabIndex={-1}
                    size="small"
                    sx={{
                      color: "rgba(144, 15, 15, 0.5)",
                      '&.Mui-checked': {
                        color: "#900f0f",
                      },
                    }}
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
