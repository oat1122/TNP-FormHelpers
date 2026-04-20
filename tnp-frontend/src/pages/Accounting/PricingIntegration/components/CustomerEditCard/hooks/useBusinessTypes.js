import { useMemo } from "react";

import { useGetAllBusinessTypesQuery } from "../../../../../../features/globalApi";

export const useBusinessTypes = () => {
  const { data: businessTypesData } = useGetAllBusinessTypesQuery();

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

  return { businessTypes };
};
