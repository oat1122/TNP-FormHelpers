import React from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Skeleton,
  Stack,
  Paper,
} from "@mui/material";
import { MdFilterList, MdSearchOff, MdError } from "react-icons/md";
import { filterColors, filterPanelConfig } from "../constants/filterConstants";
import { animations, transitions } from "../utils/animations";

// Loading skeleton for filter sections
export const FilterSectionSkeleton = ({ showIcon = true }) => (
  <Paper
    elevation={3}
    sx={{
      p: 3.5,
      borderRadius: filterPanelConfig.borderRadius.xlarge,
      height: "100%",
      backgroundColor: filterColors.background.paper,
      border: `1px solid ${filterColors.border.light}`,
      position: "relative",
      overflow: "hidden",
      
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        height: "4px",
        width: "100%",
        background: "linear-gradient(90deg, #e0e0e0 0%, #f5f5f5 100%)",
        borderRadius: `${filterPanelConfig.borderRadius.xlarge}px ${filterPanelConfig.borderRadius.xlarge}px 0 0`,
      },
    }}
  >
    <Stack spacing={2.5}>
      {/* Header skeleton */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {showIcon && (
          <Skeleton
            variant="circular"
            width={48}
            height={48}
            sx={{ 
              bgcolor: "rgba(148, 12, 12, 0.1)",
              ...animations.pulse,
            }}
          />
        )}
        <Box sx={{ flex: 1 }}>
          <Skeleton
            variant="text"
            width="60%"
            height={28}
            sx={{ bgcolor: "rgba(0, 0, 0, 0.1)" }}
          />
          <Skeleton
            variant="text"
            width="80%"
            height={20}
            sx={{ mt: 0.5, bgcolor: "rgba(0, 0, 0, 0.08)" }}
          />
        </Box>
      </Box>

      {/* Content skeleton */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: filterPanelConfig.borderRadius.large,
          backgroundColor: filterColors.background.elevated,
          border: `1px solid ${filterColors.border.light}`,
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height={48}
          sx={{ 
            borderRadius: 1.5,
            bgcolor: "rgba(0, 0, 0, 0.08)",
            mb: 2,
          }}
        />
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              width={80 + (i * 10)}
              height={32}
              sx={{ 
                borderRadius: 1,
                bgcolor: "rgba(0, 0, 0, 0.06)",
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Status skeleton */}
      <Skeleton
        variant="rounded"
        width="100%"
        height={36}
        sx={{ 
          borderRadius: 2,
          bgcolor: "rgba(0, 0, 0, 0.05)",
        }}
      />
    </Stack>
  </Paper>
);

// Loading state for filter panel
export const FilterPanelLoading = () => (
  <Box
    sx={{
      mb: 3,
      ...animations.fadeIn,
    }}
  >
    <Paper
      elevation={3}
      sx={{
        borderRadius: filterPanelConfig.borderRadius.xlarge,
        overflow: "hidden",
        border: `1px solid ${filterColors.border.light}`,
      }}
    >
      {/* Header loading */}
      <Box
        sx={{
          p: 2.5,
          backgroundColor: filterColors.background.elevated,
          borderBottom: `1px solid ${filterColors.border.light}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ bgcolor: "rgba(148, 12, 12, 0.2)" }}
            />
            <Box sx={{ flex: 1 }}>
              <Skeleton
                variant="text"
                width="50%"
                height={24}
                sx={{ bgcolor: "rgba(0, 0, 0, 0.1)" }}
              />
              <Skeleton
                variant="text"
                width="70%"
                height={16}
                sx={{ mt: 0.5, bgcolor: "rgba(0, 0, 0, 0.08)" }}
              />
            </Box>
          </Box>
          <Skeleton
            variant="rounded"
            width={120}
            height={28}
            sx={{ borderRadius: 2, bgcolor: "rgba(148, 12, 12, 0.1)" }}
          />
        </Box>
      </Box>

      {/* Content loading indicator */}
      <Box
        sx={{
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          backgroundColor: filterColors.background.section,
        }}
      >
        <CircularProgress
          size={40}
          thickness={4}
          sx={{
            color: filterColors.primary,
            ...animations.spin,
          }}
        />
        <Typography
          variant="body2"
          sx={{
            color: filterColors.text.secondary,
            fontWeight: 500,
            ...animations.pulse,
          }}
        >
          กำลังโหลดตัวกรอง...
        </Typography>
      </Box>
    </Paper>
  </Box>
);

// Empty state for no results
export const EmptyFilterState = ({ 
  title = "ไม่พบข้อมูล", 
  description = "ลองปรับเงื่อนไขการค้นหาใหม่อีกครั้ง",
  icon: Icon = MdSearchOff,
  action,
}) => (
  <Box
    sx={{
      textAlign: "center",
      py: 6,
      px: 3,
      ...animations.fadeIn,
    }}
  >
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 80,
        height: 80,
        borderRadius: "50%",
        backgroundColor: filterColors.primaryLight,
        border: `2px solid ${filterColors.border.light}`,
        mb: 3,
        ...animations.bounce,
      }}
    >
      <Icon
        style={{
          fontSize: 36,
          color: filterColors.primary,
        }}
      />
    </Box>
    
    <Typography
      variant="h6"
      sx={{
        color: filterColors.text.primary,
        fontWeight: 600,
        mb: 1,
        fontSize: { xs: "1.1rem", sm: "1.25rem" },
      }}
    >
      {title}
    </Typography>
    
    <Typography
      variant="body2"
      sx={{
        color: filterColors.text.secondary,
        mb: action ? 3 : 0,
        maxWidth: 400,
        mx: "auto",
        lineHeight: 1.5,
      }}
    >
      {description}
    </Typography>
    
    {action && (
      <Box sx={{ mt: 2 }}>
        {action}
      </Box>
    )}
  </Box>
);

// Error state for filter operations
export const FilterErrorState = ({ 
  error = "เกิดข้อผิดพลาดในการโหลดข้อมูล",
  onRetry,
}) => (
  <Box
    sx={{
      textAlign: "center",
      py: 4,
      px: 3,
      backgroundColor: filterColors.errorLight,
      border: `1px solid ${filterColors.error}`,
      borderRadius: filterPanelConfig.borderRadius.large,
      ...animations.shake,
    }}
  >
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 60,
        height: 60,
        borderRadius: "50%",
        backgroundColor: "rgba(211, 47, 47, 0.1)",
        border: `2px solid ${filterColors.error}`,
        mb: 2,
      }}
    >
      <MdError
        style={{
          fontSize: 28,
          color: filterColors.error,
        }}
      />
    </Box>
    
    <Typography
      variant="body1"
      sx={{
        color: filterColors.error,
        fontWeight: 600,
        mb: 2,
      }}
    >
      {error}
    </Typography>
    
    {onRetry && (
      <Box
        component="button"
        onClick={onRetry}
        sx={{
          px: 3,
          py: 1,
          backgroundColor: filterColors.error,
          color: "#ffffff",
          border: "none",
          borderRadius: filterPanelConfig.borderRadius.medium,
          fontWeight: 600,
          cursor: "pointer",
          transition: transitions.smooth,
          
          "&:hover": {
            backgroundColor: filterColors.primaryHover,
            transform: "translateY(-1px)",
          },
        }}
      >
        ลองอีกครั้ง
      </Box>
    )}
  </Box>
);

// Compact loading indicator for in-line loading
export const InlineLoader = ({ 
  size = 20, 
  text = "กำลังโหลด...",
  color = filterColors.primary,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      color: filterColors.text.secondary,
      fontSize: "0.875rem",
      fontWeight: 500,
    }}
  >
    <CircularProgress 
      size={size} 
      thickness={4}
      sx={{ 
        color,
        ...animations.spin,
      }} 
    />
    <span>{text}</span>
  </Box>
);

// Filter section loading wrapper
export const FilterSectionLoader = ({ 
  loading, 
  error, 
  empty, 
  children,
  emptyProps = {},
  errorProps = {},
}) => {
  if (loading) return <FilterSectionSkeleton />;
  if (error) return <FilterErrorState {...errorProps} />;
  if (empty) return <EmptyFilterState {...emptyProps} />;
  return children;
};

export default {
  FilterSectionSkeleton,
  FilterPanelLoading,
  EmptyFilterState,
  FilterErrorState,
  InlineLoader,
  FilterSectionLoader,
}; 