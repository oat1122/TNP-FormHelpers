import AddIcon from "@mui/icons-material/Add";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { Box, Container, Grid, Stack, Typography, Button, Chip, Alert, Fab } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import React, { useMemo, useState } from "react";

import {
  Header,
  FilterSection,
  PaginationSection,
  LoadingState,
  EmptyState,
} from "../PricingIntegration/components";
import accountingTheme from "../theme/accountingTheme";
import DeliveryNoteCard from "./components/DeliveryNoteCard";
import DeliveryNoteCreateDialog from "./components/DeliveryNoteCreateDialog";
import DeliveryNoteDetailDialog from "./components/DeliveryNoteDetailDialog";
import DeliveryNoteEditDialog from "./components/DeliveryNoteEditDialog";
import DeliveryNoteSourceSelectionDialog from "./components/DeliveryNoteSourceSelectionDialog";
import {
  useGetDeliveryNotesQuery,
  useGenerateDeliveryNotePDFMutation,
} from "../../../features/Accounting/accountingApi";
import { apiConfig } from "../../../api/apiConfig";
import { showError, showSuccess } from "../utils/accountingToast";

const statusFilterOptions = [
  { value: "", label: "All statuses" },
  { value: "preparing", label: "Preparing" },
  { value: "shipping", label: "Shipping" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

const methodFilterOptions = [
  { value: "", label: "All methods" },
  { value: "courier", label: "Courier" },
  { value: "self_delivery", label: "Self delivery" },
  { value: "customer_pickup", label: "Customer pickup" },
];

const DeliveryNotes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedDeliveryNoteId, setSelectedDeliveryNoteId] = useState(null);

  const { data, error, isLoading, isFetching, refetch } = useGetDeliveryNotesQuery(
    {
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      delivery_method: methodFilter || undefined,
      page,
      per_page: perPage,
    },
    { pollingInterval: 60000 }
  );

  const notes = useMemo(() => {
    const arr = data?.data?.data || data?.data || [];
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  const total = data?.data?.total || notes.length;

  const [generatePDF] = useGenerateDeliveryNotePDFMutation();

  const handleRefresh = () => {
    refetch();
  };

  const handleDownloadPDF = async (note) => {
    if (!note?.id) return;
    try {
      const response = await generatePDF(note.id).unwrap();
      const pdfUrl =
        response?.url || response?.data?.url || response?.pdf_url || response?.data?.pdf_url;
      if (pdfUrl) {
        const normalized = (pdfUrl || "").replace(/\\/g, "/");
        window.open(normalized, "_blank", "noopener");
        return;
      }
      window.open(
        `${apiConfig.baseUrl}/delivery-notes/${note.id}/generate-pdf`,
        "_blank",
        "noopener"
      );
    } catch (err) {
      showError(err?.data?.message || "Unable to download delivery note PDF");
    }
  };

  const handleOpenCreate = () => {
    setSelectionDialogOpen(true);
  };

  const handleSourceSelected = (source) => {
    setSelectedSource(source);
    setSelectionDialogOpen(false);
    setCreateDialogOpen(true);
  };

  const handleCreateClose = () => {
    setCreateDialogOpen(false);
    setSelectedSource(null);
  };

  const handleCreated = () => {
    setCreateDialogOpen(false);
    setSelectedSource(null);
    showSuccess("Delivery note created");
    refetch();
  };

  const handleViewNote = (note) => {
    setSelectedDeliveryNoteId(note.id);
    // Open edit dialog that mirrors create UI per requirement
    setEditDialogOpen(true);
  };

  const handleDetailClose = () => {
    setDetailDialogOpen(false);
    setSelectedDeliveryNoteId(null);
  };
  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedDeliveryNoteId(null);
  };

  return (
    <ThemeProvider theme={accountingTheme}>
      <Header
        title="Delivery notes"
        subtitle="Track shipments and manage delivery note workflows"
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LocalShippingIcon color="primary" />
            <Typography variant="h5" fontWeight={600}>
              Delivery notes
            </Typography>
            <Chip label={`${total} records`} size="small" color="primary" variant="outlined" />
          </Stack>

          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            New delivery note
          </Button>
        </Box>

        <FilterSection
          searchQuery={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          onRefresh={handleRefresh}
          onResetFilters={() => {
            setSearchQuery("");
            setStatusFilter("");
            setMethodFilter("");
            setPage(1);
            setPerPage(20);
          }}
        />

        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
          {statusFilterOptions.map((option) => (
            <Button
              key={`status-${option.value}`}
              variant={statusFilter === option.value ? "contained" : "outlined"}
              size="small"
              onClick={() => {
                setStatusFilter(option.value);
                setPage(1);
              }}
            >
              {option.label}
            </Button>
          ))}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5, mb: 3, flexWrap: "wrap" }}>
          {methodFilterOptions.map((option) => (
            <Button
              key={`method-${option.value}`}
              variant={methodFilter === option.value ? "contained" : "outlined"}
              size="small"
              onClick={() => {
                setMethodFilter(option.value);
                setPage(1);
              }}
            >
              {option.label}
            </Button>
          ))}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load delivery notes: {error.message}
          </Alert>
        )}

        {isLoading ? (
          <LoadingState message="Loading delivery notes..." />
        ) : notes.length === 0 ? (
          <EmptyState
            title="No delivery notes yet"
            description="Create a delivery note from an invoice item to start shipping."
          />
        ) : (
          <>
            <PaginationSection
              title={`Delivery notes (${total})`}
              page={page}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              loading={isFetching}
            />

            <Grid container spacing={2} sx={{ mt: 1 }}>
              {notes.map((note) => (
                <Grid item xs={12} md={6} lg={4} key={note.id}>
                  <DeliveryNoteCard
                    note={note}
                    onView={handleViewNote}
                    onDownloadPDF={handleDownloadPDF}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>

      <Fab
        color="primary"
        aria-label="create-delivery-note"
        onClick={handleOpenCreate}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          display: { xs: "flex", md: "none" },
        }}
      >
        <AddIcon />
      </Fab>

      <DeliveryNoteSourceSelectionDialog
        open={selectionDialogOpen}
        onClose={() => setSelectionDialogOpen(false)}
        onSelect={handleSourceSelected}
      />

      <DeliveryNoteCreateDialog
        open={createDialogOpen}
        onClose={handleCreateClose}
        onCreated={handleCreated}
        source={selectedSource}
      />

      <DeliveryNoteDetailDialog
        open={detailDialogOpen}
        deliveryNoteId={selectedDeliveryNoteId}
        onClose={handleDetailClose}
        onUpdated={refetch}
      />

      <DeliveryNoteEditDialog
        open={editDialogOpen}
        deliveryNoteId={selectedDeliveryNoteId}
        onClose={handleEditClose}
        onUpdated={refetch}
      />
    </ThemeProvider>
  );
};

export default DeliveryNotes;
