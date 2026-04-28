import { Box } from "@mui/material";

import FinancialSummaryPanel from "../FinancialSummaryPanel";

const FinancialStep = ({ items, financials, onChange }) => (
  <Box>
    <FinancialSummaryPanel items={items} financials={financials} onChange={onChange} />
  </Box>
);

export default FinancialStep;
