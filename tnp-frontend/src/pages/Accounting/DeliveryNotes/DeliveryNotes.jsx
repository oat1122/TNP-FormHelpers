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
  useGenerateDeliveryNotePDFBundleMutation,
} from "../../../features/Accounting/accountingApi";
import { apiConfig } from "../../../api/apiConfig";
import { showError, showSuccess } from "../utils/accountingToast";
import { downloadFile, normalizePath } from "./utils/downloadUtils";

const DeliveryNotes = () => {
  // Get user data for permission checks
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const isAdmin = userData.user_id === 1;
  const isAccount = userData.role === "account";
  const canCreateDeliveryNote = isAdmin || isAccount;

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
  const [generatePDFBundle] = useGenerateDeliveryNotePDFBundleMutation();

  const handleRefresh = () => {
    // ใช้ refetch() เฉพาะเมื่อผู้ใช้กดปุ่ม Refresh เท่านั้น
    refetch();
  };

  const handleDownloadPDF = async ({ deliveryNoteId, headerTypes }) => {
    if (!deliveryNoteId) return;

    try {
      // If multiple header types selected, use bundle endpoint
      if (headerTypes && headerTypes.length > 1) {
        const response = await generatePDFBundle({
          id: deliveryNoteId,
          headerTypes,
        }).unwrap();

        // Extract data from response (handle both response and response.data)
        const data = response?.data || response;

        if (data?.mode === "zip" && data?.zip?.url) {
          // Multiple files - download ZIP
          const zipUrl = normalizePath(data.zip.url);
          const filename = data.zip.filename || "delivery-notes-bundle.zip";

          // Use downloadFile utility
          downloadFile(zipUrl, filename);

          showSuccess(`ดาวน์โหลด PDF ${headerTypes.length} ไฟล์สำเร็จ (ZIP)`);
        } else if (data?.mode === "single" && data?.file?.url) {
          // Single file
          const pdfUrl = normalizePath(data.file.url);
          window.open(pdfUrl, "_blank", "noopener");
          showSuccess("ดาวน์โหลด PDF สำเร็จ");
        }
      } else {
        // Single header type - use regular PDF endpoint
        const headerType = headerTypes?.[0] || "ต้นฉบับ";
        const response = await generatePDF({
          id: deliveryNoteId,
          options: { document_header_type: headerType },
        }).unwrap();

        const pdfUrl =
          response?.url || response?.data?.url || response?.pdf_url || response?.data?.pdf_url;

        if (pdfUrl) {
          const normalized = normalizePath(pdfUrl);
          window.open(normalized, "_blank", "noopener");
          showSuccess("ดาวน์โหลด PDF สำเร็จ");
          return;
        }

        // Fallback
        window.open(
          `${apiConfig.baseUrl}/delivery-notes/${deliveryNoteId}/generate-pdf`,
          "_blank",
          "noopener"
        );
      }
    } catch (err) {
      console.error("Download PDF error:", err);
      showError(err?.data?.message || "ไม่สามารถดาวน์โหลด PDF ได้");
    }
  };

  const handlePreviewPDF = ({ deliveryNoteId, headerType }) => {
    if (!deliveryNoteId) return;

    const headerParam = headerType ? `?document_header_type=${encodeURIComponent(headerType)}` : "";
    const previewUrl = `${apiConfig.baseUrl}/delivery-notes/${deliveryNoteId}/pdf/stream${headerParam}`;
    window.open(previewUrl, "_blank", "noopener");
  };

  const handleDownloadPDF_OLD = async (note) => {
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
    // RTK Query จะ invalidate cache อัตโนมัติแล้ว ไม่ต้อง refetch
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

          {canCreateDeliveryNote && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
              New delivery note
            </Button>
          )}
        </Box>

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
                    onPreviewPDF={handlePreviewPDF}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>

      {canCreateDeliveryNote && (
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
      )}

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
        onUpdated={() => {}} // RTK Query จะ invalidate cache อัตโนมัติแล้ว
      />

      <DeliveryNoteEditDialog
        open={editDialogOpen}
        deliveryNoteId={selectedDeliveryNoteId}
        onClose={handleEditClose}
        onUpdated={() => {}} // RTK Query จะ invalidate cache อัตโนมัติแล้ว
      />
    </ThemeProvider>
  );
};

export default DeliveryNotes;
