import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  Skeleton,
  Avatar,
  Chip,
} from "@mui/material";
import {
  NotificationsActive,
  Language,
  Business,
  AssignmentInd,
  DonutLarge,
} from "@mui/icons-material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// ─── Color Palettes ───────────────────────────────────────────────
const RECALL_COLORS = ["#ef5350", "#66bb6a", "#42a5f5"]; // Red, Green, Blue
const SOURCE_COLORS = ["#7c4dff", "#00bfa5", "#ffab00", "#ff6e40", "#448aff"];
const BIZ_COLORS = ["#1e88e5", "#00897b", "#ffb300", "#f4511e", "#8e24aa", "#43a047", "#6d4c41"];
const ALLOC_COLORS = ["#ffa726", "#66bb6a"];

// ─── Tab Config ───────────────────────────────────────────────────
const TAB_CONFIG = [
  { label: "Recall Status", icon: <NotificationsActive fontSize="small" /> },
  { label: "Source", icon: <Language fontSize="small" /> },
  { label: "Business Type", icon: <Business fontSize="small" /> },
  { label: "Allocation", icon: <AssignmentInd fontSize="small" /> },
];

// ─── Custom Tooltip ───────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const { name, value, payload: innerPayload } = payload[0];
  const total = innerPayload?.total || 1;
  const pct = ((value / total) * 100).toFixed(1);
  const color = payload[0].payload?.fill || "#666";

  return (
    <Box
      sx={{
        bgcolor: "white",
        px: 2,
        py: 1.5,
        borderRadius: 2,
        boxShadow: 3,
        border: "1px solid",
        borderColor: "grey.200",
        minWidth: 150,
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            bgcolor: color,
            flexShrink: 0,
          }}
        />
        <Typography variant="body2" fontWeight={600} fontFamily="Kanit">
          {name}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">
        จำนวน: <strong>{value.toLocaleString()}</strong> ({pct}%)
      </Typography>
    </Box>
  );
};

// ─── Tab Panel ────────────────────────────────────────────────────
const TabPanel = ({ children, value, index }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`kpi-tabpanel-${index}`}
    aria-labelledby={`kpi-tab-${index}`}
  >
    {value === index && <Box sx={{ pt: 3, width: "100%" }}>{children}</Box>}
  </div>
);

// ─── Custom Legend Row (MUI Chips) ────────────────────────────────
const ChipLegend = ({ data, colors }) => (
  <Box display="flex" flexWrap="wrap" gap={1} justifyContent="center" sx={{ mt: 2 }}>
    {data.map((entry, i) => (
      <Chip
        key={i}
        size="small"
        label={`${entry.name}  ${entry.value.toLocaleString()}`}
        sx={{
          fontFamily: "Kanit",
          fontWeight: 500,
          fontSize: "0.8rem",
          bgcolor: `${colors[i % colors.length]}18`,
          color: colors[i % colors.length],
          border: `1px solid ${colors[i % colors.length]}40`,
          "& .MuiChip-label": { px: 1.5 },
        }}
        icon={
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: colors[i % colors.length],
              ml: 1,
              flexShrink: 0,
            }}
          />
        }
      />
    ))}
  </Box>
);

// ─── Donut Chart with HTML Center Label ───────────────────────────
const DonutWithCenter = ({ data, colors, total }) => {
  if (total === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={300}>
        <Typography color="text.secondary" fontFamily="Kanit">
          ไม่มีข้อมูลในช่วงเวลานี้
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Chart + center label */}
      <Box sx={{ position: "relative", width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={115}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={600}
            >
              {data.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={colors[i % colors.length]}
                  style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.15))" }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* HTML center label – always exactly in the donut hole */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <Typography
            variant="h4"
            fontWeight={800}
            fontFamily="Kanit"
            lineHeight={1.1}
            color="text.primary"
          >
            {total.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontFamily="Kanit">
            รวมทั้งหมด
          </Typography>
        </Box>
      </Box>

      {/* Custom legend chips below */}
      <ChipLegend data={data} colors={colors} />
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────
const KpiChartsCard = ({
  recallStats = {},
  bySource = [],
  byBusinessType = [],
  byAllocation = [],
  isLoading = false,
}) => {
  const [tabValue, setTabValue] = useState(0);

  // ── Data Preparation ──────────────────────────────────────────
  const prepareData = (items, nameKey, valueKey) =>
    items.map((item) => ({
      name: item[nameKey],
      value: item[valueKey],
    }));

  // Tab 0: Recall
  const recallData = [
    { name: "รอกด Recall (ตกเกณฑ์)", value: recallStats.total_waiting || 0 },
    { name: "อยู่ในเกณฑ์", value: recallStats.total_in_criteria || 0 },
    { name: "กด Recall (ในรอบนี้)", value: recallStats.recalls_made_count || 0 },
  ];

  // Tab 1: Source
  const SOURCE_LABEL_MAP = {
    telesales: "Telesales",
    sales: "Sales",
    online: "Online",
    office: "Office",
  };
  const sourceData = bySource.map((item) => ({
    name: SOURCE_LABEL_MAP[item.source] || item.source,
    value: item.count,
  }));

  // Tab 2: Business Type
  const bizData = prepareData(byBusinessType, "business_type", "count");

  // Tab 3: Allocation
  const allocData = prepareData(byAllocation, "status", "count");

  // Add total to each dataset
  const addTotal = (arr) => {
    const total = arr.reduce((sum, d) => sum + d.value, 0);
    return { data: arr.map((d) => ({ ...d, total })), total };
  };

  const recall = addTotal(recallData);
  const source = addTotal(sourceData);
  const biz = addTotal(bizData);
  const alloc = addTotal(allocData);

  // ── Render ────────────────────────────────────────────────────
  return (
    <Card
      elevation={2}
      sx={{
        mb: 3,
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 4,
        },
      }}
    >
      <CardHeader
        avatar={
          <Avatar
            sx={{
              bgcolor: "#7c4dff20",
              color: "#7c4dff",
              width: 44,
              height: 44,
            }}
          >
            <DonutLarge />
          </Avatar>
        }
        title={
          <Typography variant="h6" fontWeight={600} fontFamily="Kanit">
            สัดส่วนและแนวโน้มลูกค้า
          </Typography>
        }
        subheader="เลือก Tab เพื่อดูข้อมูลแต่ละมุมมอง"
        sx={{ pb: 0 }}
      />

      <CardContent sx={{ pt: 1 }}>
        {/* ── Tabs ── */}
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontFamily: "Kanit",
                fontWeight: 500,
                minHeight: 48,
                fontSize: "0.85rem",
              },
              "& .Mui-selected": {
                fontWeight: 700,
              },
            }}
          >
            {TAB_CONFIG.map((tab, i) => (
              <Tab
                key={i}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                id={`kpi-tab-${i}`}
                aria-controls={`kpi-tabpanel-${i}`}
              />
            ))}
          </Tabs>
        </Box>

        {/* ── Content ── */}
        {isLoading ? (
          <Box
            sx={{
              mt: 4,
              mb: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Skeleton variant="circular" width={230} height={230} />
            <Box display="flex" gap={1}>
              <Skeleton variant="rounded" width={100} height={28} sx={{ borderRadius: 4 }} />
              <Skeleton variant="rounded" width={100} height={28} sx={{ borderRadius: 4 }} />
              <Skeleton variant="rounded" width={100} height={28} sx={{ borderRadius: 4 }} />
            </Box>
          </Box>
        ) : (
          <>
            <TabPanel value={tabValue} index={0}>
              <DonutWithCenter data={recall.data} colors={RECALL_COLORS} total={recall.total} />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <DonutWithCenter data={source.data} colors={SOURCE_COLORS} total={source.total} />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <DonutWithCenter data={biz.data} colors={BIZ_COLORS} total={biz.total} />
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              <DonutWithCenter data={alloc.data} colors={ALLOC_COLORS} total={alloc.total} />
            </TabPanel>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default KpiChartsCard;
