import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  useGetAllLocationQuery,
  useGetUserByRoleQuery,
  useGetAllBusinessTypesQuery,
} from "../../../features/globalApi";
import { open_dialog_loading } from "../../../utils/import_lib";
import Swal from "sweetalert2";

export const useDialogApiData = (openDialog) => {
  const locationSearch = useSelector((state) => state.global.locationSearch);

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

  // API hooks - only execute when dialog is open
  const {
    data: locations,
    error: locationError,
    isFetching: locationIsFetching,
    refetch: refetchLocations,
  } = useGetAllLocationQuery(locationSearch, { skip: !openDialog });

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

  // Process locations data
  useEffect(() => {
    if (locations) {
      if (window.debugLocation) {
        console.log("📍 Processing location data:", {
          provinces: locations.master_provinces?.length || 0,
          districts: locations.master_district?.length || 0,
          subdistricts: locations.master_subdistrict?.length || 0,
          rawData: locations,
        });
      }
      setProvincesList(locations.master_provinces || []);
      setDistrictList(locations.master_district || []);
      setSubDistrictList(locations.master_subdistrict || []);
    }
  }, [locations]);

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
