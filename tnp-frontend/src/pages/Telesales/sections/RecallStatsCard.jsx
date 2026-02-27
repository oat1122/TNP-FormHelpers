import { Grid, Paper, Typography, Box, Skeleton, CardActionArea } from "@mui/material";
import {
  NotificationsActive as WaitingIcon,
  CheckCircle as InCriteriaIcon,
  Update as RecentrecallIcon,
} from "@mui/icons-material";

/**
 * Recall Stats Card
 * Displays KPI regarding customer recall status
 *
 * @param {Object} props
 * @param {Object} props.stats - Stats object { total_waiting, total_in_criteria, recalls_made_count }
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.onCardClick - Click handler passing the recall type ('waiting', 'in_criteria', 'made')
 */
const RecallStatsCard = ({ stats = {}, isLoading = false, onCardClick }) => {
  const { total_waiting = 0, total_in_criteria = 0, recalls_made_count = 0 } = stats || {};

  const items = [
    {
      type: "waiting",
      label: "รอกด Recall (ตกเกณฑ์)",
      value: total_waiting,
      color: "error",
      icon: <WaitingIcon fontSize="large" color="error" />,
      bgColor: "#ffebee",
    },
    {
      type: "in_criteria",
      label: "อยู่ในเกณฑ์",
      value: total_in_criteria,
      color: "success",
      icon: <InCriteriaIcon fontSize="large" color="success" />,
      bgColor: "#e8f5e9",
    },
    {
      type: "made",
      label: "กด Recall (ในรอบนี้)",
      value: recalls_made_count,
      color: "info",
      icon: <RecentrecallIcon fontSize="large" color="info" />,
      bgColor: "#e3f2fd",
    },
  ];

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom fontWeight={600} fontFamily="Kanit">
        สถานะการติดตามลูกค้า (Recall Status)
      </Typography>

      <Grid container spacing={2}>
        {items.map((item, index) => (
          <Grid item xs={12} md={4} key={index}>
            <CardActionArea
              onClick={() => onCardClick && onCardClick(item.type)}
              sx={{ borderRadius: 2 }}
            >
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: item.bgColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: 100, // Fixed height for consistency
                }}
              >
                <Box sx={{ width: "100%" }}>
                  <Typography variant="body2" color="text.secondary" fontFamily="Kanit">
                    {item.label}
                  </Typography>
                  {isLoading ? (
                    <Skeleton variant="text" width="60%" height={60} />
                  ) : (
                    <Typography variant="h4" fontWeight={700} color={item.color + ".main"}>
                      {item.value.toLocaleString()}
                    </Typography>
                  )}
                </Box>
                {item.icon}
              </Box>
            </CardActionArea>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default RecallStatsCard;
