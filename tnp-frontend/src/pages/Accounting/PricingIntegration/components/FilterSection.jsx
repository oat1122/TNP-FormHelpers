import { Search as SearchIcon } from "@mui/icons-material";
import { Box, TextField, InputAdornment, Stack } from "@mui/material";
import React from "react";

const FilterSection = ({ searchQuery, onSearchChange }) => {
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
      </Stack>
    </Box>
  );
};

export default FilterSection;
