import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import { setInputList } from "../../../features/Customer/customerSlice";
import { setLocationSearch } from "../../../features/globalSlice";

export const useLocationSelection = (
  provincesList,
  districtList,
  subDistrictList,
  refetchLocations
) => {
  const dispatch = useDispatch();
  const inputList = useSelector((state) => state.customer.inputList);
  const locationSearch = useSelector((state) => state.global.locationSearch);
  const user = JSON.parse(localStorage.getItem("userData"));

  const handleSelectLocation = useCallback(
    (e) => {
      const { name, value } = e.target;

      // 🛡️ เพิ่ม validation logic ป้องกันการเลือกผิดลำดับ
      if (name === "cus_dis_id" && !inputList.cus_pro_id) {
        alert("กรุณาเลือกจังหวัดก่อน");
        return;
      }
      if (name === "cus_sub_id" && !inputList.cus_dis_id) {
        alert("กรุณาเลือกเขต/อำเภอก่อน");
        return;
      }

      let updatedInputList = {
        ...inputList,
        [name]: value,
        cus_updated_by: user.user_id,
      };

      const clearDependentDropdowns = (dependencies) => {
        dependencies.forEach((dep) => {
          updatedInputList = { ...updatedInputList, [dep]: "" };
        });
      };

      switch (name) {
        case "cus_pro_id": {
          clearDependentDropdowns(["cus_dis_id", "cus_sub_id", "cus_zip_code"]);
          const provincesResult = provincesList.find((find) => find.pro_id === value);
          if (provincesResult) {
            console.log("🏗️ Province selected, updating locationSearch and refetching...");
            dispatch(
              setLocationSearch({
                province_sort_id: provincesResult.pro_sort_id,
                district_sort_id: undefined, // Clear district_sort_id when changing province
              })
            );

            // Manual refetch เพื่อโหลด district list ใหม่
            if (refetchLocations) {
              console.log("🔄 Manually refetching location data...");
              try {
                // รอให้ refetch เสร็จ (ถ้าเป็น async)
                const refetchResult = refetchLocations();
                if (refetchResult && typeof refetchResult.then === "function") {
                  refetchResult
                    .then(() => {
                      console.log("✅ Refetch completed successfully");
                    })
                    .catch((error) => {
                      console.error("❌ Refetch failed:", error);
                    });
                } else {
                  console.log("✅ Refetch triggered (sync)");
                }
              } catch (error) {
                console.error("❌ Refetch failed:", error);
                // ใช้ setTimeout เป็น fallback
                setTimeout(() => {
                  refetchLocations();
                }, 100);
              }
            }
          }
          break;
        }
        case "cus_dis_id": {
          clearDependentDropdowns(["cus_sub_id", "cus_zip_code"]);
          const districtResult = districtList.find((find) => find.dis_id === value);
          if (districtResult) {
            dispatch(
              setLocationSearch({
                ...locationSearch,
                district_sort_id: districtResult.dis_sort_id,
              })
            );

            // Manual refetch เพื่อโหลด subdistrict list ใหม่
            if (refetchLocations) {
              console.log("🔄 Manually refetching location data for subdistricts...");
              try {
                const refetchResult = refetchLocations();
                if (refetchResult && typeof refetchResult.then === "function") {
                  refetchResult
                    .then(() => {
                      console.log("✅ Subdistrict refetch completed successfully");
                    })
                    .catch((error) => {
                      console.error("❌ Subdistrict refetch failed:", error);
                    });
                } else {
                  console.log("✅ Subdistrict refetch triggered (sync)");
                }
              } catch (error) {
                console.error("❌ Subdistrict refetch failed:", error);
                setTimeout(() => {
                  refetchLocations();
                }, 100);
              }
            }
          }
          break;
        }
        case "cus_sub_id": {
          const subDistrictResult = subDistrictList.find((find) => find.sub_id === value);
          if (subDistrictResult) {
            updatedInputList = {
              ...updatedInputList,
              cus_zip_code: subDistrictResult.sub_zip_code,
            };
          }
          break;
        }
        default:
          break;
      }

      dispatch(setInputList(updatedInputList));
    },
    [
      inputList,
      provincesList,
      districtList,
      subDistrictList,
      dispatch,
      locationSearch,
      user.user_id,
      refetchLocations,
    ]
  );

  return {
    handleSelectLocation,
  };
};
