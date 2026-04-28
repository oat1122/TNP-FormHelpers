import {
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo } from "react";

import { useQuotationDuplicateDialogLogic } from "./hooks/useQuotationDuplicateDialogLogic";
import { useQuotationDuplicateSave } from "./hooks/useQuotationDuplicateSave";
import { useGetBulkPricingRequestAutofillQuery } from "../../../../../features/Accounting/accountingApi";
import CustomerEditDialog from "../../../PricingIntegration/components/CustomerEditDialog";
import { useCurrentUser } from "../../../shared/hooks/useCurrentUser";
import { useQuotationFinancials } from "../../../shared/hooks/useQuotationFinancials";
import { SecondaryButton, tokens } from "../../../shared/styles/quotationFormStyles";
import { useQuotationDialogFinancialsInit } from "../QuotationDetailDialog/hooks/useQuotationDialogFinancialsInit";
import FinancialControlsSection from "../QuotationDetailDialog/sections/FinancialControlsSection";
import PaymentTermsSection from "../QuotationDetailDialog/sections/PaymentTermsSection";
import PRGroupsSection from "../QuotationDetailDialog/sections/PRGroupsSection";
import { useQuotationGroups } from "../shared/hooks/useQuotationGroups";
import { getAllPrIdsFromQuotation, normalizeAndGroupItems } from "../shared/utils/quotationUtils";

const EDIT_ROLES = ["admin", "account"];

const QuotationDuplicateDialog = ({ open, onClose, initialData, onSaveSuccess }) => {
  const { currentUser } = useCurrentUser();
  const canEditCustomer = EDIT_ROLES.includes(currentUser?.role);

  const { q, customer, editCustomerOpen, formState, setters } =
    useQuotationDuplicateDialogLogic(initialData);

  useQuotationDialogFinancialsInit({ quotation: q, open, setters });

  const prIdsAll = getAllPrIdsFromQuotation(q);
  const items = normalizeAndGroupItems(q, prIdsAll);

  const { data: bulkAutofillData, isLoading: isAutofillLoading } =
    useGetBulkPricingRequestAutofillQuery(prIdsAll, {
      skip: !open || prIdsAll.length === 0,
    });

  const prAutofillMap = useMemo(() => {
    const map = new Map();
    (bulkAutofillData?.data || []).forEach((item) => {
      const key = item.pr_id || item.id;
      if (key) map.set(key, item);
    });
    return map;
  }, [bulkAutofillData]);

  const groupsLogic = useQuotationGroups(items);
  const { groups, setIsEditing, ...groupHandlers } = groupsLogic;

  // Duplicate dialog is always in edit mode — force it once groups are ready.
  useEffect(() => {
    if (open) setIsEditing(true);
  }, [open, setIsEditing]);

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

  const saveFlow = useQuotationDuplicateSave({
    sourceQuotation: q,
    customer,
    formState,
    onSuccess: () => {
      onSaveSuccess?.();
      onClose();
    },
  });

  const handleSave = useCallback(async () => {
    await saveFlow.handleSave(groups, financials);
  }, [saveFlow, groups, financials]);

  if (prIdsAll.length > 0 && isAutofillLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Box display="flex" alignItems="center" gap={1} p={2}>
            <CircularProgress size={22} />
            <Typography variant="body2">กำลังโหลดข้อมูล autofill…</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        สร้างใบเสนอราคา (สำเนา)
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2, bgcolor: tokens.bg }}>
        <Box>
          <Grid container spacing={2}>
            <PRGroupsSection
              customer={customer}
              workName={q.work_name || q.workname || q.title || ""}
              quotationNumber=""
              items={items}
              activeGroups={groups}
              prAutofillMap={prAutofillMap}
              isEditing={true}
              canEdit={canEditCustomer}
              onEditCustomer={() => setters.setEditCustomerOpen(true)}
              onAddNewGroup={groupHandlers.onAddNewGroup}
              groupHandlers={groupHandlers}
              financialControlsNode={
                <FinancialControlsSection
                  isEditing={true}
                  financials={financials}
                  formState={formState}
                  setters={setters}
                />
              }
            />

            <PaymentTermsSection
              isEditing={true}
              quotation={q}
              formState={formState}
              financials={financials}
              setters={setters}
            />
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <SecondaryButton disabled title="สามารถดู PDF ได้หลังจากสร้างใบเสนอราคาแล้ว">
          (ดู PDF หลังสร้าง)
        </SecondaryButton>
        <SecondaryButton onClick={onClose} disabled={saveFlow.isSaving}>
          ยกเลิก
        </SecondaryButton>
        <SecondaryButton onClick={handleSave} disabled={saveFlow.isSaving}>
          {saveFlow.isSaving ? "กำลังสร้าง…" : "สร้างใบเสนอราคา"}
        </SecondaryButton>
      </DialogActions>

      <CustomerEditDialog
        open={editCustomerOpen}
        onClose={() => setters.setEditCustomerOpen(false)}
        customer={customer}
        onUpdated={(c) => {
          setters.setCustomer(c);
          setters.setEditCustomerOpen(false);
        }}
      />
    </Dialog>
  );
};

export default QuotationDuplicateDialog;
