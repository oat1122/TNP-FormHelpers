// filepath: d:\01oat\TNP-FormHelpers\tnp-frontend\src\pages\Customer\DialogForm.jsx
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
} from "@mui/material";
import { MdAdd, MdSettings, MdSearch } from "react-icons/md";
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
import { MdClose } from "react-icons/md";
import Swal from "sweetalert2";
import ErrorBoundary from "../../components/ErrorBoundary";

const StyledOutlinedInput = styled(OutlinedInput)(({ theme }) => ({
  backgroundColor: theme.vars.palette.grey.outlinedInput,

  "& fieldset": {
    borderColor: theme.vars.palette.grey.outlinedInput,
  },

  "&.Mui-disabled": {
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.vars.palette.grey.outlinedInput,
    },

    "& .MuiOutlinedInput-input": {
      WebkitTextFillColor: theme.vars.palette.text.primary,
    },
  },
}));

const StyledLabel = styled(InputLabel)(({ theme }) => ({
  backgroundColor: theme.vars.palette.grey.main,
  color: theme.vars.palette.grey.dark,
  borderRadius: theme.vars.shape.borderRadius,
  fontFamily: "Kanit",
  fontSize: 16,
  height: "100%",
  alignContent: "center",
  maxHeight: 40,
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  backgroundColor: theme.vars.palette.grey.outlinedInput,

  "& fieldset": {
    borderColor: theme.vars.palette.grey.outlinedInput,
  },
}));

function DialogForm(props) {
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("userData"));
  const isAdmin = user.role === "admin";
  const inputList = useSelector((state) => state.customer.inputList);
  const itemList = useSelector((state) => state.customer.itemList);
  const mode = useSelector((state) => state.customer.mode);
  const groupList = useSelector((state) => state.customer.groupList);
  const locationSearch = useSelector((state) => state.global.locationSearch);
  const [provincesList, setProvincesList] = useState([]);
  const [districtList, setDistrictList] = useState([]);
  const [subDistrictList, setSubDistrictList] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [businessTypesList, setBusinessTypesList] = useState([]);
  const [isBusinessTypeManagerOpen, setIsBusinessTypeManagerOpen] =
    useState(false);
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
  const [saveLoading, setSaveLoading] = useState(false);
  const formRef = useRef(null);
  const [errors, setErrors] = useState({});
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

  // const dateString = moment().add(30, "days");
  const formattedRelativeTime = formatCustomRelativeTime(
    inputList.cd_last_datetime
  );

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
  };  const handleInputChange = (e) => {
    // Safely extract name and value
    const name = e?.target?.name;
    let value = e?.target?.value;

    // Safety check - if we don't have a valid name, we can't update anything
    if (!name) return;

    if (name === "cus_tax_id" || name === "cus_zip_code") {
      value = (value || "").replace(/[^0-9]/g, "");
    } else if (name === "cus_manage_by") {
      // Properly handle the cus_manage_by changes
      // If value is empty string, set empty object with empty values
      if (value === "" || value === null || value === undefined) {
        value = { user_id: "", username: "" };
      } else {
        // Find the corresponding sales person
        const salesPerson = salesList?.find((user) => user?.user_id === value) || null;
        value = salesPerson
          ? { user_id: salesPerson.user_id || "", username: salesPerson.username || "" }
          : { user_id: "", username: "" };
      }
    }

    // Get current inputList safely (default to empty object if undefined)
    const currentInputList = inputList || {};

    dispatch(
      setInputList({
        ...currentInputList, // Include existing values
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
        formRef.current[firstErrorField].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        formRef.current[firstErrorField].focus();
      }

      return false;
    }
  };
  const { scrollToTop } = useContext(ScrollContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setSaveLoading(true);

      let res;

      try {
        open_dialog_loading();

        if (mode === "create") {
          res = await addCustomer(inputList);
        } else {
          res = await updateCustomer(inputList);
        }

        if (res.data.status === "success") {
          props.handleCloseDialog();

          open_dialog_ok_timer("บันทึกข้อมูลสำเร็จ").then((result) => {
            setSaveLoading(false);
            dispatch(resetInputList());
            // Scroll to top after customer is added or updated
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
  useEffect(() => {
    if (mode === "create") {
      // Generate customer number
      const maxCusNo = String(
        Math.max(...itemList.map((customer) => parseInt(customer.cus_no, 10)))
      );
      const newCusNo = genCustomerNo(maxCusNo);

      // Get group ID (improved handling of empty groupList and simplified logic)
      const cus_mcg_id =
        groupList.length > 0
          ? groupList.reduce(
              (max, group) =>
                parseInt(group.mcg_sort, 10) > parseInt(max.mcg_sort, 10)
                  ? group
                  : max,
              groupList[0]
            ).mcg_id
          : null; // Or your appropriate default if groupList is empty

      dispatch(
        setInputList({
          ...inputList,
          cus_no: newCusNo,
          cus_mcg_id: cus_mcg_id, // Include mcg_id, might be null
          cus_manage_by: isAdmin ? { user_id: "", username: "" } : { user_id: user.user_id, username: user.username || "" },
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
      
      // Check if the current user_id from inputList.cus_manage_by exists in salesList
      // If it doesn't exist and mode is edit/view, update the value to avoid out-of-range errors
      if (mode === 'edit' || mode === 'view') {
        const currentManagerId = inputList.cus_manage_by?.user_id;
        
        if (currentManagerId && 
            currentManagerId !== "" &&
            !userRoleData.sale_role.some(user => user.user_id === currentManagerId)) {
          // The selected manager ID doesn't exist in the available options, reset it
          console.warn(`Selected user_id=${currentManagerId} not found in available sales list. Resetting value.`);
          dispatch(
            setInputList({
              ...inputList,
              cus_manage_by: { user_id: "", username: "" }
            })
          );
        }
      }
    }
  }, [userRoleData, mode, dispatch]);

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
  }, [isFetching, roleIsFetching, businessTypesIsFetching]);  // Additional useEffect to ensure cus_manage_by is always properly initialized as an object
  // This runs only once when the component mounts
  useEffect(() => {
    // If cus_manage_by is undefined, null, or not an object, initialize it
    if (!inputList || !inputList.cus_manage_by || typeof inputList.cus_manage_by !== 'object') {
      console.info('Fixing cus_manage_by format to ensure it is a properly structured object');
      
      // Create a safe version of the inputList
      const safeInputList = inputList || {};
      
      dispatch(
        setInputList({
          ...safeInputList,
          cus_manage_by: { user_id: "", username: "" }
        })
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array = run once on mount
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
        maxWidth="xl"
        disableEscapeKeyDown
        aria-hidden={props.openDialog ? false : true}
      >
        <ErrorBoundary onReset={() => {
          // Reset state when error boundary is reset
          dispatch(resetInputList());
          props.handleCloseDialog();
        }}>
        <form ref={formRef} noValidate onSubmit={handleSubmit}>
          <DialogTitle sx={{ paddingBlock: 1 }}>
            <Box sx={{ maxWidth: 800, justifySelf: "center" }}>
              {titleMap[mode] + `ข้อมูลลูกค้า`}
            </Box>
          </DialogTitle>
          <IconButton
            aria-label="close"
            onClick={props.handleCloseDialog}
            sx={(theme) => ({
              position: "absolute",
              right: 8,
              top: 10,
              color: theme.vars.palette.grey.title,
            })}
          >
            <MdClose />
          </IconButton>
          <DialogContent
            dividers
            sx={{ textAlign: "-webkit-center", paddingBottom: 0 }}
          >
            <Box sx={{ maxWidth: 800 }}>
              <Grid
                container
                sx={{ paddingBlock: 2, justifyContent: "center" }}
                spacing={2}
              >
                {isAdmin && (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>                    <StyledSelect
                      fullWidth
                      displayEmpty
                      size="small"
                      sx={{ textTransform: "capitalize", cursor: "auto" }}
                      readOnly={mode === "view"}
                      name="cus_manage_by"
                      value={
                        // Add multiple safeguards to ensure value is never undefined
                        (() => {
                          // First check if inputList exists
                          if (!inputList) return "";
                          
                          // Then check if cus_manage_by exists and is an object
                          const managedBy = inputList.cus_manage_by;
                          if (!managedBy) return "";
                          
                          // If it's a string (from older data format), return as is if not empty
                          if (typeof managedBy === 'string') return managedBy || "";
                          
                          // If it's an object, return user_id if it exists
                          if (typeof managedBy === 'object') return managedBy.user_id || "";
                          
                          // Fallback to empty string
                          return "";
                        })()
                      }
                      onChange={handleInputChange}
                    >
                      <MenuItem disabled value="">
                        ชื่อผู้ดูแล
                      </MenuItem>
                      <MenuItem value="">ไม่มีผู้ดูแล</MenuItem>                      {Array.isArray(salesList) && salesList.length > 0 ? 
                        salesList.map((item, index) => (
                          <MenuItem
                            key={(item?.user_id || '') + index}
                            value={item?.user_id || ''}
                            sx={{ textTransform: "capitalize" }}
                          >
                            {item?.username || 'Unknown User'}
                          </MenuItem>
                        ))
                        : 
                        <MenuItem value="" disabled>No sales users available</MenuItem>
                      }
                    </StyledSelect>
                  </Grid>
                )}{" "}
                <Grid size={{ xs: 12, sm: isAdmin ? 6 : 12, md: 3 }}>
                  <StyledSelect
                    required
                    fullWidth
                    displayEmpty
                    size="small"
                    sx={{ textTransform: "uppercase", cursor: "auto" }}
                    readOnly={mode === "view"}
                    name="cus_channel"
                    value={inputList.cus_channel || ""}
                    onChange={handleInputChange}
                    error={!!errors.cus_channel}
                  >
                    <MenuItem disabled value="">
                      ช่องทางการติดต่อ
                    </MenuItem>
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
                </Grid>{" "}
                <Grid size={{ xs: 12, md: 5 }}>
                  <Box
                    sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <StyledSelect
                        required
                        fullWidth
                        displayEmpty
                        size="small"
                        sx={{ textTransform: "uppercase", textAlign: "start" }}
                        readOnly={mode === "view" || businessTypesIsFetching}
                        name="cus_bt_id"
                        value={inputList.cus_bt_id || ""}
                        onChange={handleInputChange}
                        error={!!errors.cus_bt_id}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300,
                            },
                          },
                          anchorOrigin: {
                            vertical: "bottom",
                            horizontal: "left",
                          },
                          transformOrigin: {
                            vertical: "top",
                            horizontal: "left",
                          },
                        }}
                      >
                        <MenuItem disabled value="">
                          ประเภทธุรกิจ
                        </MenuItem>{" "}
                        <MenuItem
                          component="div"
                          sx={{
                            position: "sticky",
                            top: 0,
                            bgcolor: "background.paper",
                            zIndex: 1,
                            borderBottom: "1px solid",
                            borderBottomColor: "divider",
                            "&:hover": {
                              bgcolor: "background.paper",
                            },
                          }}
                          disableRipple
                          tabIndex={-1}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              width: "100%",
                            }}
                          >
                            <MdSearch
                              style={{ marginLeft: 8, color: "#757575" }}
                            />
                            <input
                              autoFocus
                              placeholder="ค้นหาประเภทธุรกิจ..."
                              style={{
                                width: "100%",
                                padding: "8px",
                                boxSizing: "border-box",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                marginLeft: "4px",
                                fontFamily: "Kanit, sans-serif",
                                fontSize: "0.9rem",
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
                          </Box>
                        </MenuItem>
                        {businessTypesList.map((item) => (
                          <MenuItem
                            key={item.bt_id}
                            value={item.bt_id}
                            sx={{
                              fontFamily: "Kanit",
                              "&.Mui-selected": {
                                bgcolor: (theme) =>
                                  `${theme.vars.palette.error.main}1A`,
                                "&:hover": {
                                  bgcolor: (theme) =>
                                    `${theme.vars.palette.error.main}26`,
                                },
                              },
                            }}
                          >
                            {item.bt_name}
                          </MenuItem>
                        ))}
                      </StyledSelect>
                      <FormHelperText error>
                        {errors.cus_bt_id && "กรุณาเลือกประเภทธุรกิจ"}
                      </FormHelperText>
                    </Box>{" "}
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
                          "&:hover": {
                            bgcolor: (theme) =>
                              `${theme.vars.palette.error.main}1A`,
                            borderColor: (theme) =>
                              theme.vars.palette.error.main,
                          },
                        }}
                        disabled={mode === "view"}
                        onClick={handleOpenBusinessTypeManager}
                      >
                        <MdSettings style={{ color: "#757575" }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
                <Grid size={{ xs: mode === "create" ? 12 : 6, md: 2 }}>
                  <StyledOutlinedInput
                    fullWidth
                    disabled
                    size="small"
                    value={
                      inputList.cus_created_date
                        ? moment(inputList.cus_created_date).format(
                            "DD/MM/YYYY"
                          )
                        : moment().format("DD/MM/YYYY")
                    }
                    inputProps={{ style: { textAlign: "-webkit-center" } }}
                  />
                </Grid>
                {mode !== "create" && (
                  <Grid size={{ xs: 6, md: 2 }}>
                    <StyledOutlinedInput
                      fullWidth
                      disabled
                      size="small"
                      value={`${formattedRelativeTime} Days`}
                      inputProps={{
                        style: {
                          textAlign: "-webkit-center",
                          textTransform: "uppercase",
                        },
                      }}
                    />
                  </Grid>
                )}
                <Grid size={12}>
                  <StyledOutlinedInput
                    fullWidth
                    required
                    size="small"
                    readOnly={mode === "view"}
                    name="cus_company"
                    placeholder="บริษัท ธนพลัส 153 จำกัด"
                    value={inputList.cus_company}
                    onChange={handleInputChange}
                    inputProps={{ style: { textAlign: "center" } }}
                    error={!!errors.cus_company}
                  />
                  <FormHelperText error>
                    {errors.cus_company && "กรุณากรอกชื่อบริษัท"}
                  </FormHelperText>
                </Grid>
                <Grid display={{ xs: "none", md: "block" }} size={2}>
                  <StyledLabel>
                    <label style={{ color: "red", marginRight: 1 }}>*</label>
                    ชื่อจริง
                  </StyledLabel>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <StyledOutlinedInput
                    fullWidth
                    required
                    size="small"
                    readOnly={mode === "view"}
                    name="cus_firstname"
                    placeholder="ชื่อจริง"
                    value={inputList.cus_firstname}
                    onChange={handleInputChange}
                    error={!!errors.cus_firstname}
                  />
                  <FormHelperText error>
                    {errors.cus_firstname && "กรุณากรอกชื่อจริง"}
                  </FormHelperText>
                </Grid>
                <Grid display={{ xs: "none", md: "block" }} size={2}>
                  <StyledLabel>
                    <label style={{ color: "red", marginRight: 1 }}>*</label>
                    นามสกุล
                  </StyledLabel>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <StyledOutlinedInput
                    fullWidth
                    required
                    size="small"
                    readOnly={mode === "view"}
                    name="cus_lastname"
                    placeholder="นามสกุล"
                    value={inputList.cus_lastname}
                    onChange={handleInputChange}
                    error={!!errors.cus_lastname}
                  />
                  <FormHelperText error>
                    {errors.cus_lastname && "กรุณากรอกนามสกุล "}
                  </FormHelperText>
                </Grid>
                <Grid display={{ xs: "none", md: "block" }} size={2}>
                  <StyledLabel>
                    <label style={{ color: "red", marginRight: 1 }}>*</label>
                    ชื่อเล่น
                  </StyledLabel>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <StyledOutlinedInput
                    fullWidth
                    required
                    size="small"
                    readOnly={mode === "view"}
                    name="cus_name"
                    placeholder="ชื่อเล่น"
                    value={inputList.cus_name}
                    onChange={handleInputChange}
                    error={!!errors.cus_name}
                  />
                  <FormHelperText error>
                    {errors.cus_name && "กรุณากรอกชื่อเล่น"}
                  </FormHelperText>
                </Grid>
                <Grid display={{ xs: "none", md: "block" }} size={2}>
                  <StyledLabel>ตำแหน่ง</StyledLabel>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <StyledOutlinedInput
                    fullWidth
                    size="small"
                    readOnly={mode === "view"}
                    name="cus_depart"
                    placeholder="ตำแหน่ง"
                    value={inputList.cus_depart}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid display={{ xs: "none", md: "block" }} size={2}>
                  <StyledLabel>
                    <label style={{ color: "red", marginRight: 1 }}>*</label>
                    เบอร์
                  </StyledLabel>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <StyledOutlinedInput
                    fullWidth
                    required
                    size="small"
                    readOnly={mode === "view"}
                    name="cus_tel_1"
                    placeholder="เบอร์"
                    value={inputList.cus_tel_1}
                    onChange={handleInputChange}
                    error={!!errors.cus_tel_1}
                  />
                  <FormHelperText error>
                    {errors.cus_tel_1 && "กรุณากรอกเบอร์"}
                  </FormHelperText>
                </Grid>
                <Grid display={{ xs: "none", md: "block" }} size={2}>
                  <StyledLabel>เบอร์สำรอง</StyledLabel>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <StyledOutlinedInput
                    fullWidth
                    size="small"
                    readOnly={mode === "view"}
                    name="cus_tel_2"
                    placeholder="เบอร์สำรอง"
                    value={inputList.cus_tel_2}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid display={{ xs: "none", md: "block" }} size={2}>
                  <StyledLabel>อีเมล</StyledLabel>
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <StyledOutlinedInput
                    fullWidth
                    size="small"
                    readOnly={mode === "view"}
                    name="cus_email"
                    placeholder="อีเมล"
                    value={inputList.cus_email}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid display={{ xs: "none", md: "block" }} size={2}>
                  <StyledLabel>เลขผู้เสียภาษี</StyledLabel>
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <StyledOutlinedInput
                    fullWidth
                    size="small"
                    readOnly={mode === "view"}
                    name="cus_tax_id"
                    placeholder="เลขผู้เสียภาษี"
                    value={inputList.cus_tax_id}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid display={{ xs: "none", md: "block" }} size={2}>
                  <StyledLabel>ที่อยู่</StyledLabel>
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <StyledOutlinedInput
                    fullWidth
                    size="small"
                    readOnly={mode === "view"}
                    placeholder="บ้านเลขที่/ถนน/ซอย/หมู่บ้าน"
                    name="cus_address"
                    value={inputList.cus_address}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Select
                    // required
                    fullWidth
                    displayEmpty
                    size="small"
                    sx={{ textTransform: "uppercase", textAlign: "start" }}
                    readOnly={mode === "view"}
                    input={<StyledOutlinedInput />}
                    name="cus_pro_id"
                    value={inputList.cus_pro_id}
                    onChange={handleSelectLocation}
                  >
                    <MenuItem disabled value="">
                      จังหวัด
                    </MenuItem>
                    {provincesList.map((item, index) => (
                      <MenuItem key={index} value={item.pro_id}>
                        {item.pro_name_th}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Select
                    // required
                    fullWidth
                    displayEmpty
                    size="small"
                    sx={{ textTransform: "uppercase", textAlign: "start" }}
                    readOnly={mode === "view" || isFetching}
                    input={<StyledOutlinedInput />}
                    name="cus_dis_id"
                    value={inputList.cus_dis_id}
                    onChange={handleSelectLocation}
                  >
                    <MenuItem disabled value="">
                      เขต/อำเภอ
                    </MenuItem>
                    {districtList.map((item, index) => (
                      <MenuItem key={index} value={item.dis_id}>
                        {item.dis_name_th}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Select
                    // required
                    fullWidth
                    displayEmpty
                    size="small"
                    sx={{ textTransform: "uppercase", textAlign: "start" }}
                    readOnly={mode === "view" || isFetching}
                    input={<StyledOutlinedInput />}
                    name="cus_sub_id"
                    value={inputList.cus_sub_id}
                    onChange={handleSelectLocation}
                  >
                    <MenuItem disabled value="">
                      แขวง/ตำบล
                    </MenuItem>
                    {subDistrictList.map((item, index) => (
                      <MenuItem key={index} value={item.sub_id}>
                        {item.sub_name_th}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StyledOutlinedInput
                    fullWidth
                    size="small"
                    readOnly={mode === "view"}
                    placeholder="รหัสไปรษณีย์"
                    name="cus_zip_code"
                    value={inputList.cus_zip_code}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid size={12}>
                  <StyledOutlinedInput
                    fullWidth
                    multiline
                    minRows={2}
                    size="small"
                    readOnly={mode === "view"}
                    name="cd_note"
                    value={inputList.cd_note}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid size={12}>
                  <StyledOutlinedInput
                    fullWidth
                    multiline
                    minRows={5}
                    size="small"
                    readOnly={mode === "view"}
                    name="cd_remark"
                    value={inputList.cd_remark}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center" }}>
            <Box sx={{ width: 800 }}>
              <Grid
                container
                sx={{
                  paddingInline: { xs: 2, md: 0, lg: 1 },
                  paddingBlock: 2,
                  justifyContent: "end",
                }}
                spacing={2}
              >
                {mode !== "view" && (
                  <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      color="error"
                      disabled={saveLoading}
                      sx={{
                        height: 40,
                      }}
                    >
                      บันทึก
                    </Button>
                  </Grid>
                )}
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    disabled={saveLoading}
                    onClick={handleCloseDialog}
                    sx={{
                      height: 40,
                    }}
                  >
                    ยกเลิก
                  </Button>
                </Grid>
              </Grid>
            </Box>          </DialogActions>
        </form>
        </ErrorBoundary>
      </Dialog>
    </>
  );
}

export default DialogForm;
