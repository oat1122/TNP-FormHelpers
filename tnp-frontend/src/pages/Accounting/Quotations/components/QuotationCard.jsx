import React from "react";
import {
  Box,
  Stack,
  Avatar,
  Typography,
  Collapse,
  Button,
  Chip,
  Grid,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import BusinessIcon from "@mui/icons-material/Business";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import {
  useGetPricingRequestAutofillQuery,
  useDeleteQuotationMutation,
  useGetCompaniesQuery,
  useUpdateQuotationMutation,
  useApproveQuotationMutation,
  useSubmitQuotationMutation,
} from "../../../../features/Accounting/accountingApi";
import { formatUserDisplay } from "../../../../utils/formatUser";
import PricingRequestNotesButton from "../../PricingIntegration/components/PricingRequestNotesButton";
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

const QuotationCard = ({
  data,
  onDownloadPDF,
  onViewLinked,
  onViewDetail,
  onCreateInvoice,
  creatingInvoice,
  actionButtonText,
}) => {
  const amountText = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(
    Number(data.total_amount || 0)
  );
  const [showAll, setShowAll] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);
  const [deleteQuotation] = useDeleteQuotationMutation();
  const { data: companiesResp, isLoading: companiesLoading } = useGetCompaniesQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });
  const [updateQuotation, { isLoading: updatingCompany }] = useUpdateQuotationMutation();
  const [approveQuotation, { isLoading: approving }] = useApproveQuotationMutation();
  const [submitQuotation, { isLoading: submitting }] = useSubmitQuotationMutation();
  const companies = React.useMemo(() => {
    const list = companiesResp?.data ?? companiesResp ?? [];
    return Array.isArray(list) ? list : [];
  }, [companiesResp]);
  const userData = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}");
    } catch {
      return {};
    }
  }, []);
  const canChangeCompany = ["admin", "account"].includes(userData?.role);
  const currentCompany = React.useMemo(
    () => companies.find((c) => c.id === data.company_id),
    [companies, data?.company_id]
  );
  const canApprove = React.useMemo(
    () =>
      ["admin", "account"].includes(userData?.role) &&
      ["draft", "pending_review"].includes(data?.status),
    [userData?.role, data?.status]
  );
  // collect linked PR ids from this quotation
  const detail = data; // data may already contain items
  const prIds = React.useMemo(() => {
    const set = new Set();
    if (Array.isArray(detail?.items)) {
      detail.items.forEach((it) => {
        if (it?.pricing_request_id) set.add(it.pricing_request_id);
      });
    }
    if (detail?.primary_pricing_request_id) set.add(detail.primary_pricing_request_id);
    if (Array.isArray(detail?.primary_pricing_request_ids))
      detail.primary_pricing_request_ids.forEach((id) => set.add(id));
    return Array.from(set);
  }, [detail]);

  // Build a friendly creator display: username (firstname lastname) with robust fallbacks
  const creatorText = React.useMemo(() => formatUserDisplay(data), [data]);

  // If no linked PRs, auto-delete this invalid quotation and hide the card
  React.useEffect(() => {
    if (!data?.id) return;
    if (deleted) return;
    if ((prIds?.length || 0) === 0) {
      deleteQuotation(data.id).finally(() => setDeleted(true));
    }
  }, [data?.id, prIds, deleted, deleteQuotation]);

  if ((prIds?.length || 0) === 0 || deleted) {
    return null;
  }
  return (
    <TNPCard>
      <TNPCardContent>
        {/* Header: Customer info to match PricingIntegration style */}
        <Box display="flex" alignItems="center" mb={2.5}>
          <Avatar
            sx={{
              bgcolor: "secondary.main",
              width: 48,
              height: 48,
              mr: 2,
              boxShadow: "0 2px 8px rgba(178, 0, 0, 0.2)",
            }}
          >
            <BusinessIcon sx={{ fontSize: "1.5rem" }} />
          </Avatar>
          <Box flex={1} minWidth={0}>
            <TNPHeading variant="h6">
              {data.customer?.cus_company || data.customer_name || "-"}
            </TNPHeading>
            {/* Company info / selector (admin, account) */}
            <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 1, minHeight: 36 }}>
              {canChangeCompany ? (
                <FormControl
                  size="small"
                  sx={{ minWidth: 180 }}
                  disabled={companiesLoading || updatingCompany}
                >
                  <InputLabel id={`company-select-label-${data.id}`}>บริษัท</InputLabel>
                  <Select
                    labelId={`company-select-label-${data.id}`}
                    value={companies.find((c) => c.id === data.company_id) ? data.company_id : ""}
                    label="บริษัท"
                    onChange={async (e) => {
                      const newCompanyId = e.target.value;
                      try {
                        await updateQuotation({ id: data.id, company_id: newCompanyId }).unwrap();
                      } catch (err) {
                        console.error("Update company failed", err);
                      }
                    }}
                    renderValue={(val) => {
                      const found = companies.find((c) => c.id === val);
                      return found ? found.short_code || found.name : "ไม่ระบุ";
                    }}
                  >
                    {companies.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {c.short_code || c.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {c.name}
                          </Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Tooltip title="บริษัทที่ออกเอกสาร">
                  <Chip
                    size="small"
                    color="default"
                    label={currentCompany?.short_code || currentCompany?.name || "ไม่ระบุบริษัท"}
                  />
                </Tooltip>
              )}
              {updatingCompany && <CircularProgress size={18} />}
            </Box>
          </Box>
        </Box>

        {/* Chips: status and amount */}
        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2.5}>
          <TNPStatusChip
            label={data.status || "draft"}
            size="small"
            statuscolor={statusColor[data.status] || "default"}
          />
          <TNPCountChip label={`ยอดรวม: ${amountText}`} size="small" />
          {data.number && !String(data.number).startsWith("DRAFT-") && (
            <TNPCountChip
              icon={<DescriptionIcon sx={{ fontSize: "1rem" }} />}
              label={data.number}
              size="small"
            />
          )}
        </Stack>

        <TNPBodyText color="text.secondary">ผู้สร้าง: {creatorText}</TNPBodyText>

        {/* PR entries with job names */}
        {prIds.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Stack spacing={1.2}>
              {prIds.slice(0, 3).map((id, idx) => (
                <PRRow
                  key={id}
                  prId={id}
                  order={idx + 1}
                  items={Array.isArray(data.items) ? data.items : []}
                />
              ))}
            </Stack>
            {prIds.length > 3 && (
              <>
                <Collapse in={showAll}>
                  <Stack spacing={1.2} sx={{ mt: 1 }}>
                    {prIds.slice(3).map((id, idx) => (
                      <PRRow
                        key={id}
                        prId={id}
                        order={3 + idx + 1}
                        items={Array.isArray(data.items) ? data.items : []}
                      />
                    ))}
                  </Stack>
                </Collapse>
                <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                  <Button
                    size="small"
                    onClick={() => setShowAll((v) => !v)}
                    sx={{ textTransform: "none" }}
                  >
                    {showAll ? "ย่อ" : "ดูเพิ่มเติม"}
                  </Button>
                </Box>
              </>
            )}
          </Box>
        )}
      </TNPCardContent>

      <TNPDivider />

      <Box
        sx={{
          p: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          bgcolor: "background.light",
        }}
      >
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TNPSecondaryButton
            size="medium"
            onClick={onDownloadPDF}
            disabled={data.status !== "approved"}
          >
            ดาวน์โหลด PDF
          </TNPSecondaryButton>
          {canApprove && (
            <Button
              size="medium"
              variant="contained"
              color="success"
              disabled={approving || submitting}
              onClick={async () => {
                try {
                  // If still draft, submit first then approve
                  if (data.status === "draft") {
                    try {
                      await submitQuotation(data.id).unwrap();
                    } catch (e) {
                      /* ignore, may already be pending */
                    }
                  }
                  await approveQuotation({ id: data.id }).unwrap();
                } catch (e) {
                  console.error("Approve failed", e);
                }
              }}
            >
              {approving || submitting ? "กำลังอนุมัติ…" : "อนุมัติ"}
            </Button>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {onCreateInvoice && data.status === "approved" && data.signature_image_url && (
            <TNPPrimaryButton
              size="medium"
              variant="outlined"
              color="primary"
              onClick={onCreateInvoice}
              disabled={creatingInvoice}
            >
              {creatingInvoice ? "กำลังสร้าง..." : actionButtonText || "สร้างใบแจ้งหนี้"}
            </TNPPrimaryButton>
          )}
          <TNPPrimaryButton
            size="medium"
            variant="contained"
            startIcon={<VisibilityIcon />}
            onClick={onViewDetail}
          >
            ดูรายละเอียด
          </TNPPrimaryButton>
        </Box>
      </Box>
    </TNPCard>
  );
};

export default QuotationCard;

// Build Pricing view URL dynamically (mirrors LinkedPricingDialog)
const getPricingViewUrl = (prId) => {
  if (import.meta.env.DEV) {
    return `/pricing/view/${encodeURIComponent(prId)}`;
  }
  const apiBase = import.meta.env.VITE_END_POINT_URL;
  try {
    if (apiBase) {
      const u = new URL(apiBase);
      const cleanedHost = u.host.replace(/^api\./, "").replace(/-api(?=\.|:)/, "");
      return `${u.protocol}//${cleanedHost}/pricing/view/${encodeURIComponent(prId)}`;
    }
  } catch (e) {
    // fallback below
  }
  return `/pricing/view/${encodeURIComponent(prId)}`;
};

// PR row with code + status chip and job name below
const PRRow = ({ prId, items }) => {
  const { data, isLoading } = useGetPricingRequestAutofillQuery(prId, { skip: !prId });
  const pr = data?.data || data || {};
  const prNo = pr.pr_no || pr.pr_number || `#${String(prId).slice(-6)}`;
  const workName = pr.pr_work_name || pr.work_name || "-";
  const [open, setOpen] = React.useState(false);
  const handleToggle = () => setOpen((v) => !v);
  const handleButtonClick = (e) => {
    e.stopPropagation();
  };
  const relatedItems = Array.isArray(items)
    ? items.filter((it) => it?.pricing_request_id === prId || it?.pricing_request_id === pr?.id)
    : [];
  const imgUrl = pr?.pr_image || pr?.image_url || pr?.image;

  // Helper: THB formatting
  const formatTHB = React.useMemo(
    () => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }),
    []
  );

  // Group items by common attributes (รายการ/แพทเทิร์น/ผ้า/สี)
  const grouped = React.useMemo(() => {
    const map = new Map();
    (relatedItems || []).forEach((it, idx) => {
      const name = it.item_name || it.name || "-";
      const pattern = it.pattern || "";
      const fabric = it.fabric_type || it.material || "";
      const color = it.color || "";
      const key = [name, pattern, fabric, color].join("||");
      if (!map.has(key)) {
        map.set(key, {
          key,
          name,
          pattern,
          fabric,
          color,
          rows: [],
        });
      }
      const q =
        typeof it.quantity === "string" ? parseFloat(it.quantity || "0") : Number(it.quantity || 0);
      const p =
        typeof it.unit_price === "string"
          ? parseFloat(it.unit_price || "0")
          : Number(it.unit_price || 0);
      const subtotal = !isNaN(q) && !isNaN(p) ? q * p : 0;
      map.get(key).rows.push({
        id: it.id || `${idx}`,
        size: it.size || "",
        unit_price: isNaN(p) ? 0 : p,
        quantity: isNaN(q) ? 0 : q,
        subtotal: typeof it.subtotal === "number" ? it.subtotal : subtotal,
      });
    });
    return Array.from(map.values()).map((g) => ({
      ...g,
      total: g.rows.reduce((s, r) => s + (Number(r.subtotal) || 0), 0),
      totalQty: g.rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
    }));
  }, [relatedItems]);
  return (
    <Box
      onClick={handleToggle}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        px: 1.25,
        py: 1,
        bgcolor: "background.paper",
        "&:hover": { borderColor: "primary.light", boxShadow: 1 },
        cursor: "pointer",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          minWidth: 0,
        }}
      >
        {/* Left: PR code + job name (two lines) */}
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
            #{prNo.toString().replace(/^#/, "")}
          </Typography>
          <Typography variant="body1" noWrap sx={{ color: "text.secondary", minWidth: 0 }}>
            {isLoading ? "กำลังโหลด…" : workName}
          </Typography>
        </Box>

        {/* Right: Notes button + original link, vertically centered */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
          onClick={(e) => e.stopPropagation()}
        >
          <PricingRequestNotesButton
            pricingRequestId={prId}
            workName={workName}
            size="small"
            showCount={false}
          />
          <Button
            variant="outlined"
            size="small"
            href={getPricingViewUrl(prId)}
            target="_blank"
            rel="noopener"
            sx={{
              textTransform: "none",
              px: 1.25,
              py: 0.25,
              borderRadius: 1.5,
              alignSelf: "center",
            }}
            onClick={handleButtonClick}
          >
            ดูใบงานต้น ฉบับ
          </Button>
        </Box>
      </Box>
      {/* Expanded details */}
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box
          sx={{
            mt: 1,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: imgUrl ? "1fr 160px" : "1fr" },
            gap: 1.25,
          }}
        >
          <Stack spacing={1}>
            {grouped.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                ไม่มีรายละเอียดรายการสำหรับงานนี้
              </Typography>
            )}
            {grouped.map((g, gi) => (
              <Box
                key={g.key || gi}
                sx={{
                  p: 1.25,
                  border: "1px dashed",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  bgcolor: "background.paper",
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
                      {g.name}
                    </Typography>
                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                      {g.pattern && (
                        <Chip size="small" label={`แพทเทิร์น: ${g.pattern}`} variant="outlined" />
                      )}
                      {g.fabric && (
                        <Chip size="small" label={`ผ้า: ${g.fabric}`} variant="outlined" />
                      )}
                      {g.color && <Chip size="small" label={`สี: ${g.color}`} variant="outlined" />}
                    </Stack>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" color="text.secondary">
                      ยอดรวมของงานนี้
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {formatTHB.format(g.total)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      รวมจำนวน {Number(g.totalQty || 0)} ชิ้น
                    </Typography>
                  </Box>
                </Box>
                {/* Per-size rows */}
                <Box>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 1fr 1fr 1.2fr",
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
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textAlign: "right" }}
                    >
                      ราคา/หน่วย
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textAlign: "right" }}
                    >
                      จำนวน
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textAlign: "right" }}
                    >
                      รวม
                    </Typography>
                  </Box>
                  {g.rows.map((r, ri) => (
                    <Box
                      key={r.id || ri}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1fr 1fr 1.2fr",
                        gap: 0.75,
                        py: 0.5,
                        px: 0.75,
                        bgcolor: ri % 2 ? "background.default" : "transparent",
                        borderRadius: 1,
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
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Stack>
          {imgUrl && (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
              <Box
                component="img"
                src={imgUrl}
                alt={workName}
                sx={{
                  maxWidth: 160,
                  maxHeight: 160,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              />
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};
