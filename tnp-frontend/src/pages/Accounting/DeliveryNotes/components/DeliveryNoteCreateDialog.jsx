import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Stack,
  Typography,
  Alert,
  MenuItem,
  Divider,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import React from "react";

import {
  useCreateDeliveryNoteMutation,
  useGetInvoiceQuery,
} from "../../../../features/Accounting/accountingApi";
import { showError, showSuccess, showLoading, dismissToast } from "../../utils/accountingToast";
import LoadingState from "../../PricingIntegration/components/LoadingState";

const deliveryMethodOptions = [
  { value: "courier", label: "Courier" },
  { value: "self_delivery", label: "Self delivery" },
  { value: "customer_pickup", label: "Customer pickup" },
];

const toDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateForApi = (date) => {
  if (!date) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const DeliveryNoteCreateDialog = ({ open, onClose, onCreated, source }) => {
  const invoiceId = source?.invoice_id;
  const { data: invoiceData, isFetching: invoiceLoading } = useGetInvoiceQuery(invoiceId, {
    skip: !open || !invoiceId,
  });

  const invoice = React.useMemo(() => invoiceData?.data || invoiceData || null, [invoiceData]);

  const [createDeliveryNote, { isLoading: creating }] = useCreateDeliveryNoteMutation();

  const [formState, setFormState] = React.useState({
    company_id: "",
    customer_id: "",
    customer_company: "",
    customer_address: "",
    customer_tel_1: "",
    recipient_name: "",
    recipient_phone: "",
    delivery_address: "",
    delivery_method: "courier",
    courier_company: "",
    tracking_number: "",
    delivery_date: toDateOrNull(new Date()),
    work_name: "",
    quantity: "1",
    delivery_notes: "",
    notes: "",
  });

  React.useEffect(() => {
    if (!open) return;

    const hydrated = {
      company_id: source?.company_id || invoice?.company_id || "",
      customer_id: source?.customer_id || invoice?.customer_id || "",
      customer_company: source?.customer_company || invoice?.customer_company || "",
      customer_address:
        source?.delivery_address || source?.customer_address || invoice?.customer_address || "",
      customer_tel_1: source?.customer_phone || invoice?.customer_tel_1 || "",
      recipient_name:
        source?.recipient_name || source?.customer_name || invoice?.customer_firstname || "",
      recipient_phone: source?.customer_phone || invoice?.customer_tel_1 || "",
      delivery_address:
        source?.delivery_address || invoice?.customer_address || source?.customer_address || "",
      delivery_method: source?.delivery_method || "courier",
      courier_company: source?.courier_company || "",
      tracking_number: source?.tracking_number || "",
      delivery_date: toDateOrNull(source?.delivery_date) || toDateOrNull(new Date()),
      work_name: source?.work_name || source?.item_name || invoice?.work_name || "",
      quantity: String(source?.quantity || invoice?.quantity || ""),
      delivery_notes: "",
      notes: "",
    };

    setFormState((prev) => ({ ...prev, ...hydrated }));
  }, [open, source, invoice]);

  const handleChange = (field) => (event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    if (!formState.customer_company || !formState.delivery_address) {
      showError("Customer and delivery address are required");
      return;
    }

    const toastId = showLoading("Creating delivery note...");

    try {
      const payload = {
        company_id: formState.company_id || invoice?.company_id,
        customer_id: formState.customer_id || undefined,
        customer_company: formState.customer_company,
        customer_address: formState.customer_address,
        customer_tel_1: formState.customer_tel_1 || undefined,
        recipient_name: formState.recipient_name || formState.customer_company,
        recipient_phone: formState.recipient_phone || undefined,
        delivery_address: formState.delivery_address,
        delivery_method: formState.delivery_method,
        courier_company: formState.delivery_method === "courier" ? formState.courier_company : null,
        tracking_number: formState.tracking_number || undefined,
        delivery_date: formatDateForApi(formState.delivery_date) || undefined,
        delivery_notes: formState.delivery_notes || undefined,
        notes: formState.notes || undefined,
        work_name: formState.work_name,
        quantity: formState.quantity,
        invoice_id: source?.invoice_id || undefined,
        invoice_item_id: source?.invoice_item_id || undefined,
      };

      await createDeliveryNote(payload).unwrap();
      dismissToast(toastId);
      showSuccess("Delivery note created successfully");
      onCreated?.();
    } catch (error) {
      dismissToast(toastId);
      const message = error?.data?.message || "Failed to create delivery note";
      showError(message);
    }
  };

  const disableCourierFields = formState.delivery_method !== "courier";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create delivery note</DialogTitle>

      <DialogContent dividers>
        {invoiceLoading && <LoadingState message="Loading invoice details..." />}

        {!invoiceLoading && (
          <Stack spacing={3}>
            {source ? (
              <Alert severity="info">
                Selected invoice item: <strong>{source.item_name}</strong> from invoice {" "}
                <strong>{source.invoice_number}</strong>
              </Alert>
            ) : (
              <Alert severity="warning">
                No invoice item selected. You can still create a manual delivery note.
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Customer company"
                  value={formState.customer_company}
                  onChange={handleChange("customer_company")}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Customer phone"
                  value={formState.customer_tel_1}
                  onChange={handleChange("customer_tel_1")}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Recipient name"
                  value={formState.recipient_name}
                  onChange={handleChange("recipient_name")}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Recipient phone"
                  value={formState.recipient_phone}
                  onChange={handleChange("recipient_phone")}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Customer address"
                  value={formState.customer_address}
                  onChange={handleChange("customer_address")}
                  fullWidth
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Delivery address"
                  value={formState.delivery_address}
                  onChange={handleChange("delivery_address")}
                  fullWidth
                  multiline
                  minRows={2}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Delivery method"
                  value={formState.delivery_method}
                  onChange={handleChange("delivery_method")}
                  fullWidth
                >
                  {deliveryMethodOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Delivery date"
                    value={formState.delivery_date}
                    onChange={(value) => setFormState((prev) => ({ ...prev, delivery_date: value }))}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Courier company"
                  value={formState.courier_company}
                  onChange={handleChange("courier_company")}
                  fullWidth
                  disabled={disableCourierFields}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Tracking number"
                  value={formState.tracking_number}
                  onChange={handleChange("tracking_number")}
                  fullWidth
                  disabled={disableCourierFields}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Work name"
                  value={formState.work_name}
                  onChange={handleChange("work_name")}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Quantity"
                  value={formState.quantity}
                  onChange={handleChange("quantity")}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Delivery notes"
                  value={formState.delivery_notes}
                  onChange={handleChange("delivery_notes")}
                  fullWidth
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Internal notes"
                  value={formState.notes}
                  onChange={handleChange("notes")}
                  fullWidth
                  multiline
                  minRows={2}
                />
              </Grid>
            </Grid>

            {invoice && (
              <>
                <Divider />
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2">Invoice summary</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {invoice.number} · {invoice.customer_company}
                  </Typography>
                </Stack>
              </>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={creating}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={creating}>
          {creating ? "Saving..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeliveryNoteCreateDialog;
