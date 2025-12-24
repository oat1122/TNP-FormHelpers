import React from "react";
import { Paper, Typography, Box } from "@mui/material";

/**
 * Personal Stats Card component
 * Displays personal statistics for sales/telesales users
 *
 * @param {Object} props
 * @param {Object} props.summary - Summary data { total_customers }
 * @param {Object} props.comparison - Comparison data { previous }
 */
const PersonalStatsCard = ({ summary, comparison }) => {
  return (
    <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        สถิติของคุณ
      </Typography>
      <Box display="flex" flexDirection="column" gap={2} mt={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography color="text.secondary">ลูกค้าที่เพิ่มในช่วงนี้</Typography>
          <Typography variant="h4" color="primary.main" fontWeight={700}>
            {summary?.total_customers || 0}
          </Typography>
        </Box>
        {comparison?.previous !== null && comparison?.previous !== undefined && (
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography color="text.secondary">ช่วงก่อนหน้า</Typography>
            <Typography variant="h5" color="text.secondary">
              {comparison.previous || 0}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default PersonalStatsCard;
