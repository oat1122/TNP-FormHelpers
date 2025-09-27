import React from "react";
import { Box, Container, Typography, useMediaQuery, useTheme } from "@mui/material";
import { MdAssignment } from "react-icons/md";

const HeaderSection = ({ mode, PRIMARY_RED, SECONDARY_RED }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        px: 2,
        py: 3,
        background: `linear-gradient(135deg, ${PRIMARY_RED} 0%, ${SECONDARY_RED} 100%)`,
        color: "white",
        borderRadius: { xs: 0, sm: "0 0 16px 16px" },
        mb: { xs: 0, sm: 2 },
      }}
    >
      <Container maxWidth="md">
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <MdAssignment size={32} />
          <Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} fontFamily="Kanit">
              ข้อมูลที่อยู่
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }} fontFamily="Kanit">
              {mode === "view"
                ? "ดูข้อมูลที่อยู่"
                : "กรอกข้อมูลที่อยู่และใช้ GPS ช่วยเติมอัตโนมัติ"}
            </Typography>
          </Box>
        </Box>

        {/* Progress indicator for mobile */}
        {isMobile && mode !== "view" && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              ขั้นตอนที่ 2 จาก 3
            </Typography>
            <Box
              sx={{
                height: 4,
                bgcolor: "rgba(255,255,255,0.3)",
                borderRadius: 2,
                mt: 0.5,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: "66.66%",
                  height: "100%",
                  bgcolor: "white",
                  borderRadius: 2,
                }}
              />
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default HeaderSection;
