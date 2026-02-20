import Swal from "sweetalert2";

import { useLazyConvertCurrencyQuery } from "../../../../../features/Superlist/supplierApi";

/**
 * Custom hook for currency conversion
 * Handles currency conversion API calls and state updates
 */
export const useCurrencyConversion = () => {
  const [triggerConvert, { isFetching: convertingCurrency }] = useLazyConvertCurrencyQuery();

  const handleConvertCurrency = async (currency, basePrice, setForm) => {
    if (currency === "THB") {
      setForm((prev) => ({
        ...prev,
        sp_price_thb: prev.sp_base_price,
        sp_exchange_rate: "1",
        sp_exchange_date: new Date().toISOString(),
      }));
      return;
    }

    if (!basePrice || !currency) {
      Swal.fire("", "กรุณาใส่ราคาและสกุลเงินก่อน", "warning");
      return;
    }

    try {
      const result = await triggerConvert({
        from: currency,
        amount: basePrice,
      }).unwrap();

      if (result?.data) {
        setForm((prev) => ({
          ...prev,
          sp_price_thb: result.data.converted,
          sp_exchange_rate: result.data.rate,
          sp_exchange_date: result.data.date,
        }));
      }
    } catch (err) {
      Swal.fire("ผิดพลาด", err?.data?.message || "แปลงสกุลเงินไม่สำเร็จ", "error");
    }
  };

  return {
    handleConvertCurrency,
    convertingCurrency,
  };
};
