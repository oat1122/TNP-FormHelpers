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
  Paper,
  Stack,
} from "@mui/material";
import React, { useMemo, useState } from "react";

import {
  useGetReceiptsQuery,
  useCreateDeliveryNoteFromReceiptMutation,
} from "../../../../features/Accounting/accountingApi";
import {
  FilterSection,
  PaginationSection,
  LoadingState,
  EmptyState,
} from "../../PricingIntegration/components";

const ReceiptCard = ({ data, onCreate }) => {
  const number = data?.receipt_number || data?.number || data?.id?.slice?.(0, 8);
  const company = data?.customer_company || data?.customer?.cus_company || "ลูกค้า";
  const amount = data?.total_amount ?? data?.grand_total ?? 0;

  return (
    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle1" fontWeight={600}>
          {number}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {company}
        </Typography>
        {amount ? (
          <Typography variant="body2">ยอดชำระ: {Number(amount).toLocaleString()} บาท</Typography>
        ) : null}
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        <Button variant="contained" size="small" onClick={onCreate}>
          สร้างใบส่งของจากใบเสร็จนี้
        </Button>
      </Stack>
    </Paper>
  );
};

const ReceiptSelectionDialog = ({ open, onClose, onCreated }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const { data, error, isLoading, isFetching, refetch } = useGetReceiptsQuery({
    search: searchQuery || undefined,
    page: currentPage,
    per_page: itemsPerPage,
    status: "approved",
  });

  const receipts = useMemo(() => {
    const arr = data?.data?.data || data?.data || [];
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  const total = data?.data?.total || receipts.length;
  const [createFromReceipt, { isLoading: creating }] = useCreateDeliveryNoteFromReceiptMutation();

  const handleCreate = async (receiptId) => {
    try {
      const resp = await createFromReceipt({ receiptId }).unwrap();
      const newId = resp?.data?.id || resp?.id;
      onClose?.();
      onCreated?.(newId);
    } catch (e) {
      console.error("Create delivery note from receipt failed", e);
    }
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
          เลือกใบเสร็จเพื่อสร้างใบส่งของ
        </Typography>
        <Typography variant="body2" color="text.secondary">
          แสดงเฉพาะใบเสร็จที่อนุมัติแล้ว (approved)
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
        ) : receipts.length === 0 ? (
          <EmptyState title="ยังไม่มีใบเสร็จที่พร้อมสร้างใบส่งของ" />
        ) : (
          <>
            <PaginationSection
              title={`พร้อมสร้างใบส่งของ (${total})`}
              page={currentPage}
              perPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onPerPageChange={setItemsPerPage}
              loading={isFetching}
            />

            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {receipts.map((r) => (
                  <Grid item xs={12} md={6} lg={4} key={r.id}>
                    <ReceiptCard data={r} onCreate={() => handleCreate(r.id)} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" size="large" disabled={creating}>
          ยกเลิก
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiptSelectionDialog;
