import { useState, useEffect, useRef, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import ScrollContext from "./ScrollContext";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from "@mui/material";
import {
  MdPerson,
  MdPhone,
  MdLocationOn,
  MdNotes,
  MdSave,
  MdCancel,
} from "react-icons/md";
import BusinessTypeManager from "../../components/BusinessTypeManager";
import { genCustomerNo } from "../../features/Customer/customerUtils";
import {
  setInputList,
  resetInputList,
} from "../../features/Customer/customerSlice";
import {
  useAddCustomerMutation,
  useUpdateCustomerMutation,
} from "../../features/Customer/customerApi";
import {
  open_dialog_ok_timer,
  open_dialog_error,
  open_dialog_loading,
} from "../../utils/import_lib";

// Import separated components and hooks
import {
  TabPanel,
  DialogHeader,
  BasicInfoTab,
  ContactInfoTab,
  AddressInfoTab,
  NotesTab,
} from "./components/DialogComponents";
import { useFormValidation } from "./hooks/useFormValidation";
import { useLocationSelection } from "./hooks/useLocationSelection";
import { useDialogApiData } from "./hooks/useDialogApiData";
import { a11yProps } from "./constants/dialogConstants";

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
  const [tabValue, setTabValue] = useState(0);

  // Refs
  const formRef = useRef(null);

  // Context
  const { scrollToTop } = useContext(ScrollContext);

  // Custom hooks
  const { errors, setErrors, validateForm, clearFieldError, clearAllErrors } = useFormValidation();
  
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
  } = useDialogApiData(props.openDialog);

  const { handleSelectLocation } = useLocationSelection(
    provincesList,
    districtList,
    subDistrictList
  );

  // API hooks
  const [addCustomer] = useAddCustomerMutation();
  const [updateCustomer] = useUpdateCustomerMutation();

  // Handlers
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

    if (name === "cus_tax_id" || name === "cus_zip_code") {
      value = value.replace(/[^0-9]/g, "");
    } else if (name === "cus_manage_by") {
      value = salesList.find((user) => user.user_id === value) || {
        user_id: "",
        username: "",
      };
    }

    dispatch(
      setInputList({
        ...inputList,
        [name]: value,
      })
    );

    clearFieldError(name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm(formRef, inputList, setTabValue)) {
      setSaveLoading(true);

      try {
        open_dialog_loading();

        const res =
          mode === "create"
            ? await addCustomer(inputList)
            : await updateCustomer(inputList);

        if (res.data.status === "success") {
          props.handleCloseDialog();

          open_dialog_ok_timer("บันทึกข้อมูลสำเร็จ").then((result) => {
            setSaveLoading(false);
            dispatch(resetInputList());
            scrollToTop();
          });
        } else {
          setSaveLoading(false);
          open_dialog_error(res.data.message);
          console.error(res.data.message);
        }
      } catch (error) {
        setSaveLoading(false);
        open_dialog_error(error.message, error);
        console.error(error);
      }
    }
  };

  const handleCloseDialog = () => {
    props.handleCloseDialog();
    clearAllErrors();
  };

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
                parseInt(group.mcg_sort, 10) > parseInt(max.mcg_sort, 10)
                  ? group
                  : max,
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
      >
        <form ref={formRef} noValidate onSubmit={handleSubmit}>
          <DialogHeader
            mode={mode}
            inputList={inputList}
            salesList={salesList}
            businessTypesList={businessTypesList}
            isAdmin={isAdmin}
            errors={errors}
            handleInputChange={handleInputChange}
            handleOpenBusinessTypeManager={handleOpenBusinessTypeManager}
            handleCloseDialog={handleCloseDialog}
            businessTypesIsFetching={businessTypesIsFetching}
            setBusinessTypesList={setBusinessTypesList}
            businessTypesData={businessTypesData}
          />
                     <DialogContent dividers>
             <Box sx={{ width: "100%" }}>
                             {/* Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="customer info tabs"
                >
                  <Tab
                    label="ข้อมูลพื้นฐาน"
                    icon={<MdPerson />}
                    iconPosition="start"
                    {...a11yProps(0)}
                  />
                  <Tab
                    label="ข้อมูลติดต่อ"
                    icon={<MdPhone />}
                    iconPosition="start"
                    {...a11yProps(1)}
                  />
                  <Tab
                    label="ที่อยู่"
                    icon={<MdLocationOn />}
                    iconPosition="start"
                    {...a11yProps(2)}
                  />
                  <Tab
                    label="บันทึกเพิ่มเติม"
                    icon={<MdNotes />}
                    iconPosition="start"
                    {...a11yProps(3)}
                  />
                </Tabs>
              </Box>
              {/* Tab 1: Basic Information */}
              <TabPanel value={tabValue} index={0}>
                <BasicInfoTab
                  inputList={inputList}
                  errors={errors}
                  handleInputChange={handleInputChange}
                  mode={mode}
                />
              </TabPanel>
              {/* Tab 2: Contact Information */}
              <TabPanel value={tabValue} index={1}>
                <ContactInfoTab
                  inputList={inputList}
                  errors={errors}
                  handleInputChange={handleInputChange}
                  mode={mode}
                />
              </TabPanel>
              {/* Tab 3: Address Information */}
              <TabPanel value={tabValue} index={2}>
                <AddressInfoTab
                  inputList={inputList}
                  errors={errors}
                  handleInputChange={handleInputChange}
                  handleSelectLocation={handleSelectLocation}
                  provincesList={provincesList}
                  districtList={districtList}
                  subDistrictList={subDistrictList}
                  mode={mode}
                  isLoading={isLoading}
                />
              </TabPanel>
              {/* Tab 4: Additional Notes */}
              <TabPanel value={tabValue} index={3}>
                <NotesTab
                  inputList={inputList}
                  handleInputChange={handleInputChange}
                  mode={mode}
                />
              </TabPanel>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            {mode !== "view" && (
              <Button
                type="submit"
                variant="contained"
                color="error"
                disabled={saveLoading}
                startIcon={<MdSave />}
                sx={{ mr: 1 }}
              >
                บันทึก
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              disabled={saveLoading}
              onClick={handleCloseDialog}
              startIcon={<MdCancel />}
            >
              ยกเลิก
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

export default DialogForm;
