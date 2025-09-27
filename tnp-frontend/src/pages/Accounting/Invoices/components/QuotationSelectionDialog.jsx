import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Alert,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  FilterSection,
  PaginationSection,
  LoadingState,
  EmptyState,
} from "../../PricingIntegration/components";
import QuotationCard from "../../Quotations/components/QuotationCard";
import {
  useGetQuotationsAwaitingInvoiceQuery,
  useGenerateQuotationPDFMutation,
} from "../../../../features/Accounting/accountingApi";

const QuotationSelectionDialog = ({
  open,
  onClose,
  onSelectQuotation,
  title = "เลือกใบเสนอราคาเพื่อสร้างใบแจ้งหนี้",
  subtitle = "เลือกใบเสนอราคาที่เซ็นแล้วและพร้อมออกใบแจ้งหนี้",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const { data, error, isLoading, isFetching, refetch } = useGetQuotationsAwaitingInvoiceQuery({
    search: searchQuery || undefined,
    page: currentPage,
    per_page: itemsPerPage,
  });

  const quotations = useMemo(() => {
    const arr = data?.data?.data || data?.data || [];
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  const total = data?.data?.total || quotations.length;
  const [generatePDF] = useGenerateQuotationPDFMutation();

  const handleDownloadPDF = async (id) => {
    try {
      await generatePDF(id).unwrap();
    } catch (e) {
      console.error("Generate PDF failed", e);
    }
  };

  const handleSelectQuotation = (quotation) => {
    onSelectQuotation(quotation);
    onClose();
  };

  const handleReset = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setItemsPerPage(12);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl" scroll="paper">
      <DialogTitle>
        <Typography variant="h5" component="div" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ minHeight: "60vh" }}>
        <FilterSection
          searchQuery={searchQuery}
          onSearchChange={(v) => {
            setSearchQuery(v);
            setCurrentPage(1);
          }}
          onRefresh={refetch}
          onResetFilters={handleReset}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            เกิดข้อผิดพลาดในการดึงข้อมูล: {error.message}
          </Alert>
        )}

        {isLoading ? (
          <LoadingState />
        ) : quotations.length === 0 ? (
          <EmptyState title="ยังไม่มีใบเสนอราคาให้สร้างใบแจ้งหนี้" />
        ) : (
          <>
            <PaginationSection
              title={`พร้อมออกใบแจ้งหนี้ (${total})`}
              page={currentPage}
              perPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onPerPageChange={setItemsPerPage}
              loading={isFetching}
            />

            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {quotations.map((q) => (
                  <Grid item xs={12} md={6} lg={4} key={q.id}>
                    <QuotationCard
                      data={q}
                      onDownloadPDF={() => handleDownloadPDF(q.id)}
                      onViewDetail={() => handleSelectQuotation(q)}
                      onCreateInvoice={() => handleSelectQuotation(q)}
                      actionButtonText="เลือกใบเสนอราคานี้"
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" size="large">
          ยกเลิก
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuotationSelectionDialog;
