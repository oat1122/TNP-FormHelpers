import React from "react";
import { Box, Card, CardContent, Skeleton, Grid, Stack } from "@mui/material";

/**
 * Dashboard Stats Card Skeleton
 */
export const DashboardStatsCardSkeleton = () => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Skeleton variant="text" width={80} height={40} />
          <Skeleton variant="text" width={120} height={24} />
          <Skeleton variant="text" width={100} height={16} />
        </Box>
        <Skeleton variant="circular" width={48} height={48} />
      </Box>
    </CardContent>
  </Card>
);

/**
 * Dashboard Stats Grid Skeleton
 */
export const DashboardStatsGridSkeleton = () => (
  <Grid container spacing={3}>
    {[1, 2, 3, 4].map((item) => (
      <Grid item xs={12} sm={6} md={3} key={item}>
        <DashboardStatsCardSkeleton />
      </Grid>
    ))}
  </Grid>
);

/**
 * Activity List Skeleton
 */
export const ActivityListSkeleton = ({ count = 5 }) => (
  <Stack spacing={2}>
    {Array.from({ length: count }).map((_, index) => (
      <Box
        key={index}
        display="flex"
        alignItems="center"
        gap={2}
        p={2}
        sx={{
          borderRadius: 1,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
        }}
      >
        <Skeleton variant="circular" width={40} height={40} />
        <Box flex={1}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={16} />
        </Box>
        <Skeleton variant="text" width={80} height={16} />
      </Box>
    ))}
  </Stack>
);

/**
 * Pricing Request Card Skeleton
 */
export const PricingRequestCardSkeleton = () => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Skeleton variant="circular" width={48} height={48} />
          <Box>
            <Skeleton variant="text" width={150} height={24} />
            <Skeleton variant="text" width={100} height={16} />
          </Box>
        </Box>
        <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
      </Box>

      {/* Content */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Skeleton variant="text" width="40%" height={16} />
          <Skeleton variant="text" width="80%" height={20} />
          <Skeleton variant="text" width="60%" height={16} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Skeleton variant="text" width={80} height={16} />
            <Skeleton variant="text" width={100} height={24} />
          </Box>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box display="flex" gap={1} mt={2}>
        <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1 }} />
      </Box>
    </CardContent>
  </Card>
);

/**
 * Pricing Request List Skeleton
 */
export const PricingRequestListSkeleton = ({ count = 3 }) => (
  <Stack spacing={2}>
    {Array.from({ length: count }).map((_, index) => (
      <PricingRequestCardSkeleton key={index} />
    ))}
  </Stack>
);

/**
 * Table Skeleton
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <Box>
    {/* Table Header */}
    <Box
      display="flex"
      p={2}
      sx={{
        bgcolor: "grey.50",
        borderRadius: "4px 4px 0 0",
        border: 1,
        borderColor: "divider",
      }}
    >
      {Array.from({ length: columns }).map((_, index) => (
        <Box key={index} flex={1} mr={index < columns - 1 ? 2 : 0}>
          <Skeleton variant="text" width="60%" height={20} />
        </Box>
      ))}
    </Box>

    {/* Table Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Box
        key={rowIndex}
        display="flex"
        p={2}
        sx={{
          borderLeft: 1,
          borderRight: 1,
          borderBottom: 1,
          borderColor: "divider",
          "&:hover": { bgcolor: "grey.25" },
        }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Box key={colIndex} flex={1} mr={colIndex < columns - 1 ? 2 : 0}>
            <Skeleton variant="text" width={colIndex === 0 ? "80%" : "60%"} height={16} />
          </Box>
        ))}
      </Box>
    ))}
  </Box>
);

/**
 * Form Skeleton
 */
export const FormSkeleton = () => (
  <Box p={3}>
    <Skeleton variant="text" width="30%" height={24} sx={{ mb: 3 }} />

    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Skeleton variant="text" width="40%" height={16} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <Skeleton variant="text" width="40%" height={16} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
      </Grid>
      <Grid item xs={12}>
        <Skeleton variant="text" width="40%" height={16} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: 1 }} />
      </Grid>
    </Grid>

    <Box display="flex" gap={2} mt={4}>
      <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
      <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
    </Box>
  </Box>
);

/**
 * Notification Skeleton
 */
export const NotificationSkeleton = ({ count = 3 }) => (
  <Stack spacing={1}>
    {Array.from({ length: count }).map((_, index) => (
      <Box key={index} display="flex" alignItems="center" gap={2} p={1}>
        <Skeleton variant="circular" width={8} height={8} />
        <Box flex={1}>
          <Skeleton variant="text" width="70%" height={16} />
          <Skeleton variant="text" width="40%" height={12} />
        </Box>
        <Skeleton variant="text" width={60} height={12} />
      </Box>
    ))}
  </Stack>
);

/**
 * Generic List Skeleton
 */
export const ListSkeleton = ({ count = 5, showAvatar = false, showActions = false }) => (
  <Stack spacing={1}>
    {Array.from({ length: count }).map((_, index) => (
      <Box
        key={index}
        display="flex"
        alignItems="center"
        gap={2}
        p={2}
        sx={{
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
        }}
      >
        {showAvatar && <Skeleton variant="circular" width={40} height={40} />}
        <Box flex={1}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={16} />
        </Box>
        {showActions && (
          <Box display="flex" gap={1}>
            <Skeleton variant="rectangular" width={32} height={32} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={32} height={32} sx={{ borderRadius: 1 }} />
          </Box>
        )}
      </Box>
    ))}
  </Stack>
);

/**
 * Page Loading Skeleton
 */
export const PageLoadingSkeleton = () => (
  <Box>
    {/* Page Header */}
    <Box mb={4}>
      <Skeleton variant="text" width="30%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="60%" height={20} />
    </Box>

    {/* Stats Grid */}
    <Box mb={4}>
      <DashboardStatsGridSkeleton />
    </Box>

    {/* Content Area */}
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <PricingRequestListSkeleton />
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
            <ActivityListSkeleton count={3} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);
