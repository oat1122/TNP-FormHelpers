import { Search as SearchIcon } from "@mui/icons-material";
import {
  Box,
  TextField,
  InputAdornment,
  Stack,
  FormControlLabel,
  Checkbox,
  Typography,
} from "@mui/material";
import React from "react";

const FilterSection = ({ searchQuery, onSearchChange, showOnlyMine, onOnlyMineChange }) => {
  return (
    <Box
      sx={{
        mb: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1.5, py: 1 }}>
        <TextField
          size="small"
          variant="outlined"
          placeholder="ค้นหาด้วยชื่อบริษัท, หมายเลข PR, หรือชื่องาน"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": { height: 36, fontSize: "0.85rem" },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "action.active" }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Show Only Mine Filter */}
        {onOnlyMineChange && (
          <FormControlLabel
            control={
              <Checkbox
                checked={showOnlyMine || false}
                onChange={(e) => onOnlyMineChange(e.target.checked)}
                color="primary"
                size="small"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: "nowrap" }}>
                แสดงเฉพาะฉัน
              </Typography>
            }
            sx={{ m: 0, pl: 1 }}
          />
        )}
      </Stack>
    </Box>
  );
};

export default FilterSection;
