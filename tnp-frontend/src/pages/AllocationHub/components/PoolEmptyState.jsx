import React from "react";
import { Box, Typography } from "@mui/material";
import { PersonOff as PersonOffIcon } from "@mui/icons-material";

/**
 * PoolEmptyState - Display when no customers are in the pool
 */
const PoolEmptyState = () => {
  return (
    <Box textAlign="center" py={8} role="status" aria-live="polite">
      <PersonOffIcon sx={{ fontSize: 80, color: "text.disabled" }} aria-hidden="true" />
      <Typography variant="h6" mt={2} color="text.primary">
        ไม่มีลูกค้าใน Pool ขณะนี้
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={1}>
        เมื่อ Telesales เพิ่มลูกค้าใหม่ จะปรากฏที่นี่
      </Typography>
    </Box>
  );
};

export default PoolEmptyState;
