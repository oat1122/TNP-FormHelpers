import { useCallback, useEffect, useState } from "react";

import {
  useGetAllLocationQuery,
  useLazyGetAllLocationQuery,
} from "../../../../../../features/globalApi";

export const useCustomerAddressLookup = (editData, { handleInputChange }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingSubdistricts, setIsLoadingSubdistricts] = useState(false);

  const { data: locationsData } = useGetAllLocationQuery({});
  const [fetchDistricts, { data: districtsData }] = useLazyGetAllLocationQuery();
  const [fetchSubdistricts, { data: subdistrictsData }] = useLazyGetAllLocationQuery();

  useEffect(() => {
    if (!locationsData) return;
    const valid = (locationsData.master_provinces || [])
      .filter((prov) => prov && prov.pro_id && prov.pro_name_th)
      .map((prov, index) => ({ ...prov, pro_id: prov.pro_id || `prov-${index}` }));
    setProvinces(valid);
  }, [locationsData]);

  useEffect(() => {
    if (!districtsData) return;
    const valid = (districtsData.master_district || [])
      .filter((d) => d && d.dis_id && (d.dis_name_th || d.dis_name))
      .map((d) => ({ ...d, dis_name: d.dis_name || d.dis_name_th }));
    setDistricts(valid);
    setIsLoadingDistricts(false);
  }, [districtsData]);

  useEffect(() => {
    if (!subdistrictsData) return;
    const valid = (subdistrictsData.master_subdistrict || [])
      .filter((s) => s && s.sub_id && (s.sub_name_th || s.sub_name))
      .map((s) => ({ ...s, sub_name: s.sub_name || s.sub_name_th }));
    setSubdistricts(valid);
    setIsLoadingSubdistricts(false);
  }, [subdistrictsData]);

  const loadDistricts = useCallback(
    (provinceId) => {
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
    (districtId) => {
      if (!districtId) {
        setSubdistricts([]);
        return;
      }
      setIsLoadingSubdistricts(true);
      fetchSubdistricts({ district_sort_id: districtId });
    },
    [fetchSubdistricts]
  );

  useEffect(() => {
    if (!provinces.length || !editData?.cus_pro_id) return;
    if (districts.length > 0 || isLoadingDistricts) return;
    const province = provinces.find((p) => p.pro_id === editData.cus_pro_id);
    if (province?.pro_sort_id) {
      loadDistricts(province.pro_sort_id);
    }
  }, [provinces, editData?.cus_pro_id, districts.length, isLoadingDistricts, loadDistricts]);

  useEffect(() => {
    if (!districts.length || !editData?.cus_dis_id) return;
    if (subdistricts.length > 0 || isLoadingSubdistricts) return;
    const district = districts.find((d) => d.dis_id === editData.cus_dis_id);
    if (district?.dis_sort_id) {
      loadSubdistricts(district.dis_sort_id);
    }
  }, [
    districts,
    editData?.cus_dis_id,
    subdistricts.length,
    isLoadingSubdistricts,
    loadSubdistricts,
  ]);

  const handleProvinceChange = useCallback(
    (_event, newValue) => {
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
    (_event, newValue) => {
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

  const handleSubdistrictChange = useCallback(
    (_event, newValue) => {
      handleInputChange("cus_sub_id", newValue?.sub_id || "");
      handleInputChange("cus_subdistrict_name", newValue?.sub_name || newValue?.sub_name_th || "");
      if (newValue?.sub_zip_code) {
        handleInputChange("cus_zip_code", newValue.sub_zip_code);
      }
    },
    [handleInputChange]
  );

  return {
    provinces,
    districts,
    subdistricts,
    isLoadingDistricts,
    isLoadingSubdistricts,
    handleProvinceChange,
    handleDistrictChange,
    handleSubdistrictChange,
  };
};
