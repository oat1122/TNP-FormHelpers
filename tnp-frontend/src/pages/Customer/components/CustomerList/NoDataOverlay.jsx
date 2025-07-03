import React from "react";
import { Box, Typography } from "@mui/material";

function NoDataOverlay() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "gray",
        padding: 5,
        gap: 2,
        backgroundColor: (theme) => `${theme.palette.grey.light}33`,
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          fontSize: 60,
          opacity: 0.5,
          animation: "subtle-pulse 2s infinite ease-in-out",
        }}
      >
        📋
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: "medium" }}>ไม่พบข้อมูลลูกค้า</Typography>
      <Typography variant="body2" sx={{ textAlign: "center", maxWidth: 300, opacity: 0.7 }}>
        ลองใช้ตัวกรองอื่น หรือลองค้นหาด้วยคำสำคัญอื่น
      </Typography>
    </Box>
  );
}

export default NoDataOverlay;
