import React from "react";
import { Box, Paper, Typography, Button } from "@mui/material";

/**
 * Reusable Empty State component with customizable icon, messages, and action
 *
 * @param {Object} props
 * @param {React.ReactElement} props.icon Icon component to display
 * @param {string} props.title Main heading text
 * @param {string} props.description Descriptive text explaining the empty state
 * @param {string} [props.actionLabel] Optional button label
 * @param {Function} [props.onAction] Optional button click handler
 * @param {'info'|'warning'|'error'} [props.severity='info'] Visual severity level
 */
const EmptyState = ({ icon, title, description, actionLabel, onAction, severity = "info" }) => {
  const severityColors = {
    info: {
      bgcolor: "grey.50",
      borderColor: "grey.200",
      iconColor: "grey.400",
    },
    warning: {
      bgcolor: "warning.lighter",
      borderColor: "warning.light",
      iconColor: "warning.main",
    },
    error: {
      bgcolor: "error.lighter",
      borderColor: "error.light",
      iconColor: "error.light",
    },
  };

  const colors = severityColors[severity] || severityColors.info;

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: colors.bgcolor,
        borderRadius: 2,
        border: 1,
        borderColor: colors.borderColor,
      }}
    >
      <Box py={8} px={3} textAlign="center">
        {/* Icon */}
        <Box mb={3}>
          {React.cloneElement(icon, {
            sx: {
              fontSize: 80,
              color: colors.iconColor,
            },
          })}
        </Box>

        {/* Title */}
        <Typography variant="h5" gutterBottom fontWeight={600}>
          {title}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            maxWidth: 500,
            mx: "auto",
            mb: 3,
            lineHeight: 1.8,
          }}
        >
          {description}
        </Typography>

        {/* Optional Action Button */}
        {actionLabel && onAction && (
          <Button
            variant="contained"
            color={severity === "error" ? "error" : "primary"}
            size="large"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default EmptyState;
