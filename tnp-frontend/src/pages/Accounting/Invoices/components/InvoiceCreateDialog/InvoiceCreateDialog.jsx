import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";

import { useInvoiceCreateForm } from "./hooks/useInvoiceCreateForm";
import { useInvoiceCreateValidation } from "./hooks/useInvoiceCreateValidation";
import CustomerSection from "./sections/CustomerSection";
import DepositSection from "./sections/DepositSection";
import ItemsCalculationSection from "./sections/ItemsCalculationSection";
import PaymentSection from "./sections/PaymentSection";
import CreateModeTabs from "./subcomponents/CreateModeTabs";
import DialogHeader from "./subcomponents/DialogHeader";
import ValidationBanner from "./subcomponents/ValidationBanner";
import { buildInvoiceCreatePayload, buildInvoiceItems } from "./utils/invoiceCreatePayload";
import {
  useGetQuotationQuery,
  useCreateInvoiceFromQuotationMutation,
} from "../../../../../features/Accounting/accountingApi";
import { useQuotationGroups } from "../../../Quotations/hooks/useQuotationGroups";
import {
  getAllPrIdsFromQuotation,
  normalizeAndGroupItems,
} from "../../../Quotations/utils/quotationUtils";
import { useQuotationFinancials } from "../../../shared/hooks/useQuotationFinancials";
import { showSuccess, showError, showLoading, dismissToast } from "../../../utils/accountingToast";

/**
 * InvoiceCreateDialog — composition shell.
 *
 * Owns: dialog open/close, source quotation fetch, items + financials hooks,
 * proactive validation, tab state, save flow. All section markup lives in
 * `./sections/*.jsx`; form state in `./hooks/useInvoiceCreateForm.js`.
 *
 * Mode-aware: `mode="create" | "edit-create"` (forwarded to DialogHeader).
 * Save button is disabled when validation has blocking errors — tooltip
 * surfaces the first reason so user knows where to look.
 */
const InvoiceCreateDialog = ({
  open,
  onClose,
  quotationId,
  onCreated,
  onCancel,
  mode = "create",
}) => {
  const { data, isLoading, isFetching } = useGetQuotationQuery(quotationId, { skip: !quotationId });
  const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceFromQuotationMutation();

  const { q, customer, formState, setters } = useInvoiceCreateForm(data);

  const prIdsAll = React.useMemo(() => getAllPrIdsFromQuotation(q), [q]);
  const items = React.useMemo(() => {
    const allItems = normalizeAndGroupItems(q, prIdsAll);
    return allItems.filter(
      (item) =>
        item.sizeRows &&
        item.sizeRows.length > 0 &&
        item.sizeRows.some((row) => row.quantity > 0 || row.unitPrice > 0 || row.size)
    );
  }, [q, prIdsAll]);
  const { groups, onChangeRow, onChangeGroup } = useQuotationGroups(items);

  const financials = useQuotationFinancials({
    items: groups,
    pricingMode: formState.pricingMode,
    depositMode: formState.deposit.mode,
    depositPercentage: formState.deposit.percentage,
    depositAmountInput: formState.deposit.amountInput,
    specialDiscountType: formState.specialDiscount.type,
    specialDiscountValue: formState.specialDiscount.value,
    hasWithholdingTax: formState.withholding.enabled,
    withholdingTaxPercentage: formState.withholding.percentage,
    hasVat: formState.vat.enabled,
    vatPercentage: formState.vat.percentage,
  });

  const { issues, hasBlockingErrors, blockingReason } = useInvoiceCreateValidation({
    groups,
    formState,
    financials,
    sourceQuotation: q,
  });

  const [previewImage, setPreviewImage] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("items");
  const signatureImages = Array.isArray(q?.signature_images) ? q.signature_images : [];

  const handleClose = () => (onCancel ?? onClose)?.();

  const handleCreate = async () => {
    if (!q?.id) return;
    const loadingId = showLoading("กำลังสร้างใบแจ้งหนี้…");
    try {
      const payload = buildInvoiceCreatePayload({
        sourceQuotation: q,
        customer,
        items: buildInvoiceItems(groups),
        financials,
        formState,
      });
      const res = await createInvoice(payload).unwrap();
      dismissToast(loadingId);
      showSuccess("สร้างใบแจ้งหนี้เรียบร้อยแล้ว");
      onCreated?.(res);
      onClose?.();
    } catch (e) {
      dismissToast(loadingId);
      showError(e?.data?.message || e?.message || "สร้างใบแจ้งหนี้ไม่สำเร็จ");
    }
  };

  const panels = {
    customer: (
      <CustomerSection
        customer={customer}
        isEditingAddress={formState.billing.isEditing}
        customAddress={formState.billing.customAddress}
        onToggleEditAddress={setters.setIsEditingAddress}
        onChangeAddress={setters.setCustomAddress}
        documentHeaderType={formState.documentHeader.type}
        customHeaderType={formState.documentHeader.custom}
        onChangeHeaderType={setters.setDocumentHeaderType}
        onChangeCustomHeaderType={setters.setCustomHeaderType}
      />
    ),
    items: (
      <ItemsCalculationSection
        groups={groups}
        onChangeRow={onChangeRow}
        onChangeGroup={onChangeGroup}
        formState={formState}
        setters={setters}
        financials={financials}
      />
    ),
    deposit: <DepositSection formState={formState} setters={setters} financials={financials} />,
    payment: (
      <PaymentSection
        notes={formState.notes}
        onChangeNotes={setters.setNotes}
        signatureImages={signatureImages}
        onPreviewImage={setPreviewImage}
      />
    ),
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg" scroll="paper">
        <DialogHeader
          mode={mode}
          sourceQuotation={q}
          customerName={customer?.cus_company}
          finalTotal={financials.finalTotal}
          onClose={handleClose}
        />
        <CreateModeTabs activeTab={activeTab} onChange={setActiveTab} />
        <DialogContent dividers={false} sx={{ p: 2, bgcolor: "grey.50", minHeight: "60vh" }}>
          {isLoading || isFetching ? (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : !q?.id ? (
            <Typography color="text.secondary">ไม่พบใบเสนอราคาที่เลือก</Typography>
          ) : (
            <>
              <ValidationBanner issues={issues} />
              {panels[activeTab]}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={isCreating} variant="outlined" size="large">
            ปิด
          </Button>
          {(() => {
            const isDisabled = isCreating || !q?.id || hasBlockingErrors;
            const buttonText = isCreating ? "กำลังสร้าง…" : "สร้างใบแจ้งหนี้";
            const button = (
              <Button
                onClick={handleCreate}
                disabled={isDisabled}
                variant="contained"
                size="large"
                sx={{ minWidth: 120 }}
              >
                {buttonText}
              </Button>
            );
            if (hasBlockingErrors && blockingReason) {
              return (
                <Tooltip title={blockingReason} arrow placement="top">
                  <span>{button}</span>
                </Tooltip>
              );
            }
            return button;
          })()}
        </DialogActions>
      </Dialog>

      <Dialog open={!!previewImage} onClose={() => setPreviewImage(null)} maxWidth="md" fullWidth>
        <DialogTitle>{previewImage?.filename || "ดูรูปภาพ"}</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
            }}
          >
            {previewImage && (
              <img
                src={previewImage.url}
                alt={previewImage.filename}
                style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewImage(null)}>ปิด</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InvoiceCreateDialog;
