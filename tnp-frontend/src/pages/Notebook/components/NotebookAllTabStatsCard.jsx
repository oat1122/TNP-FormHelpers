import {
  Alert,
  Box,
  Card,
  CardContent,
  Grid2 as Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { MdCheckCircle, MdHourglassEmpty, MdPeopleAlt, MdPhoneInTalk } from "react-icons/md";

const CARD_DEFS = [
  {
    key: "total",
    label: "Lead ทั้งหมด",
    helper: "ลูกค้าในคิวกลาง (ตาม filter)",
    color: "#1976d2",
    bg: "#e3f2fd",
    Icon: MdPeopleAlt,
  },
  {
    key: "called",
    label: "โทรไปแล้ว",
    helper: "Sales กรอกสถานะ/follow-up แล้ว",
    color: "#2e7d32",
    bg: "#e8f5e9",
    Icon: MdPhoneInTalk,
  },
  {
    key: "pending",
    label: "รอติดต่อ",
    helper: "Assign แล้วยังไม่อัปเดต",
    color: "#ed6c02",
    bg: "#fff3e0",
    Icon: MdHourglassEmpty,
  },
  {
    key: "converted",
    label: "แปลงเป็นลูกค้า",
    helper: "เปลี่ยนสถานะเป็นลูกค้าสำเร็จ",
    color: "#6a1b9a",
    bg: "#f3e5f5",
    Icon: MdCheckCircle,
  },
];

const formatPercent = (value, total) => {
  if (!total) return null;
  const percent = (value / total) * 100;
  if (!Number.isFinite(percent)) return null;
  return `${percent.toFixed(1)}%`;
};

const NotebookAllTabStatsCard = ({ stats, isLoading, isError }) => {
  if (isError) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        ไม่สามารถโหลดสรุปยอด Lead ทั้งหมดได้
      </Alert>
    );
  }

  const total = stats?.total ?? 0;

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {CARD_DEFS.map(({ key, label, helper, color, bg, Icon }) => {
        const value = stats?.[key] ?? 0;
        const percent = key === "total" ? null : formatPercent(value, total);

        return (
          <Grid key={key} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: bg,
                      color,
                      fontSize: 24,
                      flexShrink: 0,
                    }}
                  >
                    <Icon />
                  </Box>
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {label}
                    </Typography>
                    {isLoading ? (
                      <Skeleton width={80} height={36} />
                    ) : (
                      <Typography
                        variant="h5"
                        component="div"
                        fontWeight={700}
                        sx={{ color, lineHeight: 1.2 }}
                      >
                        {value.toLocaleString("th-TH")}
                        {percent ? (
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{ ml: 1, color: "text.secondary", fontWeight: 400 }}
                          >
                            ({percent})
                          </Typography>
                        ) : null}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {helper}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default NotebookAllTabStatsCard;
