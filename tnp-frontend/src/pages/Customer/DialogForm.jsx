import { useState, useEffect, useCallback, useRef, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import ScrollContext from "./ScrollContext";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  OutlinedInput,
  Grid2 as Grid,
  styled,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  FormHelperText,
  Tooltip,
  Paper,
  Typography,
  TextField,
  Tabs,
  Tab,
  Divider,
  InputAdornment,
  FormControl,
  Card,
  CardContent,
  Chip,
  Avatar,
} from "@mui/material";
import {
  MdAdd,
  MdSettings,
  MdClose,
  MdPerson,
  MdBusiness,
  MdLocationOn,
  MdPhone,
  MdEmail,
  MdNotes,
  MdSave,
  MdCancel,
  MdCheckCircle,
  MdError,
  MdInfo,
  MdAccessTime,
} from "react-icons/md";
import BusinessTypeManager from "../../components/BusinessTypeManager";
import moment from "moment";
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
import Swal from "sweetalert2";

import {
  StyledTextField,
  StyledSelect,
} from "./components/DialogForm/StyledComponents";
import BasicInfoFields from "./components/DialogForm/BasicInfoFields";
import ContactInfoFields from "./components/DialogForm/ContactInfoFields";
import AddressFields from "./components/DialogForm/AddressFields";
import AdditionalNotesFields from "./components/DialogForm/AdditionalNotesFields";
import EnhancedTabPanel from "./components/DialogForm/EnhancedTabPanel";
import EnhancedTabs from "./components/DialogForm/EnhancedTabs";
import EnhancedDialogTitle from "./components/DialogForm/EnhancedDialogTitle";
import EnhancedDialogActions from "./components/DialogForm/EnhancedDialogActions";

const FormSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
}));

const TabHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

// Tab Panel component for tabbed interface
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box 
          sx={{ 
            py: 2,
            backgroundColor: 'background.paper',
            borderRadius: 1,
            p: 2,
            mb: 4,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `customer-tab-${index}`,
    "aria-controls": `customer-tabpanel-${index}`,
  };
}

function DialogForm(props) {
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("userData"));
  const isAdmin = user.role === "admin";
  const inputList = useSelector((state) => state.customer.inputList);
  const itemList = useSelector((state) => state.customer.itemList);
  const mode = useSelector((state) => state.customer.mode);
  const groupList = useSelector((state) => state.customer.groupList);
  const locationSearch = useSelector((state) => state.global.locationSearch);

  // State
  const [provincesList, setProvincesList] = useState([]);
  const [districtList, setDistrictList] = useState([]);
  const [subDistrictList, setSubDistrictList] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [businessTypesList, setBusinessTypesList] = useState([]);
  const [isBusinessTypeManagerOpen, setIsBusinessTypeManagerOpen] =
    useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const [tabStatus, setTabStatus] = useState({
    basicInfo: 'incomplete',
    contactInfo: 'incomplete',
    address: 'optional',
    notes: 'optional'
  });

  // Refs
  const formRef = useRef(null);

  // Context
  const { scrollToTop } = useContext(ScrollContext);

  // API hooks
  const [addCustomer] = useAddCustomerMutation();
  const [updateCustomer] = useUpdateCustomerMutation();
  const {
    data: locations,
    error,
    isFetching,
  } = useGetAllLocationQuery(locationSearch, { skip: !props.openDialog });
  const {
    data: userRoleData,
    error: roleError,
    isFetching: roleIsFetching,
  } = useGetUserByRoleQuery("sale", { skip: !props.openDialog });
  const {
    data: businessTypesData,
    error: businessTypesError,
    isFetching: businessTypesIsFetching,
  } = useGetAllBusinessTypesQuery(undefined, { skip: !props.openDialog });

  // Constants
  const titleMap = {
    create: "เพิ่ม",
    edit: "แก้ไข",
    view: "ดู",
  };

  const selectList = [
    { value: "1", title: "sales" },
    { value: "2", title: "online" },
    { value: "3", title: "office" },
  ];

  const formattedRelativeTime = formatCustomRelativeTime(
    inputList.cd_last_datetime
  );

  // Handlers
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Scroll to tab content with smooth animation
    const tabContent = document.getElementById(`customer-tabpanel-${newValue}`);
    if (tabContent) {
      setTimeout(() => {
        // Adjust scroll position to account for the sticky tabs at the top
        const tabsHeight = 74; // Height of the tabs
        const dialogContent = document.querySelector('.MuiDialogContent-root');
        if (dialogContent) {
          const tabContentPosition = tabContent.offsetTop - tabsHeight - 16;
          dialogContent.scrollTo({ 
            top: tabContentPosition, 
            behavior: "smooth" 
          });
        } else {
          tabContent.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

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
    setErrors((prev) => ({ ...prev, cus_bt_id: "" }));
    setIsBusinessTypeManagerOpen(false);
  };

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

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectLocation = useCallback(
    (e) => {
      const { name, value } = e.target;
      let updatedInputList = {
        ...inputList,
        [name]: value,
        cus_updated_by: user.user_id,
      };

      const clearDependentDropdowns = (dependencies) => {
        dependencies.forEach((dep) => {
          updatedInputList = { ...updatedInputList, [dep]: "" };
        });
      };

      switch (name) {
        case "cus_pro_id": {
          clearDependentDropdowns(["cus_dis_id", "cus_sub_id", "cus_zip_code"]);
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
          clearDependentDropdowns(["cus_sub_id", "cus_zip_code"]);
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
    [inputList, provincesList, districtList, subDistrictList, setLocationSearch]
  );

  const validateForm = () => {
    const form = formRef.current;

    // Validate business type manually (required field check)
    const newErrors = {};
    if (!inputList.cus_bt_id) {
      newErrors.cus_bt_id = "กรุณาเลือกประเภทธุรกิจ";
    }

    if (form.checkValidity() && !newErrors.cus_bt_id) {
      // อัปเดตสถานะแท็บอีกครั้งก่อนส่งฟอร์ม
      updateTabStatus();
      return true;
    } else {
      // อัปเดต error state ตาม input ที่ยังไม่ได้กรอก
      form.querySelectorAll(":invalid").forEach((input) => {
        newErrors[input.name] = input.validationMessage;
      });
      setErrors(newErrors);

      const firstErrorField = Object.keys(newErrors)[0];

      if (firstErrorField && formRef.current[firstErrorField]) {
        // Find which tab contains the error field
        const errorFieldTab = getTabForField(firstErrorField);
        setTabValue(errorFieldTab);

        // Wait for tab to render then scroll to field
        setTimeout(() => {
          formRef.current[firstErrorField].scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          formRef.current[firstErrorField].focus();
        }, 100);
      }

      // อัปเดตสถานะแท็บเพื่อแสดงว่าแท็บไหนยังมีข้อมูลไม่ครบถ้วน
      updateTabStatus();
      return false;
    }
  };

  // Helper function to determine which tab contains a specific field
  const getTabForField = (fieldName) => {
    const basicInfoFields = [
      "cus_company",
      "cus_firstname",
      "cus_lastname",
      "cus_name",
      "cus_depart",
      "cus_bt_id",
      "cus_channel",
      "cus_manage_by",
    ];
    const contactFields = ["cus_tel_1", "cus_tel_2", "cus_email", "cus_tax_id"];
    const addressFields = [
      "cus_address",
      "cus_pro_id",
      "cus_dis_id",
      "cus_sub_id",
      "cus_zip_code",
    ];

    if (basicInfoFields.includes(fieldName)) return 0;
    if (contactFields.includes(fieldName)) return 1;
    if (addressFields.includes(fieldName)) return 2;
    return 3; // Notes tab for any other fields
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
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
    setErrors({});
  };

  // ฟังก์ชันสำหรับตรวจสอบความครบถ้วนของแต่ละแท็บ
  const updateTabStatus = useCallback(() => {
    const validateBasicInfoTab = () => {
      const requiredFields = ['cus_firstname', 'cus_lastname', 'cus_name', 'cus_bt_id'];
      const isComplete = requiredFields.every(field => {
        if (typeof inputList[field] === 'object') {
          return inputList[field]?.user_id;
        }
        return inputList[field] && String(inputList[field]).trim() !== '';
      });
      return isComplete ? 'complete' : 'incomplete';
    };

    const validateContactInfoTab = () => {
      // เช็คว่ามีการกรอกเบอร์โทรศัพท์หรือไม่
      return inputList.cus_tel_1 ? 'complete' : 'incomplete';
    };

    const validateAddressTab = () => {
      // ถ้าไม่มีข้อมูลที่อยู่เลย ถือว่าเป็น optional
      if (!inputList.cus_address || inputList.cus_address.trim() === '') {
        return 'optional';
      }
      
      // ถ้ามีที่อยู่ ต้องมีจังหวัดด้วย
      return inputList.cus_pro_id ? 'complete' : 'incomplete';
    };

    setTabStatus({
      basicInfo: validateBasicInfoTab(),
      contactInfo: validateContactInfoTab(),
      address: validateAddressTab(),
      notes: 'optional'  // แท็บบันทึกเพิ่มเติมไม่บังคับกรอก
    });
  }, [inputList]);

  // ใช้ useEffect เพื่ออัพเดทสถานะเมื่อข้อมูลในฟอร์มเปลี่ยนแปลง
  useEffect(() => {
    if (props.openDialog) {
      updateTabStatus();
    }
  }, [inputList, props.openDialog, updateTabStatus]);

  // Effects
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
  }, [mode]);

  useEffect(() => {
    if (locations) {
      setProvincesList(locations.master_provinces);
      setDistrictList(locations.master_district);
      setSubDistrictList(locations.master_subdistrict);
    }
  }, [locations]);

  useEffect(() => {
    if (userRoleData) {
      setSalesList(userRoleData.sale_role);
    }
  }, [userRoleData]);

  useEffect(() => {
    if (businessTypesData) {
      setBusinessTypesList(businessTypesData);
    }
  }, [businessTypesData]);

  useEffect(() => {
    if (isFetching || roleIsFetching || businessTypesIsFetching) {
      open_dialog_loading();
    } else {
      Swal.close(); // Close loading when fetching stops
    }
  }, [isFetching, roleIsFetching, businessTypesIsFetching]);

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
          elevation: 3,
          sx: { borderRadius: 2 }
        }}
      >
        <form ref={formRef} noValidate onSubmit={handleSubmit}>
          <DialogTitle
            sx={{
              paddingBlock: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'primary.lighter',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="600" color="primary.main">
                {titleMap[mode] + `ข้อมูลลูกค้า`}
              </Typography>
              {mode !== "create" && (
                <Chip
                  size="small"
                  color="info"
                  icon={<MdAccessTime size={14} />}
                  label={`${formattedRelativeTime} Days`}
                  sx={{ ml: 1, fontWeight: 500 }}
                />
              )}
            </Box>
            <IconButton
              aria-label="close"
              onClick={props.handleCloseDialog}
              sx={(theme) => ({
                color: theme.vars.palette.grey.title,
                '&:hover': { 
                  backgroundColor: 'error.lighter',
                  color: 'error.main'
                }
              })}
            >
              <MdClose />
            </IconButton>
          </DialogTitle>
          <Box sx={{ 
            position: 'sticky',
            top: 0, 
            zIndex: 10, 
            bgcolor: 'background.paper', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              aria-label="customer info tabs"
              sx={{
                bgcolor: '#fafafa',
                '& .MuiTabs-flexContainer': {
                  borderRadius: '4px 4px 0 0',
                  overflow: 'hidden'
                },
                '& .MuiTab-root': {
                  minHeight: '74px',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  py: 1,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.03)'
                  }
                },
                '& .Mui-selected': {
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                  fontWeight: 600
                }
              }}
            >
              <Tab
                icon={<MdPerson style={{ fontSize: '1.5rem' }} />}
                iconPosition="top"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    ข้อมูลพื้นฐาน
                    {tabStatus.basicInfo === 'complete' && 
                      <MdCheckCircle style={{ color: 'green', fontSize: '1rem' }} />
                    }
                    {tabStatus.basicInfo === 'incomplete' && 
                      <MdError style={{ color: 'red', fontSize: '1rem' }} />
                    }
                  </Box>
                }
                {...a11yProps(0)}
              />
              <Tab
                icon={<MdPhone style={{ fontSize: '1.5rem' }} />}
                iconPosition="top"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    ข้อมูลติดต่อ
                    {tabStatus.contactInfo === 'complete' && 
                      <MdCheckCircle style={{ color: 'green', fontSize: '1rem' }} />
                    }
                    {tabStatus.contactInfo === 'incomplete' && 
                      <MdError style={{ color: 'red', fontSize: '1rem' }} />
                    }
                  </Box>
                }
                {...a11yProps(1)}
              />
              <Tab
                icon={<MdLocationOn style={{ fontSize: '1.5rem' }} />}
                iconPosition="top"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    ที่อยู่
                    {tabStatus.address === 'complete' && 
                      <MdCheckCircle style={{ color: 'green', fontSize: '1rem' }} />
                    }
                    {tabStatus.address === 'incomplete' && 
                      <MdError style={{ color: 'red', fontSize: '1rem' }} />
                    }
                    {tabStatus.address === 'optional' && 
                      <MdInfo style={{ color: '#0288d1', fontSize: '1rem' }} />
                    }
                  </Box>
                }
                {...a11yProps(2)}
              />
              <Tab
                icon={<MdNotes style={{ fontSize: '1.5rem' }} />}
                iconPosition="top"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    บันทึกเพิ่มเติม
                    {tabStatus.notes === 'optional' && 
                      <MdInfo style={{ color: '#0288d1', fontSize: '1rem' }} />
                    }
                  </Box>
                }
                {...a11yProps(3)}
              />
            </Tabs>
          </Box>
          <DialogContent divides sx={{ maxHeight: '80vh', p: 3 }}>
            <Box sx={{ width: "100%", height: '100%', overflowY: 'auto' }}>
              {/* Note Card - แสดง Note สำคัญ */}
              {inputList.cd_note && (
                <Card
                  variant="outlined"
                  sx={{
                    mb: 3,
                    borderLeft: "4px solid",
                    borderColor: "#940c0c",
                    bgcolor: "warning.lighter",
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <MdNotes
                        style={{ fontSize: "20px", marginRight: "12px", color: '#940c0c' }}
                      />
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        color="#940c0c"
                      >
                        หมายเหตุสำคัญ
                      </Typography>
                    </Box>
                    <Typography variant="body1">{inputList.cd_note}</Typography>
                  </CardContent>
                </Card>
              )}
              
              {/* Customer Info Summary Card */}
              <Card 
                elevation={0}
                sx={{ 
                  mb: 3, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                  <Typography 
                    variant="subtitle1" 
                    fontWeight="600" 
                    color="primary.main" 
                    gutterBottom 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      mb: 2 
                    }}
                  >
                    <MdBusiness style={{ marginRight: '8px' }} />
                    ข้อมูลหลักของลูกค้า
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid size={12} md={8}>
                      <StyledTextField
                        fullWidth
                        required
                        label="ชื่อบริษัท"
                        size="small"
                        InputProps={{
                          readOnly: mode === "view",
                          startAdornment: (
                            <InputAdornment position="start">
                              <MdBusiness />
                            </InputAdornment>
                          ),
                          sx: { backgroundColor: 'white' }
                        }}
                        name="cus_company"
                        placeholder="บริษัท ธนพลัส 153 จำกัด"
                        value={inputList.cus_company || ""}
                        onChange={handleInputChange}
                        error={!!errors.cus_company}
                        helperText={errors.cus_company}
                      />
                    </Grid>

                    {isAdmin && (
                      <Grid size={12} md={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>ชื่อผู้ดูแล</InputLabel>
                          <StyledSelect
                            label="ชื่อผู้ดูแล"
                            name="cus_manage_by"
                            value={inputList.cus_manage_by?.user_id || ""}
                            onChange={handleInputChange}
                            readOnly={mode === "view"}
                            sx={{ backgroundColor: 'white' }}
                            startAdornment={
                              <InputAdornment position="start">
                                <MdPerson />
                              </InputAdornment>
                            }
                          >
                            <MenuItem value="">ไม่มีผู้ดูแล</MenuItem>
                            {salesList &&
                              salesList.map((item, index) => (
                                <MenuItem
                                  key={item.user_id + index}
                                  value={item.user_id}
                                  sx={{ textTransform: "capitalize" }}
                                >
                                  {item.username}
                                </MenuItem>
                              ))}
                          </StyledSelect>
                        </FormControl>
                      </Grid>
                    )}

                    <Grid size={12} md={isAdmin ? 6 : 8}>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          alignItems: "flex-start",
                        }}
                      >
                        <FormControl fullWidth size="small">
                          <InputLabel required>ประเภทธุรกิจ</InputLabel>
                          <StyledSelect
                            label="ประเภทธุรกิจ *"
                            name="cus_bt_id"
                            value={inputList.cus_bt_id || ""}
                            onChange={handleInputChange}
                            readOnly={
                              mode === "view" || businessTypesIsFetching
                            }
                            error={!!errors.cus_bt_id}
                            sx={{ backgroundColor: 'white' }}
                            startAdornment={
                              <InputAdornment position="start">
                                <MdBusiness />
                              </InputAdornment>
                            }
                            MenuProps={{
                              PaperProps: {
                                style: {
                                  maxHeight: 300,
                                },
                              },
                            }}
                          >
                            <MenuItem disabled value="">
                              ประเภทธุรกิจ
                            </MenuItem>
                            <MenuItem>
                              <input
                                autoFocus
                                placeholder="ค้นหาประเภทธุรกิจ..."
                                style={{
                                  width: "100%",
                                  padding: "8px",
                                  boxSizing: "border-box",
                                  border: "1px solid #ccc",
                                  borderRadius: "4px",
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const searchValue =
                                    e.target.value.toLowerCase();
                                  const filteredList =
                                    businessTypesData?.filter((item) =>
                                      item.bt_name
                                        .toLowerCase()
                                        .includes(searchValue)
                                    ) || [];
                                  setBusinessTypesList(filteredList);
                                }}
                              />
                            </MenuItem>
                            {businessTypesList.map((item) => (
                              <MenuItem key={item.bt_id} value={item.bt_id}>
                                {item.bt_name}
                              </MenuItem>
                            ))}
                          </StyledSelect>
                          <FormHelperText error>
                            {errors.cus_bt_id && "กรุณาเลือกประเภทธุรกิจ"}
                          </FormHelperText>
                        </FormControl>
                        <Tooltip title="จัดการประเภทธุรกิจ">
                          <IconButton
                            color="primary"
                            size="small"
                            sx={{
                              mt: 0.5,
                              bgcolor: (theme) =>
                                theme.vars.palette.grey.outlinedInput,
                              border: "1px solid",
                              borderColor: (theme) =>
                                theme.vars.palette.grey.outlinedInput,
                              '&:hover': {
                                bgcolor: 'primary.lighter'
                              }
                            }}
                            disabled={mode === "view"}
                            onClick={handleOpenBusinessTypeManager}
                          >
                            <MdSettings />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Grid>

                    <Grid size={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel required>ช่องทางการติดต่อ</InputLabel>
                        <StyledSelect
                          label="ช่องทางการติดต่อ *"
                          name="cus_channel"
                          value={inputList.cus_channel || ""}
                          onChange={handleInputChange}
                          readOnly={mode === "view"}
                          error={!!errors.cus_channel}
                          sx={{ backgroundColor: 'white' }}
                        >
                          {selectList.map((item, index) => (
                            <MenuItem
                              key={item.value + index}
                              value={item.value}
                              sx={{ textTransform: "uppercase" }}
                            >
                              {item.title}
                            </MenuItem>
                          ))}
                        </StyledSelect>
                        <FormHelperText error>
                          {errors.cus_channel && "กรุณาเลือกช่องทางการติดต่อ"}
                        </FormHelperText>
                      </FormControl>
                    </Grid>

                    <Grid size={12} md={2}>
                      <StyledTextField
                        fullWidth
                        disabled
                        size="small"
                        label="วันที่สร้าง"
                        value={
                          inputList.cus_created_date
                            ? moment(inputList.cus_created_date).format(
                                "DD/MM/YYYY"
                              )
                            : moment().format("DD/MM/YYYY")
                        }
                        InputProps={{
                          style: { textAlign: "center" },
                          sx: { backgroundColor: '#f5f5f5' }
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              {/* Basic Information Section with anchor for navigation */}
              <Box id="customer-tabpanel-0">
                <TabHeader>
                  <MdPerson style={{ fontSize: '22px', color: 'primary.main', marginRight: '12px' }} />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    ข้อมูลพื้นฐาน
                    {tabStatus.basicInfo === 'complete' && 
                      <MdCheckCircle style={{ color: 'green', fontSize: '1rem', marginLeft: '8px' }} />
                    }
                  </Typography>
                </TabHeader>
                <FormSection>
                  <BasicInfoFields
                    inputList={inputList}
                    handleInputChange={handleInputChange}
                    errors={errors}
                    mode={mode}
                  />
                </FormSection>
              </Box>
              
              {/* Contact Information Section with anchor for navigation */}
              <Box id="customer-tabpanel-1" sx={{ mt: 4 }}>
                <TabHeader>
                  <MdPhone style={{ fontSize: '22px', color: 'primary.main', marginRight: '12px' }} />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    ข้อมูลติดต่อ
                    {tabStatus.contactInfo === 'complete' && 
                      <MdCheckCircle style={{ color: 'green', fontSize: '1rem', marginLeft: '8px' }} />
                    }
                    {tabStatus.contactInfo === 'incomplete' && 
                      <MdError style={{ color: 'red', fontSize: '1rem', marginLeft: '8px' }} />
                    }
                  </Typography>
                </TabHeader>
                <FormSection>
                  <ContactInfoFields
                    inputList={inputList}
                    handleInputChange={handleInputChange}
                    errors={errors}
                    mode={mode}
                  />
                </FormSection>
              </Box>
              
              {/* Address Information Section with anchor for navigation */}
              <Box id="customer-tabpanel-2" sx={{ mt: 4 }}>
                <TabHeader>
                  <MdLocationOn style={{ fontSize: '22px', color: 'primary.main', marginRight: '12px' }} />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    ที่อยู่
                    {tabStatus.address === 'complete' && 
                      <MdCheckCircle style={{ color: 'green', fontSize: '1rem', marginLeft: '8px' }} />
                    }
                    {tabStatus.address === 'optional' && 
                      <MdInfo style={{ color: '#0288d1', fontSize: '1rem', marginLeft: '8px' }} />
                    }
                  </Typography>
                </TabHeader>
                <FormSection>
                  <AddressFields
                    inputList={inputList}
                    handleInputChange={handleInputChange}
                    mode={mode}
                    handleSelectLocation={handleSelectLocation}
                    provincesList={provincesList}
                    districtList={districtList}
                    subDistrictList={subDistrictList}
                    isFetching={isFetching}
                  />
                </FormSection>
              </Box>
              
              {/* Additional Notes Section with anchor for navigation */}
              <Box id="customer-tabpanel-3" sx={{ mt: 4 }}>
                <TabHeader>
                  <MdNotes style={{ fontSize: '22px', color: 'primary.main', marginRight: '12px' }} />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    บันทึกเพิ่มเติม
                    {tabStatus.notes === 'optional' && 
                      <MdInfo style={{ color: '#0288d1', fontSize: '1rem', marginLeft: '8px' }} />
                    }
                  </Typography>
                </TabHeader>
                <FormSection>
                  <AdditionalNotesFields
                    inputList={inputList}
                    handleInputChange={handleInputChange}
                    mode={mode}
                  />
                </FormSection>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
            {mode !== "view" && (
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saveLoading}
                startIcon={<MdSave />}
                size="large"
                sx={{ 
                  mr: 1,
                  px: 3,
                  fontWeight: 600,
                  boxShadow: 2
                }}
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
              size="large"
              sx={{ 
                fontWeight: 600,
                px: 2
              }}
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
