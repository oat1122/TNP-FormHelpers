import { useState, useEffect, useRef, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import ScrollContext from "./ScrollContext";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
} from "@mui/material";
import { MdSave, MdCancel, MdNavigateNext, MdNavigateBefore, MdClose } from "react-icons/md";
import BusinessTypeManager from "../../components/BusinessTypeManager";
import { genCustomerNo } from "../../features/Customer/customerUtils";
import { setInputList, resetInputList } from "../../features/Customer/customerSlice";
import {
  useAddCustomerMutation,
  useUpdateCustomerMutation,
} from "../../features/Customer/customerApi";
import {
  open_dialog_ok_timer,
  open_dialog_error,
  open_dialog_loading,
} from "../../utils/import_lib";

// Import stepper components and hooks
import CustomerStepper from "./components/CustomerStepper";
import BusinessTypeStepSimple from "./components/BusinessTypeStepSimple";
import BusinessDetailStepSimple from "./components/BusinessDetailStepSimple";
import YourDetailsStepSimple from "./components/YourDetailsStepSimple";
import VerificationStepSimple from "./components/VerificationStepSimple";
import { useStepperValidation } from "./hooks/useStepperValidation";
import { useLocationSelection } from "./hooks/useLocationSelection";
import { useDialogApiData } from "./hooks/useDialogApiData";

// Main DialogForm component

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
  const [activeStep, setActiveStep] = useState(0);

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
    // Processed data
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

  // API hooks
  const [addCustomer] = useAddCustomerMutation();
  const [updateCustomer] = useUpdateCustomerMutation();

  // Stepper handlers
  const handleStepChange = (targetStep) => {
    if (canNavigateToStep(targetStep, activeStep, inputList)) {
      setActiveStep(targetStep);
    } else {
      // แจ้งเตือนหากยังไม่สามารถไปยังขั้นตอนนั้นได้
      open_dialog_error("กรุณากรอกข้อมูลในขั้นตอนปัจจุบันให้ครบถ้วนก่อน");
    }
  };

  const handleNextStep = () => {
    if (validateCurrentStep(activeStep, inputList, formRef)) {
      if (activeStep < 3) {
        setActiveStep(activeStep + 1);
      } else if (activeStep === 3) {
        // เมื่ออยู่ที่ step การยืนยัน (step 3) และกด "ถัดไป" ให้ทำการบันทึก
        handleSubmit();
      }
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
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
      // รองรับทั้ง object (จาก YourDetailsStep) และ string (legacy)
      if (typeof value === "object" && value !== null) {
        // ใช้ object ที่ส่งมาจาก YourDetailsStep
        value = value;
      } else if (typeof value === "string") {
        // แปลง user_id เป็น object (สำหรับ legacy support)
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
    if (
      [
        "cus_address_detail",
        "cus_subdistrict_text",
        "cus_district_text",
        "cus_province_text",
        "cus_zip_code",
      ].includes(name)
    ) {
      const fullAddress = [
        name === "cus_address_detail" ? value : newInputList.cus_address_detail || "",
        name === "cus_subdistrict_text"
          ? `ต.${value}`
          : newInputList.cus_subdistrict_text
            ? `ต.${newInputList.cus_subdistrict_text}`
            : "",
        name === "cus_district_text"
          ? `อ.${value}`
          : newInputList.cus_district_text
            ? `อ.${newInputList.cus_district_text}`
            : "",
        name === "cus_province_text"
          ? `จ.${value}`
          : newInputList.cus_province_text
            ? `จ.${newInputList.cus_province_text}`
            : "",
        name === "cus_zip_code" ? value : newInputList.cus_zip_code || "",
      ]
        .filter(Boolean)
        .join(" ");

      newInputList.cus_address = fullAddress;
    }

    dispatch(setInputList(newInputList));
    clearFieldError(name);
  };

  const handleSubmit = async (e) => {
    // ป้องกัน default form submission (ถ้ามี event)
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // ตรวจสอบข้อมูลทั้งหมดก่อนบันทึก
    if (validateAllSteps(inputList, formRef)) {
      setSaveLoading(true);

      try {
        open_dialog_loading();

        const res =
          mode === "create" ? await addCustomer(inputList) : await updateCustomer(inputList);

        if (res?.data?.status === "success") {
          props.handleCloseDialog();

          // ดึง customer ID ที่เพิ่งบันทึก
          const savedCustomerId =
            mode === "create"
              ? res?.data?.customer_id || res?.data?.data?.cus_id
              : inputList.cus_id;

          open_dialog_ok_timer("บันทึกข้อมูลสำเร็จ").then((result) => {
            setSaveLoading(false);
            dispatch(resetInputList());
            scrollToTop();

            // เรียกใช้ callback เพื่อเปิด view dialog (หากมี)
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

        // จัดการ error สำหรับ validation (422) และ error อื่นๆ
        let errorMessage = "เกิดข้อผิดพลาดในการบันทึก";

        if (error?.error?.status === 422) {
          // Validation error from backend
          errorMessage = "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลที่กรอก";

          // ดึง validation errors จาก response (ถ้ามี)
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
    } else {
      // หากข้อมูลไม่ครบ ไปยังขั้นตอนแรกที่มีข้อผิดพลาด
      const errorStep = getFirstErrorStep(inputList);
      setActiveStep(errorStep);
    }
  };

  const handleCloseDialog = () => {
    props.handleCloseDialog();
    clearAllErrors();
  };

  // Effect to reset activeStep when dialog opens
  useEffect(() => {
    if (props.openDialog) {
      setActiveStep(0); // เริ่มต้นที่ step แรก "ประเภทธุรกิจ" เสมอ
    }
  }, [props.openDialog]);

  // Effects for customer creation logic
  useEffect(() => {
    if (mode === "create") {
      // Generate customer number
      const maxCusNo = String(
        Math.max(...itemList.map((customer) => parseInt(customer.cus_no, 10)))
      );
      const newCusNo = genCustomerNo(maxCusNo);

      // Get group ID
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
            flexDirection: "column", // ✅ ต้องให้ Dialog มี flex column
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
          <DialogContent
            dividers
            sx={{
              flex: 1, // ✅ ใช้ flex: 1 เพื่อให้ scroll ได้เฉพาะ content
              overflowY: "auto",
              p: 0,
            }}
          >
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
              {/* Stepper - แสดงเฉพาะ mode create และ edit */}
              {mode !== "view" && (
                <CustomerStepper
                  activeStep={activeStep}
                  {...getStepStatuses(inputList)}
                  onStepClick={handleStepChange}
                />
              )}

              {/* Step Content */}
              <Box sx={{ minHeight: { xs: 300, sm: 400 } }}>
                {/* Step 1: Business Type */}
                {activeStep === 0 && (
                  <BusinessTypeStepSimple
                    inputList={inputList}
                    errors={errors}
                    handleInputChange={handleInputChange}
                    businessTypesList={businessTypesList}
                    handleOpenBusinessTypeManager={handleOpenBusinessTypeManager}
                    businessTypesIsFetching={businessTypesIsFetching}
                    mode={mode}
                  />
                )}

                {/* Step 2: Business Detail */}
                {activeStep === 1 && (
                  <BusinessDetailStepSimple
                    inputList={inputList}
                    errors={errors}
                    handleInputChange={handleInputChange}
                    handleSelectLocation={handleSelectLocation}
                    provincesList={provincesList}
                    districtList={districtList}
                    subDistrictList={subDistrictList}
                    isLoading={isLoading}
                    mode={mode}
                    refetchLocations={refetchLocations}
                  />
                )}

                {/* Step 3: Your Details */}
                {activeStep === 2 && (
                  <YourDetailsStepSimple
                    inputList={inputList}
                    errors={errors}
                    handleInputChange={handleInputChange}
                    mode={mode}
                    salesList={salesList} // ส่ง salesList จาก dialogApiData
                  />
                )}

                {/* Step 4: Verification */}
                {activeStep === 3 && <VerificationStepSimple inputList={inputList} mode={mode} />}
              </Box>
            </Box>
          </DialogContent>

          {/* Action Button: อยู่นอก DialogContent เพื่อไม่โดน scroll */}
          <DialogActions
            sx={{
              borderTop: "1px solid #e0e0e0",
              backgroundColor: "#fff",
              p: { xs: 1, sm: 2 },
              flexDirection: { xs: "column-reverse", sm: "row" },
              gap: { xs: 1, sm: 0 },
            }}
          >
            {/* Close Button */}
            <Button
              variant="outlined"
              color="error"
              disabled={saveLoading}
              onClick={handleCloseDialog}
              startIcon={<MdCancel />}
              fullWidth={mode === "view"}
              sx={{
                order: { xs: 2, sm: 1 },
                minWidth: { xs: "auto", sm: "120px" },
                width: mode === "view" ? "100%" : { xs: "100%", sm: "auto" },
              }}
            >
              {mode === "view" ? "ปิด" : "ยกเลิก"}
            </Button>

            {/* Navigation Buttons */}
            {mode !== "view" && (
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  width: "100%",
                  order: { xs: 1, sm: 2 },
                }}
              >
                <Button
                  variant="outlined"
                  onClick={handlePrevStep}
                  disabled={activeStep === 0 || saveLoading}
                  startIcon={<MdNavigateBefore />}
                  fullWidth
                  sx={{ minWidth: { xs: "auto", sm: "120px" } }}
                >
                  <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                    ก่อนหน้า
                  </Box>
                  <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                    ก่อนหน้า
                  </Box>
                </Button>

                <Button
                  variant="contained"
                  onClick={activeStep < 3 ? handleNextStep : handleSubmit}
                  disabled={saveLoading}
                  endIcon={<MdNavigateNext />}
                  fullWidth
                  sx={{
                    backgroundColor: "#9e0000",
                    "&:hover": { backgroundColor: "#d32f2f" },
                    minWidth: { xs: "auto", sm: "120px" },
                  }}
                >
                  <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                    {activeStep < 3 ? "ถัดไป" : "บันทึก"}
                  </Box>
                  <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                    {activeStep < 3 ? "ถัดไป" : "บันทึก"}
                  </Box>
                </Button>
              </Box>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

export default DialogForm;
