import React from "react";
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  useTheme,
} from "@mui/material";
import {
  FaUser,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaClock,
} from "react-icons/fa";
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import * as dateFnsLocales from "date-fns/locale";
import {
  productionTypeConfig,
  statusConfig,
} from "../../utils/constants";

const MobileCardView = ({
  maxSupplies,
  getDeadlineStatus,
  getDaysUntilDeadline,
  getProductionTypeIcon,
  statusColors,
  statusLabelsWithEmoji,
  productionColors,
  onViewDetail,
  onEditClick,
  onDeleteClick,
}) => {
  const theme = useTheme();

  return (
    <Grid container spacing={2}>
      {maxSupplies.map((item) => {
        const deadlineStatus = getDeadlineStatus(item.expected_completion_date);
        const daysUntilDeadline = getDaysUntilDeadline(
          item.expected_completion_date
        );
        const progressPercentage = item.progress_percentage || 0;

        return (
          <Grid item xs={12} key={item.id}>
            <Card
              sx={{
                position: "relative",
                border:
                  deadlineStatus === "overdue"
                    ? "2px solid #dc2626"
                    : deadlineStatus === "urgent"
                    ? "2px solid #f59e0b"
                    : "none",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: theme.shadows[4],
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              {/* Priority and Status Indicators */}
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  display: "flex",
                  gap: 1,
                  flexDirection: "column",
                }}
              >
                {deadlineStatus === "overdue" && (
                  <Chip
                    icon={<FaExclamationTriangle />}
                    label="เลยกำหนด"
                    color="error"
                    size="small"
                    sx={{ fontSize: "0.7rem" }}
                  />
                )}
                {deadlineStatus === "urgent" && (
                  <Chip
                    icon={<FaClock />}
                    label={`เหลือ ${daysUntilDeadline} วัน`}
                    color="warning"
                    size="small"
                    sx={{ fontSize: "0.7rem" }}
                  />
                )}
                {item.priority === "urgent" && (
                  <Chip
                    label="ด่วน"
                    color="error"
                    size="small"
                    sx={{ fontSize: "0.7rem" }}
                  />
                )}
              </Box>

              <CardContent sx={{ pb: 1 }}>
                {/* Header Section */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                    pr: 6,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                      {item.code}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <FaUser style={{ fontSize: "0.8rem" }} />
                      {item.customer_name || "ไม่ระบุลูกค้า"}
                    </Typography>
                  </Box>
                </Box>

                {/* Status and Production Type Row */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Chip
                    label={statusLabelsWithEmoji[item.status]}
                    sx={{
                      bgcolor: statusColors[item.status],
                      color: "white",
                      fontWeight: "bold",
                    }}
                  />
                  <Chip
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        {getProductionTypeIcon(item.production_type)}
                        {productionTypeConfig[item.production_type]?.label ||
                          item.production_type}
                      </Box>
                    }
                    sx={{
                      bgcolor: productionColors[item.production_type],
                      color: "white",
                    }}
                  />
                </Box>

                {/* Dates Section */}
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <FaCalendarAlt
                      style={{
                        fontSize: "0.8rem",
                        color: theme.palette.primary.main,
                      }}
                    />
                    เริ่ม:{" "}
                    {item.start_date
                      ? format(new Date(item.start_date), "dd/MM/yyyy", {
                          locale: dateFnsLocales.th,
                        })
                      : "ไม่ระบุ"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <ScheduleIcon
                      style={{
                        fontSize: "0.8rem",
                        color: theme.palette.success.main,
                      }}
                    />
                    คาดว่าเสร็จ:{" "}
                    {item.expected_completion_date
                      ? format(
                          new Date(item.expected_completion_date),
                          "dd/MM/yyyy",
                          { locale: dateFnsLocales.th }
                        )
                      : "ไม่ระบุ"}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      color:
                        deadlineStatus === "overdue"
                          ? "error.main"
                          : deadlineStatus === "urgent"
                          ? "warning.main"
                          : "text.secondary",
                    }}
                  >
                    <FaExclamationTriangle style={{ fontSize: "0.8rem" }} />
                    คาดว่าเสร็จ:{" "}
                    {item.expected_completion_date
                      ? format(
                          new Date(item.expected_completion_date),
                          "dd/MM/yyyy",
                          { locale: dateFnsLocales.th }
                        )
                      : "ไม่ระบุ"}
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
                <Button
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => onViewDetail(item.id)}
                  variant="outlined"
                  sx={{ mr: 1 }}
                >
                  ดูรายละเอียด
                </Button>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => onEditClick(item)}
                  variant="outlined"
                  color="primary"
                >
                  แก้ไข
                </Button>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDeleteClick(item)}
                  sx={{ ml: "auto" }}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default MobileCardView;
