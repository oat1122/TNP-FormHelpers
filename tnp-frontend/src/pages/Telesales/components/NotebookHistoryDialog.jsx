import { Close as CloseIcon, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Stack,
  CircularProgress,
  List,
  ListItem,
  Divider,
  Collapse,
  Select,
  MenuItem,
} from "@mui/material";
import dayjs from "dayjs";
import React, { useState, useMemo } from "react";

import { useGetNotebookKpiDetailsQuery } from "../../../features/Customer/customerApi";

const NotebookHistoryDialog = ({
  open,
  onClose,
  userId,
  userName,
  periodFilter,
  sourceFilter,
  actionFilter,
}) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const {
    data: detailsData,
    isLoading,
    isFetching,
  } = useGetNotebookKpiDetailsQuery(
    {
      period: periodFilter?.mode,
      start_date: periodFilter?.startDate,
      end_date: periodFilter?.endDate,
      source_filter: sourceFilter,
      nb_status: statusFilter,
      user_id: userId,
    },
    { skip: !open || !userId }
  );

  const histories = useMemo(() => detailsData?.data || [], [detailsData]);

  const groupedHistories = useMemo(() => {
    const groups = {};
    const filteredHistories = actionFilter
      ? histories.filter((h) => h.action_type === actionFilter)
      : histories;

    filteredHistories.forEach((h) => {
      const key = h.notebook_id || h.nb_customer_name || `group-${Math.random()}`;
      if (!groups[key]) {
        groups[key] = {
          customerName: h.nb_customer_name,
          contactNumber: h.nb_contact_number,
          currentInfo: {
            nb_status: h.nb_status,
            nb_additional_info: h.nb_additional_info,
            nb_remarks: h.nb_remarks,
            nb_action: h.nb_action,
            nb_date: h.nb_date,
            nb_time: h.nb_time,
          },
          items: [],
        };
      }
      groups[key].items.push(h);
    });
    return Object.values(groups);
  }, [histories, actionFilter]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          fontFamily: "Kanit",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontFamily: "Kanit", fontWeight: "bold" }}>
          ประวัติการอัพเดท Notebook: {userName}
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{
              fontFamily: "Kanit",
              minWidth: 120,
              bgcolor: "background.paper",
              borderRadius: 1,
            }}
          >
            <MenuItem value="all" sx={{ fontFamily: "Kanit" }}>
              ทั้งหมด
            </MenuItem>
            <MenuItem value="พิจารณา" sx={{ fontFamily: "Kanit" }}>
              พิจารณา
            </MenuItem>
            <MenuItem value="ได้งาน" sx={{ fontFamily: "Kanit" }}>
              ได้งาน
            </MenuItem>
            <MenuItem value="หลุด" sx={{ fontFamily: "Kanit" }}>
              หลุด
            </MenuItem>
            <MenuItem value="ไม่ได้งาน" sx={{ fontFamily: "Kanit" }}>
              ไม่ได้งาน
            </MenuItem>
            <MenuItem value="ยังไม่แผนทำ" sx={{ fontFamily: "Kanit" }}>
              ยังไม่แผนทำ
            </MenuItem>
          </Select>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading || isFetching ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : histories.length === 0 ? (
          <Typography textAlign="center" color="text.secondary" sx={{ py: 4, fontFamily: "Kanit" }}>
            ไม่พบประวัติการอัพเดทข้อมูลสำหรับช่วงเวลานี้
          </Typography>
        ) : (
          <List sx={{ width: "100%", bgcolor: "background.paper", p: 0 }}>
            {groupedHistories.map((group, index) => (
              <React.Fragment key={index}>
                <CustomerHistoryGroup group={group} />
                {index < groupedHistories.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ fontFamily: "Kanit" }}>
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default NotebookHistoryDialog;

// --- Sub-components ---

const KEY_LABELS = {
  nb_date: "วันที่",
  nb_time: "เวลา",
  nb_customer_name: "ชื่อลูกค้า",
  nb_is_online: "Online",
  nb_additional_info: "ข้อมูลเพิ่มเติม",
  nb_contact_number: "เบอร์ติดต่อ",
  nb_email: "อีเมล",
  nb_contact_person: "ผู้ติดต่อ",
  nb_action: "สิ่งที่ต้องไป",
  nb_status: "สถานะ",
  nb_remarks: "หมายเหตุ",
  nb_manage_by: "ผู้ดูแล",
  converted_at: "วันที่เปลี่ยนสถานะ",
  is_online: "Online",
};

const CustomerHistoryGroup = ({ group }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <ListItem sx={{ flexDirection: "column", alignItems: "flex-start", py: 2 }}>
      {/* Customer Context & Toggle Button */}
      <Box mb={1} width="100%" display="flex" justifyContent="space-between" alignItems="center">
        <Typography
          variant="subtitle2"
          sx={{ fontFamily: "Kanit", fontWeight: "bold", color: "primary.main" }}
        >
          ลูกค้า: {group.customerName || "ไม่ระบุชื่อ"}
          {group.contactNumber ? ` (${group.contactNumber})` : ""}
          <Typography
            component="span"
            variant="subtitle2"
            color="text.secondary"
            sx={{ ml: 1, fontFamily: "Kanit" }}
          >
            ({group.items.length} รายการ)
          </Typography>
        </Typography>
        <Button
          size="small"
          onClick={() => setExpanded(!expanded)}
          endIcon={expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          sx={{ fontFamily: "Kanit", textTransform: "none", borderRadius: 2 }}
          variant="outlined"
        >
          {expanded ? "ซ่อนเนื้อหา" : "โชว์รายละเอียด"}
        </Button>
      </Box>

      {/* History Items */}
      <Collapse in={expanded} sx={{ width: "100%" }}>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          {/* Current Notebook Data */}
          <Box
            sx={{
              p: 1.5,
              bgcolor: "#e3f2fd",
              borderRadius: 1,
              width: "100%",
              border: "1px solid #90caf9",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              <Typography
                variant="caption"
                color="primary.main"
                sx={{ fontFamily: "Kanit", fontWeight: "bold" }}
              >
                {group.currentInfo.nb_date
                  ? dayjs(group.currentInfo.nb_date).format("DD MMM YYYY") +
                    (group.currentInfo.nb_time ? ` ${group.currentInfo.nb_time}` : "")
                  : "ไม่มีข้อมูลวันที่"}
              </Typography>
              <Typography
                variant="caption"
                color="primary.main"
                sx={{ fontFamily: "Kanit", fontWeight: "bold" }}
              >
                · ข้อมูลปัจจุบัน
              </Typography>
            </Stack>
            <Stack spacing={0.5} mt={0.5}>
              {["nb_status", "nb_action", "nb_additional_info", "nb_remarks"].map((key) => {
                if (group.currentInfo[key]) {
                  return (
                    <Typography
                      key={key}
                      variant="body2"
                      sx={{ fontFamily: "Kanit", color: "text.primary" }}
                    >
                      {KEY_LABELS[key] || key}: {group.currentInfo[key]}
                    </Typography>
                  );
                }
                return null;
              })}
            </Stack>
          </Box>

          {/* History log */}
          {group.items.map((history) => {
            // Parse changes
            const changes = [];
            if (history.action_type === "updated" && history.new_values) {
              try {
                const newVals =
                  typeof history.new_values === "string"
                    ? JSON.parse(history.new_values)
                    : history.new_values;
                Object.entries(newVals).forEach(([key, val]) => {
                  // Ignore metadata updates that users don't care about
                  if (
                    ["updated_by", "created_by", "nb_date", "nb_time", "converted_at"].includes(key)
                  ) {
                    return;
                  }

                  // Use Thai label if available
                  const label = KEY_LABELS[key] || key;
                  changes.push(`${label}: ${val || "-"}`);
                });
              } catch {
                // Ignore parse errors
              }
            }

            return (
              <Box
                key={history.history_id}
                sx={{ p: 1.5, bgcolor: "#f8f9fa", borderRadius: 1, width: "100%" }}
              >
                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
                    {dayjs(history.created_at).format("DD MMM YYYY HH:mm")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
                    · {history.action_type === "created" ? "เพิ่มข้อมูลใหม่" : "อัพเดท"}
                  </Typography>
                </Stack>

                {history.action_type === "created" ? (
                  <Typography variant="body2" sx={{ fontFamily: "Kanit", whiteSpace: "pre-wrap" }}>
                    สร้างข้อมูล Notebook ใหม่
                  </Typography>
                ) : (
                  <Stack spacing={0.5} mt={0.5}>
                    {changes.length > 0 ? (
                      changes.map((change, idx) => (
                        <Typography
                          key={idx}
                          variant="body2"
                          sx={{
                            fontFamily: "Kanit",
                            color: "text.primary",
                          }}
                        >
                          {change}
                        </Typography>
                      ))
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "Kanit",
                          color: "text.primary",
                        }}
                      >
                        อัพเดทข้อมูลทั่วไป
                      </Typography>
                    )}
                  </Stack>
                )}
              </Box>
            );
          })}
        </Stack>
      </Collapse>
    </ListItem>
  );
};
