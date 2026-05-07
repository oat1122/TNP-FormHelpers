import SharedPaymentTermsSection from "../../QuotationDetailDialog/sections/PaymentTermsSection";

/**
 * Payment terms wrapper for QuotationDuplicateDialog.
 *
 * Thin proxy around the shared PaymentTermsSection. Exists to mirror the
 * Invoice section folder pattern and provide a single boundary if duplicate-
 * specific behavior diverges from QuotationDetailDialog later.
 */
const PaymentTermsSection = ({ quotation, formState, financials, setters }) => (
  <SharedPaymentTermsSection
    isEditing={true}
    quotation={quotation}
    formState={formState}
    financials={financials}
    setters={setters}
  />
);

export default PaymentTermsSection;
