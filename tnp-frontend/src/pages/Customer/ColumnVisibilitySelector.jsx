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
  }; // Thai translations for column names with descriptions
  const thaiColumnLabels = useMemo(
    () => ({
      cus_no: "รหัสลูกค้า",
      cus_channel: "ช่องทาง",
      cus_manage_by: "ชื่อเซลล์",
      cus_name: "ชื่อลูกค้า",
      cus_company: "ชื่อบริษัท",
      cus_tel_1: "เบอร์โทร",
      cd_last_datetime: "วันที่ติดต่อกลับ",
      cd_note: "หมายเหตุ",
      cus_email: "อีเมล",
      cus_address: "ที่อยู่",
      tools: "เครื่องมือ",
    }),
    []
  );
  // Column descriptions for tooltips
  const columnDescriptions = useMemo(
    () => ({
      cus_no: "รหัสที่ใช้ระบุตัวลูกค้าในระบบ",
      cus_channel: "ช่องทางการขายหรือติดต่อกับลูกค้า",
      cus_manage_by: "พนักงานขายที่ดูแลลูกค้า",
      cus_name: "ชื่อลูกค้าที่ติดต่อ",
      cus_company: "ชื่อบริษัทของลูกค้า",
      cus_tel_1: "เบอร์โทรศัพท์หลักที่ใช้ติดต่อ",
      cd_last_datetime: "วันที่นัดติดต่อลูกค้าครั้งถัดไป",
      cd_note: "บันทึกเพิ่มเติมเกี่ยวกับลูกค้า",
      cus_email: "อีเมลที่ใช้ติดต่อลูกค้า",
      cus_address: "ที่อยู่ของลูกค้าหรือบริษัท",
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
  };
  return (
    <>
      {" "}
      <Tooltip title="เปิด/ปิด การแสดงคอลัมน์">
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
            aria-label="ตัวเลือกคอลัมน์"
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
            แสดงคอลัมน์
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
        {" "}
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
              ตั้งค่าการแสดงคอลัมน์
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
        {/* Show/Hide All Controls */}{" "}
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
            แสดงทั้งหมด
          </Button>
          <Button
            size="small"
            onClick={handleHideAll}
            variant="outlined"
            color="secondary"
            startIcon={<FiEyeOff />}
          >
            ซ่อนทั้งหมด
          </Button>{" "}
          <Button
            size="small"
            onClick={handleResetToDefault}
            variant="outlined"
            color="info"
            fullWidth
            startIcon={<MdRestartAlt />}
            sx={{ mt: 1 }}
          >
            คืนค่าเริ่มต้น
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
            คลิกที่รายการหรือช่องเพื่อเปิด/ปิดการแสดงคอลัมน์
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
            // Use Thai translation if available, otherwise use header name or field
            const displayName =
              thaiColumnLabels[column.field] ||
              column.headerName ||
              column.field;

            return (
              <Tooltip
                title={columnDescriptions[column.field] || ""}
                placement="left"
                arrow
              >
                {" "}
                <MenuItem
                  key={column.field}
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
