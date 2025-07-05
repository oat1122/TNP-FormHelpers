import { Box, Typography, FormControl, Select, MenuItem } from "@mui/material";

export default function PageSizeSelector({ value, onChange }) {
  const pageSizeOptions = [30, 50, 80, 100];

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="body2" sx={{ color: (theme) => theme.vars.palette.grey.dark }}>
        Rows per page:
      </Typography>
      <FormControl size="small" sx={{ minWidth: 85 }}>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          displayEmpty
          variant="outlined"
          sx={{
            borderRadius: 1,
            backgroundColor: (theme) => theme.vars.palette.grey.outlinedInput,
            ".MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
            ".MuiSelect-select": { py: 0.5, px: 1 },
          }}
        >
          {pageSizeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option} rows
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
