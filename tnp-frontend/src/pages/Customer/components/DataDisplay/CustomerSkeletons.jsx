import React from "react";
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Grid,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

// Shimmer animation for enhanced skeleton effect
const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

// Fade in animation for stagger effect
const fadeInUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Enhanced Skeleton with shimmer
const ShimmerSkeleton = styled(Skeleton)(({ theme }) => ({
  "&::after": {
    background: `linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    )`,
    animation: `${shimmer} 1.5s infinite`,
  },
}));

// Container with stagger animation
const StaggerContainer = styled(Box)(({ delay = 0 }) => ({
  animation: `${fadeInUp} 0.4s ease-out forwards`,
  animationDelay: `${delay}s`,
  opacity: 0,
}));

/**
 * CustomerCardSkeleton - Skeleton สำหรับ Customer Card บน Mobile/Tablet
 * @param {number} delay - Animation delay in seconds for stagger effect
 */
export const CustomerCardSkeleton = ({ delay = 0 }) => {
  const theme = useTheme();

  return (
    <StaggerContainer delay={delay}>
      <Card
        sx={{
          mb: 2,
          boxShadow: 2,
          borderRadius: 3,
          borderLeft: `4px solid ${theme.palette.grey[300]}`,
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          {/* Header - Avatar, Name, Actions */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {/* Avatar */}
              <ShimmerSkeleton variant="circular" width={48} height={48} animation="wave" />
              {/* Name and Channel */}
              <Box>
                <ShimmerSkeleton variant="text" width={140} height={24} animation="wave" />
                <ShimmerSkeleton
                  variant="rounded"
                  width={70}
                  height={22}
                  animation="wave"
                  sx={{ mt: 0.5, borderRadius: "12px" }}
                />
              </Box>
            </Box>
            {/* Action buttons */}
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <ShimmerSkeleton variant="circular" width={32} height={32} animation="wave" />
              <ShimmerSkeleton variant="circular" width={32} height={32} animation="wave" />
            </Box>
          </Box>

          <Divider sx={{ my: 1.5, borderColor: theme.palette.grey[200] }} />

          {/* Info Section */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {/* Phone */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ShimmerSkeleton variant="circular" width={20} height={20} animation="wave" />
              <ShimmerSkeleton variant="text" width="45%" height={20} animation="wave" />
            </Box>
            {/* Address */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ShimmerSkeleton variant="circular" width={20} height={20} animation="wave" />
              <ShimmerSkeleton variant="text" width="75%" height={20} animation="wave" />
            </Box>
            {/* Recall Date */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ShimmerSkeleton variant="circular" width={20} height={20} animation="wave" />
              <ShimmerSkeleton variant="text" width="55%" height={20} animation="wave" />
            </Box>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              mt: 2,
              pt: 1,
              borderTop: `1px solid ${theme.palette.grey[100]}`,
            }}
          >
            <ShimmerSkeleton variant="text" width={100} height={16} animation="wave" />
          </Box>
        </CardContent>
      </Card>
    </StaggerContainer>
  );
};

/**
 * CustomerTableRowSkeleton - Skeleton สำหรับ DataGrid row บน Desktop
 * @param {number} delay - Animation delay in seconds for stagger effect
 */
export const CustomerTableRowSkeleton = ({ delay = 0 }) => {
  const theme = useTheme();

  return (
    <StaggerContainer delay={delay}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 1.5,
          backgroundColor: theme.palette.grey[50],
          borderRadius: 2,
          mb: 1,
          height: 60,
        }}
      >
        {/* Customer Name */}
        <Box sx={{ flex: 2, px: 1 }}>
          <ShimmerSkeleton variant="text" width="70%" height={22} animation="wave" />
        </Box>
        {/* Channel */}
        <Box sx={{ flex: 1, px: 1, display: "flex", justifyContent: "center" }}>
          <ShimmerSkeleton
            variant="rounded"
            width={60}
            height={24}
            animation="wave"
            sx={{ borderRadius: "12px" }}
          />
        </Box>
        {/* Phone */}
        <Box sx={{ flex: 1.5, px: 1 }}>
          <ShimmerSkeleton variant="text" width="80%" height={20} animation="wave" />
        </Box>
        {/* Province */}
        <Box sx={{ flex: 1, px: 1 }}>
          <ShimmerSkeleton variant="text" width="60%" height={20} animation="wave" />
        </Box>
        {/* Recall Date */}
        <Box sx={{ flex: 1, px: 1 }}>
          <ShimmerSkeleton variant="text" width="70%" height={20} animation="wave" />
        </Box>
        {/* Actions */}
        <Box sx={{ flex: 1, px: 1, display: "flex", justifyContent: "center", gap: 0.5 }}>
          <ShimmerSkeleton variant="circular" width={28} height={28} animation="wave" />
          <ShimmerSkeleton variant="circular" width={28} height={28} animation="wave" />
          <ShimmerSkeleton variant="circular" width={28} height={28} animation="wave" />
        </Box>
      </Box>
    </StaggerContainer>
  );
};

/**
 * CustomerTableSkeleton - Table skeleton สำหรับ Desktop view
 * @param {number} rows - จำนวน rows ที่จะแสดง
 */
export const CustomerTableSkeleton = ({ rows = 10 }) => {
  const theme = useTheme();

  return (
    <Box sx={{ width: "100%" }}>
      {/* Table Header Skeleton */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 1.5,
          backgroundColor: theme.palette.error.dark,
          borderRadius: 2,
          mb: 1.5,
          height: 50,
        }}
      >
        <Box sx={{ flex: 2, px: 1 }}>
          <Skeleton
            variant="text"
            width="40%"
            height={20}
            sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
          />
        </Box>
        <Box sx={{ flex: 1, px: 1, display: "flex", justifyContent: "center" }}>
          <Skeleton
            variant="text"
            width="50%"
            height={20}
            sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
          />
        </Box>
        <Box sx={{ flex: 1.5, px: 1 }}>
          <Skeleton
            variant="text"
            width="45%"
            height={20}
            sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
          />
        </Box>
        <Box sx={{ flex: 1, px: 1 }}>
          <Skeleton
            variant="text"
            width="50%"
            height={20}
            sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
          />
        </Box>
        <Box sx={{ flex: 1, px: 1 }}>
          <Skeleton
            variant="text"
            width="55%"
            height={20}
            sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
          />
        </Box>
        <Box sx={{ flex: 1, px: 1, display: "flex", justifyContent: "center" }}>
          <Skeleton
            variant="text"
            width="40%"
            height={20}
            sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
          />
        </Box>
      </Box>

      {/* Table Rows Skeleton */}
      {Array.from({ length: rows }).map((_, index) => (
        <CustomerTableRowSkeleton key={`row-skeleton-${index}`} delay={index * 0.05} />
      ))}
    </Box>
  );
};

/**
 * CustomerCardListSkeleton - Card list skeleton สำหรับ Mobile/Tablet view
 * @param {number} count - จำนวน cards ที่จะแสดง
 * @param {boolean} isTablet - Flag สำหรับ tablet layout (2 columns)
 */
export const CustomerCardListSkeleton = ({ count = 6, isTablet = false }) => {
  return (
    <Box sx={{ px: { xs: 1, sm: 2 }, py: 2 }}>
      {/* Summary skeleton */}
      <Box sx={{ mb: 2, px: 1 }}>
        <ShimmerSkeleton variant="text" width={180} height={20} animation="wave" />
      </Box>

      {/* Cards Grid */}
      <Grid container spacing={{ xs: 1, sm: 2 }}>
        {Array.from({ length: count }).map((_, index) => (
          <Grid item xs={12} sm={isTablet ? 6 : 12} key={`card-skeleton-${index}`}>
            <CustomerCardSkeleton delay={index * 0.1} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

/**
 * CustomerListSkeleton - Responsive skeleton ที่เลือก Card หรือ Table ตาม screen size
 * @param {number} count - จำนวน items ที่จะแสดง
 */
export const CustomerListSkeleton = ({ count = 10 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  if (isMobile || isTablet) {
    return <CustomerCardListSkeleton count={count} isTablet={isTablet} />;
  }

  return <CustomerTableSkeleton rows={count} />;
};

export default {
  CustomerCardSkeleton,
  CustomerTableRowSkeleton,
  CustomerTableSkeleton,
  CustomerCardListSkeleton,
  CustomerListSkeleton,
};
