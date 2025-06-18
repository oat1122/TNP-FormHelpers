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

// Custom styled components
const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: theme.vars.palette.grey.outlinedInput,
    "&.Mui-disabled": {
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.vars.palette.grey.outlinedInput,
      },
      "& .MuiOutlinedInput-input": {
        WebkitTextFillColor: theme.vars.palette.text.primary,
      },
    },
  },
  "& .MuiInputLabel-root": {
    color: theme.vars.palette.grey.dark,
    fontFamily: "Kanit",
    fontSize: 14,
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  backgroundColor: theme.vars.palette.grey.outlinedInput,
  "& fieldset": {
    borderColor: theme.vars.palette.grey.outlinedInput,
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  marginBottom: theme.spacing(1),
  color: theme.vars.palette.primary.main,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const FormSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
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
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
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
      >
        <form ref={formRef} noValidate onSubmit={handleSubmit}>
          <DialogTitle
            sx={{
              paddingBlock: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="h6">
                {titleMap[mode] + `ข้อมูลลูกค้า`}
              </Typography>
              {mode !== "create" && (
                <Chip
                  size="small"
                  color="info"
                  label={`${formattedRelativeTime} Days`}
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
            <IconButton
              aria-label="close"
              onClick={props.handleCloseDialog}
              sx={(theme) => ({
                color: theme.vars.palette.grey.title,
              })}
            >
              <MdClose />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ width: "100%" }}>
              {" "}
              {/* Note Card - แสดง Note สำคัญ */}
              {inputList.cd_note && (
                <Card
                  variant="outlined"
                  sx={{
                    mb: 2,
                    borderLeft: "4px solid",
                    borderColor: "#940c0c",
                    bgcolor: "warning.lighter",
                  }}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    {" "}
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <MdNotes
                        style={{ fontSize: "18px", marginRight: "12px" }}
                      />
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        color="text.primary"
                      >
                        หมายเหตุสำคัญ
                      </Typography>
                    </Box>
                    <Typography variant="body1">{inputList.cd_note}</Typography>
                  </CardContent>
                </Card>
              )}
              {/* Customer Info Summary Card */}
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Grid container spacing={2}>
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
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
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
                <Grid container spacing={2}>
                  <Grid size={12} md={4}>
                    <StyledTextField
                      fullWidth
                      required
                      label="ชื่อจริง"
                      size="small"
                      name="cus_firstname"
                      placeholder="ชื่อจริง"
                      value={inputList.cus_firstname || ""}
                      onChange={handleInputChange}
                      error={!!errors.cus_firstname}
                      helperText={errors.cus_firstname}
                      InputProps={{
                        readOnly: mode === "view",
                      }}
                    />
                  </Grid>

                  <Grid size={12} md={4}>
                    <StyledTextField
                      fullWidth
                      required
                      label="นามสกุล"
                      size="small"
                      name="cus_lastname"
                      placeholder="นามสกุล"
                      value={inputList.cus_lastname || ""}
                      onChange={handleInputChange}
                      error={!!errors.cus_lastname}
                      helperText={errors.cus_lastname}
                      InputProps={{
                        readOnly: mode === "view",
                      }}
                    />
                  </Grid>

                  <Grid size={12} md={4}>
                    <StyledTextField
                      fullWidth
                      required
                      label="ชื่อเล่น"
                      size="small"
                      name="cus_name"
                      placeholder="ชื่อเล่น"
                      value={inputList.cus_name || ""}
                      onChange={handleInputChange}
                      error={!!errors.cus_name}
                      helperText={errors.cus_name}
                      InputProps={{
                        readOnly: mode === "view",
                      }}
                    />
                  </Grid>

                  <Grid size={12}>
                    <StyledTextField
                      fullWidth
                      label="ตำแหน่ง"
                      size="small"
                      name="cus_depart"
                      placeholder="ตำแหน่ง"
                      value={inputList.cus_depart || ""}
                      onChange={handleInputChange}
                      InputProps={{
                        readOnly: mode === "view",
                      }}
                    />
                  </Grid>
                </Grid>
              </TabPanel>
              {/* Tab 2: Contact Information */}
              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={2}>
                  <Grid size={12} md={6}>
                    <StyledTextField
                      fullWidth
                      required
                      label="เบอร์โทรศัพท์"
                      size="small"
                      name="cus_tel_1"
                      placeholder="เบอร์"
                      value={inputList.cus_tel_1 || ""}
                      onChange={handleInputChange}
                      error={!!errors.cus_tel_1}
                      helperText={errors.cus_tel_1}
                      InputProps={{
                        readOnly: mode === "view",
                        startAdornment: (
                          <InputAdornment position="start">
                            <MdPhone />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid size={12} md={6}>
                    <StyledTextField
                      fullWidth
                      label="เบอร์สำรอง"
                      size="small"
                      name="cus_tel_2"
                      placeholder="เบอร์สำรอง"
                      value={inputList.cus_tel_2 || ""}
                      onChange={handleInputChange}
                      InputProps={{
                        readOnly: mode === "view",
                        startAdornment: (
                          <InputAdornment position="start">
                            <MdPhone />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid size={12}>
                    <StyledTextField
                      fullWidth
                      label="อีเมล"
                      size="small"
                      name="cus_email"
                      placeholder="อีเมล"
                      value={inputList.cus_email || ""}
                      onChange={handleInputChange}
                      InputProps={{
                        readOnly: mode === "view",
                        startAdornment: (
                          <InputAdornment position="start">
                            <MdEmail />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid size={12}>
                    <StyledTextField
                      fullWidth
                      label="เลขผู้เสียภาษี"
                      size="small"
                      name="cus_tax_id"
                      placeholder="เลขผู้เสียภาษี"
                      value={inputList.cus_tax_id || ""}
                      onChange={handleInputChange}
                      InputProps={{
                        readOnly: mode === "view",
                      }}
                    />
                  </Grid>
                </Grid>
              </TabPanel>
              {/* Tab 3: Address Information */}
              <TabPanel value={tabValue} index={2}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <StyledTextField
                      fullWidth
                      label="ที่อยู่"
                      size="small"
                      name="cus_address"
                      placeholder="บ้านเลขที่/ถนน/ซอย/หมู่บ้าน"
                      value={inputList.cus_address || ""}
                      onChange={handleInputChange}
                      InputProps={{
                        readOnly: mode === "view",
                        startAdornment: (
                          <InputAdornment position="start">
                            <MdLocationOn />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid size={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>จังหวัด</InputLabel>
                      <StyledSelect
                        label="จังหวัด"
                        name="cus_pro_id"
                        value={inputList.cus_pro_id || ""}
                        onChange={handleSelectLocation}
                        readOnly={mode === "view"}
                      >
                        <MenuItem disabled value="">
                          จังหวัด
                        </MenuItem>
                        {provincesList.map((item, index) => (
                          <MenuItem key={index} value={item.pro_id}>
                            {item.pro_name_th}
                          </MenuItem>
                        ))}
                      </StyledSelect>
                    </FormControl>
                  </Grid>

                  <Grid size={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>เขต/อำเภอ</InputLabel>
                      <StyledSelect
                        label="เขต/อำเภอ"
                        name="cus_dis_id"
                        value={inputList.cus_dis_id || ""}
                        onChange={handleSelectLocation}
                        readOnly={mode === "view" || isFetching}
                      >
                        <MenuItem disabled value="">
                          เขต/อำเภอ
                        </MenuItem>
                        {districtList.map((item, index) => (
                          <MenuItem key={index} value={item.dis_id}>
                            {item.dis_name_th}
                          </MenuItem>
                        ))}
                      </StyledSelect>
                    </FormControl>
                  </Grid>

                  <Grid size={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>แขวง/ตำบล</InputLabel>
                      <StyledSelect
                        label="แขวง/ตำบล"
                        name="cus_sub_id"
                        value={inputList.cus_sub_id || ""}
                        onChange={handleSelectLocation}
                        readOnly={mode === "view" || isFetching}
                      >
                        <MenuItem disabled value="">
                          แขวง/ตำบล
                        </MenuItem>
                        {subDistrictList.map((item, index) => (
                          <MenuItem key={index} value={item.sub_id}>
                            {item.sub_name_th}
                          </MenuItem>
                        ))}
                      </StyledSelect>
                    </FormControl>
                  </Grid>

                  <Grid size={12} md={6}>
                    <StyledTextField
                      fullWidth
                      label="รหัสไปรษณีย์"
                      size="small"
                      name="cus_zip_code"
                      placeholder="รหัสไปรษณีย์"
                      value={inputList.cus_zip_code || ""}
                      onChange={handleInputChange}
                      InputProps={{
                        readOnly: mode === "view",
                      }}
                    />
                  </Grid>
                </Grid>
              </TabPanel>
              {/* Tab 4: Additional Notes */}
              <TabPanel value={tabValue} index={3}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <StyledTextField
                      fullWidth
                      label="Note"
                      multiline
                      minRows={3}
                      size="small"
                      name="cd_note"
                      value={inputList.cd_note || ""}
                      onChange={handleInputChange}
                      InputProps={{
                        readOnly: mode === "view",
                      }}
                    />
                  </Grid>

                  <Grid size={12}>
                    <StyledTextField
                      fullWidth
                      label="รายละเอียดเพิ่มเติม"
                      multiline
                      minRows={5}
                      size="small"
                      name="cd_remark"
                      value={inputList.cd_remark || ""}
                      onChange={handleInputChange}
                      InputProps={{
                        readOnly: mode === "view",
                      }}
                    />
                  </Grid>
                </Grid>
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
