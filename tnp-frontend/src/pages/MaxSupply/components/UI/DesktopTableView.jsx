import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  TableSortLabel,
  useTheme,
} from "@mui/material";
import {
  FaUser,
  FaExclamationTriangle,
  FaClock,
} from "react-icons/fa";
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import * as dateFnsLocales from "date-fns/locale";
import {
  productionTypeConfig,
  statusConfig,
  priorityConfig,
} from "../../utils/constants";

const DesktopTableView = ({
  maxSupplies,
  sortBy,
  sortOrder,
  onSort,
  getDeadlineStatus,
  getDaysUntilDeadline,
  getProductionTypeIcon,
  statusColors,
  statusLabels,
  productionColors,
  priorityLabels,
  priorityColors,
  onViewDetail,
  onEditClick,
  onDeleteClick,
}) => {
  const theme = useTheme();

  return (
    <TableContainer component={Paper} sx={{ boxShadow: theme.shadows[2] }}>
      <Table>
        <TableHead sx={{ bgcolor: theme.palette.grey[50] }}>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={sortBy === "code"}
                direction={sortBy === "code" ? sortOrder : "asc"}
                onClick={() => onSort("code")}
              >
                รหัส
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === "title"}
                direction={sortBy === "title" ? sortOrder : "asc"}
                onClick={() => onSort("title")}
              >
                ชื่องาน / ลูกค้า
              </TableSortLabel>
            </TableCell>
            <TableCell>ประเภท</TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === "status"}
                direction={sortBy === "status" ? sortOrder : "asc"}
                onClick={() => onSort("status")}
              >
                สถานะ
              </TableSortLabel>
            </TableCell>
            <TableCell>ความสำคัญ</TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === "start_date"}
                direction={sortBy === "start_date" ? sortOrder : "asc"}
                onClick={() => onSort("start_date")}
              >
                วันที่เริ่ม
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === "expected_completion_date"}
                direction={
                  sortBy === "expected_completion_date" ? sortOrder : "asc"
                }
                onClick={() => onSort("expected_completion_date")}
              >
                คาดว่าเสร็จ
              </TableSortLabel>
            </TableCell>
            <TableCell align="center">จัดการ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {maxSupplies.map((item) => {
            const deadlineStatus = getDeadlineStatus(
              item.expected_completion_date
            );
            const daysUntilDeadline = getDaysUntilDeadline(
              item.expected_completion_date
            );
            const progressPercentage = item.progress_percentage || 0;

            return (
              <TableRow
                key={item.id}
                hover
                sx={{
                  backgroundColor:
                    deadlineStatus === "overdue"
                      ? "#fef2f2"
                      : deadlineStatus === "urgent"
                      ? "#fffbeb"
                      : "inherit",
                  borderLeft:
                    deadlineStatus === "overdue"
                      ? "4px solid #dc2626"
                      : deadlineStatus === "urgent"
                      ? "4px solid #f59e0b"
                      : "none",
                }}
              >
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {item.code}
                    </Typography>
                    {item.priority === "urgent" && (
                      <Chip
                        label="ด่วน"
                        size="small"
                        color="error"
                        sx={{ fontSize: "0.7rem" }}
                      />
                    )}
                  </Box>
                </TableCell>

                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {item.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <FaUser style={{ fontSize: "0.7rem" }} />
                      {item.customer_name || "ไม่ระบุลูกค้า"}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Chip
                    label={
                      productionTypeConfig[item.production_type]?.label ||
                      item.production_type
                    }
                    size="small"
                    sx={{
                      bgcolor: productionColors[item.production_type],
                      color: "white",
                    }}
                  />
                </TableCell>

                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={statusLabels[item.status]}
                      size="small"
                      sx={{
                        bgcolor: statusColors[item.status],
                        color: "white",
                      }}
                    />
                    {deadlineStatus === "overdue" && (
                      <Tooltip title="เลยกำหนดแล้ว">
                        <FaExclamationTriangle
                          style={{ color: "#dc2626", fontSize: "0.9rem" }}
                        />
                      </Tooltip>
                    )}
                    {deadlineStatus === "urgent" && (
                      <Tooltip title={`เหลือ ${daysUntilDeadline} วัน`}>
                        <FaClock
                          style={{ color: "#f59e0b", fontSize: "0.9rem" }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>

                <TableCell>
                  <Chip
                    label={priorityLabels[item.priority] || item.priority}
                    size="small"
                    sx={{
                      bgcolor: priorityColors[item.priority] || "#6b7280",
                      color: "white",
                    }}
                  />
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {item.start_date
                      ? format(new Date(item.start_date), "dd/MM/yyyy", {
                          locale: dateFnsLocales.th,
                        })
                      : "ไม่ระบุ"}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color:
                          deadlineStatus === "overdue"
                            ? "error.main"
                            : deadlineStatus === "urgent"
                            ? "warning.main"
                            : "text.primary",
                      }}
                    >
                      {item.expected_completion_date
                        ? format(
                            new Date(item.expected_completion_date),
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
                </TableCell>

                <TableCell align="center">
                  <Box
                    sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}
                  >
                    <Tooltip title="ดูรายละเอียด">
                      <IconButton
                        size="small"
                        onClick={() => onViewDetail(item.id)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="แก้ไข">
                      <IconButton
                        size="small"
                        onClick={() => onEditClick(item)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="ลบ">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeleteClick(item)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DesktopTableView;
