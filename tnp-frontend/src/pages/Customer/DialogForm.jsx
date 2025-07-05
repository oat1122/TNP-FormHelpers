import { useState, useEffect, useCallback, useRef, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import ScrollContext from "./ScrollContext";
import moment from "moment";
import Swal from "sweetalert2";

// Import existing dependencies and APIs
import {
  formatCustomRelativeTime,
  genCustomerNo,
} from "../../features/Customer/customerUtils";
import {
  setInputList,
  setItemList,
  resetInputList,
} from "../../features/Customer/customerSlice";
import {
  useAddCustomerMutation,
  useUpdateCustomerMutation,
} from "../../features/Customer/customerApi";
import { setLocationSearch } from "../../features/globalSlice";
import {
  useGetAllLocationQuery,
  useLazyGetAllLocationQuery,
  useGetUserByRoleQuery,
  useGetAllBusinessTypesQuery,
} from "../../features/globalApi";
import {
  open_dialog_ok_timer,
  open_dialog_error,
  open_dialog_loading,
} from "../../utils/import_lib";

// Import the new CustomerFormStepWizard component
import CustomerFormStepWizard from "./components/CustomerFormStepWizard";
import BusinessTypeManager from "../../components/BusinessTypeManager";

function DialogForm(props) {
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("userData"));
  const isAdmin = user.role === "admin";
  const inputList = useSelector((state) => state.customer.inputList);
  const itemList = useSelector((state) => state.customer.itemList);
  
  // Add auto-save timer state
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [autoSavedAt, setAutoSavedAt] = useState(null);

  // Refs
  const formRef = useRef(null);
  const scrollRef = useRef(null);

  // Context
  const { scrollToTop } = useContext(ScrollContext);

  // API hooks
  const [addCustomer, { isLoading: isAddLoading }] = useAddCustomerMutation();
  const [updateCustomer, { isLoading: isUpdateLoading }] = useUpdateCustomerMutation();
  const {
    data: dataBt,
    isLoading: loadingBt,
    isError: errorBt,
    refetch: refetchBusinessTypes,
  } = useGetAllBusinessTypesQuery();
  const {
    data: dataUser,
    isLoading: loadingUser,
    isError: errorUser,
  } = useGetUserByRoleQuery();
  const {
    data: dataLocation,
    isLoading: loadingLocation,
    isError: errorLocation,
  } = useGetAllLocationQuery();
  const [getLazyLocation, { isFetching }] = useLazyGetAllLocationQuery();
  const locationSearch = useSelector((state) => state.global.locationSearch);

  // States
  const [errors, setErrors] = useState({});
  const [showBusinessTypeManager, setShowBusinessTypeManager] = useState(false);
  const mode = props.mode || "add"; // add, edit, view

  // Close Business Type dialog and refresh list
  const handleCloseBusinessTypeManager = () => {
    setShowBusinessTypeManager(false);
    refetchBusinessTypes();
  };

  // Create lists for form selections
  const userList = dataUser ? Object.values(dataUser).flat() : [];
  const businessTypeList = dataBt?.result || [];

  // Location data
  const provincesList = dataLocation?.province || [];
  const districtList = dataLocation?.district?.filter((item) => {
    if (locationSearch?.province_sort_id)
      return item.pro_id === locationSearch.province_sort_id;
    return inputList.cus_pv_id === item.pro_id;
  });
  const subDistrictList = dataLocation?.sub_district?.filter((item) => {
    if (locationSearch?.district_sort_id)
      return item.dis_id === locationSearch.district_sort_id;
    return inputList.cus_dis_id === item.dis_id;
  });
  
  // For phone number formatting
  const formatPhoneNumber = (value) => {
    if (!value) return value;
    
    // Strip all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  // Set customer ID with a unique prefix for new customer
  useEffect(() => {
    if (mode === "add" && inputList.cus_id === undefined) {
      dispatch(
        setInputList({
          cus_id: genCustomerNo(),
          cus_create_by: user.id,
          cus_is_active: 1,
        })
      );
    }
  }, [dispatch, inputList.cus_id, mode, user]);

  // Check if form is being submitted
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoading = isAddLoading || isUpdateLoading || isSubmitting;

  // Formatted time display for last update
  const lastUpdateTime = inputList.cd_last_datetime
    ? moment(inputList.cd_last_datetime).fromNow()
    : null;
  const formattedRelativeTime = lastUpdateTime
    ? formatCustomRelativeTime(lastUpdateTime)
    : "";

  // Map mode to Thai language for title
  const titleMap = {
    add: "เพิ่ม",
    edit: "แก้ไข",
    view: "ดู",
  };

  // Implement auto-save functionality
  const autoSaveForm = useCallback(() => {
    if (mode === "add" || mode === "edit") {
      // Save the current form state to localStorage
      localStorage.setItem("customerFormDraft", JSON.stringify({
        inputList,
        timestamp: new Date().toISOString(),
      }));
      setAutoSavedAt(new Date());
    }
  }, [inputList, mode]);

  // Handle input changes
  const handleInputChange = useCallback(
    (e) => {
      let { name, value } = e.target;
      
      // Format phone numbers as user types
      if ((name === 'cus_tel_1' || name === 'cus_tel_2') && value) {
        value = formatPhoneNumber(value);
      }
      
      // Format tax ID - allow only digits and limit to 13 characters
      if (name === 'cus_tax_id') {
        value = value.replace(/\D/g, '').slice(0, 13);
      }
      
      // Sanitize company name - remove problematic characters
      if (name === 'cus_company') {
        value = value.replace(/[<>%$#@^&*()+={}[\]:;'"|\\`]/g, '');
      }

      // Convert manage_by selection to object
      if (name === 'cus_manage_by') {
        if (value === '') {
          value = { user_id: '', username: '' };
        } else {
          const found = userList.find((u) => u.user_id === value);
          value = found ? { user_id: found.user_id, username: found.username } : { user_id: '', username: '' };
        }
      }
      
      // Clear previous auto-save timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      
      // Set new auto-save timer (2 seconds after last change)
      const newTimer = setTimeout(() => {
        autoSaveForm();
      }, 2000);
      
      setAutoSaveTimer(newTimer);

      // Clear error for the field being edited
      setErrors((prev) => ({ ...prev, [name]: "" }));

      let updatedInputList = {
        ...inputList,
        [name]: value,
      };

      // Handle location dropdown dependencies
      switch (name) {
        case "cus_pv_id": {
          // Clear dependent dropdowns
          updatedInputList.cus_dis_id = "";
          updatedInputList.cus_sub_id = "";
          updatedInputList.cus_zip_code = "";
          
          const provincesResult = provincesList.find(
            (find) => find.pro_id === value
          );
          if (provincesResult) {
            dispatch(
              setLocationSearch({
                province_sort_id: provincesResult.pro_sort_id,
              })
            );
          }
          break;
        }
        case "cus_dis_id": {
          // Clear dependent dropdowns
          updatedInputList.cus_sub_id = "";
          updatedInputList.cus_zip_code = "";
          
          const districtResult = districtList.find(
            (find) => find.dis_id === value
          );
          if (districtResult) {
            dispatch(
              setLocationSearch({
                ...locationSearch,
                district_sort_id: districtResult.dis_sort_id,
              })
            );
          }
          break;
        }
        case "cus_sub_id": {
          const subDistrictResult = subDistrictList.find(
            (find) => find.sub_id === value
          );
          if (subDistrictResult) {
            updatedInputList = {
              ...updatedInputList,
              cus_zip_code: subDistrictResult.sub_zip_code,
            };
          }
          break;
        }
        default:
          break;
      }

      dispatch(setInputList(updatedInputList));
    },
    [inputList, autoSaveTimer, autoSaveForm, dispatch, districtList, locationSearch, provincesList, subDistrictList, formatPhoneNumber, userList]
  );

  // Handle location selection
  const handleSelectLocation = (field, value) => {
    handleInputChange({
      target: {
        name: field,
        value: value,
      },
    });
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // Check required fields based on current step
    const requiredFields = [
      "cus_company",
      "cus_firstname",
      "cus_lastname",
      "cus_name",
      "cus_tel_1",
      "cus_bt_id",
      "cus_channel"
    ];
    
    requiredFields.forEach(field => {
      if (!inputList[field]) {
        newErrors[field] = `กรุณากรอกข้อมูลในช่องนี้`;
        isValid = false;
      }
    });
    
    // Enhanced validation for specific fields
    
    // Email validation
    if (inputList.cus_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inputList.cus_email)) {
        newErrors.cus_email = "รูปแบบอีเมลไม่ถูกต้อง";
        isValid = false;
      }
    }
    
    // Phone validation
    if (inputList.cus_tel_1) {
      const phoneValue = inputList.cus_tel_1.replace(/\D/g, '');
      if (phoneValue.length < 9 || phoneValue.length > 10) {
        newErrors.cus_tel_1 = "เบอร์โทรต้องมี 9-10 หลัก";
        isValid = false;
      }
    }
    
    // Phone validation (optional second phone)
    if (inputList.cus_tel_2) {
      const phoneValue = inputList.cus_tel_2.replace(/\D/g, '');
      if (phoneValue.length < 9 || phoneValue.length > 10) {
        newErrors.cus_tel_2 = "เบอร์โทรต้องมี 9-10 หลัก";
        isValid = false;
      }
    }
    
    // Tax ID validation
    if (inputList.cus_tax_id) {
      if (!/^\d+$/.test(inputList.cus_tax_id) || inputList.cus_tax_id.length !== 13) {
        newErrors.cus_tax_id = "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก";
        isValid = false;
      }
    }
    
    // Business type validation
    if (inputList.cus_bt_id && !businessTypeList.some(bt => bt.bt_id === inputList.cus_bt_id)) {
      newErrors.cus_bt_id = "กรุณาเลือกประเภทธุรกิจที่ถูกต้อง";
      isValid = false;
    }
    
    // Company name validation - no special characters
    if (inputList.cus_company && /[<>%$#@!^&*()_+={}\[\]:;'"|\\]/.test(inputList.cus_company)) {
      newErrors.cus_company = "ชื่อบริษัทมีอักขระพิเศษที่ไม่อนุญาต";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    // Show loading dialog
    open_dialog_loading("กำลังบันทึกข้อมูล...");

    try {
      // Prepare data
      const data = {
        ...inputList,
      };

      let result;
      
      if (mode === "add") {
        result = await addCustomer(data).unwrap();
      } else if (mode === "edit") {
        result = await updateCustomer(data).unwrap();
      }

      if (result.status === "ok") {
        // Show success dialog
        open_dialog_ok_timer("บันทึกข้อมูลสำเร็จ", "", 1000);
        
        // Clear draft from localStorage if exists
        localStorage.removeItem("customerFormDraft");
        
        // Close the dialog and refresh the data
        setTimeout(() => {
          props.handleCloseDialog();
          props.refreshData();
        }, 1000);
      } else {
        // Show error dialog
        open_dialog_error(result.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      open_dialog_error(error?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load auto-saved draft - improved with error handling and clean-up of old drafts
  useEffect(() => {
    if (mode === "add") {
      const savedDraft = localStorage.getItem("customerFormDraft");
      
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          const { inputList: savedInputList, timestamp, currentStep } = parsedDraft;
          
          if (!timestamp) {
            // Invalid draft, remove it
            localStorage.removeItem("customerFormDraft");
            return;
          }
          
          const savedTime = moment(timestamp);
          
          // Clean up old drafts (older than 24 hours)
          if (moment().diff(savedTime, 'hours') >= 24) {
            localStorage.removeItem("customerFormDraft");
            return;
          }
          
          // Ask user if they want to load the draft
          Swal.fire({
            title: 'พบข้อมูลที่บันทึกไว้',
            text: `คุณต้องการโหลดข้อมูลที่บันทึกไว้เมื่อ ${savedTime.format('DD/MM/YYYY HH:mm')} หรือไม่?`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'ใช่, โหลดข้อมูล',
            cancelButtonText: 'ไม่, เริ่มใหม่'
          }).then((result) => {
            if (result.isConfirmed) {
              // Validate data before loading
              if (savedInputList && typeof savedInputList === 'object') {
                // Ensure we have required fields
                if (savedInputList.cus_id) {
                  dispatch(setInputList(savedInputList));
                  setAutoSavedAt(new Date(timestamp));
                } else {
                  console.warn("Draft data is missing required fields");
                  localStorage.removeItem("customerFormDraft");
                  Swal.fire({
                    title: 'ข้อมูลไม่สมบูรณ์',
                    text: 'ไม่สามารถโหลดข้อมูลร่างได้เนื่องจากข้อมูลไม่สมบูรณ์',
                    icon: 'warning',
                    confirmButtonText: 'ตกลง'
                  });
                }
              }
            } else {
              // User chose not to use the draft, remove it
              localStorage.removeItem("customerFormDraft");
            }
          });
        } catch (error) {
          console.error("Error loading draft:", error);
          // Clear invalid draft data
          localStorage.removeItem("customerFormDraft");
        }
      }
    }
  }, [dispatch, mode]);

  return (
    <>
      {/* Business Type Manager Dialog */}
      {showBusinessTypeManager && (
        <BusinessTypeManager
          open={showBusinessTypeManager}
          onClose={handleCloseBusinessTypeManager}
        />
      )}
      
      {/* Customer Form Step Wizard - New component */}
      <CustomerFormStepWizard
        openDialog={props.openDialog}
        handleCloseDialog={props.handleCloseDialog}
        inputList={inputList}
        errors={errors}
        mode={mode === 'add' ? 'create' : mode}
        handleInputChange={handleInputChange}
        handleSelectLocation={handleSelectLocation}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        provincesList={provincesList}
        districtList={districtList}
        subDistrictList={subDistrictList}
        isFetching={isFetching}
        businessTypeList={businessTypeList}
        userList={userList}
        formatPhoneNumber={formatPhoneNumber}
        lastUpdated={formattedRelativeTime}
        onAddBusinessType={() => setShowBusinessTypeManager(true)}
      />
    </>
  );
}

export default DialogForm;
