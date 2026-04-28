import { useCallback, useEffect, useMemo, useState } from "react";

import {
  useGetAllLocationQuery,
  useLazyGetAllLocationQuery,
} from "../../../../../../../features/globalApi";

const normalizeProvinces = (locationsData) =>
  (locationsData?.master_provinces || [])
    .filter((prov) => prov && prov.pro_id && prov.pro_name_th)
    .map((prov, index) => ({ ...prov, pro_id: prov.pro_id || `prov-${index}` }));

const normalizeDistricts = (districtsData) =>
  (districtsData?.master_district || [])
    .filter((d) => {
      const hasName = d.dis_name_th || d.dis_name;
      return d && d.dis_id && hasName;
    })
    .map((d) => ({ ...d, dis_name: d.dis_name || d.dis_name_th }));

const normalizeSubdistricts = (subdistrictsData) =>
  (subdistrictsData?.master_subdistrict || [])
    .filter((s) => {
      const hasName = s.sub_name_th || s.sub_name;
      return s && s.sub_id && hasName;
    })
    .map((s) => ({ ...s, sub_name: s.sub_name || s.sub_name_th }));

// Manages the province → district → subdistrict cascade for the create form.
// Cascade resets descendant fields whenever an ancestor changes, and auto-fills
// the zip code from the selected subdistrict when available.
export function useCustomerCreateLocations({ formData, onChange }) {
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingSubdistricts, setIsLoadingSubdistricts] = useState(false);

  const { data: locationsData } = useGetAllLocationQuery({});
  const [fetchDistricts, { data: districtsData }] = useLazyGetAllLocationQuery();
  const [fetchSubdistricts, { data: subdistrictsData }] = useLazyGetAllLocationQuery();

  const provinces = useMemo(() => normalizeProvinces(locationsData), [locationsData]);

  useEffect(() => {
    if (!districtsData) return;
    setDistricts(normalizeDistricts(districtsData));
    setIsLoadingDistricts(false);
  }, [districtsData]);

  useEffect(() => {
    if (!subdistrictsData) return;
    setSubdistricts(normalizeSubdistricts(subdistrictsData));
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

  const handleProvinceChange = useCallback(
    (_event, newValue) => {
      onChange("cus_pro_id", newValue?.pro_id || "");
      onChange("cus_province_name", newValue?.pro_name_th || "");
      setDistricts([]);
      setSubdistricts([]);
      onChange("cus_dis_id", "");
      onChange("cus_district_name", "");
      onChange("cus_sub_id", "");
      onChange("cus_subdistrict_name", "");

      const sortKey = newValue?.pro_sort_id || newValue?.pro_id;
      if (sortKey) loadDistricts(sortKey);
    },
    [onChange, loadDistricts]
  );

  const handleDistrictChange = useCallback(
    (_event, newValue) => {
      onChange("cus_dis_id", newValue?.dis_id || "");
      onChange("cus_district_name", newValue?.dis_name || newValue?.dis_name_th || "");
      setSubdistricts([]);
      onChange("cus_sub_id", "");
      onChange("cus_subdistrict_name", "");

      const sortKey = newValue?.dis_sort_id || newValue?.dis_id;
      if (sortKey) loadSubdistricts(sortKey);
    },
    [onChange, loadSubdistricts]
  );

  const handleSubdistrictChange = useCallback(
    (_event, newValue) => {
      onChange("cus_sub_id", newValue?.sub_id || "");
      onChange("cus_subdistrict_name", newValue?.sub_name || newValue?.sub_name_th || "");
      if (newValue?.sub_zip_code) {
        onChange("cus_zip_code", newValue.sub_zip_code);
      }
    },
    [onChange]
  );

  const selectedProvince = useMemo(
    () => provinces.find((p) => p.pro_id === formData.cus_pro_id) || null,
    [provinces, formData.cus_pro_id]
  );
  const selectedDistrict = useMemo(
    () => districts.find((d) => d.dis_id === formData.cus_dis_id) || null,
    [districts, formData.cus_dis_id]
  );
  const selectedSubdistrict = useMemo(
    () => subdistricts.find((s) => s.sub_id === formData.cus_sub_id) || null,
    [subdistricts, formData.cus_sub_id]
  );

  return {
    provinces,
    districts,
    subdistricts,
    isLoadingDistricts,
    isLoadingSubdistricts,
    selectedProvince,
    selectedDistrict,
    selectedSubdistrict,
    handleProvinceChange,
    handleDistrictChange,
    handleSubdistrictChange,
  };
}
