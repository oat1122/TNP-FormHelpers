import { Chip, Stack, Autocomplete, TextField } from "@mui/material";
import React from "react";

// Constants
import { filterColors } from "../../../constants/filterConstants";

/**
 * Sales Filter Section Component
 * Compact autocomplete for sales selection
 */
const SalesFilterSection = ({
  draftFilters,
  salesList,
  salesOptions,
  selectionHelpers,
  compact = false,
}) => {
  const { handleSalesChange, clearSalesSelection } = selectionHelpers;

  return (
    <Autocomplete
      multiple
      size="small"
      options={salesOptions}
      getOptionLabel={(option) => option.label || option}
      value={salesOptions.filter((opt) => draftFilters.salesName?.includes(opt.value))}
      onChange={(_, newValue) => {
        const values = newValue.map((v) => v.value || v);
        handleSalesChange({ target: { value: values } });
      }}
      renderTags={(value, getTagProps) =>
        value.slice(0, 3).map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option.value}
            label={option.label}
            size="small"
            sx={{
              height: 22,
              fontSize: "0.7rem",
              bgcolor: filterColors.primaryLight,
              color: filterColors.primary,
              "& .MuiChip-deleteIcon": {
                color: filterColors.primary,
                fontSize: "0.9rem",
              },
            }}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={
            draftFilters.salesName?.length > 0
              ? draftFilters.salesName.length > 3
                ? `${draftFilters.salesName.length} คน`
                : ""
              : "เลือกพนักงานขาย..."
          }
          sx={{
            "& .MuiInputBase-root": {
              height: "auto",
              minHeight: 36,
              py: 0.5,
            },
          }}
        />
      )}
      sx={{
        "& .MuiAutocomplete-tag": {
          maxWidth: 100,
        },
      }}
      ListboxProps={{
        sx: { maxHeight: 200 },
      }}
      noOptionsText="ไม่พบข้อมูล"
    />
  );
};

export default SalesFilterSection;
