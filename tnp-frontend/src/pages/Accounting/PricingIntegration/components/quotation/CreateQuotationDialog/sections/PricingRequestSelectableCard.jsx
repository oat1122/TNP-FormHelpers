import {
  CheckCircleOutline as CheckCircleIcon,
  RadioButtonUnchecked as UncheckIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";

import { tokens } from "../../../../../shared/styles/tokens";

const PricingRequestSelectableCard = ({ item, index, selected, onToggle }) => {
  const handleCardClick = () => {
    if (!item.is_quoted) onToggle(item.pr_id);
  };

  return (
    <Card
      variant="outlined"
      sx={{ mb: 1, opacity: item.is_quoted ? 0.5 : 1 }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box sx={{ flex: 1 }}>
            <Box display="flex" alignItems="center" gap={1.25} mb={1}>
              <Avatar
                sx={{
                  bgcolor: selected ? tokens.primary : tokens.border,
                  color: selected ? tokens.white : tokens.textMuted,
                  width: 28,
                  height: 28,
                }}
              >
                {index + 1}
              </Avatar>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color={selected ? tokens.primary : "inherit"}
              >
                {item.pr_work_name}
              </Typography>
            </Box>
            <Grid container spacing={1.25}>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  ลาย/แบบ
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {item.pr_pattern || "-"}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  วัสดุ
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {item.pr_fabric_type || "-"}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  จำนวน
                </Typography>
                <Typography variant="body2" fontWeight={700} color={tokens.primary}>
                  {item.pr_quantity} ชิ้น
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  กำหนดส่ง
                </Typography>
                <Typography variant="body2">
                  {item.pr_due_date ? new Date(item.pr_due_date).toLocaleDateString("th-TH") : "-"}
                </Typography>
              </Grid>
            </Grid>
          </Box>
          <Tooltip
            title={
              item.is_quoted ? "มีใบเสนอราคาแล้ว" : selected ? "ยกเลิกการเลือก" : "เลือกงานนี้"
            }
          >
            <span>
              <IconButton
                disabled={item.is_quoted}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(item.pr_id);
                }}
              >
                {selected ? <CheckCircleIcon /> : <UncheckIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        {item.is_quoted && (
          <Chip label="มีใบเสนอราคาแล้ว" color="warning" size="small" sx={{ mt: 1 }} />
        )}
      </CardContent>
    </Card>
  );
};

export default PricingRequestSelectableCard;
