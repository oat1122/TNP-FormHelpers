import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import { useMemo } from "react";

import CustomerSection from "./sections/CustomerSection";
import NotesSection from "./sections/NotesSection";
import SenderCompanySection from "./sections/SenderCompanySection";
import WorkItemsSection from "./sections/WorkItemsSection";
import InvoiceSummaryCard from "./subcomponents/InvoiceSummaryCard";
import SourceAlert from "./subcomponents/SourceAlert";
import { normalizeInvoiceCustomer } from "./utils/createCustomerNormalize";
import {
  useCreateDeliveryNoteMutation,
  useGetCompaniesQuery,
  useGetInvoiceQuery,
} from "../../../../../features/Accounting/accountingApi";
import LoadingState from "../../../PricingIntegration/components/LoadingState";
import { tokens } from "../../../PricingIntegration/components/styles/quotationFormStyles";
import { useDeliveryNoteForm } from "../../hooks/useDeliveryNoteForm";
import { useDeliveryNoteItems } from "../../hooks/useDeliveryNoteItems";
import { useSubmitDeliveryNote } from "../../hooks/useSubmitDeliveryNote";

/**
 * DeliveryNoteCreateDialog — composition shell.
 *
 * Responsibilities (orchestration only):
 *   - fetch invoice (เมื่อมี source.invoice_id) + companies
 *   - delegate form state / items state / submit ไปยัง hooks ที่มีอยู่แล้ว
 *   - compose 4 sections: Customer / Sender / Notes / WorkItems
 *
 * Business logic / inline JSX กลุ่มใหญ่ทั้งหมดถูกย้ายไปยัง sections + subcomponents.
 */
const DeliveryNoteCreateDialog = ({ open, onClose, onCreated, source }) => {
  const invoiceId = source?.invoice_id;
  const { data: invoiceData, isFetching: invoiceLoading } = useGetInvoiceQuery(invoiceId, {
    skip: !open || !invoiceId,
  });

  const invoice = useMemo(() => invoiceData?.data || invoiceData || null, [invoiceData]);

  const { data: companiesResp, isLoading: companiesLoading } = useGetCompaniesQuery(undefined, {
    skip: !open,
  });

  const companies = useMemo(() => {
    const list = companiesResp?.data ?? companiesResp ?? [];
    return Array.isArray(list) ? list : [];
  }, [companiesResp]);

  const [createDeliveryNote, { isLoading: creating }] = useCreateDeliveryNoteMutation();

  const customer = useMemo(() => normalizeInvoiceCustomer(invoice), [invoice]);

  const { formState, handleChange, customerDataSource, handleCustomerDataSourceChange } =
    useDeliveryNoteForm(open, source, invoice, customer);

  const { editableItems, handleUpdateItems } = useDeliveryNoteItems();

  const { handleSubmit } = useSubmitDeliveryNote(
    createDeliveryNote,
    formState,
    invoice,
    customer,
    customerDataSource,
    source,
    editableItems,
    onCreated
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>สร้างใบส่งของ</DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {invoiceLoading && <LoadingState message="Loading invoice details..." />}

        {!invoiceLoading && (
          <Stack spacing={3} sx={{ p: 3 }}>
            <SourceAlert source={source} />

            <CustomerSection
              customerDataSource={customerDataSource}
              onCustomerDataSourceChange={handleCustomerDataSourceChange}
              customer={customer}
              formState={formState}
              onFieldChange={handleChange}
            />

            <SenderCompanySection
              formState={formState}
              onFieldChange={handleChange}
              companies={companies}
              companiesLoading={companiesLoading}
            />

            <NotesSection formState={formState} onFieldChange={handleChange} />

            <WorkItemsSection
              invoice={invoice}
              formState={formState}
              source={source}
              onFieldChange={handleChange}
              onUpdateItems={handleUpdateItems}
            />

            <InvoiceSummaryCard invoice={invoice} />
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={creating}>
          ยกเลิก
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={creating}
          sx={{
            bgcolor: tokens.primary,
            "&:hover": { bgcolor: "#7A0E0E" },
          }}
        >
          {creating ? "กำลังบันทึก..." : "สร้างใบส่งของ"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeliveryNoteCreateDialog;
