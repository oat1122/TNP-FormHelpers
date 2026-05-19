import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";
import { useMemo } from "react";

import { useEditNoteFormState } from "./hooks/useEditNoteFormState";
import { useEditPermission } from "./hooks/useEditPermission";
import { useGroupedNoteItems } from "./hooks/useGroupedNoteItems";
import CustomerSection from "./sections/CustomerSection";
import ItemsSection from "./sections/ItemsSection";
import NotesSection from "./sections/NotesSection";
import SenderCompanySection from "./sections/SenderCompanySection";
import InvoiceSummaryCard from "./subcomponents/InvoiceSummaryCard";
import { buildMasterContactName, normalizeMasterCustomer } from "./utils/contactNameUtils";
import { EDITABLE_STATUS } from "./utils/editDialogConstants";
import {
  useGetCompaniesQuery,
  useGetDeliveryNoteQuery,
  useUpdateDeliveryNoteMutation,
} from "../../../../../features/Accounting/accountingApi";
import { tokens } from "../../../PricingIntegration/components/styles/quotationFormStyles";
import { useSubmitUpdateDeliveryNote } from "../../hooks/useSubmitUpdateDeliveryNote";

/**
 * DeliveryNoteEditDialog — composition shell.
 *
 * Responsibilities (orchestration only):
 *   - fetch note + companies
 *   - delegate form state / permission / grouped items ไปยัง hooks
 *   - compose section components ทั้ง 4 ส่วน (Customer/Sender/Items/Notes)
 *   - กดบันทึก → useSubmitUpdateDeliveryNote
 *
 * Logic/UI ลึก ๆ ทั้งหมดอยู่ใน sections/, subcomponents/, hooks/, utils/.
 */
const DeliveryNoteEditDialog = ({ open, onClose, deliveryNoteId, onUpdated }) => {
  const { canEdit } = useEditPermission();

  const { data: noteResp, isLoading } = useGetDeliveryNoteQuery(deliveryNoteId, {
    skip: !open || !deliveryNoteId,
  });
  const note = useMemo(() => noteResp?.data || noteResp || null, [noteResp]);

  const { data: companiesResp, isLoading: companiesLoading } = useGetCompaniesQuery(undefined, {
    skip: !open,
  });
  const companies = useMemo(() => {
    const list = companiesResp?.data ?? companiesResp ?? [];
    return Array.isArray(list) ? list : [];
  }, [companiesResp]);

  const [updateDeliveryNote, { isLoading: saving }] = useUpdateDeliveryNoteMutation();

  const {
    formState,
    customerDataSource,
    notesSource,
    handleFieldChange,
    handleCustomerDataSourceChange,
    handleNotesSourceChange,
  } = useEditNoteFormState(note);

  const { groups, setGroups } = useGroupedNoteItems(note);

  // Master customer derivations (memoized — depend on `note?.customer`)
  const masterCustomer = useMemo(() => normalizeMasterCustomer(note?.customer), [note?.customer]);
  const masterContactName = useMemo(() => buildMasterContactName(note?.customer), [note?.customer]);

  const { handleUpdate } = useSubmitUpdateDeliveryNote(
    updateDeliveryNote,
    note,
    formState,
    groups,
    customerDataSource
  );

  const handleSave = async () => {
    const ok = await handleUpdate();
    if (ok) {
      onUpdated?.();
      onClose?.();
    }
  };

  const invoiceNumber = note?.invoice_number || note?.invoice?.number;
  const isLockedStatus = note && note.status !== EDITABLE_STATUS;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>ดู / แก้ไข ใบส่งของ</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {isLoading ? (
          <Box sx={{ p: 3 }}>กำลังโหลดข้อมูล...</Box>
        ) : !note ? (
          <Box sx={{ p: 3 }}>ไม่พบข้อมูลใบส่งของ</Box>
        ) : (
          <Stack spacing={3} sx={{ p: 3 }}>
            {isLockedStatus && (
              <Alert severity="info">
                ใบส่งของอยู่ในสถานะ <strong>{note.status}</strong> จะแก้ไขไม่ได้
              </Alert>
            )}
            {invoiceNumber ? (
              <Alert severity="info">
                ใบแจ้งหนี้ที่เกี่ยวข้อง: <strong>{invoiceNumber}</strong>
              </Alert>
            ) : null}

            <CustomerSection
              customerDataSource={customerDataSource}
              onCustomerDataSourceChange={handleCustomerDataSourceChange}
              masterCustomer={masterCustomer}
              masterContactName={masterContactName}
              manager={note?.manager}
              formState={formState}
              onFieldChange={handleFieldChange}
              canEdit={canEdit}
            />

            <SenderCompanySection
              formState={formState}
              onFieldChange={handleFieldChange}
              companies={companies}
              companiesLoading={companiesLoading}
              canEdit={canEdit}
            />

            <ItemsSection
              groups={groups}
              setGroups={setGroups}
              invoiceNumber={invoiceNumber}
              canEdit={canEdit}
            />

            <NotesSection
              notesSource={notesSource}
              onNotesSourceChange={handleNotesSourceChange}
              formState={formState}
              onFieldChange={handleFieldChange}
              canEdit={canEdit}
            />

            <InvoiceSummaryCard invoice={note?.invoice} />
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving}>
          {canEdit ? "ยกเลิก" : "ปิด"}
        </Button>
        {canEdit && (
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || isLockedStatus}
            sx={{ bgcolor: tokens.primary, "&:hover": { bgcolor: "#7A0E0E" } }}
          >
            {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DeliveryNoteEditDialog;
