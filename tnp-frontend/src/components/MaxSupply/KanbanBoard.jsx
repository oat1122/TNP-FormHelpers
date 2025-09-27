import { Add, Assignment } from "@mui/icons-material";
import { Box, Typography, Button, Grid } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { KanbanColumn, ContextMenu, DeleteDialog } from "./Kanban";
import {
  createColumnsWithCounts,
  getJobsByStatus,
  PRODUCTION_TYPES,
  PRIORITY_COLORS,
} from "./Kanban/kanbanUtils";

const KanbanBoard = ({ maxSupplies = [], onStatusChange, onDeleteJob, loading = false }) => {
  const navigate = useNavigate();
  const [deleteDialog, setDeleteDialog] = useState({ open: false, job: null });
  const [menuAnchor, setMenuAnchor] = useState({ element: null, job: null });
  const [draggedJob, setDraggedJob] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Create columns with counts
  const columns = createColumnsWithCounts(maxSupplies);

  const handleMenuClick = (event, job) => {
    setMenuAnchor({ element: event.currentTarget, job });
  };

  const handleMenuClose = () => {
    setMenuAnchor({ element: null, job: null });
  };

  const handleStatusChange = (job, newStatus) => {
    if (onStatusChange) {
      onStatusChange(job.id, newStatus);
    }
    handleMenuClose();
  };

  const handleDeleteClick = (job) => {
    setDeleteDialog({ open: true, job });
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.job && onDeleteJob) {
      onDeleteJob(deleteDialog.job.id);
    }
    setDeleteDialog({ open: false, job: null });
  };

  // Drag and Drop handlers
  const handleDragStart = (e, job) => {
    setDraggedJob(job);
    e.dataTransfer.setData("text/plain", job.id);
    e.dataTransfer.effectAllowed = "move";

    // Add ghost image effect
    const dragImage = e.target.cloneNode(true);
    dragImage.style.transform = "rotate(5deg)";
    dragImage.style.opacity = "0.8";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = (e) => {
    setDraggedJob(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e) => {
    // Only clear if leaving the column container, not child elements
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedJob && draggedJob.status !== newStatus) {
      if (onStatusChange) {
        onStatusChange(draggedJob.id, newStatus);
      }
    }
    setDraggedJob(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading jobs...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            <Assignment sx={{ mr: 1, verticalAlign: "middle" }} />
            Job Manager
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            ลากและวางการ์ดงานเพื่อเปลี่ยนสถานะ หรือคลิกปุ่ม ⋮ เพื่อจัดการ
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/max-supply/create")}
        >
          เพิ่มงานใหม่
        </Button>
      </Box>

      {/* Kanban Board */}
      <Grid container spacing={3}>
        {columns.map((column) => {
          const isDropTarget = dragOverColumn === column.id;
          const canDrop = draggedJob && draggedJob.status !== column.id;
          const columnJobs = getJobsByStatus(maxSupplies, column.id);

          return (
            <Grid item xs={12} md={4} key={column.id}>
              <KanbanColumn
                column={column}
                jobs={columnJobs}
                productionTypes={PRODUCTION_TYPES}
                priorityColors={PRIORITY_COLORS}
                onMenuClick={handleMenuClick}
                draggedJobId={draggedJob?.id}
                isDragOver={isDropTarget}
                canDrop={canDrop}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            </Grid>
          );
        })}
      </Grid>

      {/* Context Menu */}
      <ContextMenu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={handleMenuClose}
        job={menuAnchor.job}
        onStatusChange={handleStatusChange}
        onDeleteClick={handleDeleteClick}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, job: null })}
        job={deleteDialog.job}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
};

export default KanbanBoard;
