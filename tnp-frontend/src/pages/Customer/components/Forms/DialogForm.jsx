import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useState, useEffect, useRef, useContext } from "react";
import { MdSave, MdCancel, MdClose, MdSwapHoriz, MdHistory } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";

// Form Tab and Part components (relative to this file in Forms/)
import { CustomerFormTabs, FormSummaryPreview } from "./parts";
import { EssentialInfoTab, AdditionalInfoTab } from "./tabs";
import DuplicatePhoneDialog from "./DuplicatePhoneDialog";

// Common components
import { QuickActionsBar } from "../Common";

// Data display components
import { ScrollContext } from "../DataDisplay";

// Transfer components
import { TransferToSalesDialog, TransferToOnlineDialog, TransferHistoryDialog } from "../transfer";

// Constants (relative path from Forms/)
import { canUserTransfer, TRANSFER_DIRECTIONS } from "../../constants/customerChannel";

// Hooks (relative path from Forms/)
import {
  useDialogApiData,
  useDuplicateCheck,
  useStepperValidation,
  useCustomerFormHandler,
  useCustomerInitializer,
  useCustomerSubmit,
} from "../../hooks";

// Shared components
import BusinessTypeManager from "../../../../components/BusinessTypeManager";

// Redux
import { resetInputList } from "../../../../features/Customer/customerSlice";

/**
 * DialogForm - Customer form dialog with 2-tab layout
 * Tab 1: Essential Info (required fields)
 * Tab 2: Additional Info (optional fields like address, notes)
 */
function DialogForm(props) {
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("userData"));
  const inputList = useSelector((state) => state.customer.inputList);
  const itemList = useSelector((state) => state.customer.itemList);
  const mode = useSelector((state) => state.customer.mode);
  const groupList = useSelector((state) => state.customer.groupList);

  // Local state
  const [isBusinessTypeManagerOpen, setIsBusinessTypeManagerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = Essential, 1 = Additional

  // Transfer dialog states (view mode only)
  const [transferToSalesOpen, setTransferToSalesOpen] = useState(false);
  const [transferToOnlineOpen, setTransferToOnlineOpen] = useState(false);
  const [transferHistoryOpen, setTransferHistoryOpen] = useState(false);

  // Refs
  const formRef = useRef(null);

  // Context
  const { scrollToTop } = useContext(ScrollContext);

  // ========== Custom hooks ==========

  // Validation hook
  const { errors, setErrors, clearFieldError, clearAllErrors } = useStepperValidation();

  // Dialog API data hook
  const {
    provincesList,
    districtList,
    subDistrictList,
    salesList,
    businessTypesList,
    businessTypesIsFetching,
    // Location handlers (Autocomplete)
    handleProvinceChange,
    handleDistrictChange,
    handleSubdistrictChange,
    isLoadingDistricts,
    isLoadingSubdistricts,
  } = useDialogApiData(props.openDialog);

  // Duplicate check hook
  const {
    duplicatePhoneDialogOpen,
    duplicatePhoneData,
    companyWarning,
    checkPhoneDuplicate,
    checkCompanyDuplicate,
    closeDuplicatePhoneDialog,
    clearCompanyWarning,
    clearDuplicatePhoneData,
    resetDuplicateChecks,
  } = useDuplicateCheck({
    mode,
    currentCustomerId: inputList?.cus_id || null,
  });

  // ========== New Refactored Hooks ==========

  // 1. Customer Initializer - Generate cus_no และค่าเริ่มต้นเมื่อเปิด Dialog (Create Mode)
  useCustomerInitializer({
    mode,
    itemList,
    groupList,
    user,
    inputList,
    openDialog: props.openDialog,
  });

  // 2. Customer Form Handler - จัดการ Input Change
  const { handleInputChange, handleCopyLastCustomer, handleBusinessTypeSelected } =
    useCustomerFormHandler({
      inputList,
      salesList,
      clearFieldError,
    });

  // 3. Customer Submit - Validation และ Submit
  const { handleSubmit, saveLoading } = useCustomerSubmit({
    inputList,
    mode,
    setErrors,
    setActiveTab,
    onSuccess: () => {
      props.handleCloseDialog();
    },
    onAfterSave: props.onAfterSave,
    scrollToTop,
  });

  // ========== Local handlers ==========

  // Tab change handler
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
  };

  // Business type handlers
  const handleOpenBusinessTypeManager = () => {
    setIsBusinessTypeManagerOpen(true);
  };

  const handleCloseBusinessTypeManager = () => {
    setIsBusinessTypeManagerOpen(false);
  };

  // Wrapper for business type selected (close modal after selection)
  const handleBusinessTypeSelectedWrapper = (typeId) => {
    handleBusinessTypeSelected(typeId, handleCloseBusinessTypeManager);
  };

  // ========== UI Helper Functions ==========

  // Check if essential tab is complete
  const isEssentialComplete = () => {
    return (
      inputList.cus_bt_id &&
      inputList.cus_company?.trim() &&
      inputList.cus_firstname?.trim() &&
      inputList.cus_lastname?.trim() &&
      inputList.cus_name?.trim() &&
      inputList.cus_tel_1?.trim()
    );
  };

  // Check if essential tab has errors
  const essentialHasError = () => {
    return !!(
      errors.cus_bt_id ||
      errors.cus_company ||
      errors.cus_firstname ||
      errors.cus_lastname ||
      errors.cus_name ||
      errors.cus_tel_1
    );
  };

  // Check if additional tab has any data
  const additionalHasData = () => {
    return !!(
      inputList.cus_address_detail ||
      inputList.cus_province_text ||
      inputList.cus_tax_id ||
      inputList.cd_note
    );
  };

  // Close dialog handler
  const handleCloseDialog = () => {
    props.handleCloseDialog();
    clearAllErrors();
    setActiveTab(0);
    resetDuplicateChecks();
  };

  // Effect to reset activeTab when dialog opens
  useEffect(() => {
    if (props.openDialog) {
      setActiveTab(0);
    }
  }, [props.openDialog]);

  return (
    <>
      <BusinessTypeManager
        open={isBusinessTypeManagerOpen}
        onClose={handleCloseBusinessTypeManager}
        onTypeSelected={handleBusinessTypeSelectedWrapper}
      />
      <Dialog
        open={props.openDialog}
        fullWidth
        maxWidth="md"
        disableEscapeKeyDown
        aria-hidden={props.openDialog ? false : true}
        PaperProps={{
          sx: {
            display: "flex",
            flexDirection: "column",
            width: { xs: "95vw", sm: "90vw", md: "80vw" },
            maxWidth: { xs: "95vw", sm: "90vw", md: "900px" },
            margin: { xs: "10px", sm: "20px" },
            height: { xs: "95vh", sm: "auto" },
            maxHeight: { xs: "95vh", sm: "90vh" },
          },
        }}
      >
        <form
          ref={formRef}
          noValidate
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          {/* Dialog Header */}
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#9e0000",
              color: "white",
              py: { xs: 1, sm: 2 },
              px: { xs: 2, sm: 3 },
            }}
          >
            <span
              style={{
                fontFamily: "Kanit",
                fontWeight: 600,
                fontSize: { xs: "1rem", sm: "1.1rem" },
                color: "white",
              }}
            >
              {mode === "create" && "เพิ่มลูกค้าใหม่"}
              {mode === "edit" && "แก้ไขข้อมูลลูกค้า"}
              {mode === "view" && "ดูข้อมูลลูกค้า"}
            </span>
            <IconButton
              onClick={handleCloseDialog}
              sx={{
                color: "white",
                p: { xs: 1, sm: 1.5 },
              }}
            >
              <MdClose size={20} />
            </IconButton>
          </DialogTitle>

          {/* Tab Navigation */}
          <CustomerFormTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            essentialComplete={isEssentialComplete()}
            essentialHasError={essentialHasError()}
            additionalComplete={additionalHasData()}
            mode={mode}
          />

          {/* Dialog Content */}
          <DialogContent
            dividers
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 0,
              bgcolor: "#fafafa",
            }}
          >
            {/* Summary Preview */}
            <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 } }}>
              <FormSummaryPreview inputList={inputList} mode={mode} />
            </Box>

            {/* Tab Content */}
            <Box sx={{ minHeight: { xs: 300, sm: 400 } }}>
              {/* Tab 1: Essential Info */}
              {activeTab === 0 && (
                <EssentialInfoTab
                  inputList={inputList}
                  errors={errors}
                  handleInputChange={handleInputChange}
                  businessTypesList={businessTypesList}
                  handleOpenBusinessTypeManager={handleOpenBusinessTypeManager}
                  businessTypesIsFetching={businessTypesIsFetching}
                  mode={mode}
                  onPhoneBlur={checkPhoneDuplicate}
                  onPhoneChange={clearDuplicatePhoneData}
                  onCompanyBlur={checkCompanyDuplicate}
                  companyWarning={companyWarning}
                  onClearCompanyWarning={clearCompanyWarning}
                  duplicatePhoneData={duplicatePhoneData}
                />
              )}

              {/* Tab 2: Additional Info */}
              {activeTab === 1 && (
                <AdditionalInfoTab
                  inputList={inputList}
                  errors={errors}
                  handleInputChange={handleInputChange}
                  // Location handlers (Autocomplete)
                  handleProvinceChange={handleProvinceChange}
                  handleDistrictChange={handleDistrictChange}
                  handleSubdistrictChange={handleSubdistrictChange}
                  isLoadingDistricts={isLoadingDistricts}
                  isLoadingSubdistricts={isLoadingSubdistricts}
                  mode={mode}
                  salesList={salesList}
                  provincesList={provincesList}
                  districtList={districtList}
                  subDistrictList={subDistrictList}
                />
              )}
            </Box>
          </DialogContent>

          {/* Action Buttons - Separated to opposite ends */}
          <DialogActions
            sx={{
              borderTop: "1px solid #e0e0e0",
              backgroundColor: "#fff",
              p: { xs: 1.5, sm: 2 },
              justifyContent: "space-between",
              flexDirection: { xs: "column-reverse", sm: "row" },
              gap: { xs: 1, sm: 1 },
            }}
          >
            <Button
              variant="outlined"
              color="error"
              disabled={saveLoading}
              onClick={handleCloseDialog}
              startIcon={<MdCancel />}
              sx={{
                minWidth: { xs: "100%", sm: "120px" },
                fontFamily: "Kanit",
              }}
            >
              {mode === "view" ? "ปิด" : "ยกเลิก"}
            </Button>

            {/* Transfer Buttons - View mode only */}
            {mode === "view" &&
              (() => {
                const transferInfo = canUserTransfer(user.role, inputList?.cus_channel);
                if (!transferInfo.canTransfer) return null;

                return (
                  <Box
                    sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}
                  >
                    <Tooltip title="ดูประวัติการโอน">
                      <Button
                        variant="outlined"
                        color="inherit"
                        size="small"
                        startIcon={<MdHistory />}
                        onClick={() => setTransferHistoryOpen(true)}
                      >
                        ประวัติโอน
                      </Button>
                    </Tooltip>
                    <Button
                      variant="contained"
                      color={
                        transferInfo.direction === TRANSFER_DIRECTIONS.TO_SALES ? "warning" : "info"
                      }
                      startIcon={<MdSwapHoriz />}
                      onClick={() => {
                        if (transferInfo.direction === TRANSFER_DIRECTIONS.TO_SALES) {
                          setTransferToSalesOpen(true);
                        } else if (transferInfo.direction === TRANSFER_DIRECTIONS.TO_ONLINE) {
                          setTransferToOnlineOpen(true);
                        }
                      }}
                      sx={{ fontFamily: "Kanit" }}
                    >
                      {transferInfo.direction === TRANSFER_DIRECTIONS.TO_SALES
                        ? "โอนไป Sales"
                        : "โอนไป Online"}
                    </Button>
                  </Box>
                );
              })()}

            {mode !== "view" && (
              <Button
                variant="contained"
                type="submit"
                disabled={saveLoading || !!duplicatePhoneData}
                startIcon={<MdSave />}
                sx={{
                  backgroundColor: duplicatePhoneData ? "#888" : "#9e0000",
                  "&:hover": { backgroundColor: duplicatePhoneData ? "#888" : "#d32f2f" },
                  minWidth: { xs: "100%", sm: "140px" },
                  fontFamily: "Kanit",
                  fontWeight: 600,
                }}
              >
                {saveLoading ? "กำลังบันทึก..." : duplicatePhoneData ? "เบอร์ซ้ำ" : "บันทึก"}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      {/* Duplicate Phone Dialog */}
      <DuplicatePhoneDialog
        open={duplicatePhoneDialogOpen}
        onClose={closeDuplicatePhoneDialog}
        duplicateData={duplicatePhoneData}
      />

      {/* Transfer Dialogs - View mode only */}
      {mode === "view" && (
        <>
          <TransferToSalesDialog
            open={transferToSalesOpen}
            onClose={() => setTransferToSalesOpen(false)}
            customerData={inputList}
            onSuccess={(result) => {
              setTransferToSalesOpen(false);
              handleCloseDialog();
              if (props.onTransferSuccess) {
                props.onTransferSuccess(result);
              }
            }}
          />
          <TransferToOnlineDialog
            open={transferToOnlineOpen}
            onClose={() => setTransferToOnlineOpen(false)}
            customerData={inputList}
            onSuccess={(result) => {
              setTransferToOnlineOpen(false);
              handleCloseDialog();
              if (props.onTransferSuccess) {
                props.onTransferSuccess(result);
              }
            }}
          />
          <TransferHistoryDialog
            open={transferHistoryOpen}
            onClose={() => setTransferHistoryOpen(false)}
            customerId={inputList?.cus_id}
          />
        </>
      )}
    </>
  );
}

export default DialogForm;
