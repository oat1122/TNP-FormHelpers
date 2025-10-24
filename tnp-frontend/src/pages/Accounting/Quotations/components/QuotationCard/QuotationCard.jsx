import React from "react";
import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  TNPBodyText,
  TNPCard,
  TNPCardContent,
  TNPCountChip,
  TNPDivider,
  TNPHeading,
  TNPPrimaryButton,
  TNPSecondaryButton,
  TNPStatusChip,
} from "../../../PricingIntegration/components/styles/StyledComponents";
import PRRow from "./subcomponents/PRRow";
import statusColor from "./utils/statusMap";
import useQuotationCardLogic from "./hooks/useQuotationCardLogic";

export default function QuotationCard({
  data,
  onDownloadPDF,
  onViewLinked, // kept for backward compatibility
  onViewDetail,
  onCreateInvoice,
  creatingInvoice,
  actionButtonText,
  onActionSuccess, // ✅ รับ prop ใหม่
}) {
  const {
    companiesLoading,
    updatingCompany,
    approving,
    submitting,
    deleted,
    showAll,
    setShowAll,
    amountText,
    companies,
    canChangeCompany,
    currentCompany,
    canApprove,
    prIds,
    creatorText,
    onChangeCompany,
    onApprove,
  } = useQuotationCardLogic(data, onActionSuccess); // ✅ ส่ง prop ต่อไปให้ hook

  if ((prIds?.length || 0) === 0 || deleted) {
    return null;
  }

  const items = Array.isArray(data?.items) ? data.items : [];

  return (
    <TNPCard>
      <TNPCardContent>
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
              {data?.customer?.cus_company || data?.customer_name || "-"}
            </TNPHeading>
            <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 1, minHeight: 36 }}>
              {canChangeCompany ? (
                <FormControl
                  size="small"
                  sx={{ minWidth: 180 }}
                  disabled={companiesLoading || updatingCompany}
                >
                  <InputLabel id={`company-select-label-${data?.id}`}>บริษัท</InputLabel>
                  <Select
                    labelId={`company-select-label-${data?.id}`}
                    value={
                      companies.find((company) => company.id === data?.company_id)
                        ? data?.company_id
                        : ""
                    }
                    label="บริษัท"
                    onChange={(event) => onChangeCompany(event.target.value)}
                    renderValue={(value) => {
                      const found = companies.find((company) => company.id === value);
                      return found ? found.short_code || found.name : "ไม่ระบุ";
                    }}
                  >
                    {companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {company.short_code || company.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {company.name}
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

        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2.5}>
          <TNPStatusChip
            label={data?.status || "draft"}
            size="small"
            statuscolor={statusColor[data?.status] || "default"}
          />
          <TNPCountChip label={`ยอดรวม: ${amountText}`} size="small" />
          {data?.number && !String(data.number).startsWith("DRAFT-") && (
            <TNPCountChip
              icon={<DescriptionIcon sx={{ fontSize: "1rem" }} />}
              label={data.number}
              size="small"
            />
          )}
        </Stack>

        <TNPBodyText color="text.secondary">ผู้สร้าง: {creatorText}</TNPBodyText>

        {prIds.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Stack spacing={1.2}>
              {prIds.slice(0, 3).map((id) => (
                <PRRow key={id} prId={id} items={items} />
              ))}
            </Stack>
            {prIds.length > 3 && (
              <>
                <Collapse in={showAll}>
                  <Stack spacing={1.2} sx={{ mt: 1 }}>
                    {prIds.slice(3).map((id) => (
                      <PRRow key={id} prId={id} items={items} />
                    ))}
                  </Stack>
                </Collapse>
                <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                  <Button
                    size="small"
                    onClick={() => setShowAll((value) => !value)}
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
            disabled={data?.status !== "approved"}
          >
            ดาวน์โหลด PDF
          </TNPSecondaryButton>
          {canApprove && (
            <Button
              size="medium"
              variant="contained"
              color="success"
              disabled={approving || submitting}
              onClick={onApprove}
            >
              {approving || submitting ? "กำลังอนุมัติ…" : "อนุมัติ"}
            </Button>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {onCreateInvoice && data?.status === "approved" && data?.signature_image_url && (
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
}
