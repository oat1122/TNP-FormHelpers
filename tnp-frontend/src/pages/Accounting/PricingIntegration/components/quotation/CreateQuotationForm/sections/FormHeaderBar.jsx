import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";

import { tokens } from "../../../../../shared/styles/tokens";

const FormHeaderBar = ({ onBack, prItemsCount, manualItemsCount, customerName }) => (
  <Box
    sx={{
      mb: 3,
      display: "flex",
      alignItems: "center",
      gap: 2,
      justifyContent: "space-between",
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Tooltip title="ย้อนกลับ">
        <IconButton
          onClick={onBack}
          size="small"
          sx={{ color: tokens.primary, border: `1px solid ${tokens.primary}` }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>
      <Box>
        <Typography variant="h5" fontWeight={700} color={tokens.primary}>
          สร้างใบเสนอราคา
        </Typography>
        <Typography variant="body2" color="text.secondary">
          จาก {prItemsCount} งาน PR + {manualItemsCount} งานเพิ่มเติม •{" "}
          {customerName || "กำลังโหลด…"}
        </Typography>
      </Box>
    </Box>
  </Box>
);

export default FormHeaderBar;
