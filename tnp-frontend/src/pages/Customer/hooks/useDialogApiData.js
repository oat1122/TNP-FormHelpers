import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import Swal from "sweetalert2";

import {
  useGetAllLocationQuery,
  useLazyGetAllLocationQuery,
  useGetUserByRoleQuery,
  useGetAllBusinessTypesQuery,
} from "../../../features/globalApi";
import { setInputList } from "../../../features/Customer/customerSlice";
import { open_dialog_loading } from "../../../utils/import_lib";

export const useDialogApiData = (openDialog) => {
  const dispatch = useDispatch();
  const locationSearch = useSelector((state) => state.global.locationSearch);
  const inputList = useSelector((state) => state.customer.inputList);

  // Debug logging สำหรับ locationSearch changes
  useEffect(() => {
    if (window.debugLocation) {
      console.log("🌐 LocationSearch state changed:", locationSearch);
    }
  }, [locationSearch]);

  // Local state for processed data
  const [provincesList, setProvincesList] = useState([]);
  const [districtList, setDistrictList] = useState([]);
  const [subDistrictList, setSubDistrictList] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [businessTypesList, setBusinessTypesList] = useState([]);

  // Loading states for lazy queries
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingSubdistricts, setIsLoadingSubdistricts] = useState(false);

  // API hooks - only execute when dialog is open (Provinces only)
  const {
    data: locations,
    error: locationError,
    isFetching: locationIsFetching,
    refetch: refetchLocations,
  } = useGetAllLocationQuery({}, { skip: !openDialog });

  // Lazy queries สำหรับ Districts และ Subdistricts (แบบ cascade)
  const [fetchDistricts, { data: districtsData }] = useLazyGetAllLocationQuery();
  const [fetchSubdistricts, { data: subdistrictsData }] = useLazyGetAllLocationQuery();

  // Debug logging สำหรับ API calls
  useEffect(() => {
    if (window.debugLocation) {
      console.log("📡 API Call State:", {
        openDialog,
        locationSearch,
        locationIsFetching,
        hasLocationData: !!locations,
        locationError: !!locationError,
      });
    }
  }, [openDialog, locationSearch, locationIsFetching, locations, locationError]);

  const {
    data: userRoleData,
    error: roleError,
    isFetching: roleIsFetching,
  } = useGetUserByRoleQuery("sale", { skip: !openDialog });

  const {
    data: businessTypesData,
    error: businessTypesError,
    isFetching: businessTypesIsFetching,
  } = useGetAllBusinessTypesQuery(undefined, { skip: !openDialog });

  // Process provinces data (โหลดครั้งเดียวเมื่อเปิด dialog)
  useEffect(() => {
    if (locations?.master_provinces) {
      const validProvinces = locations.master_provinces
        .filter((prov) => prov?.pro_id && prov?.pro_name_th)
        .map((prov, index) => ({
          ...prov,
          pro_id: prov.pro_id || `prov-${index}`,
        }));
      setProvincesList(validProvinces);
    }
  }, [locations]);

  // Update districts when lazy query returns
  useEffect(() => {
    if (districtsData?.master_district) {
      const validDistricts = districtsData.master_district
        .filter((district) => district?.dis_id && (district.dis_name_th || district.dis_name))
        .map((district) => ({
          ...district,
          dis_name: district.dis_name || district.dis_name_th,
        }));
      setDistrictList(validDistricts);
      setIsLoadingDistricts(false);
    }
  }, [districtsData]);

  // Update subdistricts when lazy query returns
  useEffect(() => {
    if (subdistrictsData?.master_subdistrict) {
      const validSubdistricts = subdistrictsData.master_subdistrict
        .filter((sub) => sub?.sub_id && (sub.sub_name_th || sub.sub_name))
        .map((sub) => ({
          ...sub,
          sub_name: sub.sub_name || sub.sub_name_th,
        }));
      setSubDistrictList(validSubdistricts);
      setIsLoadingSubdistricts(false);
    }
  }, [subdistrictsData]);

  // === Location Handlers (Autocomplete) ===

  // Helper: สร้าง cus_address จากข้อมูลทั้งหมด
  const buildFullAddress = useCallback((data) => {
    const parts = [
      data.cus_address_detail || "",
      data.cus_subdistrict_text ? `ต.${data.cus_subdistrict_text}` : "",
      data.cus_district_text ? `อ.${data.cus_district_text}` : "",
      data.cus_province_text ? `จ.${data.cus_province_text}` : "",
      data.cus_zip_code || "",
    ].filter(Boolean);
    return parts.join(" ");
  }, []);

  // Province change handler
  const handleProvinceChange = useCallback(
    (event, newValue) => {
      const updatedData = {
        ...inputList,
        cus_pro_id: newValue?.pro_id || "",
        cus_province_text: newValue?.pro_name_th || "",
        // Clear dependent fields
        cus_dis_id: "",
        cus_district_text: "",
        cus_sub_id: "",
        cus_subdistrict_text: "",
        cus_zip_code: "",
      };
      updatedData.cus_address = buildFullAddress(updatedData);

      dispatch(setInputList(updatedData));

      // Clear dependent data
      setDistrictList([]);
      setSubDistrictList([]);

      // Load districts for selected province
      if (newValue?.pro_sort_id) {
        setIsLoadingDistricts(true);
        fetchDistricts({ province_sort_id: newValue.pro_sort_id });
      }
    },
    [inputList, dispatch, buildFullAddress, fetchDistricts]
  );

  // District change handler
  const handleDistrictChange = useCallback(
    (event, newValue) => {
      const updatedData = {
        ...inputList,
        cus_dis_id: newValue?.dis_id || "",
        cus_district_text: newValue?.dis_name_th || newValue?.dis_name || "",
        // Clear dependent fields
        cus_sub_id: "",
        cus_subdistrict_text: "",
        cus_zip_code: "",
      };
      updatedData.cus_address = buildFullAddress(updatedData);

      dispatch(setInputList(updatedData));

      // Clear subdistricts
      setSubDistrictList([]);

      // Load subdistricts for selected district
      if (newValue?.dis_sort_id) {
        setIsLoadingSubdistricts(true);
        fetchSubdistricts({ district_sort_id: newValue.dis_sort_id });
      }
    },
    [inputList, dispatch, buildFullAddress, fetchSubdistricts]
  );

  // Subdistrict change handler (auto-fill zip code)
  const handleSubdistrictChange = useCallback(
    (event, newValue) => {
      const updatedData = {
        ...inputList,
        cus_sub_id: newValue?.sub_id || "",
        cus_subdistrict_text: newValue?.sub_name_th || newValue?.sub_name || "",
        cus_zip_code: newValue?.sub_zip_code || inputList.cus_zip_code || "",
      };
      updatedData.cus_address = buildFullAddress(updatedData);

      dispatch(setInputList(updatedData));
    },
    [inputList, dispatch, buildFullAddress]
  );

  // Process user role data
  useEffect(() => {
    if (userRoleData) {
      setSalesList(userRoleData.sale_role);
    }
  }, [userRoleData]);

  // Process business types data
  useEffect(() => {
    if (businessTypesData) {
      setBusinessTypesList(businessTypesData);
    }
  }, [businessTypesData]);

  // Handle loading states
  useEffect(() => {
    if (locationIsFetching || roleIsFetching || businessTypesIsFetching) {
      open_dialog_loading();
    } else {
      Swal.close(); // Close loading when fetching stops
    }
  }, [locationIsFetching, roleIsFetching, businessTypesIsFetching]);

  // Check if any API call has errors
  const hasErrors = locationError || roleError || businessTypesError;
  const isLoading = locationIsFetching || roleIsFetching || businessTypesIsFetching;

  return {
    // Processed data
    provincesList,
    districtList,
    subDistrictList,
    salesList,
    businessTypesList,
    setBusinessTypesList,

    // API states
    isLoading,
    hasErrors,

    // API functions
    refetchLocations,

    // Location handlers (for Autocomplete)
    handleProvinceChange,
    handleDistrictChange,
    handleSubdistrictChange,
    isLoadingDistricts,
    isLoadingSubdistricts,

    // Raw data (if needed)
    locations,
    userRoleData,
    businessTypesData,

    // Individual loading states
    locationIsFetching,
    roleIsFetching,
    businessTypesIsFetching,
  };
};
