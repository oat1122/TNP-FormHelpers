import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import ColumnHeader from "./ColumnHeader";
import JobCard from "./JobCard";

const KanbanColumn = ({
  column,
  jobs,
  productionTypes,
  priorityColors,
  onMenuClick,
  draggedJobId,
  isDragOver,
  canDrop,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
}) => {
  return (
    <Paper
      elevation={isDragOver ? 4 : 1}
      sx={{
        p: 2,
        bgcolor: isDragOver && canDrop ? column.color : "grey.50",
        minHeight: "70vh",
        transition: "all 0.3s ease-in-out",
        border: isDragOver && canDrop ? "2px solid" : "1px solid transparent",
        borderColor: isDragOver && canDrop ? "primary.main" : "transparent",
      }}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <ColumnHeader column={column} />

      <Box
        sx={{
          minHeight: "60vh",
          position: "relative",
        }}
      >
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            productionTypes={productionTypes}
            priorityColors={priorityColors}
            onMenuClick={onMenuClick}
            draggedJobId={draggedJobId}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}

        {jobs.length === 0 && (
          <Box
            textAlign="center"
            py={4}
            sx={{
              border: "2px dashed",
              borderColor: isDragOver && canDrop ? "primary.main" : "divider",
              borderRadius: 2,
              bgcolor: "background.paper",
              transition: "all 0.3s ease-in-out",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {isDragOver && canDrop
                ? `วางงานที่นี่เพื่อเปลี่ยนเป็น ${column.title}`
                : "ไม่มีงานในสถานะนี้"}
            </Typography>
          </Box>
        )}

        {/* Drop zone indicator */}
        {isDragOver && canDrop && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              border: "3px dashed",
              borderColor: "primary.main",
              borderRadius: 2,
              bgcolor: "primary.light",
              opacity: 0.1,
              pointerEvents: "none",
              zIndex: 1000,
            }}
          />
        )}
      </Box>
    </Paper>
  );
};

export default KanbanColumn;
