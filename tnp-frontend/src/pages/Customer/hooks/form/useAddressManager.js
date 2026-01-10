/**
 * useAddressManager - Central hook for Thai address selection
 *
 * Consolidates location logic that was duplicated across:
 * - useDialogApiData.js
 * - useTelesalesQuickForm.js
 *
 * Features:
 * - Province > District > Subdistrict cascade loading
 * - Auto-fill zip code when subdistrict selected
 * - Builds full address string using centralized utility
 * - Supports both Redux-backed and local state modes
 */

import { useState, useEffect, useCallback } from "react";
import { useGetAllLocationQuery, useLazyGetAllLocationQuery } from "../../../../features/globalApi";

// Import centralized address utility
import { buildFullAddress as buildAddressFromUtils } from "../../utils/addressUtils";

/**
 * @param {Object} options
 * @param {boolean} options.skip - Skip API calls (default: false)
 * @param {string} options.mode - "redux" (uses dispatch) or "local" (returns data only)
 * @param {Object} options.initialProvinceId - Pre-selected province ID for edit mode
 * @param {Object} options.initialDistrictId - Pre-selected district ID for edit mode
 */
export const useAddressManager = ({
  skip = false,
  mode = "local",
  initialProvinceId = null,
  initialDistrictId = null,
} = {}) => {
  // Location data states
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);

  // Loading states
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingSubdistricts, setIsLoadingSubdistricts] = useState(false);

  // Selected values for cascade tracking
  const [selectedProvinceId, setSelectedProvinceId] = useState(initialProvinceId);
  const [selectedDistrictId, setSelectedDistrictId] = useState(initialDistrictId);

  // API hooks
  const { data: locationsData, isFetching: isLoadingProvinces } = useGetAllLocationQuery(
    {},
    { skip }
  );
  const [fetchDistricts, { data: districtsData }] = useLazyGetAllLocationQuery();
  const [fetchSubdistricts, { data: subdistrictsData }] = useLazyGetAllLocationQuery();

  // ==================== Process API Data ====================

  // Process provinces when data arrives
  useEffect(() => {
    if (locationsData?.master_provinces) {
      const validProvinces = locationsData.master_provinces
        .filter((prov) => prov?.pro_id && prov?.pro_name_th)
        .map((prov, index) => ({
          ...prov,
          pro_id: prov.pro_id || `prov-${index}`,
        }));
      setProvinces(validProvinces);
    }
  }, [locationsData]);

  // Process districts when lazy query returns
  useEffect(() => {
    if (districtsData?.master_district) {
      const validDistricts = districtsData.master_district
        .filter((district) => district?.dis_id && (district.dis_name_th || district.dis_name))
        .map((district) => ({
          ...district,
          dis_name: district.dis_name || district.dis_name_th,
        }));
      setDistricts(validDistricts);
      setIsLoadingDistricts(false);
    }
  }, [districtsData]);

  // Process subdistricts when lazy query returns
  useEffect(() => {
    if (subdistrictsData?.master_subdistrict) {
      const validSubdistricts = subdistrictsData.master_subdistrict
        .filter((sub) => sub?.sub_id && (sub.sub_name_th || sub.sub_name))
        .map((sub) => ({
          ...sub,
          sub_name: sub.sub_name || sub.sub_name_th,
        }));
      setSubdistricts(validSubdistricts);
      setIsLoadingSubdistricts(false);
    }
  }, [subdistrictsData]);

  // ==================== Helper Functions ====================

  /**
   * Build full address string from form data (cus_* fields)
   * Maps form field names to utility parameter names
   */
  const buildFullAddress = useCallback((formData) => {
    return buildAddressFromUtils({
      address: formData.cus_address_detail || "",
      subdistrict: formData.cus_subdistrict_text || "",
      district: formData.cus_district_text || "",
      province: formData.cus_province_text || "",
      zipCode: formData.cus_zip_code || "",
    });
  }, []);

  // ==================== Change Handlers ====================

  /**
   * Handle province selection - clears dependent fields and loads districts
   * @param {Object} newValue - Selected province object from Autocomplete
   * @returns {Object} Updated address fields
   */
  const handleProvinceChange = useCallback(
    (event, newValue) => {
      // Track selected province
      setSelectedProvinceId(newValue?.pro_id || null);
      setSelectedDistrictId(null);

      // Clear dependent data
      setDistricts([]);
      setSubdistricts([]);

      // Load districts for selected province
      if (newValue?.pro_sort_id) {
        setIsLoadingDistricts(true);
        fetchDistricts({ province_sort_id: newValue.pro_sort_id });
      }

      // Return updated fields for consumer to apply
      return {
        cus_pro_id: newValue?.pro_id || "",
        cus_province_text: newValue?.pro_name_th || "",
        // Clear dependent fields
        cus_dis_id: "",
        cus_district_text: "",
        cus_sub_id: "",
        cus_subdistrict_text: "",
        cus_zip_code: "",
      };
    },
    [fetchDistricts]
  );

  /**
   * Handle district selection - clears subdistrict and loads subdistricts
   * @param {Object} newValue - Selected district object from Autocomplete
   * @returns {Object} Updated address fields
   */
  const handleDistrictChange = useCallback(
    (event, newValue) => {
      // Track selected district
      setSelectedDistrictId(newValue?.dis_id || null);

      // Clear dependent data
      setSubdistricts([]);

      // Load subdistricts for selected district
      if (newValue?.dis_sort_id) {
        setIsLoadingSubdistricts(true);
        fetchSubdistricts({ district_sort_id: newValue.dis_sort_id });
      }

      // Return updated fields for consumer to apply
      return {
        cus_dis_id: newValue?.dis_id || "",
        cus_district_text: newValue?.dis_name_th || newValue?.dis_name || "",
        // Clear dependent fields
        cus_sub_id: "",
        cus_subdistrict_text: "",
        cus_zip_code: "",
      };
    },
    [fetchSubdistricts]
  );

  /**
   * Handle subdistrict selection - auto-fills zip code
   * @param {Object} newValue - Selected subdistrict object from Autocomplete
   * @param {string} currentZipCode - Current zip code (to preserve if user manually entered)
   * @returns {Object} Updated address fields
   */
  const handleSubdistrictChange = useCallback((event, newValue, currentZipCode = "") => {
    return {
      cus_sub_id: newValue?.sub_id || "",
      cus_subdistrict_text: newValue?.sub_name_th || newValue?.sub_name || "",
      cus_zip_code: newValue?.sub_zip_code || currentZipCode || "",
    };
  }, []);

  /**
   * Load districts for a specific province (used in edit mode)
   */
  const loadDistrictsForProvince = useCallback(
    (provinceSortId) => {
      if (provinceSortId) {
        setIsLoadingDistricts(true);
        fetchDistricts({ province_sort_id: provinceSortId });
      }
    },
    [fetchDistricts]
  );

  /**
   * Load subdistricts for a specific district (used in edit mode)
   */
  const loadSubdistrictsForDistrict = useCallback(
    (districtSortId) => {
      if (districtSortId) {
        setIsLoadingSubdistricts(true);
        fetchSubdistricts({ district_sort_id: districtSortId });
      }
    },
    [fetchSubdistricts]
  );

  /**
   * Reset all location data
   */
  const resetLocationData = useCallback(() => {
    setDistricts([]);
    setSubdistricts([]);
    setSelectedProvinceId(null);
    setSelectedDistrictId(null);
  }, []);

  // ==================== Return API ====================
  return {
    // Data
    provinces,
    districts,
    subdistricts,

    // Loading states
    isLoadingProvinces,
    isLoadingDistricts,
    isLoadingSubdistricts,

    // Change handlers (return updated fields, don't dispatch)
    handleProvinceChange,
    handleDistrictChange,
    handleSubdistrictChange,

    // Utility functions
    buildFullAddress,
    loadDistrictsForProvince,
    loadSubdistrictsForDistrict,
    resetLocationData,

    // Tracking (for conditional rendering)
    selectedProvinceId,
    selectedDistrictId,
  };
};
