import DescriptionIcon from "@mui/icons-material/Description";
import BusinessIcon from "@mui/icons-material/Business";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
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
  Box,
  IconButton,
  Collapse,
} from "@mui/material";
import { format } from "date-fns";
import React from "react";
import { formatTHB } from "../../Invoices/utils/format";
import DeliveryNotePDFMenu from "./DeliveryNotePDFMenu";

const statusConfig = {
  preparing: { color: "default", label: "preparing" },
  shipping: { color: "primary", label: "shipping" },
  in_transit: { color: "warning", label: "in_transit" },
  delivered: { color: "success", label: "delivered" },
  completed: { color: "info", label: "completed" },
  approved: { color: "success", label: "approved" },
  failed: { color: "error", label: "failed" },
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
  onPreviewPDF,
  onStartShipping,
  onMarkDelivered,
  onMarkCompleted,
  onMarkFailed,
}) => {
  if (!note) return null;

  const status = statusConfig[note.status] || { color: "default", label: note.status };
  const invoice = note.invoice || {};
  const invoiceNumber = note.invoice_number || invoice.number || "-";
  const createdAt = note.created_at || invoice.created_at;

  // Normalize customer snapshot (if any)
  const cs = React.useMemo(() => {
    try {
      return typeof note.customer_snapshot === "string"
        ? JSON.parse(note.customer_snapshot)
        : note.customer_snapshot || null;
    } catch {
      return null;
    }
  }, [note.customer_snapshot]);

  // Choose display fields based on customer_data_source
  const preferDelivery = (note.customer_data_source || "master") === "delivery";

  const customerCompany = React.useMemo(() => {
    const fromDelivery = note.customer_company || cs?.customer_company || cs?.cus_company;
    const fromMaster = note.customer?.cus_company || cs?.cus_company || cs?.customer_company;
    return (preferDelivery ? fromDelivery : fromMaster) || fromDelivery || fromMaster || "-";
  }, [preferDelivery, note.customer_company, note.customer, cs]);

  const customerInfo = React.useMemo(() => {
    // Tax ID
    const taxFromDelivery =
      note.customer_tax_id || cs?.customer_tax_id || cs?.tax_id || cs?.cus_tax_id;
    const taxFromMaster =
      note.customer?.cus_tax_id || cs?.cus_tax_id || cs?.tax_id || cs?.customer_tax_id;
    const taxId =
      (preferDelivery ? taxFromDelivery : taxFromMaster) || taxFromDelivery || taxFromMaster || "";

    // Telephone
    const telFromDelivery = note.customer_tel_1 || cs?.customer_tel_1 || cs?.cus_tel_1;
    const telFromMaster = note.customer?.cus_tel_1 || cs?.cus_tel_1 || cs?.customer_tel_1;
    const tel =
      (preferDelivery ? telFromDelivery : telFromMaster) || telFromDelivery || telFromMaster || "";

    // Address
    const addrFromDelivery = note.customer_address || cs?.customer_address || cs?.cus_address;
    const addrFromMaster = note.customer?.cus_address || cs?.cus_address || cs?.customer_address;
    const address =
      (preferDelivery ? addrFromDelivery : addrFromMaster) ||
      addrFromDelivery ||
      addrFromMaster ||
      "";

    // Contact name: prefer master (immutable contact policy), fallback to snapshot
    const contactName =
      note.customer?.cus_firstname || note.customer?.cus_lastname
        ? `${note.customer?.cus_firstname || ""} ${note.customer?.cus_lastname || ""}`.trim()
        : note.customer?.cus_name || cs?.contact_name || cs?.cus_name || "";

    return { taxId, tel, address, contactName };
  }, [
    preferDelivery,
    note.customer,
    note.customer_tax_id,
    note.customer_tel_1,
    note.customer_address,
    cs,
  ]);

  // Group delivery note items (delivery_note_items)
  const { groups, totalRows, grandTotalAmount, grandTotalQty } = React.useMemo(() => {
    const items = Array.isArray(note.items)
      ? note.items
      : Array.isArray(note.delivery_note_items)
        ? note.delivery_note_items
        : [];
    const map = new Map();
    items.forEach((it, idx) => {
      const name = it.item_name || "-";
      const pattern = it.pattern || "";
      const fabric = it.fabric_type || "";
      const color = it.color || "";
      const workName = name;
      const key = [name, pattern, fabric, color, workName].join("||");
      if (!map.has(key)) {
        map.set(key, {
          key,
          name,
          workName,
          pattern,
          fabric,
          color,
          rows: [],
        });
      }
      // unit price from snapshot if available
      let snap = {};
      try {
        snap =
          typeof it.item_snapshot === "string"
            ? JSON.parse(it.item_snapshot)
            : it.item_snapshot || {};
      } catch {
        snap = {};
      }
      const unitPrice =
        Number(snap?.unit_price ?? snap?.price_per_unit ?? snap?.price_unit ?? snap?.price ?? 0) ||
        0;
      const quantity =
        Number(
          typeof it.delivered_quantity === "string"
            ? parseFloat(it.delivered_quantity || "0")
            : it.delivered_quantity || 0
        ) || 0;
      map.get(key).rows.push({
        id: it.id || `${idx}`,
        size: it.size || "",
        unitPrice,
        quantity,
        unit: it.unit || "ชิ้น",
        total: unitPrice * quantity,
      });
    });
    const grouped = Array.from(map.values()).map((g) => ({
      ...g,
      totalQty: g.rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
      totalAmount: g.rows.reduce((s, r) => s + (Number(r.total) || 0), 0),
    }));
    const rowsCount = grouped.reduce((s, g) => s + g.rows.length, 0);
    const totalAmountAll = grouped.reduce((s, g) => s + g.totalAmount, 0);
    const totalQtyAll = grouped.reduce((s, g) => s + g.totalQty, 0);
    return {
      groups: grouped,
      totalRows: rowsCount,
      grandTotalAmount: totalAmountAll,
      grandTotalQty: totalQtyAll,
    };
  }, [note.items, note.delivery_note_items]);

  const hasAmount = grandTotalAmount > 0;

  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card elevation={1} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header with icon and invoice info */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <DescriptionIcon color="primary" />
          <Box>
            <Typography variant="h6">{`Invoice ${invoiceNumber || "-"}`}</Typography>
            <Typography variant="body2" color="text.secondary">
              {`สร้างเมื่อ ${formatDate(createdAt)}`}
            </Typography>
          </Box>
        </Box>

        {/* Status and total chips */}
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Chip
            size="small"
            label={status.label}
            color={status.color}
            sx={{ textTransform: "none" }}
          />
          {hasAmount ? (
            <Chip size="small" label={`ยอดรวม: ${formatTHB(grandTotalAmount)}`} />
          ) : (
            <Chip size="small" label={`รวมจำนวน: ${grandTotalQty} ชิ้น`} />
          )}
        </Stack>

        {/* Customer section */}
        <Stack spacing={0.5} sx={{ mt: 2 }}>
          <Typography variant="caption">ลูกค้า</Typography>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <BusinessIcon fontSize="small" color="action" />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              <Typography variant="body2" fontWeight={600}>
                {customerCompany}
              </Typography>
              {customerInfo.taxId ? (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`เลขผู้เสียภาษี: ${customerInfo.taxId}`}
                />
              ) : null}
              {customerInfo.contactName ? (
                <Typography variant="caption" color="text.secondary">
                  ผู้ติดต่อ: {customerInfo.contactName}
                </Typography>
              ) : null}
              {customerInfo.tel ? (
                <Typography variant="caption" color="text.secondary">
                  โทร: {customerInfo.tel}
                </Typography>
              ) : null}
              {customerInfo.address ? (
                <Typography variant="caption" color="text.secondary">
                  ที่อยู่: {customerInfo.address}
                </Typography>
              ) : null}
            </Box>
          </Stack>
        </Stack>

        {/* Items section */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="subtitle2">
              {`รายการสินค้า (${groups.length} กลุ่ม, ${totalRows} รายการ)`}
            </Typography>
            <IconButton size="small" onClick={() => setExpanded((e) => !e)}>
              <ExpandMoreIcon />
            </IconButton>
          </Box>
          <Collapse in={expanded}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {groups.map((g) => (
                <Box key={g.key} sx={{ p: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: { xs: "flex-start", sm: "center" },
                      justifyContent: "flex-start",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2">{g.name}</Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >{`งาน: ${g.workName}`}</Typography>
                      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                        {g.pattern && (
                          <Chip size="small" variant="outlined" label={`แพทเทิร์น: ${g.pattern}`} />
                        )}
                        {g.fabric && (
                          <Chip size="small" variant="outlined" label={`ผ้า: ${g.fabric}`} />
                        )}
                        {g.color && (
                          <Chip size="small" variant="outlined" label={`สี: ${g.color}`} />
                        )}
                      </Stack>
                    </Box>
                    {/* Per-group totals removed as requested */}
                  </Box>

                  {/* rows header */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    <Typography variant="caption">ไซส์</Typography>
                    <Typography variant="caption">จำนวน</Typography>
                  </Box>
                  {g.rows.map((r) => (
                    <Box
                      key={r.id}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 1,
                        alignItems: "center",
                        py: 0.5,
                      }}
                    >
                      <Typography variant="body2">{r.size || "-"}</Typography>
                      <Typography variant="body2">{`${r.quantity} ${r.unit || ""}`}</Typography>
                    </Box>
                  ))}
                </Box>
              ))}
            </Stack>
          </Collapse>
        </Box>
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
          {typeof onMarkFailed === "function" &&
            note.status !== "completed" &&
            note.status !== "failed" && (
              <Button size="small" color="error" onClick={() => onMarkFailed(note)}>
                Mark Failed
              </Button>
            )}
        </Stack>

        <DeliveryNotePDFMenu
          deliveryNote={note}
          onDownloadPDF={onDownloadPDF}
          onPreviewPDF={onPreviewPDF}
        />
      </CardActions>
    </Card>
  );
};

export default DeliveryNoteCard;
