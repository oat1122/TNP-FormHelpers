import { Box, LinearProgress, Typography, Chip } from "@mui/material";
import React from "react";

const ProgressIndicator = ({
  current = 0,
  total = 0,
  percentage = 0,
  showNumbers = true,
  showPercentage = true,
  size = "medium",
  variant = "default",
}) => {
  const actualPercentage = percentage || (total > 0 ? (current / total) * 100 : 0);

  const getProgressColor = (percent) => {
    if (percent >= 80) return "success";
    if (percent >= 50) return "warning";
    return "error";
  };

  const getProgressHeight = () => {
    switch (size) {
      case "small":
        return 4;
      case "large":
        return 10;
      default:
        return 6;
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("th-TH").format(num);
  };

  if (variant === "circular") {
    return (
      <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        <Chip
          label={`${Math.round(actualPercentage)}%`}
          color={getProgressColor(actualPercentage)}
          size={size === "large" ? "medium" : "small"}
          sx={{
            fontWeight: "bold",
            minWidth: size === "large" ? 60 : 50,
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {(showNumbers || showPercentage) && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 0.5,
          }}
        >
          {showPercentage && (
            <Typography
              variant={size === "large" ? "h6" : "body2"}
              fontWeight="bold"
              color={`${getProgressColor(actualPercentage)}.main`}
            >
              {Math.round(actualPercentage)}%
            </Typography>
          )}
          {showNumbers && total > 0 && (
            <Typography variant={size === "large" ? "body1" : "caption"} color="text.secondary">
              {formatNumber(current)} / {formatNumber(total)} ชิ้น
            </Typography>
          )}
        </Box>
      )}

      <LinearProgress
        variant="determinate"
        value={actualPercentage}
        color={getProgressColor(actualPercentage)}
        sx={{
          height: getProgressHeight(),
          borderRadius: getProgressHeight() / 2,
          backgroundColor: "rgba(0, 0, 0, 0.1)",
          "& .MuiLinearProgress-bar": {
            borderRadius: getProgressHeight() / 2,
          },
        }}
      />

      {size === "large" && (
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            เริ่ม
          </Typography>
          <Typography variant="caption" color="text.secondary">
            เสร็จสิ้น
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ProgressIndicator;
