import { Business as BusinessIcon, Close as CloseIcon } from "@mui/icons-material";
import { Avatar, Box, DialogTitle, IconButton, Tooltip, Typography } from "@mui/material";

import { tokens } from "../../../../../shared/styles/tokens";

const DialogHeaderBar = ({ customerName, onClose }) => (
  <DialogTitle sx={{ p: 2 }}>
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Box display="flex" alignItems="center" gap={1.5}>
        <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
          <BusinessIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            สร้างใบเสนอราคา
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {customerName}
          </Typography>
        </Box>
      </Box>
      <Tooltip title="ปิด">
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Tooltip>
    </Box>
  </DialogTitle>
);

export default DialogHeaderBar;
