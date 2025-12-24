import React from "react";
import {
  Typography,
  Box,
  Checkbox,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Chip,
  Select,
} from "@mui/material";

// Constants - ใช้ colors จาก central config
import { filterColors } from "../../../constants/filterConstants";

/**
 * FilterMultiSelect - Generic multi-select dropdown สำหรับ Filter
 *
 * @param {Array} options - รายการตัวเลือก [{value, label, icon?, color?}]
 * @param {Array} value - รายการที่ถูกเลือก
 * @param {Function} onChange - Callback เมื่อมีการเปลี่ยนแปลง
 * @param {string} placeholder - ข้อความเมื่อยังไม่เลือก
 * @param {number} maxChipsDisplay - จำนวน Chips ที่แสดงสูงสุด (default: 3)
 * @param {string} moreLabel - Label สำหรับแสดงจำนวนที่เหลือ (default: "รายการ")
 */
export const FilterMultiSelect = ({
  options = [],
  value = [],
  onChange,
  placeholder = "เลือกรายการ",
  maxChipsDisplay = 3,
  moreLabel = "รายการ",
}) => {
  // Common menu styling
  const menuProps = {
    PaperProps: {
      style: {
        maxHeight: 48 * 4.5 + 8,
        width: 280,
        borderRadius: 12,
        marginTop: 8,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
      },
    },
    MenuListProps: {
      sx: { padding: 1 },
    },
  };

  // Common select styling - ใช้ filterColors
  const selectSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      border: `1px solid ${filterColors.primaryBorder}`,
      minHeight: "48px",
      fontFamily: "'Kanit', sans-serif",
      "&:hover": {
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: filterColors.border.focus,
        },
      },
      "&.Mui-focused": {
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: filterColors.primary,
          borderWidth: "2px",
        },
      },
    },
    "& .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
    "& .MuiSelect-select": {
      padding: "10px 16px",
      fontSize: "14px",
    },
  };

  // MenuItem styling
  const menuItemSx = {
    borderRadius: 1.5,
    margin: "2px 0",
    minHeight: "44px",
    padding: "8px 12px",
    "&:hover": {
      bgcolor: filterColors.primaryLight,
    },
    "&.Mui-selected": {
      bgcolor: "rgba(148, 12, 12, 0.12)",
      "&:hover": {
        bgcolor: "rgba(148, 12, 12, 0.15)",
      },
    },
  };

  // Checkbox styling
  const checkboxSx = {
    color: "rgba(148, 12, 12, 0.6)",
    "&.Mui-checked": {
      color: filterColors.primary,
    },
    marginRight: 1,
  };

  // Render chip for selected value
  const renderChip = (selectedValue, option) => {
    const Icon = option?.icon;
    const hasCustomColor = option?.color;

    return (
      <Chip
        key={selectedValue}
        icon={Icon ? <Icon style={{ fontSize: "0.8rem" }} /> : undefined}
        label={option?.label || selectedValue}
        size="small"
        sx={{
          bgcolor: hasCustomColor ? option.color : filterColors.primaryLight,
          color: hasCustomColor ? "white" : filterColors.primary,
          fontWeight: 600,
          borderRadius: "6px",
          height: "24px",
          fontSize: "0.75rem",
          "& .MuiChip-icon": {
            color: hasCustomColor ? "white" : filterColors.primary,
            fontSize: "0.8rem",
          },
        }}
      />
    );
  };

  // Render selected values
  const renderValue = (selected) => {
    if (selected.length === 0) {
      return <Typography sx={{ color: "text.secondary" }}>{placeholder}</Typography>;
    }

    const displayItems = selected.slice(0, maxChipsDisplay);
    const remainingCount = selected.length - maxChipsDisplay;

    return (
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {displayItems.map((val) => {
          const option = options.find((opt) => opt.value === val);
          return renderChip(val, option);
        })}
        {remainingCount > 0 && (
          <Chip
            label={`+${remainingCount} ${moreLabel}`}
            size="small"
            sx={{
              bgcolor: "rgba(148, 12, 12, 0.15)",
              color: filterColors.primary,
              fontWeight: 700,
              borderRadius: "6px",
              height: "24px",
              fontSize: "0.75rem",
            }}
          />
        )}
      </Box>
    );
  };

  return (
    <Select
      multiple
      value={value}
      onChange={onChange}
      input={<OutlinedInput />}
      renderValue={renderValue}
      displayEmpty
      MenuProps={menuProps}
      sx={selectSx}
    >
      {options.length > 0 ? (
        options.map((option) => {
          const Icon = option.icon;
          const isSelected = value.indexOf(option.value) > -1;

          return (
            <MenuItem key={option.value} value={option.value} sx={menuItemSx}>
              <Checkbox checked={isSelected} size="small" sx={checkboxSx} />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                {Icon && (
                  <Icon
                    style={{
                      fontSize: "16px",
                      color: isSelected ? filterColors.primary : "inherit",
                    }}
                  />
                )}
                <ListItemText
                  primary={option.label}
                  sx={{
                    "& .MuiTypography-root": {
                      fontFamily: "'Kanit', sans-serif",
                      fontSize: "14px",
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? filterColors.primary : "text.primary",
                    },
                  }}
                />
              </Box>
            </MenuItem>
          );
        })
      ) : (
        <MenuItem disabled>
          <Typography sx={{ color: "text.secondary", fontStyle: "italic" }}>ไม่พบข้อมูล</Typography>
        </MenuItem>
      )}
    </Select>
  );
};

export default FilterMultiSelect;
