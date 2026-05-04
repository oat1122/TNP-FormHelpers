import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import { Box, Button, Collapse, Stack, Typography } from "@mui/material";

import { formatTHB } from "../../utils/invoiceFormatters";
import DepositCard from "../../subcomponents/DepositCard";
import FinancialSummaryCard from "../../subcomponents/FinancialSummaryCard";

const InvoiceCardFinancials = ({
  invoice,
  financials,
  depositMode,
  activeSideStatus,
  hasEvidence,
  hasEvidenceForMode,
  onDepositModeChange,
  showDetails,
  onToggleDetails,
}) => (
  <Box mb={2.5}>
    <Stack spacing={1.25}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <RequestQuoteIcon fontSize="medium" color="primary" aria-hidden="true" />
        <Typography
          sx={{ fontWeight: 700, fontSize: "1.1rem", color: "primary.main", lineHeight: 1.45 }}
        >
          ยอดรวม: {formatTHB(financials?.total || 0)}
        </Typography>
      </Stack>

      <DepositCard
        mode={depositMode}
        depositAmount={financials?.depositAmount || 0}
        paidAmount={financials?.paidAmount || 0}
        remaining={financials?.remaining || 0}
        activeSideStatus={activeSideStatus}
        hasEvidence={hasEvidence}
        invoice={invoice}
        hasEvidenceForMode={hasEvidenceForMode}
        onModeChange={onDepositModeChange}
      />

      <Button
        size="small"
        variant="text"
        onClick={onToggleDetails}
        startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={{ alignSelf: "flex-start", ml: 4.5, mt: 0.5, fontSize: "0.85rem", fontWeight: 500 }}
        tabIndex={0}
        aria-label={showDetails ? "ซ่อนรายละเอียดการคำนวณ" : "แสดงรายละเอียดการคำนวณ"}
      >
        {showDetails ? "ซ่อนรายละเอียด" : "แสดงรายละเอียดการคำนวณ"}
      </Button>

      <Collapse in={showDetails}>
        <FinancialSummaryCard financials={financials} invoice={invoice} showDetails={showDetails} />
      </Collapse>
    </Stack>
  </Box>
);

export default InvoiceCardFinancials;
