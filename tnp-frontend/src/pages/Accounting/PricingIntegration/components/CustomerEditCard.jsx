import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Box,
  IconButton,
  Collapse,
  Alert,
  CircularProgress,
  Divider,
  Autocomplete,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import {
  customerApi,
  validateCustomerData,
  formatPhoneNumber,
  formatTaxId,
} from "./customerApiUtils";
import {
  normalizeManagerData,
  hydrateManagerUsername,
  getDefaultManagerAssignment,
  validateManagerAssignment,
  prepareManagerForApi,
  mergeManagerData,
} from "./managerUtils";
import { showSuccess, showError, showLoading, dismissToast } from "../../utils/accountingToast";
import { AddressService } from "../../../../services/AddressService";
import { useGetUserByRoleQuery } from "../../../../features/globalApi";

// Styled Components
const CustomerCard = styled(Card)(({ theme }) => ({
  background: "linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)",
  border: "2px solid #E36264",
  borderRadius: "16px",
  boxShadow: "0 8px 24px rgba(144, 15, 15, 0.15)",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
    background: "linear-gradient(90deg, #900F0F 0%, #B20000 100%)",
  },
}));

const CustomerHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "16px",
  padding: "8px 0",
}));

const EditButton = styled(IconButton)(({ theme }) => ({
  background: "linear-gradient(135deg, #900F0F 0%, #B20000 100%)",
  color: "#FFFFFF",
  width: "48px",
  height: "48px",
  boxShadow: "0 4px 12px rgba(144, 15, 15, 0.3)",
  "&:hover": {
    background: "linear-gradient(135deg, #B20000 0%, #E36264 100%)",
    transform: "scale(1.05)",
  },
  transition: "all 0.3s ease-in-out",
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

const CustomerEditCard = ({ customer, onUpdate, onCancel, startInEdit = false }) => {
  // Normalize channel value to the string values expected by RadioGroup: '1' | '2' | '3' | ''
  const normalizeChannelValue = useCallback((raw) => {
    if (raw === null || raw === undefined) return "";
    const v = typeof raw === "string" ? raw.trim() : raw;
    if (v === "") return "";
    // Accept already-correct values
    if (v === "1" || v === "2" || v === "3") return String(v);
    // Map common textual values and synonyms (EN/TH)
    const lower = String(v).toLowerCase();
    const salesSet = new Set(["sales", "sale", "ฝ่ายขาย", "เซลส์", "เซล", "ขาย"]);
    const onlineSet = new Set([
      "online",
      "on-line",
      "ออนไลน์",
      "website",
      "web",
      "facebook",
      "ig",
      "line",
      "ไลน์",
      "เพจ",
    ]);
    const officeSet = new Set([
      "office",
      "walk-in",
      "walkin",
      "หน้าร้าน",
      "ออฟฟิศ",
      "สาขา",
      "หน้าสำนักงาน",
    ]);
    if (salesSet.has(lower)) return "1";
    if (onlineSet.has(lower)) return "2";
    if (officeSet.has(lower)) return "3";
    // Map numeric-like values
    const num = Number(v);
    if (Number.isFinite(num)) {
      if (num >= 1 && num <= 3) return String(num);
      if (num === 0) return "";
    }
    return "";
  }, []);

  const [isEditing, setIsEditing] = useState(startInEdit);
  const [isExpanded, setIsExpanded] = useState(startInEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    // Safe defaults to show selected state immediately
    cus_channel: "1",
    cus_manage_by: { user_id: "", username: "" },
  });
  const [displayCustomer, setDisplayCustomer] = useState(customer);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [errors, setErrors] = useState({});

  // Loading states
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingSubdistricts, setIsLoadingSubdistricts] = useState(false);
  // Sales list for assigning manager (cus_manage_by)
  const { data: userRoleData } = useGetUserByRoleQuery("sale");
  const salesList = (userRoleData?.sale_role || [])
    .filter((u) => u && u.user_id != null) // ensure numeric id exists
    .map((u) => ({
      user_id: String(u.user_id),
      username: u.username || u.user_nickname || u.name || `User ${u.user_id}`,
    }));

  // Current user & role
  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}") || {};
    } catch {
      return {};
    }
  }, []);
  const isAdmin = String(currentUser?.role).toLowerCase() === "admin";

  // Initialize edit data when customer changes
  useEffect(() => {
    if (customer) {
      const initChannelRaw = customer.cus_channel ?? customer.channel ?? null;
      const initBtRaw =
        customer.cus_bt_id ??
        customer.bt_id ??
        customer.business_type_id ??
        customer.business_type?.bt_id ??
        null;
      // Infer customer type: prefer explicit field, fallback to presence of company name
      const initType =
        customer.customer_type ||
        customer.cus_type ||
        (customer.cus_company ? "company" : "individual");
      // Normalize manage_by into object { user_id, username }
      const rawManage = customer.cus_manage_by;
      const fallbackUsername = customer.sales_name;
      let initManageObj;

      if (!isAdmin && currentUser?.user_id) {
        // For non-admin users, always assign to self
        initManageObj = getDefaultManagerAssignment(isAdmin, currentUser);
      } else {
        // For admin users, use existing assignment or default
        initManageObj = normalizeManagerData(rawManage, fallbackUsername);
      }
      setEditData({
        cus_company: customer.cus_company || "",
        cus_firstname: customer.cus_firstname || "",
        cus_lastname: customer.cus_lastname || "",
        cus_name: customer.cus_name || "",
        cus_depart: customer.cus_depart || "",
        cus_tel_1: customer.cus_tel_1 || "",
        cus_tel_2: customer.cus_tel_2 || "",
        cus_email: customer.cus_email || "",
        cus_tax_id: customer.cus_tax_id || "",
        cus_address: customer.cus_address || "",
        cus_zip_code: customer.cus_zip_code || "",
        // Keep as string for RadioGroup; normalize from number or text
        cus_channel: normalizeChannelValue(initChannelRaw) || "1",
        // Keep business type id as string for stable equality in UI
        cus_bt_id: initBtRaw == null ? "" : String(initBtRaw),
        cus_pro_id: customer.cus_pro_id || "",
        cus_dis_id: customer.cus_dis_id || "",
        cus_sub_id: customer.cus_sub_id || "",
        customer_type: initType === "individual" ? "individual" : "company",
        // Manager assignment
        cus_manage_by: initManageObj,
      });

      // Keep a local display customer and hydrate with full details if needed
      setDisplayCustomer(customer);
      (async () => {
        try {
          if (customer.cus_id) {
            const full = await customerApi.getCustomer(customer.cus_id);
            // Merge, prefer full details
            const src = full?.data || full?.customer || full || {};
            const merged = mergeManagerData(customer, src);
            setDisplayCustomer(merged);
            // Autofill/normalize editable fields after hydration
            setEditData((prev) => {
              const prevCh = normalizeChannelValue(prev.cus_channel);
              const mergedCh = normalizeChannelValue(merged.cus_channel ?? merged.channel ?? null);
              const effectiveCh = (prevCh === "" ? mergedCh || "1" : prevCh) || "1";
              const prevBt = prev.cus_bt_id;
              const mergedBt =
                merged.cus_bt_id ??
                merged.bt_id ??
                merged.business_type_id ??
                merged.business_type?.bt_id ??
                null;
              const mergedType =
                merged.customer_type ||
                merged.cus_type ||
                (merged.cus_company ? "company" : "individual");
              // Merge cus_manage_by
              let mergedManage = prev.cus_manage_by;
              const mRaw = merged.cus_manage_by;
              if (!mergedManage || !mergedManage.user_id) {
                if (mRaw && typeof mRaw === "object") {
                  const id = mRaw.user_id ?? mRaw.user_uuid ?? mRaw.id ?? "";
                  const name = mRaw.username || mRaw.user_nickname || mRaw.name || "";
                  mergedManage = { user_id: id ? String(id) : "", username: name };
                } else if (mRaw != null && mRaw !== "") {
                  mergedManage = { user_id: String(mRaw), username: "" };
                }
              }
              return {
                ...prev,
                cus_channel: effectiveCh,
                cus_bt_id:
                  prevBt === "" || prevBt == null
                    ? mergedBt == null
                      ? ""
                      : String(mergedBt)
                    : prevBt,
                customer_type: prev.customer_type || mergedType,
                cus_manage_by: mergedManage,
              };
            });
          }
        } catch (e) {
          // Silent fail; use provided customer fields
          if (import.meta.env.VITE_DEBUG_API === "true") {
            console.warn("Failed to hydrate customer details:", e);
          }
        }
      })();
    }
  }, [customer]);

  // Hydrate manager username from sales list when available
  useEffect(() => {
    if (!editData?.cus_manage_by?.user_id || !salesList.length) return;

    const hydratedManager = hydrateManagerUsername(editData.cus_manage_by, salesList);
    if (hydratedManager.username !== editData.cus_manage_by.username) {
      setEditData((prev) => ({
        ...prev,
        cus_manage_by: hydratedManager,
      }));

      // Also update display customer for immediate feedback
      setDisplayCustomer((prev) => ({
        ...prev,
        cus_manage_by: hydratedManager,
        sales_name: hydratedManager.username,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRoleData, editData?.cus_manage_by?.user_id]);

  // 🔧 Function definitions (moved before useEffect to avoid hoisting issues)
  const loadMasterData = useCallback(async () => {
    try {
      console.log("🔄 Loading master data...");

      // Load business types
      const businessTypesData = await customerApi.getBusinessTypes();
      console.log("📊 Raw business types:", businessTypesData);

      // Unwrap possible shapes and normalize field names
      const btRaw = Array.isArray(businessTypesData)
        ? businessTypesData
        : businessTypesData?.master_business_types ||
          businessTypesData?.master_business_type ||
          businessTypesData?.data ||
          businessTypesData?.items ||
          [];

      const validBusinessTypes = (btRaw || [])
        .filter((bt) => bt && (bt.bt_id != null || bt.id != null) && (bt.bt_name || bt.name))
        .map((bt, index) => ({
          ...bt,
          // normalize as string for consistent UI equality
          bt_id:
            bt.bt_id != null ? String(bt.bt_id) : bt.id != null ? String(bt.id) : `bt-${index}`,
          bt_name: bt.bt_name || bt.name || "ไม่ทราบประเภทธุรกิจ",
        }));
      console.log("✅ Valid business types:", validBusinessTypes);
      setBusinessTypes(validBusinessTypes);

      // Load provinces
      const provincesData = await customerApi.getProvinces();
      console.log("📊 Raw provinces:", provincesData);

      // Filter out invalid provinces
      const validProvinces = (provincesData || [])
        .filter((prov) => prov && prov.pro_id && prov.pro_name_th)
        .map((prov, index) => ({
          ...prov,
          pro_id: prov.pro_id || `prov-${index}`,
        }));
      console.log("✅ Valid provinces:", validProvinces);
      setProvinces(validProvinces);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "ไม่สามารถโหลดข้อมูลได้";
      console.error("❌ Failed to load master data:", {
        error: errorMessage,
        status: error.response?.status,
        url: error.config?.url,
      });
      setErrors({ general: `ไม่สามารถโหลดข้อมูลได้: ${errorMessage}` });
    }
  }, []);

  // Load master data on component mount
  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  const loadDistricts = useCallback(async (provinceId) => {
    if (!provinceId) {
      console.warn("⚠️ loadDistricts called with empty provinceId");
      setDistricts([]);
      return;
    }

    setIsLoadingDistricts(true);
    try {
      console.log("🔄 Loading districts for province:", provinceId);
      const districtsData = await customerApi.getDistricts(provinceId);
      console.log("📊 Raw districts data:", districtsData);

      // Filter out invalid entries and ensure unique IDs
      const validDistricts = (districtsData || [])
        .filter((district) => {
          // Check for dis_name_th (Thai name) or dis_name (general name)
          const hasValidName = district.dis_name_th || district.dis_name;
          const hasValidId = district.dis_id;
          const isValid = district && hasValidId && hasValidName;

          if (!isValid) {
            console.warn("⚠️ Invalid district data:", district);
            console.warn("⚠️ Missing fields:", {
              hasId: !!hasValidId,
              hasName: !!hasValidName,
              dis_name_th: district.dis_name_th,
              dis_name: district.dis_name,
            });
          }
          return isValid;
        })
        .map((district, index) => ({
          ...district,
          // Ensure unique ID if missing
          dis_id: district.dis_id || `district-${provinceId}-${index}`,
          // Normalize name field for consistent usage
          dis_name: district.dis_name || district.dis_name_th,
        }));

      console.log("✅ Valid districts:", validDistricts);
      setDistricts(validDistricts);
      setSubdistricts([]); // Clear subdistricts
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "ไม่สามารถโหลดข้อมูลอำเภอได้";
      console.error("❌ Failed to load districts:", {
        provinceId,
        error: errorMessage,
        status: error.response?.status,
      });
      setDistricts([]);
    } finally {
      setIsLoadingDistricts(false);
    }
  }, []);

  const loadSubdistricts = useCallback(async (districtId) => {
    if (!districtId) {
      console.warn("⚠️ loadSubdistricts called with empty districtId");
      setSubdistricts([]);
      return;
    }

    setIsLoadingSubdistricts(true);
    try {
      console.log("🔄 Loading subdistricts for district:", districtId);
      const subdistrictsData = await customerApi.getSubdistricts(districtId);
      console.log("📊 Raw subdistricts data:", subdistrictsData);

      // Filter out invalid entries and ensure unique IDs
      const validSubdistricts = (subdistrictsData || [])
        .filter((subdistrict) => {
          // Check for sub_name_th (Thai name) or sub_name (general name)
          const hasValidName = subdistrict.sub_name_th || subdistrict.sub_name;
          const hasValidId = subdistrict.sub_id;
          const isValid = subdistrict && hasValidId && hasValidName;

          if (!isValid) {
            console.warn("⚠️ Invalid subdistrict data:", subdistrict);
            console.warn("⚠️ Missing fields:", {
              hasId: !!hasValidId,
              hasName: !!hasValidName,
              sub_name_th: subdistrict.sub_name_th,
              sub_name: subdistrict.sub_name,
            });
          }
          return isValid;
        })
        .map((subdistrict, index) => ({
          ...subdistrict,
          // Ensure unique ID if missing
          sub_id: subdistrict.sub_id || `subdistrict-${districtId}-${index}`,
          // Normalize name field for consistent usage
          sub_name: subdistrict.sub_name || subdistrict.sub_name_th,
        }));

      console.log("✅ Valid subdistricts:", validSubdistricts);
      setSubdistricts(validSubdistricts);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "ไม่สามารถโหลดข้อมูลตำบลได้";
      console.error("❌ Failed to load subdistricts:", {
        districtId,
        error: errorMessage,
        status: error.response?.status,
      });
      setSubdistricts([]);
    } finally {
      setIsLoadingSubdistricts(false);
    }
  }, []);

  // 🔧 Input and form handlers
  const handleInputChange = useCallback(
    (field, value) => {
      setEditData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear specific error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }
    },
    [errors]
  );

  const handleProvinceChange = useCallback(
    (event, newValue) => {
      console.log("🏢 Province changed:", newValue);

      handleInputChange("cus_pro_id", newValue?.pro_id || "");
      handleInputChange("cus_province_name", newValue?.pro_name_th || "");
      setDistricts([]);
      setSubdistricts([]);
      handleInputChange("cus_dis_id", "");
      handleInputChange("cus_district_name", "");
      handleInputChange("cus_sub_id", "");
      handleInputChange("cus_subdistrict_name", "");

      // Use pro_sort_id for loading districts (this is usually the correct field)
      if (newValue?.pro_sort_id) {
        console.log("🔄 Loading districts with pro_sort_id:", newValue.pro_sort_id);
        loadDistricts(newValue.pro_sort_id);
      } else if (newValue?.pro_id) {
        // Fallback to pro_id if pro_sort_id doesn't exist
        console.log("🔄 Loading districts with pro_id (fallback):", newValue.pro_id);
        loadDistricts(newValue.pro_id);
      } else {
        console.warn("⚠️ No valid province ID found for loading districts");
      }
    },
    [handleInputChange, loadDistricts]
  );

  const handleDistrictChange = useCallback(
    (event, newValue) => {
      console.log("🏘️ District changed:", newValue);

      handleInputChange("cus_dis_id", newValue?.dis_id || "");
      handleInputChange("cus_district_name", newValue?.dis_name || newValue?.dis_name_th || "");
      setSubdistricts([]);
      handleInputChange("cus_sub_id", "");
      handleInputChange("cus_subdistrict_name", "");

      // Use dis_sort_id for loading subdistricts
      if (newValue?.dis_sort_id) {
        console.log("🔄 Loading subdistricts with dis_sort_id:", newValue.dis_sort_id);
        loadSubdistricts(newValue.dis_sort_id);
      } else if (newValue?.dis_id) {
        // Fallback to dis_id if dis_sort_id doesn't exist
        console.log("🔄 Loading subdistricts with dis_id (fallback):", newValue.dis_id);
        loadSubdistricts(newValue.dis_id);
      } else {
        console.warn("⚠️ No valid district ID found for loading subdistricts");
      }
    },
    [handleInputChange, loadSubdistricts]
  );

  // 🔧 Form action handlers
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setIsExpanded(true);
    setErrors({});
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setIsExpanded(false);
    setErrors({});

    // Reset to hydrated data if available
    const base = displayCustomer || customer;
    if (base) {
      const resetChannel = base.cus_channel ?? base.channel ?? null;
      const resetBt =
        base.cus_bt_id ?? base.bt_id ?? base.business_type_id ?? base.business_type?.bt_id ?? null;
      // Reset manager
      const rawManage = base.cus_manage_by;
      const fallbackUsername = base.sales_name;
      let resetManage;

      if (!isAdmin && currentUser?.user_id) {
        // For non-admin, always reset to self
        resetManage = getDefaultManagerAssignment(isAdmin, currentUser);
      } else {
        // For admin, normalize existing data
        resetManage = normalizeManagerData(rawManage, fallbackUsername);
      }
      setEditData({
        cus_company: base.cus_company || "",
        cus_firstname: base.cus_firstname || "",
        cus_lastname: base.cus_lastname || "",
        cus_name: base.cus_name || "",
        cus_depart: base.cus_depart || "",
        cus_tel_1: base.cus_tel_1 || "",
        cus_tel_2: base.cus_tel_2 || "",
        cus_email: base.cus_email || "",
        cus_tax_id: base.cus_tax_id || "",
        cus_address: base.cus_address || "",
        cus_zip_code: base.cus_zip_code || "",
        cus_channel: normalizeChannelValue(resetChannel),
        cus_bt_id: resetBt == null ? "" : String(resetBt),
        cus_pro_id: base.cus_pro_id || "",
        cus_dis_id: base.cus_dis_id || "",
        cus_sub_id: base.cus_sub_id || "",
        customer_type:
          base.customer_type || base.cus_type || (base.cus_company ? "company" : "individual"),
        cus_manage_by: resetManage,
      });
    }
    if (onCancel) onCancel();
  }, [customer, displayCustomer, onCancel, isAdmin, currentUser]);

  const validateForm = useCallback(() => {
    const validation = validateCustomerData(editData);
    const nextErrors = { ...(validation.errors || {}) };
    let isValid = !!validation.isValid;

    // Conditional requirements based on customer_type
    if (editData.customer_type === "individual") {
      // Company not required for individuals
      delete nextErrors.cus_company;
      // Require first and last name
      if (!editData.cus_firstname || String(editData.cus_firstname).trim() === "") {
        nextErrors.cus_firstname = nextErrors.cus_firstname || "กรุณากรอกชื่อ";
        isValid = false;
      }
      if (!editData.cus_lastname || String(editData.cus_lastname).trim() === "") {
        nextErrors.cus_lastname = nextErrors.cus_lastname || "กรุณากรอกนามสกุล";
        isValid = false;
      }
    } else {
      // Company required for business customers
      if (!editData.cus_company || String(editData.cus_company).trim() === "") {
        nextErrors.cus_company = nextErrors.cus_company || "กรุณากรอกชื่อบริษัท";
        isValid = false;
      }
    }

    // Require contact channel selection
    if (!editData.cus_channel || !["1", "2", "3"].includes(String(editData.cus_channel))) {
      nextErrors.cus_channel = "กรุณาเลือกช่องทางการติดต่อ";
      isValid = false;
    }

    // Require manager assignment; non-admin will auto-assign to self, admin must select
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
      // Auto-fix for non-admin users
      const defaultManager = getDefaultManagerAssignment(isAdmin, currentUser);
      setEditData((prev) => ({
        ...prev,
        cus_manage_by: defaultManager,
      }));
    }

    setErrors(nextErrors);
    return isValid;
  }, [editData, isAdmin, currentUser]);

  // Build a display address from current selection for optimistic UI
  const buildDisplayAddress = useCallback(() => {
    if (editData.cus_address && editData.cus_address.trim()) {
      return editData.cus_address.trim();
    }
    const proName =
      editData.cus_province_name ||
      provinces.find((p) => p.pro_id === editData.cus_pro_id)?.pro_name_th ||
      "";
    const disName =
      editData.cus_district_name ||
      districts.find((d) => d.dis_id === editData.cus_dis_id)?.dis_name ||
      districts.find((d) => d.dis_id === editData.cus_dis_id)?.dis_name_th ||
      "";
    const subName =
      editData.cus_subdistrict_name ||
      subdistricts.find((s) => s.sub_id === editData.cus_sub_id)?.sub_name ||
      subdistricts.find((s) => s.sub_id === editData.cus_sub_id)?.sub_name_th ||
      "";
    const zip = editData.cus_zip_code || "";

    const isBkk = proName.includes("กรุงเทพ");
    const parts = [];
    if (subName) parts.push(isBkk ? `แขวง${subName}` : `ตำบล${subName}`);
    if (disName) parts.push(isBkk ? `เขต${disName}` : `อำเภอ${disName}`);
    if (proName) parts.push(isBkk ? "กรุงเทพฯ" : `จ.${proName}`);
    if (zip) parts.push(zip);
    return parts.join(" ").trim();
  }, [editData, provinces, districts, subdistricts]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    // Optimistic update: update UI and parent immediately
    const originalCustomer = displayCustomer || customer;
    const optimisticCustomer = { ...originalCustomer, ...editData };
    const optimisticAddress = buildDisplayAddress();
    if (optimisticAddress) {
      optimisticCustomer.cus_address = optimisticAddress;
    }
    // Keep name fields for AddressService format fallback
    optimisticCustomer.cus_province_name =
      editData.cus_province_name || optimisticCustomer.cus_province_name;
    optimisticCustomer.cus_district_name =
      editData.cus_district_name || optimisticCustomer.cus_district_name;
    optimisticCustomer.cus_subdistrict_name =
      editData.cus_subdistrict_name || optimisticCustomer.cus_subdistrict_name;
    optimisticCustomer.cus_zip_code = editData.cus_zip_code || optimisticCustomer.cus_zip_code;
    setDisplayCustomer(optimisticCustomer);
    if (onUpdate) onUpdate(optimisticCustomer);
    setIsEditing(false);
    setIsExpanded(false);

    setIsSaving(true);
    const loadingId = showLoading("กำลังบันทึกข้อมูลลูกค้า…");
    try {
      // เตรียมข้อมูลที่อยู่สำหรับส่งไป API
      const addressData = AddressService.prepareAddressForApi(editData);
      const updateData = { ...editData, ...addressData };
      // normalize customer_type to backend-acceptable values
      updateData.customer_type = editData.customer_type === "individual" ? "individual" : "company";
      updateData.cus_type = updateData.customer_type;
      updateData.cus_channel =
        editData.cus_channel === "" ? null : parseInt(editData.cus_channel, 10);
      updateData.cus_bt_id =
        editData.cus_bt_id === ""
          ? null
          : isNaN(Number(editData.cus_bt_id))
            ? editData.cus_bt_id
            : Number(editData.cus_bt_id);
      // Map manager assignment to backend field (bigint)
      updateData.cus_manage_by = prepareManagerForApi(editData.cus_manage_by, isAdmin, currentUser);

      await customerApi.updateCustomer(customer.cus_id, updateData);

      // Show success message briefly
      dismissToast(loadingId);
      showSuccess("บันทึกข้อมูลลูกค้าเรียบร้อยแล้ว");
      setErrors({});
    } catch (error) {
      dismissToast(loadingId);
      // Rollback on failure
      setDisplayCustomer(originalCustomer);
      if (onUpdate) onUpdate(originalCustomer);

      const errorMessage =
        error.response?.data?.message || error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      console.error("Failed to save customer data:", {
        customerId: customer.cus_id,
        error: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
      });
      setErrors({ general: `เกิดข้อผิดพลาด: ${errorMessage}` });
      showError(errorMessage || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");

      // Re-open edit mode to let user fix input
      setIsEditing(true);
      setIsExpanded(true);
    } finally {
      setIsSaving(false);
    }
  }, [customer, editData, onUpdate, validateForm, displayCustomer, buildDisplayAddress]);

  if (!customer) {
    return (
      <Alert severity="info" sx={{ borderRadius: "12px" }}>
        <Typography>ไม่พบข้อมูลลูกค้า</Typography>
      </Alert>
    );
  }

  const viewCustomer = displayCustomer || customer;

  return (
    <CustomerCard>
      <CardContent sx={{ padding: "24px" }}>
        {/* Success/Error Messages */}
        {errors.success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: "12px" }} icon={<CheckIcon />}>
            {errors.success}
          </Alert>
        )}
        {errors.general && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>
            {errors.general}
          </Alert>
        )}

        <CustomerHeader>
          <Box display="flex" alignItems="center" gap={2}>
            <BusinessIcon sx={{ color: "#900F0F", fontSize: "28px" }} />
            <Box>
              <Typography variant="h6" sx={{ color: "#900F0F", fontWeight: 600 }}>
                ข้อมูลลูกค้า
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isEditing ? "กำลังแก้ไขข้อมูล" : "คลิกเพื่อแก้ไขข้อมูลลูกค้า"}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" gap={1}>
            {!isEditing && (
              <>
                <IconButton
                  onClick={() => setIsExpanded(!isExpanded)}
                  sx={{
                    color: "#900F0F",
                    "&:hover": { backgroundColor: "rgba(144, 15, 15, 0.1)" },
                  }}
                >
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <EditButton onClick={handleEdit}>
                  <EditIcon />
                </EditButton>
              </>
            )}

            {isEditing && (
              <Box display="flex" gap={1}>
                <SaveButton
                  onClick={handleSave}
                  disabled={isSaving}
                  startIcon={
                    isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />
                  }
                >
                  {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                </SaveButton>
                <CancelButton onClick={handleCancel} disabled={isSaving}>
                  ยกเลิก
                </CancelButton>
              </Box>
            )}
          </Box>
        </CustomerHeader>

        {/* Basic Customer Info (Always Visible) */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            {isEditing ? (
              <StyledTextField
                fullWidth
                label={
                  editData.customer_type === "individual" ? "ชื่อบริษัท (ถ้ามี)" : "ชื่อบริษัท *"
                }
                value={editData.cus_company}
                onChange={(e) => handleInputChange("cus_company", e.target.value)}
                error={!!errors.cus_company && editData.customer_type !== "individual"}
                helperText={editData.customer_type === "individual" ? "" : errors.cus_company || ""}
                size="small"
              />
            ) : (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  ชื่อบริษัท
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {viewCustomer.cus_company || "-"}
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            {isEditing ? (
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
                InputLabelProps={{
                  shrink: Boolean(editData.cus_tel_1 && String(editData.cus_tel_1).length),
                }}
              />
            ) : (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  เบอร์โทรศัพท์
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formatPhoneNumber(viewCustomer.cus_tel_1) || "-"}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>

        {/* Expanded Details */}
        <Collapse in={isExpanded || isEditing}>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                sx={{ color: "#900F0F", mb: 1, display: "flex", alignItems: "center", gap: 1 }}
              >
                <PersonIcon /> ข้อมูลผู้ติดต่อ
              </Typography>
            </Grid>

            {isEditing && (
              <Grid item xs={12} md={6}>
                <FormControl component="fieldset" size="small">
                  <FormLabel component="legend" sx={{ color: "#900F0F", fontSize: "0.875rem" }}>
                    ประเภทลูกค้า
                  </FormLabel>
                  <RadioGroup
                    row
                    value={editData.customer_type}
                    onChange={(e) => handleInputChange("customer_type", e.target.value)}
                  >
                    <FormControlLabel
                      value={"individual"}
                      control={<Radio size="small" />}
                      label="บุคคลธรรมดา"
                    />
                    <FormControlLabel
                      value={"company"}
                      control={<Radio size="small" />}
                      label="บริษัท"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} md={4}>
              {isEditing ? (
                <StyledTextField
                  fullWidth
                  label="ชื่อ *"
                  value={editData.cus_firstname}
                  onChange={(e) => handleInputChange("cus_firstname", e.target.value)}
                  error={!!errors.cus_firstname}
                  helperText={errors.cus_firstname}
                  size="small"
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ชื่อ
                  </Typography>
                  <Typography variant="body2">{viewCustomer.cus_firstname || "-"}</Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              {isEditing ? (
                <StyledTextField
                  fullWidth
                  label="นามสกุล *"
                  value={editData.cus_lastname}
                  onChange={(e) => handleInputChange("cus_lastname", e.target.value)}
                  error={!!errors.cus_lastname}
                  helperText={errors.cus_lastname}
                  size="small"
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    นามสกุล
                  </Typography>
                  <Typography variant="body2">{viewCustomer.cus_lastname || "-"}</Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              {isEditing ? (
                <StyledTextField
                  fullWidth
                  label="ชื่อเล่น *"
                  value={editData.cus_name}
                  onChange={(e) => handleInputChange("cus_name", e.target.value)}
                  error={!!errors.cus_name}
                  helperText={errors.cus_name}
                  size="small"
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ชื่อเล่น
                  </Typography>
                  <Typography variant="body2">{viewCustomer.cus_name || "-"}</Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              {isEditing ? (
                <StyledTextField
                  fullWidth
                  label="ตำแหน่ง/แผนก"
                  value={editData.cus_depart}
                  onChange={(e) => handleInputChange("cus_depart", e.target.value)}
                  size="small"
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ตำแหน่ง/แผนก
                  </Typography>
                  <Typography variant="body2">{viewCustomer.cus_depart || "-"}</Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              {isEditing ? (
                <StyledTextField
                  fullWidth
                  label="เบอร์โทรสำรอง"
                  value={editData.cus_tel_2}
                  onChange={(e) => handleInputChange("cus_tel_2", e.target.value)}
                  size="small"
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    เบอร์โทรสำรอง
                  </Typography>
                  <Typography variant="body2">
                    {formatPhoneNumber(viewCustomer.cus_tel_2) || "-"}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              {isEditing ? (
                <StyledTextField
                  fullWidth
                  label="อีเมล"
                  value={editData.cus_email}
                  onChange={(e) => handleInputChange("cus_email", e.target.value)}
                  error={!!errors.cus_email}
                  helperText={errors.cus_email}
                  size="small"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ color: "#900F0F", mr: 1 }} />,
                  }}
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    อีเมล
                  </Typography>
                  <Typography variant="body2">{viewCustomer.cus_email || "-"}</Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              {isEditing ? (
                <StyledTextField
                  fullWidth
                  label="เลขประจำตัวผู้เสียภาษี"
                  value={editData.cus_tax_id}
                  onChange={(e) => handleInputChange("cus_tax_id", e.target.value)}
                  error={!!errors.cus_tax_id}
                  helperText={errors.cus_tax_id}
                  size="small"
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    เลขประจำตัวผู้เสียภาษี
                  </Typography>
                  <Typography variant="body2">
                    {formatTaxId(viewCustomer.cus_tax_id) || "-"}
                  </Typography>
                </Box>
              )}
            </Grid>

            {/* Business Information */}
            {isEditing && (
              <>
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "#900F0F",
                      mb: 1,
                      mt: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <BusinessIcon /> ข้อมูลธุรกิจ
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl component="fieldset" size="small">
                    <FormLabel component="legend" sx={{ color: "#900F0F", fontSize: "0.875rem" }}>
                      ช่องทางการติดต่อ
                    </FormLabel>
                    <RadioGroup
                      row
                      name="cus_channel"
                      value={editData.cus_channel}
                      onChange={(e) => handleInputChange("cus_channel", e.target.value)}
                    >
                      <FormControlLabel
                        value={"1"}
                        control={<Radio size="small" />}
                        label="Sales"
                      />
                      <FormControlLabel
                        value={"2"}
                        control={<Radio size="small" />}
                        label="Online"
                      />
                      <FormControlLabel
                        value={"3"}
                        control={<Radio size="small" />}
                        label="Office"
                      />
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
                    getOptionKey={(option) => `business-type-${option.bt_id || Math.random()}`}
                    isOptionEqualToValue={(option, value) =>
                      String(option.bt_id) === String(value.bt_id)
                    }
                    value={
                      businessTypes.find((bt) => String(bt.bt_id) === String(editData.cus_bt_id)) ||
                      null
                    }
                    onChange={(event, newValue) => {
                      handleInputChange(
                        "cus_bt_id",
                        newValue?.bt_id != null ? String(newValue.bt_id) : ""
                      );
                    }}
                    renderInput={(params) => (
                      <StyledTextField
                        {...params}
                        label="ประเภทธุรกิจ"
                        placeholder="เลือกประเภทธุรกิจ"
                      />
                    )}
                  />
                </Grid>

                {/* Manager Assignment */}
                <Grid item xs={12} md={6}>
                  <FormControl component="fieldset" size="small" fullWidth>
                    <FormLabel component="legend" sx={{ color: "#900F0F", fontSize: "0.875rem" }}>
                      ผู้ดูแลลูกค้า
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
              </>
            )}

            {/* Address Information */}
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: "#900F0F",
                  mb: 1,
                  mt: isEditing ? 2 : 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <LocationIcon /> ข้อมูลที่อยู่
              </Typography>
            </Grid>

            {/* Display Manager for View Mode */}
            {!isEditing && (
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ผู้ดูแลลูกค้า
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#900F0F", fontWeight: 500 }}>
                    {viewCustomer.cus_manage_by?.username ||
                      viewCustomer.sales_name ||
                      "ไม่ได้กำหนด"}
                  </Typography>
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              {isEditing ? (
                <StyledTextField
                  fullWidth
                  label="ที่อยู่"
                  value={editData.cus_address}
                  onChange={(e) => handleInputChange("cus_address", e.target.value)}
                  multiline
                  rows={2}
                  size="small"
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ที่อยู่
                  </Typography>
                  <Typography variant="body2">
                    {AddressService.formatDisplayAddress(viewCustomer) || "-"}
                  </Typography>
                </Box>
              )}
            </Grid>

            {isEditing && (
              <>
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    size="small"
                    options={provinces}
                    getOptionLabel={(option) => option.pro_name_th || ""}
                    getOptionKey={(option) => `province-${option.pro_id || Math.random()}`}
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
                    getOptionKey={(option) => `district-${option.dis_id || Math.random()}`}
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
                    getOptionKey={(option) => `subdistrict-${option.sub_id || Math.random()}`}
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
                    InputLabelProps={{
                      shrink: Boolean(
                        editData.cus_zip_code && String(editData.cus_zip_code).length
                      ),
                    }}
                  />
                </Grid>
              </>
            )}

            {!isEditing && (
              <Grid item xs={12} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    รหัสไปรษณีย์
                  </Typography>
                  <Typography variant="body2">{viewCustomer.cus_zip_code || "-"}</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Collapse>
      </CardContent>
    </CustomerCard>
  );
};

export default CustomerEditCard;
