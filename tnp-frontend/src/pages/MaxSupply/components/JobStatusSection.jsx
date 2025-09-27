import { Circle } from "@mui/icons-material";
import { Paper, Typography, Button, List, ListItem, Box, Skeleton } from "@mui/material";
import React from "react";

const JobStatusSection = ({ statistics, loading }) => {
  // Map statistics to display data
  const statusData = [
    {
      key: "pending",
      label: "กำลังรอ",
      color: "#F59E0B",
      count: statistics.pending || 0,
    },
    {
      key: "in_progress",
      label: "กำลังผลิต",
      color: "#3B82F6",
      count: statistics.in_progress || 0,
    },
    {
      key: "completed",
      label: "เสร็จสิ้น",
      color: "#10B981",
      count: statistics.completed || 0,
    },
  ];

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Job statuses
      </Typography>
      <Button variant="text" size="small" sx={{ color: "text.secondary", mb: 2 }}>
        Clear all
      </Button>

      <List dense>
        {loading
          ? // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <ListItem key={index} sx={{ px: 0, display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                  <Skeleton variant="circular" width={12} height={12} />
                  <Skeleton variant="text" width="60%" />
                </Box>
                <Skeleton variant="text" width="20%" />
              </ListItem>
            ))
          : statusData.map((status) => (
              <ListItem
                key={status.key}
                sx={{ px: 0, display: "flex", alignItems: "center", gap: 1 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                  <Circle sx={{ fontSize: "0.8rem", color: status.color }} />
                  <Typography variant="body2">{status.label}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  ({status.count})
                </Typography>
              </ListItem>
            ))}
      </List>
    </Paper>
  );
};

export default JobStatusSection;
