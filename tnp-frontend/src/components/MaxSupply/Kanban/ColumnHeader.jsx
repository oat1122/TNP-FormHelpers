import React from "react";
import { Box, Typography, Button, Badge } from "@mui/material";
import { Add } from "@mui/icons-material";

const ColumnHeader = ({ column }) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      mb={2}
      p={1.5}
      sx={{
        bgcolor: column.color,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box display="flex" alignItems="center">
        {column.icon}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ ml: 1 }}>
          {column.title}
        </Typography>
        <Badge badgeContent={column.count} color="primary" sx={{ ml: 1 }} />
      </Box>
      <Button size="small" startIcon={<Add />} variant="text">
        <Add fontSize="small" />
      </Button>
    </Box>
  );
};

export default ColumnHeader;
