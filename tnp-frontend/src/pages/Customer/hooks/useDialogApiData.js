import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import Swal from "sweetalert2";

import { useGetUserByRoleQuery, useGetAllBusinessTypesQuery } from "../../../features/globalApi";
import { setInputList } from "../../../features/Customer/customerSlice";
import { open_dialog_loading } from "../../../utils/import_lib";

// Use centralized address manager hook
import { useAddressManager } from "./form/useAddressManager";

/**
 * useDialogApiData - Manages API data for Customer DialogForm
 *
 * Refactored to use useAddressManager for location logic.
 * Now focuses on:
 * - Business types
 * - Sales list
 * - Coordinating location changes with Redux
 */
export const useDialogApiData = (openDialog) => {
  const dispatch = useDispatch();
  const inputList = useSelector((state) => state.customer.inputList);

  // Local state for processed data
  const [salesList, setSalesList] = useState([]);
  const [businessTypesList, setBusinessTypesList] = useState([]);

  // === Use Address Manager for Location Logic ===
  const {
    provinces: provincesList,
    districts: districtList,
    subdistricts: subDistrictList,
    isLoadingProvinces: locationIsFetching,
    isLoadingDistricts,
    isLoadingSubdistricts,
    handleProvinceChange: addressProvinceChange,
    handleDistrictChange: addressDistrictChange,
    handleSubdistrictChange: addressSubdistrictChange,
    buildFullAddress,
    loadDistrictsForProvince,
    loadSubdistrictsForDistrict,
  } = useAddressManager({ skip: !openDialog });

  // === Other API Hooks ===
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

  // === Location Handlers (Wrapped to dispatch to Redux) ===

  /**
   * Province change handler - wraps useAddressManager and dispatches to Redux
   */
  const handleProvinceChange = useCallback(
    (event, newValue) => {
      const updatedFields = addressProvinceChange(event, newValue);

      const updatedData = {
        ...inputList,
        ...updatedFields,
      };
      updatedData.cus_address = buildFullAddress(updatedData);

      dispatch(setInputList(updatedData));
    },
    [inputList, dispatch, addressProvinceChange, buildFullAddress]
  );

  /**
   * District change handler - wraps useAddressManager and dispatches to Redux
   */
  const handleDistrictChange = useCallback(
    (event, newValue) => {
      const updatedFields = addressDistrictChange(event, newValue);

      const updatedData = {
        ...inputList,
        ...updatedFields,
      };
      updatedData.cus_address = buildFullAddress(updatedData);

      dispatch(setInputList(updatedData));
    },
    [inputList, dispatch, addressDistrictChange, buildFullAddress]
  );

  /**
   * Subdistrict change handler - wraps useAddressManager and dispatches to Redux
   */
  const handleSubdistrictChange = useCallback(
    (event, newValue) => {
      const updatedFields = addressSubdistrictChange(event, newValue, inputList.cus_zip_code);

      const updatedData = {
        ...inputList,
        ...updatedFields,
      };
      updatedData.cus_address = buildFullAddress(updatedData);

      dispatch(setInputList(updatedData));
    },
    [inputList, dispatch, addressSubdistrictChange, buildFullAddress]
  );

  // === Process API Data ===

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
      Swal.close();
    }
  }, [locationIsFetching, roleIsFetching, businessTypesIsFetching]);

  // === Pre-load location data for View/Edit mode ===

  // Pre-load districts when viewing/editing a customer with province
  useEffect(() => {
    if (openDialog && inputList?.cus_pro_id && provincesList.length > 0) {
      const province = provincesList.find((p) => p.pro_id === inputList.cus_pro_id);
      if (province?.pro_sort_id && districtList.length === 0) {
        loadDistrictsForProvince(province.pro_sort_id);
      }
    }
  }, [
    openDialog,
    inputList?.cus_pro_id,
    provincesList,
    districtList.length,
    loadDistrictsForProvince,
  ]);

  // Pre-load subdistricts when viewing/editing a customer with district
  useEffect(() => {
    if (openDialog && inputList?.cus_dis_id && districtList.length > 0) {
      const district = districtList.find((d) => d.dis_id === inputList.cus_dis_id);
      if (district?.dis_sort_id && subDistrictList.length === 0) {
        loadSubdistrictsForDistrict(district.dis_sort_id);
      }
    }
  }, [
    openDialog,
    inputList?.cus_dis_id,
    districtList,
    subDistrictList.length,
    loadSubdistrictsForDistrict,
  ]);

  // Check if any API call has errors
  const hasErrors = roleError || businessTypesError;
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

    // Location handlers (for Autocomplete)
    handleProvinceChange,
    handleDistrictChange,
    handleSubdistrictChange,
    isLoadingDistricts,
    isLoadingSubdistricts,

    // Utility functions (for edit mode pre-loading)
    loadDistrictsForProvince,
    loadSubdistrictsForDistrict,

    // Raw data (if needed)
    userRoleData,
    businessTypesData,

    // Individual loading states
    locationIsFetching,
    roleIsFetching,
    businessTypesIsFetching,
  };
};
