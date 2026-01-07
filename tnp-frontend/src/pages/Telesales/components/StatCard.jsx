import React from "react";
import { Card, CardContent, Box, Avatar, Typography, Skeleton } from "@mui/material";
import { TrendingUp } from "@mui/icons-material";

/**
 * Stat Card component for displaying KPI metrics
 *
 * @param {Object} props
 * @param {React.ReactElement} props.icon Icon to display in avatar
 * @param {string} props.label Card label/title
 * @param {number|string} props.value Main metric value
 * @param {string} [props.trend] Optional trend text (e.g., "+5 จากเมื่อวาน")
 * @param {string} props.color Primary color for avatar and value
 * @param {boolean} props.loading Whether to show loading skeleton
 */
const StatCard = ({ icon, label, value, trend, color, loading }) => {
  return (
    <Card
      elevation={2}
      sx={{
        height: "100%",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        {loading ? (
          // Loading skeleton
          <Box display="flex" gap={2} alignItems="center">
            <Skeleton variant="circular" width={56} height={56} />
            <Box flex={1}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="80%" height={40} sx={{ mt: 0.5 }} />
              <Skeleton variant="text" width="50%" height={16} sx={{ mt: 0.5 }} />
            </Box>
          </Box>
        ) : (
          // Content
          <Box display="flex" justifyContent="space-between" alignItems="center">
            {/* Avatar Icon */}
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: `${color}20`,
                color: color,
              }}
            >
              {icon}
            </Avatar>

            {/* Text Content */}
            <Box flex={1} ml={2}>
              <Typography
                variant="body2"
                color="text.secondary"
                gutterBottom
                textTransform="uppercase"
                letterSpacing={0.5}
                fontSize="0.75rem"
              >
                {label}
              </Typography>

              <Typography variant="h4" fontWeight="bold" color={color}>
                {value !== undefined && value !== null
                  ? typeof value === "number"
                    ? value.toLocaleString()
                    : value
                  : "-"}
              </Typography>

              {trend && (
                <Typography
                  variant="caption"
                  color="success.main"
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  mt={0.5}
                >
                  <TrendingUp fontSize="small" />
                  {trend}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
