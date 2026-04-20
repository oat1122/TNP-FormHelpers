import { useDispatch } from "react-redux";

import { useCreateQuotationFromMultiplePricingMutation } from "../../../../features/Accounting/accountingApi";
import { addNotification } from "../../../../features/Accounting/accountingSlice";
import { buildCreateQuotationPayload } from "../utils/quotationPayload";

const formatTHB = (n) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(n || 0);

const buildDraftSuccessMessage = (result) =>
  `เลขที่ใบเสนอราคา: ${result?.data?.number || "N/A"} (สถานะ: ร่าง)`;

const buildSubmitSuccessMessage = (result) =>
  `เลขที่ใบเสนอราคา: ${result?.data?.number || "N/A"} ยอดรวม: ${formatTHB(result?.data?.total_amount)}`;

export const useQuotationFromPricing = ({ onSuccess } = {}) => {
  const dispatch = useDispatch();
  const [createMutation, { isLoading }] = useCreateQuotationFromMultiplePricingMutation();

  const runMutation = async ({
    formData,
    selectedPricingRequests,
    successTitle,
    buildSuccessMessage,
    errorTitle,
    errorFallbackMessage,
  }) => {
    try {
      const payload = buildCreateQuotationPayload({ formData, selectedPricingRequests });
      const result = await createMutation(payload).unwrap();

      dispatch(
        addNotification({
          type: "success",
          title: successTitle,
          message: buildSuccessMessage(result),
        })
      );

      onSuccess?.(result);
      return result;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`❌ ${errorTitle}:`, error);
      }
      dispatch(
        addNotification({
          type: "error",
          title: errorTitle,
          message: error?.data?.message || error?.message || errorFallbackMessage,
        })
      );
      throw error;
    }
  };

  const saveDraft = (args) =>
    runMutation({
      ...args,
      successTitle: "บันทึกร่างสำเร็จ! 📝",
      buildSuccessMessage: buildDraftSuccessMessage,
      errorTitle: "เกิดข้อผิดพลาดในการบันทึกร่าง",
      errorFallbackMessage: "ไม่สามารถบันทึกร่างได้",
    });

  const submit = (args) =>
    runMutation({
      ...args,
      successTitle: "สร้างใบเสนอราคาสำเร็จ! 🎉",
      buildSuccessMessage: buildSubmitSuccessMessage,
      errorTitle: "เกิดข้อผิดพลาดในการสร้างใบเสนอราคา",
      errorFallbackMessage: "ไม่สามารถสร้างใบเสนอราคาได้ กรุณาลองใหม่อีกครั้ง",
    });

  return { saveDraft, submit, isLoading };
};
