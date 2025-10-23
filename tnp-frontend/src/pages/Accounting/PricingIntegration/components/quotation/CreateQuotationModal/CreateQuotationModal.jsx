import {
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Close as CloseIcon,
  CheckCircleOutline as CheckCircleIcon,
  RadioButtonUnchecked as UncheckIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
  Avatar,
  Tooltip,
  IconButton,
  Badge,
  LinearProgress,
} from "@mui/material";
import React, { useEffect, useState } from "react";

import useCustomerPricingRequests from "../hooks/useCustomerPricingRequests";
import {
  Section,
  SectionHeader,
  PrimaryButton,
  SecondaryButton,
  InfoCard,
  tokens,
} from "../styles/quotationTheme";

const CreateQuotationModal = ({ open, onClose, pricingRequest, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [selectedPricingItems, setSelectedPricingItems] = useState([]);

  const {
    list: customerPricingRequests,
    isLoading,
    fetchForCustomer,
  } = useCustomerPricingRequests();

  useEffect(() => {
    if (open && pricingRequest?.customer?.cus_id) {
      const endpoint = import.meta.env.VITE_END_POINT_URL;
      fetchForCustomer(pricingRequest.customer.cus_id, pricingRequest.pr_id, true, endpoint).then(
        ({ defaultSelected }) => setSelectedPricingItems(defaultSelected)
      );
    }
  }, [open, pricingRequest, fetchForCustomer]);

  const toggleSelect = (prId) =>
    setSelectedPricingItems((prev) =>
      prev.includes(prId) ? prev.filter((id) => id !== prId) : [...prev, prId]
    );

  const handleSubmit = async () => {
    if (selectedPricingItems.length === 0) return alert("กรุณาเลือกอย่างน้อย 1 งาน");
    setIsSubmitting(true);
    try {
      const validSelections = customerPricingRequests.filter((item) =>
        selectedPricingItems.includes(item.pr_id)
      );

      // *** เพิ่ม customer ใน validSelections เพื่อให้ Form ได้ข้อมูลครบ ***
      const selectionsWithCustomer = validSelections.map((item) => ({
        ...item,
        customer: pricingRequest?.customer || item.customer || {},
      }));

      const submitData = {
        pricingRequestIds: selectedPricingItems,
        customerId: pricingRequest?.customer?.cus_id,
        additional_notes: additionalNotes,
        selectedRequestsData: selectionsWithCustomer,
        customer: pricingRequest?.customer, // *** ส่ง customer กลับไปด้วย ***
      };
      await onSubmit?.(submitData);
      onClose();
      setAdditionalNotes("");
      setSelectedPricingItems([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTotal = customerPricingRequests
    .filter((x) => selectedPricingItems.includes(x.pr_id))
    .reduce((s, it) => s + (it.pr_quantity || 0), 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} fullWidth>
      <DialogTitle sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              sx={{
                bgcolor: tokens.primary,
                color: tokens.white,
                width: 28,
                height: 28,
              }}
            >
              <BusinessIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                สร้างใบเสนอราคา
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {pricingRequest?.customer?.cus_company}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="ปิด">
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: "relative" }}>
        {isLoading && <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0 }} />}

        <Box sx={{ p: 3 }}>
          <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
            เลือกงานที่ต้องการสร้างใบเสนอราคา (เลือกได้หลายงานรวมใบเดียว)
          </Alert>

          <InfoCard sx={{ p: 2, mb: 2 }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={1}>
              <Avatar
                sx={{
                  bgcolor: tokens.primary,
                  color: tokens.white,
                  width: 28,
                  height: 28,
                }}
              >
                <BusinessIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
                  ข้อมูลลูกค้า
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Customer Information
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  บริษัทลูกค้า
                </Typography>
                <Typography fontWeight={600}>{pricingRequest?.customer?.cus_company}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  เลขประจำตัวผู้เสียภาษี
                </Typography>
                <Typography>{pricingRequest?.customer?.cus_tax_id}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  ที่อยู่
                </Typography>
                <Typography variant="body2">{pricingRequest?.customer?.cus_address}</Typography>
              </Grid>
            </Grid>
          </InfoCard>

          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Avatar
                  sx={{
                    bgcolor: tokens.primary,
                    color: tokens.white,
                    width: 28,
                    height: 28,
                  }}
                >
                  <AssignmentIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
                    เลือกงานที่ต้องการสร้างใบเสนอราคา
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Select jobs to create quotation
                  </Typography>
                </Box>
              </Box>
              {selectedTotal > 0 && (
                <Chip
                  icon={<CheckCircleIcon />}
                  label={`รวม ${selectedTotal} ชิ้น`}
                  color="success"
                  variant="outlined"
                />
              )}
            </Box>

            {isLoading ? (
              <Box sx={{ py: 2 }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={96}
                    sx={{ borderRadius: 1.5, mb: 1 }}
                  />
                ))}
              </Box>
            ) : (
              <Box sx={{ maxHeight: 420, overflowY: "auto", pr: 1 }}>
                {customerPricingRequests.map((item, index) => {
                  const selected = selectedPricingItems.includes(item.pr_id);
                  return (
                    <Card
                      key={item.pr_id}
                      variant="outlined"
                      sx={{ mb: 1, opacity: item.is_quoted ? 0.5 : 1 }}
                      onClick={() => !item.is_quoted && toggleSelect(item.pr_id)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box sx={{ flex: 1 }}>
                            <Box display="flex" alignItems="center" gap={1.25} mb={1}>
                              <Avatar
                                sx={{
                                  bgcolor: selected ? tokens.primary : "#E5E7EB",
                                  color: selected ? tokens.white : "#6B7280",
                                  width: 28,
                                  height: 28,
                                }}
                              >
                                {index + 1}
                              </Avatar>
                              <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                color={selected ? tokens.primary : "inherit"}
                              >
                                {item.pr_work_name}
                              </Typography>
                            </Box>
                            <Grid container spacing={1.25}>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  ลาย/แบบ
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {item.pr_pattern || "-"}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  วัสดุ
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {item.pr_fabric_type || "-"}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  จำนวน
                                </Typography>
                                <Typography variant="body2" fontWeight={700} color={tokens.primary}>
                                  {item.pr_quantity} ชิ้น
                                </Typography>
                              </Grid>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  กำหนดส่ง
                                </Typography>
                                <Typography variant="body2">
                                  {item.pr_due_date
                                    ? new Date(item.pr_due_date).toLocaleDateString("th-TH")
                                    : "-"}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                          <Tooltip
                            title={
                              item.is_quoted
                                ? "มีใบเสนอราคาแล้ว"
                                : selected
                                  ? "ยกเลิกการเลือก"
                                  : "เลือกงานนี้"
                            }
                          >
                            <span>
                              <IconButton
                                disabled={item.is_quoted}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelect(item.pr_id);
                                }}
                              >
                                {selected ? <CheckCircleIcon /> : <UncheckIcon />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                        {item.is_quoted && (
                          <Chip
                            label="มีใบเสนอราคาแล้ว"
                            color="warning"
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Box>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="หมายเหตุเพิ่มเติม"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="หมายเหตุเพิ่มเติมสำหรับใบเสนอราคา…"
            sx={{ mt: 2 }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
          <Typography variant="caption" color="text.secondary">
            {selectedPricingItems.length > 0 &&
              `เลือกแล้ว ${selectedPricingItems.length} งาน จากทั้งหมด ${customerPricingRequests.length} งาน`}
          </Typography>
          <Box display="flex" gap={1}>
            <Button onClick={onClose} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <PrimaryButton
              onClick={handleSubmit}
              disabled={isSubmitting || selectedPricingItems.length === 0}
              startIcon={<AssignmentIcon />}
            >
              {isSubmitting
                ? "กำลังสร้าง…"
                : `สร้างใบเสนอราคา (${selectedPricingItems.length} งาน)`}
            </PrimaryButton>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default CreateQuotationModal;
