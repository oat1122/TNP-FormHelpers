import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  useGetAllLocationQuery,
  useGetUserByRoleQuery,
  useGetAllBusinessTypesQuery,
} from "../../../features/globalApi";
import {
  open_dialog_loading,
} from "../../../utils/import_lib";
import Swal from "sweetalert2";

export const useDialogApiData = (openDialog) => {
  const locationSearch = useSelector((state) => state.global.locationSearch);
  
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
  } = useGetAllLocationQuery(locationSearch, { skip: !openDialog });

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
      setProvincesList(locations.master_provinces);
      setDistrictList(locations.master_district);
      setSubDistrictList(locations.master_subdistrict);
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