import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import MapIcon from "@mui/icons-material/Map";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Stack,
  Divider,
  Tooltip,
} from "@mui/material";
import { format } from "date-fns";
import React from "react";

const statusConfig = {
  preparing: { color: "default", label: "Preparing" },
  shipping: { color: "primary", label: "Shipping" },
  in_transit: { color: "warning", label: "In Transit" },
  delivered: { color: "success", label: "Delivered" },
  completed: { color: "info", label: "Completed" },
  failed: { color: "error", label: "Failed" },
};

const deliveryMethodLabels = {
  courier: "Courier",
  self_delivery: "Self delivery",
  customer_pickup: "Customer pickup",
};

const formatDate = (date) => {
  if (!date) return "-";
  try {
    return format(new Date(date), "dd MMM yyyy");
  } catch (e) {
    return date;
  }
};

const DeliveryNoteCard = ({
  note,
  onView,
  onDownloadPDF,
  onStartShipping,
  onMarkDelivered,
  onMarkCompleted,
  onMarkFailed,
}) => {
  if (!note) return null;

  const status = statusConfig[note.status] || { color: "default", label: note.status };
  const methodLabel = deliveryMethodLabels[note.delivery_method] || note.delivery_method;
  const hasTracking = Boolean(note.tracking_number);
  const invoiceNumber = note.invoice?.number || note.invoice_number;
  const invoiceItemName = note.invoice_item?.item_name || note.work_name;

  return (
    <Card elevation={1} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1" fontWeight={600}>
            {note.number || "Draft"}
          </Typography>
          <Chip size="small" color={status.color} label={status.label} />
        </Stack>

        <Stack spacing={1.2} sx={{ mt: 2 }}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Customer
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {note.customer_company || note.customer?.cus_company || "-"}
            </Typography>
            {note.customer_tel_1 && (
              <Typography variant="body2" color="text.secondary">
                Tel: {note.customer_tel_1}
              </Typography>
            )}
          </Stack>

          <Divider flexItem light />

          <Stack direction="row" spacing={1} alignItems="center">
            <LocalShippingIcon fontSize="small" color="action" />
            <Typography variant="body2">{methodLabel}</Typography>
            <Chip size="small" variant="outlined" label={`Qty: ${note.quantity || "-"}`} />
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <MapIcon fontSize="small" color="action" />
            <Typography variant="body2" sx={{ flex: 1 }}>
              {note.delivery_address || "No delivery address"}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <ReceiptLongIcon fontSize="small" color="action" />
            <Typography variant="body2" sx={{ flex: 1 }}>
              {invoiceNumber ? `Invoice ${invoiceNumber}` : "Unlinked invoice"}
            </Typography>
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Delivery date
            </Typography>
            <Typography variant="body2">{formatDate(note.delivery_date)}</Typography>
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Item
            </Typography>
            <Typography variant="body2">{invoiceItemName || "-"}</Typography>
          </Stack>

          {hasTracking && (
            <Typography variant="body2" color="text.secondary">
              Tracking: {note.tracking_number}
            </Typography>
          )}
        </Stack>
      </CardContent>

      <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={() => onView?.(note)}>
            View / Edit
          </Button>
          {typeof onStartShipping === "function" && note.status === "preparing" && (
            <Button size="small" onClick={() => onStartShipping(note)}>
              Start Shipping
            </Button>
          )}
          {typeof onMarkDelivered === "function" && note.status === "shipping" && (
            <Button size="small" onClick={() => onMarkDelivered(note)}>
              Mark Delivered
            </Button>
          )}
          {typeof onMarkCompleted === "function" && note.status === "delivered" && (
            <Button size="small" onClick={() => onMarkCompleted(note)}>
              Complete
            </Button>
          )}
          {typeof onMarkFailed === "function" && note.status !== "completed" && note.status !== "failed" && (
            <Button size="small" color="error" onClick={() => onMarkFailed(note)}>
              Mark Failed
            </Button>
          )}
        </Stack>

        <Tooltip title="Download delivery note PDF">
          <Button
            size="small"
            startIcon={<PictureAsPdfIcon fontSize="small" />}
            onClick={() => onDownloadPDF?.(note)}
          >
            PDF
          </Button>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default DeliveryNoteCard;
