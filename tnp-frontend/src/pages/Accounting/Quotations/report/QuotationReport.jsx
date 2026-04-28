import BarChartIcon from "@mui/icons-material/BarChart";
import MenuIcon from "@mui/icons-material/Menu";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Alert, Box, Container, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { th } from "date-fns/locale";
import { useOutletContext } from "react-router-dom";

import ReportFilterBar from "./components/ReportFilterBar";
import ReportStatusTabs from "./components/ReportStatusTabs";
import ReportSummaryCards from "./components/ReportSummaryCards";
import ReportTableView from "./components/ReportTableView";
import { useQuotationReport } from "./hooks/useQuotationReport";
import { useReportDateFilter } from "./hooks/useReportDateFilter";
import accountingTheme from "../../theme/accountingTheme";

const QuotationReport = () => {
  const context = useOutletContext();
  const dateFilter = useReportDateFilter();
  const report = useQuotationReport({
    dateFrom: dateFilter.dateFrom,
    dateTo: dateFilter.dateTo,
  });

  return (
    <ThemeProvider theme={accountingTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
          <Box
            sx={{
              bgcolor: "primary.main",
              color: "white",
              px: { xs: 2, md: 4 },
              py: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 1 }}
                onClick={context?.onMenuClick}
              >
                <MenuIcon fontSize="large" />
              </IconButton>
              <BarChartIcon sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                  รายงานใบเสนอราคา
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  Sales Report — Quotation Summary
                </Typography>
              </Box>
            </Stack>
            <Tooltip title="รีเฟรชข้อมูล">
              <IconButton onClick={report.handleRefresh} sx={{ color: "white" }} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 4 } }}>
            <ReportFilterBar dateFilter={dateFilter} report={report} />

            {report.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
              </Alert>
            )}

            <ReportSummaryCards summary={report.dynamicSummary} />

            <Box>
              <ReportStatusTabs
                value={report.activeTab}
                counts={report.countsByStatus}
                onChange={report.setActiveTab}
              />
              <ReportTableView
                data={report.displayData}
                isLoading={report.isLoading || report.isFetching}
              />
            </Box>

            <Box sx={{ mt: 1.5, textAlign: "right" }}>
              <Typography variant="caption" color="text.secondary">
                แสดง {report.displayData.length} รายการ
                {report.isLoading || report.isFetching ? " (กำลังโหลด...)" : ""}
              </Typography>
            </Box>
          </Container>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default QuotationReport;
