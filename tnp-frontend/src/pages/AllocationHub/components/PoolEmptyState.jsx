import React from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import { PersonOff as PersonOffIcon } from "@mui/icons-material";

/**
 * PoolEmptyState - Display when no customers are in the pool
 */
const PoolEmptyState = ({ message = "ไม่มีลูกค้าใน Pool ขณะนี้" }) => {
  return (
    <Box textAlign="center" py={8} role="status" aria-live="polite">
      <PersonOffIcon sx={{ fontSize: 80, color: "text.disabled" }} aria-hidden="true" />
      <Typography variant="h6" mt={2} color="text.primary">
        {message}
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={1}>
        เมื่อมีข้อมูลใหม่ จะปรากฏที่นี่
      </Typography>
    </Box>
  );
};

PoolEmptyState.propTypes = {
  message: PropTypes.string,
};

export default PoolEmptyState;
