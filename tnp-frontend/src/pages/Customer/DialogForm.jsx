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
  Typography,
  TextField,
  Stack,
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
import CompactHeader from "./components/DialogForm/CompactHeader";

// Tab Panel component for tabbed interface

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
      form.querySelectorAll(":invalid").forEach((input) => {
        newErrors[input.name] = input.validationMessage;
      });
      setErrors(newErrors);
      return false;
    }
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

            <DialogContent sx={{ height: 'calc(100vh - 140px)', p: 2, overflow: 'hidden' }}>
              {inputList.cd_note && (
                <Card
                  variant="outlined"
                  sx={{
                    mb: 2,
                    borderLeft: '4px solid',
                    borderColor: '#940c0c',
                    bgcolor: 'warning.lighter',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <MdNotes style={{ fontSize: 20, marginRight: 12, color: '#940c0c' }} />
                      <Typography variant="subtitle1" fontWeight="bold" color="#940c0c">
                        หมายเหตุสำคัญ
                      </Typography>
                    </Box>
                    <Typography variant="body1">{inputList.cd_note}</Typography>
                  </CardContent>
                </Card>
              )}
              <CompactHeader />
              <Grid container spacing={2} sx={{ height: 'calc(100% - 120px)' }}>
                <Grid item xs={12} md={6} sx={{ height: '100%', overflow: 'auto' }}>
                  <Stack spacing={2}>
                    <BasicInfoFields
                      inputList={inputList}
                      handleInputChange={handleInputChange}
                      errors={errors}
                      mode={mode}
                    />
                    <ContactInfoFields
                      inputList={inputList}
                      handleInputChange={handleInputChange}
                      errors={errors}
                      mode={mode}
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6} sx={{ height: '100%', overflow: 'auto' }}>
                  <Stack spacing={2}>
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
                    <AdditionalNotesFields
                      inputList={inputList}
                      handleInputChange={handleInputChange}
                      mode={mode}
                    />
                  </Stack>
                </Grid>
              </Grid>
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
