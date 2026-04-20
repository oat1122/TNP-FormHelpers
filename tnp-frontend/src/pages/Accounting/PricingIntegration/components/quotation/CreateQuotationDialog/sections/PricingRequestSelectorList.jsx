import {
  Assignment as AssignmentIcon,
  CheckCircleOutline as CheckCircleIcon,
} from "@mui/icons-material";
import { Avatar, Box, Chip, Skeleton, Typography } from "@mui/material";

import PricingRequestSelectableCard from "./PricingRequestSelectableCard";
import { tokens } from "../../../../../shared/styles/tokens";

const PricingRequestSelectorList = ({
  list,
  isLoading,
  selectedPricingItems,
  selectedTotal,
  onToggleSelect,
}) => (
  <Box>
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
      <Box display="flex" alignItems="center" gap={1.5}>
        <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
          <AssignmentIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
            เลือกงานที่ต้องการสร้างใบเสนอราคา
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Select jobs to create quotation
          </Typography>
        </Box>
      </Box>
      {selectedTotal > 0 && (
        <Chip
          icon={<CheckCircleIcon />}
          label={`รวม ${selectedTotal} ชิ้น`}
          color="success"
          variant="outlined"
        />
      )}
    </Box>

    {isLoading ? (
      <Box sx={{ py: 2 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={96} sx={{ borderRadius: 1.5, mb: 1 }} />
        ))}
      </Box>
    ) : (
      <Box sx={{ maxHeight: 420, overflowY: "auto", pr: 1 }}>
        {list.map((item, index) => (
          <PricingRequestSelectableCard
            key={item.pr_id}
            item={item}
            index={index}
            selected={selectedPricingItems.includes(item.pr_id)}
            onToggle={onToggleSelect}
          />
        ))}
      </Box>
    )}
  </Box>
);

export default PricingRequestSelectorList;
