import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  TextField,
  Button,
  Box,
  CircularProgress,
  Divider,
  Autocomplete,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  Alert,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

// นำเข้า Utils และ Hooks
import { validateCustomerData } from "../../../PricingIntegration/components/customerApiUtils";
import {
  normalizeManagerData,
  hydrateManagerUsername,
  getDefaultManagerAssignment,
  validateManagerAssignment,
  prepareManagerForApi,
} from "../../../PricingIntegration/components/managerUtils";
import { useGetUserByRoleQuery } from "../../../../../features/globalApi";
import { useAddCustomerMutation } from "../../../../../features/Customer/customerApi";
import {
  useGetAllBusinessTypesQuery,
  useGetAllLocationQuery,
  useLazyGetAllLocationQuery,
} from "../../../../../features/globalApi";
import { AddressService } from "../../../../../services/AddressService";
import { showSuccess, showError, showLoading, dismissToast } from "../../../utils/accountingToast";

// Styled Components
const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#FFFFFF",
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#B20000",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#900F0F",
      borderWidth: "2px",
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#900F0F",
  },
}));

const SaveButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(135deg, #4CAF50 0%, #45A049 100%)",
  color: "#FFFFFF",
  borderRadius: "12px",
  padding: "10px 20px",
  fontWeight: 600,
  textTransform: "none",
  boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
  "&:hover": {
    background: "linear-gradient(135deg, #45A049 0%, #388E3C 100%)",
    transform: "translateY(-2px)",
  },
  "&:disabled": {
    background: "#E0E0E0",
    color: "#9E9E9E",
  },
  transition: "all 0.3s ease-in-out",
}));

const CancelButton = styled(Button)(({ theme }) => ({
  border: "2px solid #FF6B6B",
  color: "#FF6B6B",
  borderRadius: "12px",
  padding: "8px 20px",
  fontWeight: 600,
  textTransform: "none",
  "&:hover": {
    backgroundColor: "rgba(255, 107, 107, 0.05)",
    borderColor: "#FF5252",
    color: "#FF5252",
  },
  transition: "all 0.3s ease-in-out",
}));

/**
 * CustomerCreateDialog
 * Dialog สำหรับสร้างลูกค้าใหม่ โดยอ้างอิง logic และ UI จาก CustomerEditCard
 */
const CustomerCreateDialog = ({ open, onClose, onSuccess }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [errors, setErrors] = useState({});

  // Loading states
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingSubdistricts, setIsLoadingSubdistricts] = useState(false);

  // RTK Query hooks
  const { data: userRoleData } = useGetUserByRoleQuery("sale");
  const { data: businessTypesData } = useGetAllBusinessTypesQuery();
  const { data: locationsData } = useGetAllLocationQuery({});
  const [fetchDistricts, { data: districtsData }] = useLazyGetAllLocationQuery();
  const [fetchSubdistricts, { data: subdistrictsData }] = useLazyGetAllLocationQuery();

  // ใช้ useAddCustomerMutation
  const [addCustomer, { isLoading: isCreating }] = useAddCustomerMutation();

  // Current user & role
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}") || {};
    } catch {
      return {};
    }
  }, []);
  const isAdmin = String(currentUser?.role).toLowerCase() === "admin";

  // Sales list
  const salesList = (userRoleData?.sale_role || [])
    .filter((u) => u && u.user_id != null)
    .map((u) => ({
      user_id: String(u.user_id),
      username: u.username || u.user_nickname || u.name || `User ${u.user_id}`,
    }));

  // State ข้อมูลฟอร์ม (สำหรับสร้างใหม่)
  const [editData, setEditData] = useState(() => {
    const defaultManager = getDefaultManagerAssignment(isAdmin, currentUser);
    return {
      cus_company: "",
      cus_firstname: "",
      cus_lastname: "",
      cus_name: "", // nickname
      cus_depart: "",
      cus_tel_1: "",
      cus_tel_2: "",
      cus_email: "",
      cus_tax_id: "",
      cus_address: "",
      cus_zip_code: "",
      cus_channel: "1", // Default to Sales
      cus_bt_id: "",
      cus_pro_id: "",
      cus_dis_id: "",
      cus_sub_id: "",
      customer_type: "company", // Default to company
      cus_manage_by: defaultManager,
    };
  });

  // Hydrate manager username
  useEffect(() => {
    if (!editData?.cus_manage_by?.user_id || !salesList.length) return;
    const hydratedManager = hydrateManagerUsername(editData.cus_manage_by, salesList);
    if (hydratedManager.username !== editData.cus_manage_by.username) {
      setEditData((prev) => ({
        ...prev,
        cus_manage_by: hydratedManager,
      }));
    }
  }, [userRoleData, editData?.cus_manage_by?.user_id, salesList]);

  // Load master data - Provinces
  useEffect(() => {
    if (locationsData) {
      const validProvinces = (locationsData.master_provinces || [])
        .filter((prov) => prov && prov.pro_id && prov.pro_name_th)
        .map((prov, index) => ({ ...prov, pro_id: prov.pro_id || `prov-${index}` }));
      setProvinces(validProvinces);
    }
  }, [locationsData]);

  // Load master data - Districts
  useEffect(() => {
    if (districtsData) {
      const validDistricts = (districtsData.master_district || [])
        .filter((district) => {
          const hasValidName = district.dis_name_th || district.dis_name;
          const hasValidId = district.dis_id;
          return district && hasValidId && hasValidName;
        })
        .map((district) => ({
          ...district,
          dis_name: district.dis_name || district.dis_name_th,
        }));
      setDistricts(validDistricts);
      setIsLoadingDistricts(false);
    }
  }, [districtsData]);

  // Load master data - Subdistricts
  useEffect(() => {
    if (subdistrictsData) {
      const validSubdistricts = (subdistrictsData.master_subdistrict || [])
        .filter((subdistrict) => {
          const hasValidName = subdistrict.sub_name_th || subdistrict.sub_name;
          const hasValidId = subdistrict.sub_id;
          return subdistrict && hasValidId && hasValidName;
        })
        .map((subdistrict) => ({
          ...subdistrict,
          sub_name: subdistrict.sub_name || subdistrict.sub_name_th,
        }));
      setSubdistricts(validSubdistricts);
      setIsLoadingSubdistricts(false);
    }
  }, [subdistrictsData]);

  const loadDistricts = useCallback(
    async (provinceId) => {
      if (!provinceId) {
        setDistricts([]);
        return;
      }
      setIsLoadingDistricts(true);
      fetchDistricts({ province_sort_id: provinceId });
      setSubdistricts([]);
    },
    [fetchDistricts]
  );

  const loadSubdistricts = useCallback(
    async (districtId) => {
      if (!districtId) {
        setSubdistricts([]);
        return;
      }
      setIsLoadingSubdistricts(true);
      fetchSubdistricts({ district_sort_id: districtId });
    },
    [fetchSubdistricts]
  );

  // Business types
  const businessTypes = useMemo(() => {
    if (!businessTypesData) return [];
    const btRaw = Array.isArray(businessTypesData)
      ? businessTypesData
      : businessTypesData?.master_business_types ||
        businessTypesData?.master_business_type ||
        businessTypesData?.data ||
        businessTypesData?.items ||
        [];
    return (btRaw || [])
      .filter((bt) => bt && (bt.bt_id != null || bt.id != null) && (bt.bt_name || bt.name))
      .map((bt, index) => ({
        ...bt,
        bt_id: bt.bt_id != null ? String(bt.bt_id) : bt.id != null ? String(bt.id) : `bt-${index}`,
        bt_name: bt.bt_name || bt.name || "ไม่ทราบประเภทธุรกิจ",
      }));
  }, [businessTypesData]);

  // Form handlers
  const handleInputChange = useCallback(
    (field, value) => {
      setEditData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const handleProvinceChange = useCallback(
    (event, newValue) => {
      handleInputChange("cus_pro_id", newValue?.pro_id || "");
      handleInputChange("cus_province_name", newValue?.pro_name_th || "");
      setDistricts([]);
      setSubdistricts([]);
      handleInputChange("cus_dis_id", "");
      handleInputChange("cus_district_name", "");
      handleInputChange("cus_sub_id", "");
      handleInputChange("cus_subdistrict_name", "");

      if (newValue?.pro_sort_id) {
        loadDistricts(newValue.pro_sort_id);
      } else if (newValue?.pro_id) {
        loadDistricts(newValue.pro_id);
      }
    },
    [handleInputChange, loadDistricts]
  );

  const handleDistrictChange = useCallback(
    (event, newValue) => {
      handleInputChange("cus_dis_id", newValue?.dis_id || "");
      handleInputChange("cus_district_name", newValue?.dis_name || newValue?.dis_name_th || "");
      setSubdistricts([]);
      handleInputChange("cus_sub_id", "");
      handleInputChange("cus_subdistrict_name", "");

      if (newValue?.dis_sort_id) {
        loadSubdistricts(newValue.dis_sort_id);
      } else if (newValue?.dis_id) {
        loadSubdistricts(newValue.dis_id);
      }
    },
    [handleInputChange, loadSubdistricts]
  );

  // Validation
  const validateForm = useCallback(() => {
    const validation = validateCustomerData(editData);
    const nextErrors = { ...(validation.errors || {}) };
    let isValid = !!validation.isValid;

    if (!editData.cus_channel || !["1", "2", "3"].includes(String(editData.cus_channel))) {
      nextErrors.cus_channel = "กรุณาเลือกช่องทางการติดต่อ";
      isValid = false;
    }

    const managerValidation = validateManagerAssignment(
      editData.cus_manage_by,
      isAdmin,
      salesList,
      currentUser
    );

    if (!managerValidation.isValid) {
      Object.assign(nextErrors, managerValidation.errors);
      isValid = false;
    } else if (!isAdmin && currentUser?.user_id && !editData.cus_manage_by?.user_id) {
      const defaultManager = getDefaultManagerAssignment(isAdmin, currentUser);
      setEditData((prev) => ({ ...prev, cus_manage_by: defaultManager }));
    }

    setErrors(nextErrors);
    return isValid;
  }, [editData, isAdmin, currentUser, salesList]);

  // Save Handler (สำหรับสร้าง)
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      showError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    setIsSaving(true);
    const loadingId = showLoading("กำลังสร้างข้อมูลลูกค้า…");

    try {
      // 1. Prepare Data
      const addressData = AddressService.prepareAddressForApi(editData);
      const apiData = { ...editData, ...addressData };

      // Fix backend address handling
      const hasComponents = apiData.cus_pro_id || apiData.cus_dis_id || apiData.cus_sub_id;
      if (hasComponents && apiData.cus_address !== undefined) {
        apiData.cus_address_detail = apiData.cus_address;
      }

      // Format for API
      apiData.customer_type = editData.customer_type === "individual" ? "individual" : "company";
      apiData.cus_type = apiData.customer_type;
      apiData.cus_channel = editData.cus_channel === "" ? null : parseInt(editData.cus_channel, 10);
      apiData.cus_bt_id =
        editData.cus_bt_id === ""
          ? null
          : isNaN(Number(editData.cus_bt_id))
            ? editData.cus_bt_id
            : Number(editData.cus_bt_id);

      // Manager assignment
      apiData.cus_manage_by = prepareManagerForApi(editData.cus_manage_by, isAdmin, currentUser);

      // Clean phone and tax ID
      apiData.cus_tel_1 = apiData.cus_tel_1?.replace(/[^0-9]/g, "");
      apiData.cus_tel_2 = apiData.cus_tel_2?.replace(/[^0-9]/g, "");
      apiData.cus_tax_id = apiData.cus_tax_id?.replace(/[^0-9]/g, "");

      // 2. Call Create Mutation
      const result = await addCustomer(apiData).unwrap();

      dismissToast(loadingId);
      showSuccess("สร้างลูกค้าใหม่เรียบร้อยแล้ว");
      setErrors({});

      // 3. Extract customer data from response
      // หลังจากสร้างสำเร็จ backend อาจส่งกลับมาแค่ {status: 'success'}
      // หรือ {status: 'success', customer_id: xxx, data: {...}}
      let createdCustomer = null;

      // ลองหาข้อมูล customer จาก response structure ต่างๆ
      if (result?.data?.data && typeof result.data.data === "object" && result.data.data.cus_id) {
        // รูปแบบ: {data: {data: {cus_id: xxx, ...}}}
        createdCustomer = result.data.data;
      } else if (result?.data && typeof result.data === "object" && result.data.cus_id) {
        // รูปแบบ: {data: {cus_id: xxx, ...}}
        createdCustomer = result.data;
      } else if (result?.cus_id) {
        // รูปแบบ: {cus_id: xxx, ...}
        createdCustomer = result;
      }

      // ถ้าไม่เจอข้อมูล customer ใน response ให้ใช้ข้อมูลจาก editData แทน
      if (!createdCustomer || !createdCustomer.cus_id) {
        // สร้าง customer object จาก editData ที่เรากรอก
        // และเพิ่ม customer_id จาก response (ถ้ามี)
        const customerId =
          result?.customer_id || result?.data?.customer_id || result?.data?.data?.cus_id || null;

        createdCustomer = {
          ...editData,
          cus_id: customerId, // อาจเป็น null ถ้า backend ไม่ส่งมา
          // แปลง manager object กลับเป็น format ที่ CustomerSelector คาดหวัง
          cus_manage_by: editData.cus_manage_by,
          sales_name: editData.cus_manage_by?.username || "",
        };
      }

      // 4. Call onSuccess prop
      if (onSuccess) {
        onSuccess(createdCustomer);
      }
      onClose();
    } catch (error) {
      dismissToast(loadingId);
      const errorMessage =
        error?.data?.message || error?.message || "เกิดข้อผิดพลาดในการสร้างลูกค้า";
      console.error("Failed to create customer:", error);
      setErrors({ general: `เกิดข้อผิดพลาด: ${errorMessage}` });
      showError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, editData, addCustomer, isAdmin, currentUser, onSuccess, onClose]);

  // Render
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        สร้างลูกค้าใหม่
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {errors.general && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>
            {errors.general}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* ข้อมูลหลัก */}
          <Grid item xs={12} md={6}>
            <StyledTextField
              fullWidth
              label="ชื่อบริษัท *"
              value={editData.cus_company}
              onChange={(e) => handleInputChange("cus_company", e.target.value)}
              error={!!errors.cus_company}
              helperText={errors.cus_company || ""}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <StyledTextField
              fullWidth
              label="เบอร์โทรศัพท์ *"
              value={editData.cus_tel_1}
              onChange={(e) => handleInputChange("cus_tel_1", e.target.value)}
              error={!!errors.cus_tel_1}
              helperText={errors.cus_tel_1}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: "#900F0F" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* ข้อมูลผู้ติดต่อ */}
          <Grid item xs={12}>
            <Typography
              variant="subtitle2"
              sx={{ color: "#900F0F", mb: 1, mt: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <PersonIcon /> ข้อมูลผู้ติดต่อ
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <StyledTextField
              fullWidth
              label="ชื่อ *"
              value={editData.cus_firstname}
              onChange={(e) => handleInputChange("cus_firstname", e.target.value)}
              error={!!errors.cus_firstname}
              helperText={errors.cus_firstname}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StyledTextField
              fullWidth
              label="นามสกุล *"
              value={editData.cus_lastname}
              onChange={(e) => handleInputChange("cus_lastname", e.target.value)}
              error={!!errors.cus_lastname}
              helperText={errors.cus_lastname}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StyledTextField
              fullWidth
              label="ชื่อเล่น *"
              value={editData.cus_name}
              onChange={(e) => handleInputChange("cus_name", e.target.value)}
              error={!!errors.cus_name}
              helperText={errors.cus_name}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <StyledTextField
              fullWidth
              label="ตำแหน่ง/แผนก"
              value={editData.cus_depart}
              onChange={(e) => handleInputChange("cus_depart", e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <StyledTextField
              fullWidth
              label="เบอร์โทรสำรอง"
              value={editData.cus_tel_2}
              onChange={(e) => handleInputChange("cus_tel_2", e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <StyledTextField
              fullWidth
              label="อีเมล"
              value={editData.cus_email}
              onChange={(e) => handleInputChange("cus_email", e.target.value)}
              error={!!errors.cus_email}
              helperText={errors.cus_email}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: "#900F0F" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <StyledTextField
              fullWidth
              label="เลขประจำตัวผู้เสียภาษี"
              value={editData.cus_tax_id}
              onChange={(e) => handleInputChange("cus_tax_id", e.target.value)}
              error={!!errors.cus_tax_id}
              helperText={errors.cus_tax_id}
              size="small"
            />
          </Grid>

          {/* ข้อมูลธุรกิจ */}
          <Grid item xs={12}>
            <Typography
              variant="subtitle2"
              sx={{ color: "#900F0F", mb: 1, mt: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <BusinessIcon /> ข้อมูลธุรกิจ
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset" size="small">
              <FormLabel component="legend" sx={{ color: "#900F0F", fontSize: "0.875rem" }}>
                ช่องทางการติดต่อ *
              </FormLabel>
              <RadioGroup
                row
                name="cus_channel"
                value={editData.cus_channel}
                onChange={(e) => handleInputChange("cus_channel", e.target.value)}
              >
                <FormControlLabel value={"1"} control={<Radio size="small" />} label="Sales" />
                <FormControlLabel value={"2"} control={<Radio size="small" />} label="Online" />
                <FormControlLabel value={"3"} control={<Radio size="small" />} label="Office" />
              </RadioGroup>
              {errors.cus_channel && (
                <Typography variant="caption" color="error">
                  {errors.cus_channel}
                </Typography>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              size="small"
              options={businessTypes}
              getOptionLabel={(option) => option.bt_name || ""}
              isOptionEqualToValue={(option, value) => String(option.bt_id) === String(value.bt_id)}
              value={
                businessTypes.find((bt) => String(bt.bt_id) === String(editData.cus_bt_id)) || null
              }
              onChange={(event, newValue) => {
                handleInputChange(
                  "cus_bt_id",
                  newValue?.bt_id != null ? String(newValue.bt_id) : ""
                );
              }}
              renderInput={(params) => (
                <StyledTextField {...params} label="ประเภทธุรกิจ" placeholder="เลือกประเภทธุรกิจ" />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset" size="small" fullWidth>
              <FormLabel component="legend" sx={{ color: "#900F0F", fontSize: "0.875rem" }}>
                ผู้ดูแลลูกค้า *
              </FormLabel>
              {isAdmin ? (
                <Autocomplete
                  size="small"
                  options={salesList}
                  getOptionLabel={(option) => option.username || ""}
                  isOptionEqualToValue={(option, value) =>
                    String(option.user_id) === String(value.user_id)
                  }
                  value={(() => {
                    const id = editData?.cus_manage_by?.user_id || "";
                    return id
                      ? salesList.find((u) => String(u.user_id) === String(id)) || {
                          user_id: id,
                          username: editData?.cus_manage_by?.username || "",
                        }
                      : null;
                  })()}
                  onChange={(event, newValue) => {
                    handleInputChange(
                      "cus_manage_by",
                      newValue
                        ? { user_id: String(newValue.user_id), username: newValue.username }
                        : { user_id: "", username: "" }
                    );
                  }}
                  renderInput={(params) => (
                    <StyledTextField
                      {...params}
                      label="เลือกผู้ดูแลลูกค้า"
                      placeholder="เลือกผู้ดูแล"
                      error={!!errors.cus_manage_by}
                      helperText={errors.cus_manage_by}
                    />
                  )}
                />
              ) : (
                <StyledTextField
                  fullWidth
                  size="small"
                  label="ผู้ดูแลลูกค้า"
                  value={
                    editData?.cus_manage_by?.username ||
                    currentUser?.username ||
                    currentUser?.user_nickname ||
                    ""
                  }
                  disabled
                />
              )}
            </FormControl>
          </Grid>

          {/* ข้อมูลที่อยู่ */}
          <Grid item xs={12}>
            <Typography
              variant="subtitle2"
              sx={{ color: "#900F0F", mb: 1, mt: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <LocationIcon /> ข้อมูลที่อยู่
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <StyledTextField
              fullWidth
              label="ที่อยู่"
              value={editData.cus_address}
              onChange={(e) => handleInputChange("cus_address", e.target.value)}
              multiline
              rows={2}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              size="small"
              options={provinces}
              getOptionLabel={(option) => option.pro_name_th || ""}
              isOptionEqualToValue={(option, value) => option.pro_id === value.pro_id}
              value={provinces.find((p) => p.pro_id === editData.cus_pro_id) || null}
              onChange={handleProvinceChange}
              renderInput={(params) => (
                <StyledTextField {...params} label="จังหวัด" placeholder="เลือกจังหวัด" />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              size="small"
              options={districts}
              getOptionLabel={(option) => option.dis_name || option.dis_name_th || ""}
              isOptionEqualToValue={(option, value) => option.dis_id === value.dis_id}
              value={districts.find((d) => d.dis_id === editData.cus_dis_id) || null}
              onChange={handleDistrictChange}
              disabled={!editData.cus_pro_id}
              renderInput={(params) => (
                <StyledTextField {...params} label="อำเภอ/เขต" placeholder="เลือกอำเภอ/เขต" />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              size="small"
              options={subdistricts}
              getOptionLabel={(option) => option.sub_name || option.sub_name_th || ""}
              isOptionEqualToValue={(option, value) => option.sub_id === value.sub_id}
              value={subdistricts.find((s) => s.sub_id === editData.cus_sub_id) || null}
              onChange={(event, newValue) => {
                handleInputChange("cus_sub_id", newValue?.sub_id || "");
                handleInputChange(
                  "cus_subdistrict_name",
                  newValue?.sub_name || newValue?.sub_name_th || ""
                );
                if (newValue?.sub_zip_code) {
                  handleInputChange("cus_zip_code", newValue.sub_zip_code);
                }
              }}
              disabled={!editData.cus_dis_id}
              renderInput={(params) => (
                <StyledTextField {...params} label="ตำบล/แขวง" placeholder="เลือกตำบล/แขวง" />
              )}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StyledTextField
              fullWidth
              label="รหัสไปรษณีย์"
              value={editData.cus_zip_code}
              onChange={(e) => handleInputChange("cus_zip_code", e.target.value)}
              size="small"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <CancelButton onClick={onClose} disabled={isSaving}>
          ยกเลิก
        </CancelButton>
        <SaveButton
          onClick={handleSave}
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
        >
          {isSaving ? "กำลังบันทึก..." : "สร้างลูกค้า"}
        </SaveButton>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerCreateDialog;
