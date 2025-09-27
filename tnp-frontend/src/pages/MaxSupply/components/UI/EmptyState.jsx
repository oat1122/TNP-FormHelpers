import React from "react";
import { Box, Typography, Button, useTheme } from "@mui/material";
import { FaPlus } from "react-icons/fa";
import { Assignment as AssignmentIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const EmptyState = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        textAlign: "center",
      }}
    >
      <AssignmentIcon
        sx={{
          fontSize: 80,
          color: theme.palette.grey[400],
          mb: 2,
        }}
      />
      <Typography variant="h5" color="text.secondary" gutterBottom>
        ไม่พบงานที่ตรงกับเงื่อนไข
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        ลองปรับเงื่อนไขการค้นหาหรือสร้างงานใหม่
      </Typography>
      <Button
        variant="contained"
        startIcon={<FaPlus />}
        onClick={() => navigate("/max-supply/create")}
        sx={{
          background: "linear-gradient(45deg, #B20000, #E36264)",
          "&:hover": {
            background: "linear-gradient(45deg, #900F0F, #B20000)",
          },
        }}
      >
        สร้างงานใหม่
      </Button>
    </Box>
  );
};

export default EmptyState;
