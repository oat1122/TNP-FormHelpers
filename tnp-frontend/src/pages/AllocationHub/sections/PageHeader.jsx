import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, IconButton } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";

/**
 * PageHeader - Header section with title and refresh button
 */
const PageHeader = ({ title, onRefresh, isRefreshing = false }) => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
      <Typography variant="h4" component="h1" fontWeight="bold" aria-label={title}>
        {title}
      </Typography>
      <IconButton
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label="รีเฟรชข้อมูล"
        color="primary"
      >
        <RefreshIcon />
      </IconButton>
    </Box>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  onRefresh: PropTypes.func.isRequired,
  isRefreshing: PropTypes.bool,
};

export default PageHeader;
