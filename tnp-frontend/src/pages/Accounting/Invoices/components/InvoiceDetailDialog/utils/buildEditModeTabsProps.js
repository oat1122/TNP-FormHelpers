/**
 * Pure factory — รวม props ของ EditModeTabs ทั้ง 5 แท็บ + sideEditProps
 * จาก state/derived values ของ shell.
 *
 * รับ 4 bag objects เพื่อลด argument noise + ทำให้ shell เรียกสั้นลง:
 *  - mode      : flags เกี่ยวกับโหมด (isEditing, canEdit, ฯลฯ)
 *  - data      : derived/server data (invoice, customer, items, calc, validation)
 *  - handlers  : event handlers ของ form/items
 *  - sideState : per-side edit state (มัดจำก่อน/หลัง)
 */
export const buildEditModeTabsProps = ({ mode, data, handlers, sideState }) => {
  const { initialEditMode, isEditing, canEditInvoice, lockedReadOnly, setIsEditing } = mode;
  const {
    customer,
    customerDataSource,
    formData,
    invoice,
    depositMode,
    editableItems,
    items,
    calculation,
    validation,
    notes,
    companies,
    loadingCompanies,
    discountTypeState,
    currentUser,
  } = data;
  const {
    handleFieldChange,
    handleCustomerDataSourceChange,
    handleAddSizeRow,
    handleChangeSizeRow,
    handleRemoveSizeRow,
    handleDeleteItem,
    handleChangeItem,
    setDiscountTypeState,
    setNotes,
  } = handlers;
  const { sideEdit, sideValidation, activeSideTab, setActiveSideTab } = sideState;

  return {
    initialTab: initialEditMode ? "customer" : "overview",
    sectionProps: {
      overview: { customer, customerDataSource, formData, invoice, depositMode },
      customer: {
        isEditing,
        customerDataSource,
        handleCustomerDataSourceChange,
        customer,
        formData,
        invoice,
        depositMode,
        editableItems,
        handleFieldChange,
        companies,
        loadingCompanies,
      },
      calculation: {
        isEditing,
        setIsEditing: canEditInvoice && !lockedReadOnly ? setIsEditing : undefined,
        validation,
        items,
        editableItems,
        handleAddSizeRow,
        handleChangeSizeRow,
        handleRemoveSizeRow,
        handleDeleteItem,
        handleChangeItem,
        formData,
        handleFieldChange,
        calculation,
        discountTypeState,
        setDiscountTypeState,
      },
      paymentTerms: {
        isEditing,
        formData,
        handleFieldChange,
        calculation,
        notes,
        setNotes,
        invoice,
        paidBeforeOverride: sideEdit.beforeFormData.paid_amount_before,
        paidAfterOverride: sideEdit.afterFormData.paid_amount_after,
      },
      evidence: {
        invoice,
        currentUserRole: currentUser?.role,
        readOnly: false,
      },
    },
    sideEditProps: {
      invoice,
      beforeFormData: sideEdit.beforeFormData,
      afterFormData: sideEdit.afterFormData,
      setBeforeField: isEditing ? sideEdit.setBeforeField : undefined,
      setAfterField: isEditing ? sideEdit.setAfterField : undefined,
      dirtyBefore: sideEdit.dirtyBefore,
      dirtyAfter: sideEdit.dirtyAfter,
      warnings: sideValidation.warnings,
      activeTab: activeSideTab,
      onTabChange: setActiveSideTab,
      readOnly: !isEditing,
    },
  };
};
