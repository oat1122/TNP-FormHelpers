import React from "react";
import { CircularProgress, Box, Select, MenuItem, FormControl } from "@mui/material";

/**
 * FilterGroupMobile - Mobile dropdown สำหรับเลือกกลุ่มลูกค้า
 * ✅ เป็น Presentational Component - รับค่าที่คำนวณแล้วจาก parent
 */
const FilterGroupMobile = ({
  groupSelected,
  onSelectGroup,
  sortedGroupList,
  computedTotalCount, // ✅ รับค่าที่คำนวณแล้ว
  allGroupCounts,
  isLoadingCounts,
  hasActiveFilters,
}) => {
  // MenuItem styling
  const menuItemSx = {
    fontFamily: "Kanit",
    fontSize: "0.875rem",
    color: "#9e0000",
    "&:hover": {
      backgroundColor: "rgba(158, 0, 0, 0.08)",
    },
    "&.Mui-selected": {
      backgroundColor: "rgba(158, 0, 0, 0.12)",
      "&:hover": {
        backgroundColor: "rgba(158, 0, 0, 0.16)",
      },
    },
  };

  return (
    <Box sx={{ width: "100%" }}>
      <FormControl
        fullWidth
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            backgroundColor: "#fffaf9",
            border: "1px solid rgba(158, 0, 0, 0.3)",
            fontFamily: "Kanit",
            fontSize: "0.875rem",
            "&:hover": {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#9e0000",
              },
            },
            "&.Mui-focused": {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#9e0000",
                borderWidth: "2px",
              },
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(158, 0, 0, 0.3)",
            },
          },
          "& .MuiSelect-select": {
            color: "#9e0000",
            fontWeight: 500,
            padding: "10px 14px",
          },
          "& .MuiSelect-icon": {
            color: "#9e0000",
          },
        }}
      >
        <Select
          value={groupSelected}
          onChange={onSelectGroup}
          displayEmpty
          renderValue={(selected) => {
            if (selected === "all") {
              return `ทั้งหมด (${computedTotalCount})`;
            }

            const selectedGroup = sortedGroupList.find((item) => item.mcg_id === selected);
            if (selectedGroup) {
              const count = hasActiveFilters
                ? allGroupCounts[selectedGroup.mcg_id] || 0
                : selectedGroup.customer_group_count || 0;
              return `${selectedGroup.mcg_name} (${count})`;
            }

            return "เลือกกลุ่มลูกค้า";
          }}
        >
          <MenuItem value="all" sx={menuItemSx}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: "100%",
                justifyContent: "space-between",
              }}
            >
              <span>ทั้งหมด</span>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <span>({computedTotalCount})</span>
                {isLoadingCounts && <CircularProgress size={12} sx={{ color: "#9e0000" }} />}
              </Box>
            </Box>
          </MenuItem>

          {sortedGroupList.map((item, index) => (
            <MenuItem key={index} value={item.mcg_id} sx={menuItemSx}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  width: "100%",
                  justifyContent: "space-between",
                }}
              >
                <span>{item.mcg_name}</span>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <span>
                    (
                    {hasActiveFilters
                      ? allGroupCounts[item.mcg_id] || 0
                      : item.customer_group_count || 0}
                    )
                  </span>
                  {isLoadingCounts && <CircularProgress size={12} sx={{ color: "#9e0000" }} />}
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default FilterGroupMobile;
