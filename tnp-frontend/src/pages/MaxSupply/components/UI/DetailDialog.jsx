import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Avatar,
  Grid,
  Paper,
  Stack,
  Divider,
  LinearProgress,
  useTheme,
} from "@mui/material";
import {
  FaUser,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import * as dateFnsLocales from "date-fns/locale";
import {
  productionTypeConfig,
  statusConfig,
  priorityConfig,
} from "../../utils/constants";

const DetailDialog = ({
  open,
  onClose,
  selectedItem,
  getDeadlineStatus,
  getDaysUntilDeadline,
  getProgressColor,
  getProductionTypeIcon,
  statusColors,
  statusLabels,
  productionColors,
  priorityLabels,
  priorityColors,
  onEditClick,
}) => {
  const theme = useTheme();

  if (!selectedItem) return null;

  const deadlineStatus = getDeadlineStatus(
    selectedItem.expected_completion_date
  );
  const daysUntilDeadline = getDaysUntilDeadline(
    selectedItem.expected_completion_date
  );
  const progressPercentage = selectedItem.progress_percentage || 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: productionColors[selectedItem.production_type],
                width: 40,
                height: 40,
              }}
            >
              {getProductionTypeIcon(selectedItem.production_type)}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {selectedItem.code}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedItem.title}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Status and Progress Overview */}
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: theme.palette.grey[50],
            borderRadius: 1,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <Chip
                label={statusLabels[selectedItem.status]}
                sx={{
                  bgcolor: statusColors[selectedItem.status],
                  color: "white",
                  width: "100%",
                  fontWeight: "bold",
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Chip
                label={
                  productionTypeConfig[selectedItem.production_type]?.label ||
                  selectedItem.production_type
                }
                sx={{
                  bgcolor: productionColors[selectedItem.production_type],
                  color: "white",
                  width: "100%",
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Chip
                label={priorityLabels[selectedItem.priority]}
                sx={{
                  bgcolor: priorityColors[selectedItem.priority] || "#6b7280",
                  color: "white",
                  width: "100%",
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              {deadlineStatus === "overdue" && (
                <Chip
                  icon={<FaExclamationTriangle />}
                  label="เลยกำหนด"
                  color="error"
                  sx={{ width: "100%" }}
                />
              )}
              {deadlineStatus === "urgent" && (
                <Chip
                  icon={<FaClock />}
                  label={`เหลือ ${daysUntilDeadline} วัน`}
                  color="warning"
                  sx={{ width: "100%" }}
                />
              )}
              {deadlineStatus === "normal" && (
                <Chip
                  icon={<FaCheckCircle />}
                  label="ปกติ"
                  color="success"
                  sx={{ width: "100%" }}
                />
              )}
            </Grid>
          </Grid>
        </Box>

        {/* Progress Section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <TrendingUpIcon color="primary" />
            ความคืบหน้า
          </Typography>
          <Box
            sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography
                variant="h4"
                fontWeight="bold"
                color={getProgressColor(progressPercentage)}
              >
                {progressPercentage}%
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {selectedItem.completed_quantity || 0} /{" "}
                {selectedItem.total_quantity || 0} ชิ้น
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              color={getProgressColor(progressPercentage)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <AssignmentIcon color="primary" />
                ข้อมูลพื้นฐาน
              </Typography>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    รหัสงาน
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedItem.code}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    ชื่องาน
                  </Typography>
                  <Typography variant="body1">
                    {selectedItem.title}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    ลูกค้า
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <FaUser style={{ fontSize: "0.8rem" }} />
                    {selectedItem.customer_name || "ไม่ระบุลูกค้า"}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    จำนวนทั้งหมด
                  </Typography>
                  <Typography variant="body1">
                    {selectedItem.total_quantity || 0} ชิ้น
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Schedule Information */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <ScheduleIcon color="primary" />
                กำหนดการ
              </Typography>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    วันที่เริ่ม
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <FaCalendarAlt
                      style={{
                        fontSize: "0.8rem",
                        color: theme.palette.primary.main,
                      }}
                    />
                    {selectedItem.start_date
                      ? format(
                          new Date(selectedItem.start_date),
                          "dd/MM/yyyy",
                          { locale: dateFnsLocales.th }
                        )
                      : "ไม่ระบุ"}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    วันที่คาดว่าจะเสร็จ
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      color:
                        deadlineStatus === "overdue"
                          ? "error.main"
                          : deadlineStatus === "urgent"
                          ? "warning.main"
                          : "text.primary",
                    }}
                  >
                    <ScheduleIcon style={{ fontSize: "0.8rem" }} />
                    {selectedItem.expected_completion_date
                      ? format(
                          new Date(selectedItem.expected_completion_date),
                          "dd/MM/yyyy",
                          { locale: dateFnsLocales.th }
                        )
                      : "ไม่ระบุ"}
                  </Typography>
                  {deadlineStatus === "urgent" && (
                    <Typography variant="caption" color="warning.main">
                      เหลือ {daysUntilDeadline} วัน
                    </Typography>
                  )}
                  {deadlineStatus === "overdue" && (
                    <Typography variant="caption" color="error.main">
                      เลย {Math.abs(daysUntilDeadline)} วัน
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Notes Section */}
        {selectedItem.notes && (
          <Box sx={{ mt: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                หมายเหตุ
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {selectedItem.notes}
              </Typography>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          ปิด
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => {
            onClose();
            onEditClick(selectedItem);
          }}
          sx={{
            background: "linear-gradient(45deg, #B20000, #E36264)",
            "&:hover": {
              background: "linear-gradient(45deg, #900F0F, #B20000)",
            },
          }}
        >
          แก้ไข
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetailDialog;
