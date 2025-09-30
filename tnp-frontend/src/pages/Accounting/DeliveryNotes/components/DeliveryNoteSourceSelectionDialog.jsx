import DescriptionIcon from "@mui/icons-material/Description";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Paper,
  Stack,
  Alert,
  Chip,
  Box,
} from "@mui/material";
import React, { useMemo, useState } from "react";

import {
  FilterSection,
  PaginationSection,
  LoadingState,
  EmptyState,
} from "../../PricingIntegration/components";
import { useGetDeliveryNoteInvoiceItemsQuery } from "../../../../features/Accounting/accountingApi";
import { format } from "date-fns";

const formatCurrency = (value) => {
  if (value === undefined || value === null) return "-";
  try {
    return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(Number(value));
  } catch (e) {
    return value;
  }
};

const InvoiceItemCard = ({ item, onSelect }) => {
  const invoiceLabel = item.invoice_number ? `Invoice ${item.invoice_number}` : "Unlinked invoice";
  const createdAt = item.created_at ? format(new Date(item.created_at), "dd MMM yyyy") : "-";

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{ p: 2, borderRadius: 2, height: "100%", cursor: "pointer", '&:hover': { borderColor: "primary.main", boxShadow: 2 } }}
      onClick={() => onSelect?.(item)}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <DescriptionIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={600}>
              {invoiceLabel}
            </Typography>
          </Stack>
          <Chip size="small" label={item.invoice_status || "-"} />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Created {createdAt}
        </Typography>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">
            Customer
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {item.customer_company || "-"}
          </Typography>
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">
            Item
          </Typography>
          <Typography variant="body2">
            {item.item_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Qty {item.quantity} × {formatCurrency(item.unit_price)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Line total {formatCurrency(item.final_amount)}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
          <Inventory2Icon fontSize="small" />
          <Typography variant="body2">Work: {item.work_name || "-"}</Typography>
        </Stack>
      </Stack>
    </Paper>
  );
};

const DeliveryNoteSourceSelectionDialog = ({
  open,
  onClose,
  onSelect,
  title = "Select invoice item",
  subtitle = "Choose an invoice item to pre-fill the delivery note details",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const { data, error, isLoading, isFetching, refetch } = useGetDeliveryNoteInvoiceItemsQuery(
    {
      search: searchQuery || undefined,
      page: currentPage,
      per_page: itemsPerPage,
    },
    { skip: !open }
  );

  const items = useMemo(() => {
    const arr = data?.data?.data || data?.data || [];
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  const total = data?.data?.total || items.length;

  const handleReset = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setItemsPerPage(12);
    refetch();
  };

  const handleSelect = (item) => {
    if (!item) return;
    onSelect?.(item);
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
          onSearchChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          onRefresh={refetch}
          onResetFilters={handleReset}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to load invoice items: {error.message}
          </Alert>
        )}

        {isLoading ? (
          <LoadingState sx={{ mt: 4 }} />
        ) : items.length === 0 ? (
          <EmptyState title="No invoice items available" description="Create an invoice or adjust your filters." />
        ) : (
          <>
            <PaginationSection
              title={`Invoice items (${total})`}
              page={currentPage}
              perPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onPerPageChange={setItemsPerPage}
              loading={isFetching}
            />

            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {items.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.invoice_item_id}>
                    <InvoiceItemCard item={item} onSelect={handleSelect} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeliveryNoteSourceSelectionDialog;
