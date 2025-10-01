import DescriptionIcon from "@mui/icons-material/Description";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import BusinessIcon from "@mui/icons-material/Business";
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
  Collapse,
  IconButton,
} from "@mui/material";
import React, { useMemo, useState } from "react";

import {
  FilterSection,
  PaginationSection,
  LoadingState,
  EmptyState,
} from "../../PricingIntegration/components";
import { useGetDeliveryNoteInvoicesQuery } from "../../../../features/Accounting/accountingApi";
import { format } from "date-fns";
import {
  TNPCard,
  TNPCardContent,
  TNPHeading,
  TNPBodyText,
  TNPStatusChip,
  TNPCountChip,
  TNPPrimaryButton,
  TNPSecondaryButton,
  TNPDivider,
} from "../../PricingIntegration/components/styles/StyledComponents";

const statusColor = {
  draft: "default",
  pending_review: "warning",
  approved: "success",
  rejected: "error",
  sent: "info",
  completed: "success",
};

const formatCurrency = (value) => {
  if (value === undefined || value === null) return "-";
  try {
    return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(
      Number(value)
    );
  } catch (e) {
    return value;
  }
};

const InvoiceItemGroupRow = ({ group, invoice, onSelectItem }) => {
  const formatTHB = React.useMemo(
    () => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }),
    []
  );

  return (
    <Box
      sx={{
        p: 1.25,
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 1.5,
        bgcolor: "background.paper",
        "&:hover": { borderColor: "primary.light", boxShadow: 1 },
      }}
    >
      {/* Header: unique fields (friendly chips) */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 1,
          flexWrap: "wrap",
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            {group.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            งาน: {group.workName}
          </Typography>
          <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
            {group.pattern && (
              <Chip size="small" label={`แพทเทิร์น: ${group.pattern}`} variant="outlined" />
            )}
            {group.fabric && (
              <Chip size="small" label={`ผ้า: ${group.fabric}`} variant="outlined" />
            )}
            {group.color && <Chip size="small" label={`สี: ${group.color}`} variant="outlined" />}
          </Stack>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="caption" color="text.secondary">
            ยอดรวมของงานนี้
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {formatTHB.format(group.total)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            รวมจำนวน {Number(group.totalQty || 0)} ชิ้น
          </Typography>
        </Box>
      </Box>

      {/* Per-size rows */}
      <Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr 1.2fr 120px",
            gap: 0.75,
            mb: 0.5,
            p: 0.75,
            bgcolor: "background.default",
            borderRadius: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            ไซส์
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
            ราคา/หน่วย
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
            จำนวน
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
            รวม
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
            เลือก
          </Typography>
        </Box>
        {group.rows.map((r, ri) => (
          <Box
            key={r.id || ri}
            sx={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr 1.2fr 120px",
              gap: 0.75,
              py: 0.5,
              px: 0.75,
              bgcolor: ri % 2 ? "background.default" : "transparent",
              borderRadius: 1,
              alignItems: "center",
            }}
          >
            <Typography variant="body2">{r.size || "-"}</Typography>
            <Typography variant="body2" sx={{ textAlign: "right" }}>
              {formatTHB.format(Number(r.unit_price || 0))}
            </Typography>
            <Typography variant="body2" sx={{ textAlign: "right" }}>
              {Number(r.quantity || 0)}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, textAlign: "right" }}>
              {formatTHB.format(Number(r.subtotal || 0))}
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <TNPSecondaryButton
                size="small"
                variant="outlined"
                onClick={() => onSelectItem?.(r.originalItem, invoice)}
              >
                เลือก
              </TNPSecondaryButton>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const InvoiceCard = ({ invoice, onSelectInvoice, onSelectItem }) => {
  const [expanded, setExpanded] = useState(false);
  const invoiceNumber = invoice.number || `DRAFT-${invoice.id?.slice(-6)}`;
  const createdAt = invoice.created_at ? format(new Date(invoice.created_at), "dd MMM yyyy") : "-";
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const amountText = formatCurrency(invoice.total_amount || 0);

  // Group items by common attributes (รายการ/แพทเทิร์น/ผ้า/สี/งาน)
  const grouped = React.useMemo(() => {
    const map = new Map();
    items.forEach((it, idx) => {
      const name = it.item_name || it.name || "-";
      const pattern = it.pattern || "";
      const fabric = it.fabric_type || it.material || "";
      const color = it.color || "";
      const workName = it.work_name || "-";
      const key = [name, pattern, fabric, color, workName].join("||");

      if (!map.has(key)) {
        map.set(key, {
          key,
          name,
          pattern,
          fabric,
          color,
          workName,
          rows: [],
        });
      }

      const q =
        typeof it.quantity === "string" ? parseFloat(it.quantity || "0") : Number(it.quantity || 0);
      const p =
        typeof it.unit_price === "string"
          ? parseFloat(it.unit_price || "0")
          : Number(it.unit_price || 0);
      const subtotal = Number(
        it.final_amount || it.subtotal || (!isNaN(q) && !isNaN(p) ? q * p : 0)
      );

      map.get(key).rows.push({
        id: it.id || `${idx}`,
        size: it.size || "",
        unit_price: isNaN(p) ? 0 : p,
        quantity: isNaN(q) ? 0 : q,
        subtotal: isNaN(subtotal) ? 0 : subtotal,
        originalItem: it, // Keep reference to original item for selection
      });
    });

    return Array.from(map.values()).map((g) => ({
      ...g,
      total: g.rows.reduce((s, r) => s + (Number(r.subtotal) || 0), 0),
      totalQty: g.rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
    }));
  }, [items]);

  const handleToggleExpanded = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleSelectInvoice = (e) => {
    e.stopPropagation();
    onSelectInvoice?.(invoice);
  };

  const handleSelectItem = (item) => {
    onSelectItem?.(item, invoice);
  };

  return (
    <TNPCard>
      <TNPCardContent>
        {/* Header: Invoice info with icon and status */}
        <Box display="flex" alignItems="center" mb={2}>
          <DescriptionIcon color="primary" sx={{ mr: 1.5, fontSize: "1.75rem" }} />
          <Box flex={1} minWidth={0}>
            <TNPHeading variant="h6">Invoice {invoiceNumber}</TNPHeading>
            <TNPBodyText variant="body2" color="text.secondary">
              สร้างเมื่อ {createdAt}
            </TNPBodyText>
          </Box>
        </Box>

        {/* Status and amount chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
          <TNPStatusChip
            label={invoice.status || "draft"}
            size="small"
            statuscolor={statusColor[invoice.status] || "default"}
          />
          <TNPCountChip label={`ยอดรวม: ${amountText}`} size="small" />
        </Stack>

        {/* Customer info */}
        <Stack spacing={0.5} mb={2}>
          <Typography variant="caption" color="text.secondary">
            ลูกค้า
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <BusinessIcon fontSize="small" color="action" />
            <Typography variant="body2" fontWeight={500}>
              {invoice.customer_company || invoice.customer?.cus_company || "-"}
            </Typography>
          </Stack>
        </Stack>

        {/* Items section with expand/collapse */}
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              py: 1,
              "&:hover": { bgcolor: "action.hover" },
              borderRadius: 1,
              px: 1,
            }}
            onClick={handleToggleExpanded}
          >
            <Typography variant="subtitle2">
              รายการสินค้า ({grouped.length} กลุ่ม, {items.length} รายการ)
            </Typography>
            <IconButton size="small">
              <ExpandMoreIcon
                sx={{
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </IconButton>
          </Box>

          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {grouped.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ p: 2, textAlign: "center" }}
                >
                  ไม่มีรายการสินค้า
                </Typography>
              ) : (
                grouped.map((group, index) => (
                  <InvoiceItemGroupRow
                    key={group.key || index}
                    group={group}
                    invoice={invoice}
                    onSelectItem={handleSelectItem}
                  />
                ))
              )}
            </Stack>
          </Collapse>
        </Box>
      </TNPCardContent>

      <TNPDivider />

      {/* Action buttons */}
      <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}>
        <TNPPrimaryButton variant="contained" size="medium" onClick={handleSelectInvoice}>
          Select invoice
        </TNPPrimaryButton>
      </Box>
    </TNPCard>
  );
};

const DeliveryNoteSourceSelectionDialog = ({
  open,
  onClose,
  onSelect,
  title = "Select invoice",
  subtitle = "Choose an invoice and optionally an item to pre-fill delivery note details",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const { data, error, isLoading, isFetching, refetch } = useGetDeliveryNoteInvoicesQuery(
    {
      search: searchQuery || undefined,
      page: currentPage,
      per_page: itemsPerPage,
      status: "approved", // Only show approved invoices
    },
    { skip: !open }
  );

  const invoices = useMemo(() => {
    const arr = data?.data?.data || data?.data || [];
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  const total = data?.data?.total || invoices.length;

  const handleReset = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setItemsPerPage(12);
    refetch();
  };

  const handleSelectInvoice = (invoice) => {
    if (!invoice) return;
    const selection = {
      invoice_id: invoice.id,
      invoice_number: invoice.number,
      customer_company: invoice.customer_company || invoice.customer?.cus_company,
      customer_address: invoice.customer_address,
      customer_tel_1: invoice.customer_tel_1,
      total_amount: invoice.total_amount,
      company_id: invoice.company_id,
    };
    onSelect?.(selection);
  };

  const handleSelectItem = (item, invoice) => {
    if (!item || !invoice) return;
    const selection = {
      invoice_id: invoice.id,
      invoice_item_id: item.id,
      invoice_number: invoice.number,
      item_name: item.item_name,
      work_name: item.work_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      customer_company: invoice.customer_company || invoice.customer?.cus_company,
      customer_address: invoice.customer_address,
      customer_tel_1: invoice.customer_tel_1,
      company_id: invoice.company_id,
    };
    onSelect?.(selection);
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
            เกิดข้อผิดพลาดในการดึงข้อมูล: {error.message}
          </Alert>
        )}

        {isLoading ? (
          <LoadingState sx={{ mt: 4 }} />
        ) : invoices.length === 0 ? (
          <EmptyState
            title="ยังไม่มีใบแจ้งหนี้ที่พร้อมสร้างใบส่งของ"
            description="สร้างใบแจ้งหนี้หรือปรับเงื่อนไขการค้นหา"
          />
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
                {invoices.map((invoice) => (
                  <Grid item xs={12} md={6} lg={4} key={invoice.id}>
                    <InvoiceCard
                      invoice={invoice}
                      onSelectInvoice={handleSelectInvoice}
                      onSelectItem={handleSelectItem}
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

export default DeliveryNoteSourceSelectionDialog;
