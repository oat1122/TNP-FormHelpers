import { Box, Chip } from "@mui/material";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useMemo } from "react";

const STATUS_TABS = [
  { value: "all", label: "ทั้งหมด", color: "default" },
  { value: "approved", label: "อนุมัติแล้ว", color: "success" },
  { value: "pending_review", label: "รอตรวจสอบ", color: "warning" },
  { value: "draft", label: "แบบร่าง", color: "default" },
  { value: "completed", label: "เสร็จสิ้น", color: "info" },
  { value: "rejected", label: "ยกเลิก", color: "error" },
];

const STATUS_COLORS = {
  all: "#757575",
  approved: "#2e7d32",
  pending_review: "#ed6c02",
  draft: "#616161",
  completed: "#0288d1",
  rejected: "#c62828",
};

const ReportStatusTabs = ({ value, counts = {}, onChange }) => {
  const tabs = useMemo(() => {
    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    return STATUS_TABS.map((t) => ({
      ...t,
      count: t.value === "all" ? total : (counts[t.value] ?? 0),
    }));
  }, [counts]);

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        borderRadius: "8px 8px 0 0",
        px: 1,
      }}
    >
      <Tabs
        value={value}
        onChange={(_, v) => onChange(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          "& .MuiTab-root": {
            minHeight: 52,
            fontWeight: 500,
            fontSize: "0.875rem",
            textTransform: "none",
          },
          "& .Mui-selected": {
            fontWeight: 700,
          },
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {tab.label}
                <Chip
                  label={tab.count}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    bgcolor: value === tab.value ? STATUS_COLORS[tab.value] : "action.hover",
                    color: value === tab.value ? "white" : "text.secondary",
                  }}
                />
              </Box>
            }
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default ReportStatusTabs;
