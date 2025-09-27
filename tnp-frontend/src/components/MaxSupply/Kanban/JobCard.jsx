import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  AvatarGroup,
  Chip,
  IconButton,
  Box,
  Stack,
  Tooltip,
} from "@mui/material";
import { MoreVert, Person, AccessTime } from "@mui/icons-material";
import { format } from "date-fns";
import { th } from "date-fns/locale";

const JobCard = ({
  job,
  productionTypes,
  priorityColors,
  onMenuClick,
  draggedJobId,
  onDragStart,
  onDragEnd,
}) => {
  const productionType = productionTypes[job.production_type] || productionTypes.screen;
  const isDragging = draggedJobId === job.id;

  const formatDate = (dateString) => {
    if (!dateString) return "ไม่ระบุ";
    try {
      return format(new Date(dateString), "dd MMM", { locale: th });
    } catch {
      return "ไม่ระบุ";
    }
  };

  const handleDragStart = (e) => {
    if (onDragStart) {
      onDragStart(e, job);
    }
  };

  const handleDragEnd = (e) => {
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  return (
    <Card
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sx={{
        mb: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        transition: "all 0.2s ease-in-out",
        cursor: "grab",
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? "rotate(5deg)" : "none",
        "&:hover": {
          transform: isDragging ? "rotate(5deg)" : "translateY(-2px)",
          boxShadow: 3,
        },
        "&:active": {
          cursor: "grabbing",
        },
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Tooltip title="ลากเพื่อเปลี่ยนสถานะ" placement="top">
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              sx={{
                fontSize: "0.875rem",
                lineHeight: 1.3,
                flex: 1,
                mr: 1,
              }}
            >
              {job.title || "งานไม่ระบุชื่อ"}
            </Typography>
          </Tooltip>
          <IconButton size="small" onClick={(e) => onMenuClick(e, job)} sx={{ p: 0.5 }}>
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>

        {/* Customer */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: "0.75rem" }}>
          <Person sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />
          {job.customer_name || "ไม่ระบุลูกค้า"}
        </Typography>

        {/* Tags */}
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 1.5 }}>
          {/* Production Type */}
          <Chip
            size="small"
            label={`${productionType.icon} ${productionType.label}`}
            sx={{
              bgcolor: productionType.color + "20",
              color: productionType.color,
              fontSize: "0.65rem",
              height: 20,
              "& .MuiChip-label": { px: 0.5 },
            }}
          />

          {/* Priority */}
          <Chip
            size="small"
            label={job.priority || "normal"}
            sx={{
              bgcolor: priorityColors[job.priority] + "20",
              color: priorityColors[job.priority],
              fontSize: "0.65rem",
              height: 20,
              "& .MuiChip-label": { px: 0.5 },
            }}
          />

          {/* Quantity */}
          {job.total_quantity && (
            <Chip
              size="small"
              label={`${job.total_quantity} ตัว`}
              variant="outlined"
              sx={{
                fontSize: "0.65rem",
                height: 20,
                "& .MuiChip-label": { px: 0.5 },
              }}
            />
          )}
        </Stack>

        {/* Footer */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {/* Due Date */}
          <Box display="flex" alignItems="center">
            <AccessTime sx={{ fontSize: 12, mr: 0.5, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
              {formatDate(job.due_date)}
            </Typography>
          </Box>

          {/* Avatar Group (mock data for now) */}
          <AvatarGroup
            max={3}
            sx={{ "& .MuiAvatar-root": { width: 20, height: 20, fontSize: "0.7rem" } }}
          >
            <Avatar sx={{ bgcolor: productionType.color }}>
              {(job.customer_name || "U").charAt(0).toUpperCase()}
            </Avatar>
            {job.total_quantity > 100 && (
              <Avatar sx={{ bgcolor: "#f59e0b" }}>{Math.floor(job.total_quantity / 100)}</Avatar>
            )}
          </AvatarGroup>
        </Box>

        {/* Progress indicator */}
        {job.status === "in_progress" && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
              กำลังดำเนินการ...
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default JobCard;
