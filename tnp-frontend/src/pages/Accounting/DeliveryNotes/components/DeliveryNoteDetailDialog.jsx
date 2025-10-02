import { Box, Stack, Typography, Grid, TextField, Button, Chip } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import React, { useMemo, useState } from "react";
import {
  useGetDeliveryNoteQuery,
  useStartShippingMutation,
  useUpdateTrackingMutation,
  useMarkDeliveredMutation,
  useMarkCompletedMutation,
  useMarkFailedMutation,
  useGenerateDeliveryNotePDFMutation,
} from "../../../../features/Accounting/accountingApi";
import DetailDialog from "../../shared/components/DetailDialog";
import { apiConfig } from "../../../../api/apiConfig";
import { showError } from "../../utils/accountingToast";

const statusColor = (status) => {
  switch (status) {
    case "preparing":
      return "default";
    case "shipping":
    case "in_transit":
      return "info";
    case "delivered":
    case "completed":
      return "success";
    case "failed":
      return "error";
    default:
      return "default";
  }
};

const DeliveryNoteDetailDialog = ({ open, onClose, deliveryNoteId, onUpdated }) => {
  const { data, isLoading, error, refetch } = useGetDeliveryNoteQuery(deliveryNoteId, {
    skip: !open || !deliveryNoteId,
  });

  const note = useMemo(() => data?.data || data || null, [data]);

  const [startShipping, { isLoading: starting }] = useStartShippingMutation();
  const [updateTracking, { isLoading: updating }] = useUpdateTrackingMutation();
  const [markDelivered, { isLoading: markingDelivered }] = useMarkDeliveredMutation();
  const [markCompleted, { isLoading: markingCompleted }] = useMarkCompletedMutation();
  const [markFailed, { isLoading: markingFailed }] = useMarkFailedMutation();
  const [generatePDF] = useGenerateDeliveryNotePDFMutation();

  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierCompany, setCourierCompany] = useState("");

  const handleStartShipping = async () => {
    if (!deliveryNoteId) return;
    try {
      await startShipping({
        id: deliveryNoteId,
        tracking_number: trackingNumber,
        courier_company: courierCompany,
      }).unwrap();
      await refetch();
      onUpdated?.();
    } catch (e) {
      console.error("Start shipping failed", e);
    }
  };

  const handleUpdateTracking = async () => {
    if (!deliveryNoteId) return;
    try {
      await updateTracking({
        id: deliveryNoteId,
        tracking_number: trackingNumber,
        courier_company: courierCompany,
      }).unwrap();
      await refetch();
      onUpdated?.();
    } catch (e) {
      console.error("Update tracking failed", e);
    }
  };

  const handleMarkDelivered = async () => {
    try {
      await markDelivered({ id: deliveryNoteId }).unwrap();
      await refetch();
      onUpdated?.();
    } catch (e) {
      console.error("Mark delivered failed", e);
    }
  };

  const handleMarkCompleted = async () => {
    try {
      await markCompleted({ id: deliveryNoteId }).unwrap();
      await refetch();
      onUpdated?.();
    } catch (e) {
      console.error("Mark completed failed", e);
    }
  };

  const handleMarkFailed = async () => {
    try {
      await markFailed({ id: deliveryNoteId }).unwrap();
      await refetch();
      onUpdated?.();
    } catch (e) {
      console.error("Mark failed failed", e);
    }
  };

  const handleDownloadPDF = async () => {
    if (!deliveryNoteId) return;
    try {
      const response = await generatePDF(deliveryNoteId).unwrap();
      const pdfUrl =
        response?.url || response?.data?.url || response?.pdf_url || response?.data?.pdf_url;
      if (pdfUrl) {
        const normalized = (pdfUrl || "").replace(/\\/g, "/");
        window.open(normalized, "_blank", "noopener");
        return;
      }
      // Fallback to direct GET route
      window.open(
        `${apiConfig.baseUrl}/delivery-notes/${deliveryNoteId}/generate-pdf`,
        "_blank",
        "noopener"
      );
    } catch (err) {
      showError(err?.data?.message || "Unable to download delivery note PDF");
    }
  };

  return (
    <DetailDialog
      open={open}
      onClose={onClose}
      title={`ใบส่งของ: ${note?.delivery_note_number || note?.number || "-"}`}
      isLoading={isLoading}
      error={error}
      maxWidth="md"
    >
      {note && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">สถานะการจัดส่ง</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                size="small"
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                onClick={handleDownloadPDF}
              >
                PDF
              </Button>
              <Chip size="small" label={note.status} color={statusColor(note.status)} />
            </Stack>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                ลูกค้า
              </Typography>
              <Typography variant="body2">
                {note.customer_company || note.customer?.cus_company || "-"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {note.customer_address || note.customer?.cus_address || ""}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                การจัดส่ง
              </Typography>
              <Typography variant="body2">วิธี: {note.delivery_method || "-"}</Typography>
              <Typography variant="body2">บริษัทขนส่ง: {note.courier_company || "-"}</Typography>
              <Typography variant="body2">Tracking: {note.tracking_number || "-"}</Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                อัปเดต Tracking
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  label="บริษัทขนส่ง"
                  size="small"
                  value={courierCompany}
                  onChange={(e) => setCourierCompany(e.target.value)}
                />
                <TextField
                  label="Tracking Number"
                  size="small"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
                <Button variant="outlined" onClick={handleUpdateTracking} disabled={updating}>
                  อัปเดต
                </Button>
                <Button variant="contained" onClick={handleStartShipping} disabled={starting}>
                  เริ่มจัดส่ง
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleMarkDelivered}
                  disabled={markingDelivered}
                >
                  ยืนยันส่งสำเร็จ
                </Button>
                <Button
                  variant="outlined"
                  color="info"
                  onClick={handleMarkCompleted}
                  disabled={markingCompleted}
                >
                  ปิดงาน
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleMarkFailed}
                  disabled={markingFailed}
                >
                  รายงานปัญหา
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      )}
    </DetailDialog>
  );
};

export default DeliveryNoteDetailDialog;
