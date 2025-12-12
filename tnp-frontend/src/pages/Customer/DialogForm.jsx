import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Tooltip,
} from "@mui/material";
import { useState, useEffect, useRef, useContext } from "react";
import { MdSave, MdCancel, MdClose, MdSwapHoriz, MdHistory } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";

// New Tab-based components
import AdditionalInfoTab from "./components/AdditionalInfoTab";
import CustomerFormTabs from "./components/CustomerFormTabs";
import DuplicatePhoneDialog from "./components/DuplicatePhoneDialog";
import EssentialInfoTab from "./components/EssentialInfoTab";
import FormSummaryPreview from "./components/FormSummaryPreview";
import QuickActionsBar from "./components/QuickActionsBar";

// Transfer components
import {
  TransferToSalesDialog,
  TransferToOnlineDialog,
  TransferHistoryDialog,
} from "./components/transfer";
import { canUserTransfer, TRANSFER_DIRECTIONS } from "./constants/customerChannel";

import { useDialogApiData } from "./hooks/useDialogApiData";
import { useDuplicateCheck } from "./hooks/useDuplicateCheck";
import { useLocationSelection } from "./hooks/useLocationSelection";
import { useStepperValidation } from "./hooks/useStepperValidation";
import ScrollContext from "./ScrollContext";
import BusinessTypeManager from "../../components/BusinessTypeManager";
import {
  useAddCustomerMutation,
  useUpdateCustomerMutation,
} from "../../features/Customer/customerApi";
import { setInputList, resetInputList } from "../../features/Customer/customerSlice";
import { genCustomerNo } from "../../features/Customer/customerUtils";
import {
  open_dialog_ok_timer,
  open_dialog_error,
  open_dialog_loading,
} from "../../utils/import_lib";

/**
 * DialogForm - Customer form dialog with 2-tab layout
 * Tab 1: Essential Info (required fields)
 * Tab 2: Additional Info (optional fields like address, notes)
 */
function DialogForm(props) {
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("userData"));
  const isAdmin = user.role === "admin";
  const inputList = useSelector((state) => state.customer.inputList);
  const itemList = useSelector((state) => state.customer.itemList);
  const mode = useSelector((state) => state.customer.mode);
  const groupList = useSelector((state) => state.customer.groupList);

  // Local state
  const [isBusinessTypeManagerOpen, setIsBusinessTypeManagerOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = Essential, 1 = Additional

  // Transfer dialog states (view mode only)
  const [transferToSalesOpen, setTransferToSalesOpen] = useState(false);
  const [transferToOnlineOpen, setTransferToOnlineOpen] = useState(false);
  const [transferHistoryOpen, setTransferHistoryOpen] = useState(false);

  // Refs
  const formRef = useRef(null);

  // Context
  const { scrollToTop } = useContext(ScrollContext);

  // Custom hooks
  const {
    errors,
    setErrors,
    validateCurrentStep,
    validateAllSteps,
    clearFieldError,
    clearAllErrors,
    getStepStatuses,
    canNavigateToStep,
    getFirstErrorStep,
    isStepComplete,
  } = useStepperValidation();

  const {
    provincesList,
    districtList,
    subDistrictList,
    salesList,
    businessTypesList,
    setBusinessTypesList,
    isLoading,
    businessTypesData,
    businessTypesIsFetching,
    refetchLocations,
  } = useDialogApiData(props.openDialog);

  const { handleSelectLocation } = useLocationSelection(
    provincesList,
    districtList,
    subDistrictList,
    refetchLocations
  );

  // Duplicate check hook
  const {
    duplicatePhoneDialogOpen,
    duplicatePhoneData,
    companyWarning,
    isCheckingPhone,
    checkPhoneDuplicate,
    checkCompanyDuplicate,
    closeDuplicatePhoneDialog,
    clearCompanyWarning,
    clearDuplicatePhoneData,
    resetDuplicateChecks,
    hasDuplicateWarning,
  } = useDuplicateCheck({
    mode,
    currentCustomerId: inputList?.cus_id || null,
  });

  // API hooks
  const [addCustomer] = useAddCustomerMutation();
  const [updateCustomer] = useUpdateCustomerMutation();

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

  const handleBusinessTypeSelected = (typeId) => {
    dispatch(
      setInputList({
        ...inputList,
        cus_bt_id: typeId,
      })
    );
    clearFieldError("cus_bt_id");
    setIsBusinessTypeManagerOpen(false);
  };

  // Input change handler with validation
  const handleInputChange = (e) => {
    let { name, value } = e.target;

    // จัดการข้อมูลพิเศษ
    if (name === "cus_tax_id" || name === "cus_zip_code") {
      value = value.replace(/[^0-9]/g, "");
    } else if (name === "cus_manage_by") {
      if (typeof value === "object" && value !== null) {
        value = value;
      } else if (typeof value === "string") {
        const selectedUser = salesList.find((user) => String(user.user_id) === String(value));
        value = selectedUser
          ? {
              user_id: selectedUser.user_id,
              username:
                selectedUser.username ||
                selectedUser.user_nickname ||
                `User ${selectedUser.user_id}`,
            }
          : { user_id: "", username: "" };
      }
    }

    const newInputList = {
      ...inputList,
      [name]: value,
    };

    // อัพเดท cus_address เมื่อมีการเปลี่ยนแปลงในฟิลด์ที่อยู่
    if (["cus_address_detail", "cus_zip_code"].includes(name)) {
      const fullAddress = [
        name === "cus_address_detail" ? value : newInputList.cus_address_detail || "",
        newInputList.cus_subdistrict_text ? `ต.${newInputList.cus_subdistrict_text}` : "",
        newInputList.cus_district_text ? `อ.${newInputList.cus_district_text}` : "",
        newInputList.cus_province_text ? `จ.${newInputList.cus_province_text}` : "",
        name === "cus_zip_code" ? value : newInputList.cus_zip_code || "",
      ]
        .filter(Boolean)
        .join(" ");

      newInputList.cus_address = fullAddress;
    }

    dispatch(setInputList(newInputList));
    clearFieldError(name);
  };

  // Quick Actions: Copy from last customer
  const handleCopyLastCustomer = (copyData) => {
    dispatch(
      setInputList({
        ...inputList,
        ...copyData,
      })
    );
  };

  // Validate essential fields only
  const validateEssentialFields = () => {
    const newErrors = {};

    if (!inputList.cus_bt_id) {
      newErrors.cus_bt_id = "กรุณาเลือกประเภทธุรกิจ";
    }
    if (!inputList.cus_company?.trim()) {
      newErrors.cus_company = "กรุณากรอกชื่อบริษัท";
    }
    if (!inputList.cus_firstname?.trim()) {
      newErrors.cus_firstname = "กรุณากรอกชื่อจริง";
    }
    if (!inputList.cus_lastname?.trim()) {
      newErrors.cus_lastname = "กรุณากรอกนามสกุล";
    }
    if (!inputList.cus_name?.trim()) {
      newErrors.cus_name = "กรุณากรอกชื่อเล่น";
    }
    if (!inputList.cus_tel_1?.trim()) {
      newErrors.cus_tel_1 = "กรุณากรอกเบอร์โทรหลัก";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Validate essential fields
    if (!validateEssentialFields()) {
      // Switch to essential tab if there are errors
      setActiveTab(0);
      return;
    }

    setSaveLoading(true);

    try {
      open_dialog_loading();

      const res =
        mode === "create" ? await addCustomer(inputList) : await updateCustomer(inputList);

      if (res?.data?.status === "success") {
        props.handleCloseDialog();

        const savedCustomerId =
          mode === "create" ? res?.data?.customer_id || res?.data?.data?.cus_id : inputList.cus_id;

        open_dialog_ok_timer("บันทึกข้อมูลสำเร็จ").then((result) => {
          setSaveLoading(false);
          dispatch(resetInputList());
          scrollToTop();

          if (props.onAfterSave && savedCustomerId) {
            props.onAfterSave(savedCustomerId);
          }
        });
      } else {
        setSaveLoading(false);
        open_dialog_error(res?.data?.message || "เกิดข้อผิดพลาดในการบันทึก");
        console.error(res?.data?.message || "Unknown error");
      }
    } catch (error) {
      setSaveLoading(false);

      let errorMessage = "เกิดข้อผิดพลาดในการบันทึก";

      if (error?.error?.status === 422) {
        errorMessage = "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลที่กรอก";

        if (error?.error?.data?.errors) {
          const validationErrors = error.error.data.errors;
          const errorMessages = Object.values(validationErrors).flat();
          errorMessage += "\n" + errorMessages.join("\n");
        }
      } else if (error?.error?.data?.message) {
        errorMessage = error.error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      open_dialog_error(errorMessage);
      console.error("Submit error:", error);
    }
  };

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

  // Effects for customer creation logic
  useEffect(() => {
    if (mode === "create") {
      const maxCusNo = String(
        Math.max(...itemList.map((customer) => parseInt(customer.cus_no, 10)))
      );
      const newCusNo = genCustomerNo(maxCusNo);

      const cus_mcg_id =
        groupList.length > 0
          ? groupList.reduce(
              (max, group) =>
                parseInt(group.mcg_sort, 10) > parseInt(max.mcg_sort, 10) ? group : max,
              groupList[0]
            ).mcg_id
          : null;

      dispatch(
        setInputList({
          ...inputList,
          cus_no: newCusNo,
          cus_mcg_id: cus_mcg_id,
          cus_manage_by: isAdmin ? "" : { user_id: user.user_id },
        })
      );
    }
  }, [mode, itemList, groupList, isAdmin, user.user_id]);

  return (
    <>
      <BusinessTypeManager
        open={isBusinessTypeManagerOpen}
        onClose={handleCloseBusinessTypeManager}
        onTypeSelected={handleBusinessTypeSelected}
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
                  handleSelectLocation={handleSelectLocation}
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
