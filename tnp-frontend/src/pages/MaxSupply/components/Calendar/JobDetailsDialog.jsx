import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Chip,
  Grid,
  Card,
  Divider,
  Alert,
  IconButton,
  useTheme,
  useMediaQuery,
  Fade,
} from "@mui/material";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Work as WorkIcon,
} from "@mui/icons-material";
import { productionTypeConfig, statusConfig, priorityConfig } from "../../utils/constants";
import {
  formatDate,
  formatShortDate,
  calculateDuration,
  formatDuration,
  isOverdue,
} from "../../utils/dateFormatters";
import ProductionTypeIcon from "../ProductionTypeIcon";

const JobDetailsDialog = ({ open, onClose, selectedJob, onJobEdit, onJobDelete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (!selectedJob) return null;

  const typeConfig =
    productionTypeConfig[selectedJob.production_type] || productionTypeConfig.screen;
  const statusInfo = statusConfig[selectedJob.status] || statusConfig.pending;
  const priorityInfo = priorityConfig[selectedJob.priority] || priorityConfig.normal;
  const endDateForDuration = selectedJob.expected_completion_date || selectedJob.due_date;
  const duration = calculateDuration(selectedJob.start_date, endDateForDuration);

  const handleJobEdit = () => {
    onJobEdit(selectedJob);
    onClose();
  };

  const handleJobDelete = () => {
    if (window.confirm(`คุณต้องการลบงาน "${selectedJob.title}" หรือไม่?`)) {
      onJobDelete(selectedJob.id);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          boxShadow: isMobile ? "none" : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        },
      }}
    >
      {/* Header with accent color */}
      <Box
        sx={{
          background: typeConfig.gradient,
          color: "white",
          position: "relative",
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "white",
            pb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                width: 56,
                height: 56,
              }}
            >
              <ProductionTypeIcon type={selectedJob.production_type} size={24} color="white" />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ color: "white" }}>
                {selectedJob.title || "งานไม่ระบุชื่อ"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, color: "white" }}>
                {typeConfig.label}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {/* Status and Priority Badges */}
        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
          <Chip
            label={statusInfo.label}
            sx={{
              bgcolor: statusInfo.bgColor,
              color: statusInfo.color,
              fontWeight: 600,
            }}
          />
          <Chip
            label={`ความสำคัญ: ${priorityInfo.label}`}
            sx={{
              bgcolor: `${priorityInfo.color}20`,
              color: priorityInfo.color,
              fontWeight: 600,
            }}
          />
        </Box>

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <PersonIcon color="primary" />
                ข้อมูลพื้นฐาน
              </Typography>
              <Box sx={{ space: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    ลูกค้า:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {selectedJob.customer_name || "ไม่ระบุ"}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    จำนวน:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {selectedJob.total_quantity || 0} ตัว
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    ประเภทเสื้อ:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {selectedJob.shirt_type || "ไม่ระบุ"}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Timeline Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <EventIcon color="primary" />
                ระยะเวลา
              </Typography>
              <Box sx={{ space: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    วันที่เริ่ม:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatDate(selectedJob.start_date)}
                  </Typography>
                </Box>
                {selectedJob.expected_completion_date && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      วันที่คาดว่าเสร็จ:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatDate(selectedJob.expected_completion_date)}
                    </Typography>
                  </Box>
                )}
                {selectedJob.due_date && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      วันครบกำหนด:
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      color={isOverdue(selectedJob.due_date) ? "error.main" : "text.primary"}
                    >
                      {formatDate(selectedJob.due_date)}
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    ระยะเวลา:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color={typeConfig.color}>
                    {formatDuration(duration)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: typeConfig.lightColor,
                    borderRadius: 1,
                    border: `1px solid ${typeConfig.color}30`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    การแสดงผลบนปฏิทิน
                  </Typography>
                  <Typography variant="body2" sx={{ color: typeConfig.color, fontWeight: "bold" }}>
                    {typeConfig.icon} Timeline bar ข้ามจาก {formatShortDate(selectedJob.start_date)}{" "}
                    ถึง{" "}
                    {formatShortDate(selectedJob.expected_completion_date || selectedJob.due_date)}
                  </Typography>
                  {selectedJob.due_date &&
                    selectedJob.expected_completion_date &&
                    selectedJob.due_date !== selectedJob.expected_completion_date && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 1, color: "text.secondary" }}
                      >
                        ⚠️ วันครบกำหนด: {formatShortDate(selectedJob.due_date)}
                      </Typography>
                    )}
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Work Calculations */}
          {selectedJob.work_calculations && (
            <Grid item xs={12}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <WorkIcon color="primary" />
                รายละเอียดการผลิต
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(selectedJob.work_calculations).map(([type, data]) => {
                  const typeConf = productionTypeConfig[type] || productionTypeConfig.screen;
                  return (
                    <Grid item xs={12} md={6} key={type}>
                      <Card
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: typeConf.bgColor,
                          borderColor: typeConf.color,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          sx={{ mb: 1, color: typeConf.color }}
                        >
                          {typeConf.icon} {typeConf.label}
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary">
                              จุดพิมพ์
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {data.points || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary">
                              จำนวน
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {data.total_quantity || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary">
                              รวมงาน
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color={typeConf.color}>
                              {data.total_work || 0}
                            </Typography>
                          </Grid>
                        </Grid>
                        {data.description && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              mt: 1,
                              display: "block",
                              fontStyle: "italic",
                            }}
                          >
                            {data.description}
                          </Typography>
                        )}
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          )}

          {/* Notes */}
          {(selectedJob.notes || selectedJob.special_instructions) && (
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                📝 หมายเหตุ
              </Typography>
              {selectedJob.notes && (
                <Alert severity="info" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    <strong>หมายเหตุทั่วไป:</strong> {selectedJob.notes}
                  </Typography>
                </Alert>
              )}
              {selectedJob.special_instructions && (
                <Alert severity="warning">
                  <Typography variant="body2">
                    <strong>คำแนะนำพิเศษ:</strong> {selectedJob.special_instructions}
                  </Typography>
                </Alert>
              )}
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          onClick={handleJobEdit}
          variant="contained"
          startIcon={<EditIcon />}
          sx={{
            background: typeConfig.gradient,
            "&:hover": { opacity: 0.9 },
          }}
        >
          แก้ไข
        </Button>
        <Button
          onClick={handleJobDelete}
          variant="outlined"
          startIcon={<DeleteIcon />}
          color="error"
        >
          ลบ
        </Button>
        <Button onClick={onClose} variant="outlined">
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JobDetailsDialog;
