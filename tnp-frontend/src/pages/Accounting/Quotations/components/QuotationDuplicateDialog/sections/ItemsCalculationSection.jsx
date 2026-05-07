import FinancialControlsSection from "../../QuotationDetailDialog/sections/FinancialControlsSection";
import PRGroupsSection from "../../QuotationDetailDialog/sections/PRGroupsSection";

/**
 * Items + Calculation section wrapper for QuotationDuplicateDialog.
 *
 * Composes the shared PRGroupsSection (work items) and FinancialControlsSection
 * (discount / withholding / VAT / pricing mode / summary) into a single
 * organizational unit. Shared sections are NOT modified — this wrapper exists
 * to keep the main dialog file slim and to mirror the Invoice section folder
 * pattern (matches `Invoices/components/InvoiceDetailDialog/sections/`).
 *
 * Future: when shared sections get refactored, this wrapper is the boundary
 * to swap in duplicate-specific layouts (sticky summary, collapsible cards,
 * etc.) without touching the main dialog.
 */
const ItemsCalculationSection = ({
  customer,
  workName,
  items,
  groups,
  prAutofillMap,
  canEdit,
  onEditCustomer,
  onAddNewGroup,
  groupHandlers,
  formState,
  setters,
  financials,
  hideCustomerCard = false,
}) => {
  return (
    <PRGroupsSection
      customer={customer}
      workName={workName}
      quotationNumber=""
      items={items}
      activeGroups={groups}
      prAutofillMap={prAutofillMap}
      isEditing={true}
      canEdit={canEdit}
      onEditCustomer={onEditCustomer}
      onAddNewGroup={onAddNewGroup}
      groupHandlers={groupHandlers}
      hideCustomerCard={hideCustomerCard}
      financialControlsNode={
        <FinancialControlsSection
          isEditing={true}
          financials={financials}
          formState={formState}
          setters={setters}
        />
      }
    />
  );
};

export default ItemsCalculationSection;
