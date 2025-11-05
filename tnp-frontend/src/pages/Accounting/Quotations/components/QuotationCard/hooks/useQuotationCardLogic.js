import React from "react";
import {
  useDeleteQuotationMutation,
  useGetCompaniesQuery,
  useUpdateQuotationMutation,
  useApproveQuotationMutation,
  useSubmitQuotationMutation,
} from "../../../../../../features/Accounting/accountingApi";
import { formatUserDisplay } from "../../../../../../utils/formatUser";

export default function useQuotationCardLogic(data, onActionSuccess) {
  // ✅ รับ argument ใหม่
  const amountText = React.useMemo(
    () =>
      new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(
        Number(data?.total_amount || 0)
      ),
    [data?.total_amount]
  );

  const [showAll, setShowAll] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);

  const [deleteQuotation] = useDeleteQuotationMutation();
  const { data: companiesResp, isLoading: companiesLoading } = useGetCompaniesQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });
  const [updateQuotation, { isLoading: updatingCompany }] = useUpdateQuotationMutation();
  const [approveQuotation, { isLoading: approving }] = useApproveQuotationMutation();
  const [submitQuotation, { isLoading: submitting }] = useSubmitQuotationMutation();

  const companies = React.useMemo(() => {
    const list = companiesResp?.data ?? companiesResp ?? [];
    return Array.isArray(list) ? list : [];
  }, [companiesResp]);

  const userData = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}");
    } catch (error) {
      console.error("Parse userData failed", error);
      return {};
    }
  }, []);

  const canChangeCompany = React.useMemo(
    () => ["admin", "account"].includes(userData?.role),
    [userData?.role]
  );

  const currentCompany = React.useMemo(
    () => companies.find((company) => company.id === data?.company_id),
    [companies, data?.company_id]
  );

  const canApprove = React.useMemo(
    () =>
      ["admin", "account"].includes(userData?.role) &&
      ["draft", "pending_review"].includes(data?.status),
    [userData?.role, data?.status]
  );

  const prIds = React.useMemo(() => {
    const set = new Set();
    if (Array.isArray(data?.items)) {
      data.items.forEach((item) => {
        if (item?.pricing_request_id) {
          set.add(item.pricing_request_id);
        }
      });
    }
    if (data?.primary_pricing_request_id) {
      set.add(data.primary_pricing_request_id);
    }
    if (Array.isArray(data?.primary_pricing_request_ids)) {
      data.primary_pricing_request_ids.forEach((id) => set.add(id));
    }
    return Array.from(set);
  }, [data]);

  const creatorText = React.useMemo(() => formatUserDisplay(data), [data]);

  // ✅ ลบการ auto-delete เมื่อไม่มี pricing request
  // React.useEffect(() => {
  //   if (!data?.id || deleted) {
  //     return;
  //   }
  //   if ((prIds?.length || 0) === 0) {
  //     deleteQuotation(data.id).finally(() => setDeleted(true));
  //   }
  // }, [data?.id, prIds, deleted, deleteQuotation]);

  const onChangeCompany = React.useCallback(
    async (newCompanyId) => {
      try {
        await updateQuotation({ id: data?.id, company_id: newCompanyId }).unwrap();
      } catch (error) {
        console.error("Update company failed", error);
      }
    },
    [data?.id, updateQuotation]
  );

  const onApprove = React.useCallback(async () => {
    try {
      if (data?.status === "draft") {
        try {
          await submitQuotation(data.id).unwrap();
        } catch (error) {
          console.warn("Submit quotation skipped", error);
        }
      }
      await approveQuotation({ id: data?.id }).unwrap();
      onActionSuccess?.(); // ✅ เรียก callback เมื่ออนุมัติสำเร็จ
    } catch (error) {
      console.error("Approve failed", error);
    }
  }, [approveQuotation, data?.id, data?.status, submitQuotation, onActionSuccess]); // ✅ เพิ่ม dependency

  return {
    companiesLoading,
    updatingCompany,
    approving,
    submitting,
    deleted,
    showAll,
    setShowAll,
    amountText,
    companies,
    canChangeCompany,
    currentCompany,
    canApprove,
    prIds,
    creatorText,
    onChangeCompany,
    onApprove,
  };
}
