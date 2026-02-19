import {
  Card,
  Box,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  TextField,
} from "@mui/material";

import { PRIMARY_RED, COUNTRY_OPTIONS, SORT_OPTIONS } from "../utils";

/**
 * FilterPanel - Filter controls panel for product list
 */
const FilterPanel = ({
  filters,
  categories,
  countries,
  tags,
  hasActiveFilters,
  onCategoryChange,
  onCountryChange,
  onSortChange,
  onTagClick,
  onResetFilters,
}) => {
  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
          ตัวกรอง
        </Typography>
        {hasActiveFilters && (
          <Button
            size="small"
            onClick={onResetFilters}
            sx={{ fontFamily: "Kanit", color: PRIMARY_RED }}
          >
            ล้างตัวกรอง
          </Button>
        )}
      </Box>

      <Grid container spacing={2}>
        {/* Category Filter */}
        {/* Category Filter */}
        <Grid item xs={12} sm={4}>
          <Autocomplete
            fullWidth
            size="small"
            options={categories}
            getOptionLabel={(option) => option.spc_name || ""}
            value={categories.find((c) => c.spc_id === filters.category) || null}
            onChange={(event, newValue) => {
              onCategoryChange(newValue ? newValue.spc_id : "");
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="หมวดหมู่"
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
                InputProps={{
                  ...params.InputProps,
                  style: { fontFamily: "Kanit" },
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props} style={{ fontFamily: "Kanit" }}>
                {option.spc_name}
              </li>
            )}
            sx={{ fontFamily: "Kanit" }}
          />
        </Grid>

        {/* Country Filter */}
        <Grid item xs={12} sm={4}>
          <Autocomplete
            fullWidth
            size="small"
            options={countries || []}
            value={filters.country || null}
            onChange={(event, newValue) => {
              onCountryChange(newValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="ประเทศต้นทาง"
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
                InputProps={{
                  ...params.InputProps,
                  style: { fontFamily: "Kanit" },
                }}
              />
            )}
            sx={{ fontFamily: "Kanit" }}
          />
        </Grid>

        {/* Sort */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ fontFamily: "Kanit" }}>เรียงตาม</InputLabel>
            <Select
              value={`${filters.sort_by}_${filters.sort_dir}`}
              label="เรียงตาม"
              onChange={(e) => {
                const value = e.target.value;
                // Default special case for "created_at"
                if (value === "created_at_desc") {
                  onSortChange("created_at", "desc");
                } else if (value === "created_at_asc") {
                  onSortChange("created_at", "asc");
                } else {
                  // For other fields like sp_name_asc, sp_price_thb_desc
                  // We need to parse correctly based on the utils constants
                  const parts = value.split("_");
                  const dir = parts.pop(); // last part is asc/desc
                  const field = parts.join("_"); // rest is field name
                  onSortChange(field, dir);
                }
              }}
              sx={{ fontFamily: "Kanit" }}
            >
              {SORT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value} sx={{ fontFamily: "Kanit" }}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Tags */}
      {/* Tags Autocomplete */}
      {tags.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Autocomplete
            multiple
            fullWidth
            size="small"
            options={tags}
            disableCloseOnSelect
            getOptionLabel={(option) => option.spt_name}
            value={tags.filter((t) => filters.tags?.includes(t.spt_id)) || []}
            onChange={(event, newValue) => {
              onTagClick(newValue.map((t) => t.spt_id));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder="เลือก Tags..."
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
                InputProps={{
                  ...params.InputProps,
                  style: { fontFamily: "Kanit" },
                }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.spt_id}
                  label={option.spt_name}
                  size="small"
                  sx={{ fontFamily: "Kanit" }}
                />
              ))
            }
            renderOption={(props, option, { selected }) => (
              <li {...props} style={{ fontFamily: "Kanit" }}>
                <Box
                  component="span"
                  sx={{
                    width: 16,
                    height: 16,
                    mr: 2,
                    borderRadius: 0.5,
                    border: "1px solid #ccc",
                    bgcolor: selected ? PRIMARY_RED : "transparent",
                    borderColor: selected ? PRIMARY_RED : "#ccc",
                  }}
                />
                {option.spt_name}
              </li>
            )}
            sx={{ fontFamily: "Kanit" }}
          />
        </Box>
      )}
    </Card>
  );
};

export default FilterPanel;
