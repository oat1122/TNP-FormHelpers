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
} from "@mui/material";

import { PRIMARY_RED, COUNTRY_OPTIONS, SORT_OPTIONS } from "../utils";

/**
 * FilterPanel - Filter controls panel for product list
 */
const FilterPanel = ({
  filters,
  categories,
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
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ fontFamily: "Kanit" }}>หมวดหมู่</InputLabel>
            <Select
              value={filters.category || ""}
              label="หมวดหมู่"
              onChange={(e) => onCategoryChange(e.target.value)}
              sx={{ fontFamily: "Kanit" }}
            >
              <MenuItem value="" sx={{ fontFamily: "Kanit" }}>
                ทั้งหมด
              </MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.mpc_id} value={cat.mpc_id} sx={{ fontFamily: "Kanit" }}>
                  {cat.mpc_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Country Filter */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ fontFamily: "Kanit" }}>ประเทศต้นทาง</InputLabel>
            <Select
              value={filters.country || ""}
              label="ประเทศต้นทาง"
              onChange={(e) => onCountryChange(e.target.value)}
              sx={{ fontFamily: "Kanit" }}
            >
              {COUNTRY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value} sx={{ fontFamily: "Kanit" }}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Sort */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ fontFamily: "Kanit" }}>เรียงตาม</InputLabel>
            <Select
              value={`${filters.sort_by}_${filters.sort_dir}`}
              label="เรียงตาม"
              onChange={(e) => {
                const [field, dir] = e.target.value.split("_");
                onSortChange(field, dir);
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
      {tags.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ fontFamily: "Kanit", mb: 1, display: "block" }}>
            Tags:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {tags.map((tag) => (
              <Chip
                key={tag.spt_id}
                label={tag.spt_name}
                size="small"
                onClick={() => onTagClick(tag.spt_id)}
                color={filters.tags?.includes(tag.spt_id) ? "error" : "default"}
                variant={filters.tags?.includes(tag.spt_id) ? "filled" : "outlined"}
                sx={{ fontFamily: "Kanit", fontSize: 12 }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default FilterPanel;
