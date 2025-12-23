import React from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { Refresh as RefreshIcon, FileDownload as DownloadIcon } from "@mui/icons-material";

/**
 * Dashboard Header component
 * Displays title, role label, username, and action buttons
 *
 * @param {Object} props
 * @param {string} props.userName - User's display name
 * @param {string} props.roleLabel - Role label (ภาพรวมทีม/ข้อมูลส่วนตัว)
 * @param {Function} props.onExportCsv - CSV export handler
 * @param {Function} props.onRefresh - Refresh data handler
 * @param {boolean} props.isLoading - Loading state
 * @param {boolean} props.isFetching - Fetching state
 * @param {boolean} props.isExporting - Export loading state
 */
const DashboardHeader = ({
  userName,
  roleLabel,
  onExportCsv,
  onRefresh,
  isLoading,
  isFetching,
  isExporting,
}) => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          KPI Dashboard
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip size="small" label={roleLabel} color="primary" variant="outlined" />
          {userName && (
            <Typography variant="caption" color="text.secondary" ml={1}>
              {userName}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Action buttons */}
      <Box display="flex" gap={1}>
        <Button
          variant="outlined"
          startIcon={isExporting ? <CircularProgress size={16} /> : <DownloadIcon />}
          onClick={onExportCsv}
          disabled={isLoading || isFetching || isExporting}
        >
          ส่งออก CSV
        </Button>
        <Tooltip title="รีเฟรชข้อมูล" arrow>
          <IconButton onClick={onRefresh} disabled={isFetching}>
            {isFetching ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default DashboardHeader;
