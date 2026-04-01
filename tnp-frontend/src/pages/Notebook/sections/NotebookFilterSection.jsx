import { Box } from "@mui/material";

import PeriodTabs from "../../Telesales/sections/PeriodTabs";

const NotebookFilterSection = ({
  periodFilter,
  onPeriodChange,
  dateFilterBy,
  onDateFilterChange,
  isLoading,
}) => (
  <Box sx={{ mb: 2 }}>
    <PeriodTabs
      periodFilter={periodFilter}
      onPeriodChange={onPeriodChange}
      filters={[
        {
          label: "ประเภทวันที่",
          value: dateFilterBy,
          onChange: onDateFilterChange,
          options: [
            { value: "all", label: "ทั้งหมด" },
            { value: "created_at", label: "วันที่สร้าง" },
            { value: "updated_at", label: "วันที่อัปเดต" },
          ],
        },
      ]}
      isLoading={isLoading}
    />
  </Box>
);

export default NotebookFilterSection;
