import { Box, Container, Typography, IconButton, Stack } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import React from "react";
import { useOutletContext } from "react-router-dom";

const Header = ({
  title = "งานใหม่จากระบบ Pricing",
  subtitle = "เลือกงานที่เสร็จสมบูรณ์แล้วเพื่อสร้างใบเสนอราคา",
}) => {
  const context = useOutletContext();
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
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={context?.onMenuClick}
            sx={{ color: "white" }}
          >
            <MenuIcon fontSize="large" />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ color: "white", m: 0 }}>
            {title}
          </Typography>
        </Stack>
        <Typography variant="subtitle1" sx={{ color: "white", ml: 7 }}>
          {subtitle}
        </Typography>
      </Container>
    </Box>
  );
};

export default Header;
