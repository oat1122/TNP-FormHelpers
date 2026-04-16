import {
  Edit as EditIcon,
  Save as SaveIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
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
import { styled } from "@mui/material/styles";
import React, { useState, useEffect, useCallback } from "react";

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
} from "./managerUtils";
import { useGetUserByRoleQuery } from "../../../../features/globalApi";
import {
  useGetAllBusinessTypesQuery,
  useGetAllLocationQuery,
  useLazyGetAllLocationQuery,
} from "../../../../features/globalApi";
import { AddressService } from "../../../../services/AddressService";
import { showSuccess, showError, showLoading, dismissToast } from "../../utils/accountingToast";

// Styled Components
const CustomerCard = styled(Card)(() => ({
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

const CustomerHeader = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "16px",
  padding: "8px 0",
}));

const EditButton = styled(IconButton)(() => ({
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

const SaveButton = styled(Button)(() => ({
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

const CancelButton = styled(Button)(() => ({
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

const StyledTextField = styled(TextField)(() => ({
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
  const [isHydrating, setIsHydrating] = useState(false);
  const [editData, setEditData] = useState({
    // Safe defaults to show selected state immediately
    cus_channel: "1",
    cus_manage_by: { user_id: "", username: "" },
  });
  const [displayCustomer, setDisplayCustomer] = useState(customer);
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
  // Sales list for assigning manager (cus_manage_by)
  const salesList = (userRoleData?.sale_role || [])
    .filter((u) => u && u.user_id != null)
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

      // Parse cus_address_detail จาก cus_address ตาม pattern ของ Customer module
      // (เฉพาะส่วนก่อน แขวง/ตำบล/ต. เท่านั้น ไม่รวม location components)
      let addressDetail = customer.cus_address_detail || "";
      if (!addressDetail && customer.cus_address) {
        const patterns = [
          /^(.+?)(?:\s+แขวง)/, // ก่อน "แขวง"
          /^(.+?)(?:\s+ตำบล)/, // ก่อน "ตำบล"
          /^(.+?)(?:\s+ต\.)/, // ก่อน "ต."
        ];
        for (const pattern of patterns) {
          const match = customer.cus_address.match(pattern);
          if (match && match[1]) {
            addressDetail = match[1].trim();
            break;
          }
        }
        // ถ้าไม่ match pattern ใดเลย ให้ใช้ค่าเดิม (อาจเป็นที่อยู่ที่ไม่มี location)
        if (!addressDetail) {
          addressDetail = customer.cus_address;
        }
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
        cus_address: addressDetail, // ใช้ addressDetail ที่ parse แล้ว แทน customer.cus_address
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

      // Keep a local display customer
      setDisplayCustomer(customer);
    }
  }, [customer, normalizeChannelValue, isAdmin, currentUser]);

  // Hydrate full customer data from API
  useEffect(() => {
    if (!customer?.cus_id) return;

    const fetchFullDetails = async () => {
      setIsHydrating(true);
      try {
        const fullData = await customerApi.getCustomer(customer.cus_id);
        const src = fullData?.data || fullData || {};

        // Merge data between Props (customer) and Full Data (src)
        // Give priority to src as it's more recent
        const merged = { ...customer, ...src };

        // Update display customer
        setDisplayCustomer(merged);

        // Update form data
        setEditData((prev) => {
          const mergedCh = normalizeChannelValue(merged.cus_channel ?? merged.channel);
          const effectiveCh = mergedCh || prev.cus_channel || "1";

          const mergedBt = merged.cus_bt_id ?? merged.bt_id ?? merged.business_type_id ?? "";

          // Handle Manager data
          let mergedManage = prev.cus_manage_by;
          const mRaw = merged.cus_manage_by;

          // If form doesn't have data or incomplete, use loaded data
          if (!mergedManage?.user_id || mergedManage?.username === "กำลังโหลด...") {
            if (mRaw && typeof mRaw === "object") {
              mergedManage = {
                user_id: String(mRaw.user_id || mRaw.id || ""),
                username: mRaw.username || mRaw.name || merged.sales_name || "",
              };
            } else if (mRaw) {
              mergedManage = {
                user_id: String(mRaw),
                username: merged.sales_name || "",
              };
            }
          }

          // ✅ FIX: Parse full address to extract only address detail (without location components)
          // Location components (แขวง/เขต/จังหวัด/รหัสไปรษณีย์) are shown in dropdowns
          let parsedAddressDetail = prev.cus_address;
          if (merged.cus_address) {
            const parsed = AddressService.parseFullAddress(merged.cus_address);
            parsedAddressDetail = parsed.addressDetail || merged.cus_address;
          }

          return {
            ...prev,
            cus_channel: effectiveCh,
            cus_bt_id: mergedBt ? String(mergedBt) : prev.cus_bt_id,
            cus_tax_id: merged.cus_tax_id || prev.cus_tax_id,
            cus_manage_by: mergedManage,
            // ✅ FIX: Include all customer fields from API response for complete data display
            cus_company: merged.cus_company || prev.cus_company,
            cus_firstname: merged.cus_firstname || prev.cus_firstname,
            cus_lastname: merged.cus_lastname || prev.cus_lastname,
            cus_name: merged.cus_name || prev.cus_name,
            cus_depart: merged.cus_depart || prev.cus_depart,
            cus_tel_1: merged.cus_tel_1 || prev.cus_tel_1,
            cus_tel_2: merged.cus_tel_2 || prev.cus_tel_2,
            cus_email: merged.cus_email || prev.cus_email,
            cus_address: parsedAddressDetail, // ✅ Use parsed addressDetail only
            cus_pro_id: merged.cus_pro_id || prev.cus_pro_id,
            cus_dis_id: merged.cus_dis_id || prev.cus_dis_id,
            cus_sub_id: merged.cus_sub_id || prev.cus_sub_id,
            cus_zip_code: merged.cus_zip_code || prev.cus_zip_code,
          };
        });
      } catch (err) {
        console.warn("Failed to hydrate customer details:", err);
      } finally {
        setIsHydrating(false);
      }
    };

    fetchFullDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.cus_id]);

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
  }, [userRoleData, editData?.cus_manage_by?.user_id, salesList]);

  // 🔧 Load master data from RTK Query
  useEffect(() => {
    if (businessTypesData) {
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
          bt_id:
            bt.bt_id != null ? String(bt.bt_id) : bt.id != null ? String(bt.id) : `bt-${index}`,
          bt_name: bt.bt_name || bt.name || "ไม่ทราบประเภทธุรกิจ",
        }));
      console.log("✅ Valid business types:", validBusinessTypes);
    }
  }, [businessTypesData]);

  useEffect(() => {
    if (locationsData) {
      console.log("📊 Raw provinces:", locationsData);

      const validProvinces = (locationsData.master_provinces || [])
        .filter((prov) => prov && prov.pro_id && prov.pro_name_th)
        .map((prov, index) => ({
          ...prov,
          pro_id: prov.pro_id || `prov-${index}`,
        }));
      console.log("✅ Valid provinces:", validProvinces);
      setProvinces(validProvinces);
    }
  }, [locationsData]);

  // Update districts when data arrives
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

  // Update subdistricts when data arrives
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
        console.warn("⚠️ loadDistricts called with empty provinceId");
        setDistricts([]);
        return;
      }

      setIsLoadingDistricts(true);
      console.log("🔄 Loading districts for province:", provinceId);
      fetchDistricts({ province_sort_id: provinceId });
      setSubdistricts([]);
    },
    [fetchDistricts]
  );

  const loadSubdistricts = useCallback(
    async (districtId) => {
      if (!districtId) {
        console.warn("⚠️ loadSubdistricts called with empty districtId");
        setSubdistricts([]);
        return;
      }

      setIsLoadingSubdistricts(true);
      console.log("🔄 Loading subdistricts for district:", districtId);
      fetchSubdistricts({ district_sort_id: districtId });
    },
    [fetchSubdistricts]
  );

  // 🔧 Auto-load districts เมื่อ editData มี cus_pro_id (hydrated จาก API)
  useEffect(() => {
    // ต้องรอให้ provinces โหลดเสร็จก่อน และมี cus_pro_id จาก hydration
    if (!provinces.length || !editData?.cus_pro_id) return;
    // ถ้า districts โหลดแล้วไม่ต้องโหลดอีก
    if (districts.length > 0 || isLoadingDistricts) return;

    const province = provinces.find((p) => p.pro_id === editData.cus_pro_id);
    if (province?.pro_sort_id) {
      console.log("🔄 Auto-loading districts for hydrated province:", province.pro_name_th);
      loadDistricts(province.pro_sort_id);
    }
  }, [provinces, editData?.cus_pro_id, districts.length, isLoadingDistricts, loadDistricts]);

  // 🔧 Auto-load subdistricts เมื่อ editData มี cus_dis_id (hydrated จาก API)
  useEffect(() => {
    // ต้องรอให้ districts โหลดเสร็จก่อน และมี cus_dis_id จาก hydration
    if (!districts.length || !editData?.cus_dis_id) return;
    // ถ้า subdistricts โหลดแล้วไม่ต้องโหลดอีก
    if (subdistricts.length > 0 || isLoadingSubdistricts) return;

    const district = districts.find((d) => d.dis_id === editData.cus_dis_id);
    if (district?.dis_sort_id) {
      console.log(
        "🔄 Auto-loading subdistricts for hydrated district:",
        district.dis_name_th || district.dis_name
      );
      loadSubdistricts(district.dis_sort_id);
    }
  }, [
    districts,
    editData?.cus_dis_id,
    subdistricts.length,
    isLoadingSubdistricts,
    loadSubdistricts,
  ]);

  // Get business types array for Autocomplete
  const businessTypes = React.useMemo(() => {
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

      // Parse cus_address_detail จาก cus_address ตาม pattern ของ Customer module
      let addressDetail = base.cus_address_detail || "";
      if (!addressDetail && base.cus_address) {
        const patterns = [/^(.+?)(?:\s+แขวง)/, /^(.+?)(?:\s+ตำบล)/, /^(.+?)(?:\s+ต\.)/];
        for (const pattern of patterns) {
          const match = base.cus_address.match(pattern);
          if (match && match[1]) {
            addressDetail = match[1].trim();
            break;
          }
        }
        if (!addressDetail) {
          addressDetail = base.cus_address;
        }
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
        cus_address: addressDetail, // ใช้ addressDetail ที่ parse แล้ว
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
  }, [customer, displayCustomer, onCancel, isAdmin, currentUser, normalizeChannelValue]);

  const validateForm = useCallback(() => {
    const validation = validateCustomerData(editData);
    const nextErrors = { ...(validation.errors || {}) };
    let isValid = !!validation.isValid;

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
  }, [editData, isAdmin, currentUser, salesList]);

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

      // -------------------- START: FIX --------------------
      // ตรวจสอบว่ามีการส่ง components (จังหวัด/อำเภอ/ตำบล) หรือไม่
      const hasComponents = updateData.cus_pro_id || updateData.cus_dis_id || updateData.cus_sub_id;

      // ถ้ามี components และมี cus_address (จาก text field)
      // ให้แยกเฉพาะส่วน addressDetail (เลขที่, ถนน, ซอย) ออกมา
      // เพื่อป้องกันการซ้ำซ้อนเมื่อ Backend สร้างที่อยู่เต็มจาก components
      if (hasComponents && updateData.cus_address !== undefined) {
        // Parse full address to extract only address detail portion
        const parsed = AddressService.parseFullAddress(updateData.cus_address);
        updateData.cus_address_detail = parsed.addressDetail || "";
      }
      // -------------------- END: FIX --------------------

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

      // Clean phone and tax ID
      updateData.cus_tel_1 = updateData.cus_tel_1?.replace(/[^0-9]/g, "");
      updateData.cus_tel_2 = updateData.cus_tel_2?.replace(/[^0-9]/g, "");
      updateData.cus_tax_id = updateData.cus_tax_id?.replace(/[^0-9]/g, "");

      // Use RTK mutation

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
        error?.data?.message || error?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      console.error("Failed to save customer data:", {
        customerId: customer.cus_id,
        error: errorMessage,
        status: error?.status,
        data: error?.data,
      });
      setErrors({ general: `เกิดข้อผิดพลาด: ${errorMessage}` });
      showError(errorMessage || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");

      // Re-open edit mode to let user fix input
      setIsEditing(true);
      setIsExpanded(true);
    } finally {
      setIsSaving(false);
    }
  }, [
    customer,
    editData,
    onUpdate,
    validateForm,
    displayCustomer,
    buildDisplayAddress,
    isAdmin,
    currentUser,
  ]);

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
      {/* Loading indicator when hydrating data */}
      {isHydrating && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, #900F0F 0%, #E36264 50%, #900F0F 100%)",
            backgroundSize: "200% 100%",
            animation: "loading 1.5s infinite ease-in-out",
            zIndex: 10,
            "@keyframes loading": {
              "0%": { backgroundPosition: "200% 0" },
              "100%": { backgroundPosition: "-200% 0" },
            },
          }}
        />
      )}
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
                {isEditing
                  ? isHydrating
                    ? "กำลังดึงข้อมูลล่าสุด..."
                    : "กำลังแก้ไขข้อมูล"
                  : "คลิกเพื่อแก้ไขข้อมูลลูกค้า"}
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
                  disabled={isSaving || isHydrating}
                  startIcon={
                    isSaving || isHydrating ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                >
                  {isSaving ? "กำลังบันทึก..." : isHydrating ? "กำลังโหลด..." : "บันทึก"}
                </SaveButton>
                <CancelButton onClick={handleCancel} disabled={isSaving || isHydrating}>
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
                label="ชื่อบริษัท *"
                value={editData.cus_company}
                onChange={(e) => handleInputChange("cus_company", e.target.value)}
                error={!!errors.cus_company}
                helperText={errors.cus_company || ""}
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
                          if (!id) return null;

                          // Try to find in sales list
                          const found = salesList.find((u) => String(u.user_id) === String(id));
                          if (found) return found;

                          // If not found, use current value (from hydration)
                          return {
                            user_id: id,
                            username: editData?.cus_manage_by?.username || "กำลังโหลด...",
                          };
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
                  <Typography variant="body2">{viewCustomer.cus_address || "-"}</Typography>
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
