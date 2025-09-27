import React from "react";
import { Box, Container, Typography } from "@mui/material";

const Header = ({
  title = "📊 งานใหม่จากระบบ Pricing",
  subtitle = "เลือกงานที่เสร็จสมบูรณ์แล้วเพื่อสร้างใบเสนอราคา",
}) => {
  return (
    <Box
      sx={{
        bgcolor: "primary.main",
        color: "white",
        py: 3,
        background: "linear-gradient(135deg, #900F0F 0%, #B20000 100%)",
      }}
    >
      <Container maxWidth="xl">
        <Typography variant="h4" component="h1" gutterBottom>
          {title}
        </Typography>
        <Typography variant="subtitle1">{subtitle}</Typography>
      </Container>
    </Box>
  );
};

export default Header;
