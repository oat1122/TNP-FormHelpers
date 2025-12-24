import React from "react";
import { ToggleButton, CircularProgress, Box } from "@mui/material";

/**
 * FilterGroupDesktop - Desktop toggle buttons สำหรับเลือกกลุ่มลูกค้า
 * ✅ เป็น Presentational Component - รับค่าที่คำนวณแล้วจาก parent
 */
const FilterGroupDesktop = ({
  groupSelected,
  onSelectGroup,
  sortedGroupList,
  computedTotalCount, // ✅ รับค่าที่คำนวณแล้ว
  allGroupCounts,
  isLoadingCounts,
  hasActiveFilters,
}) => {
  // Helper function สำหรับสร้าง button styling
  const getButtonSx = (isSelected) => ({
    fontSize: "0.875rem",
    fontFamily: "Kanit",
    textAlign: "center",
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid rgba(211, 47, 47, 0.3)",
    backgroundColor: isSelected ? "#8B0000" : "transparent",
    color: isSelected ? "#fff" : "rgba(211, 47, 47, 0.8)",
    fontWeight: isSelected ? 600 : 400,
    minHeight: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&.MuiToggleButton-root": {
      backgroundColor: isSelected ? "#8B0000 !important" : "transparent !important",
      color: isSelected ? "#fff !important" : "rgba(211, 47, 47, 0.8) !important",
      border: "1px solid rgba(211, 47, 47, 0.3) !important",
    },
    "&:hover": {
      backgroundColor: isSelected ? "#8B0000 !important" : "#a91c1c !important",
      color: "#fff !important",
    },
    "&.Mui-selected": {
      backgroundColor: "#8B0000 !important",
      color: "#fff !important",
      "&:hover": {
        backgroundColor: "#8B0000 !important",
        color: "#fff !important",
      },
    },
  });

  return (
    <Box
      sx={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, auto))",
        gap: 1,
      }}
    >
      {/* All button */}
      <ToggleButton
        value="all"
        selected={groupSelected === "all"}
        onChange={(e) => onSelectGroup(e, "all")}
        sx={getButtonSx(groupSelected === "all")}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: "inherit" }}>
          <span>ทั้งหมด ({computedTotalCount})</span>
          {isLoadingCounts && <CircularProgress size={10} color="inherit" />}
        </Box>
      </ToggleButton>

      {/* Group buttons */}
      {sortedGroupList.map((item, index) => (
        <ToggleButton
          key={index}
          value={item.mcg_id}
          selected={groupSelected === item.mcg_id}
          onChange={(e) => onSelectGroup(e, item.mcg_id)}
          sx={getButtonSx(groupSelected === item.mcg_id)}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, fontSize: "inherit" }}>
            <span>
              {item.mcg_name} (
              {hasActiveFilters ? allGroupCounts[item.mcg_id] || 0 : item.customer_group_count || 0}
              )
            </span>
            {isLoadingCounts && <CircularProgress size={8} color="inherit" />}
          </Box>
        </ToggleButton>
      ))}
    </Box>
  );
};

export default FilterGroupDesktop;
