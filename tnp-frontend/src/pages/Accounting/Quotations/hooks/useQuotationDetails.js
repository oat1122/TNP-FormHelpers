import { useMemo } from "react";

import { useGetQuotationQuery } from "../../../../features/Accounting/accountingApi";

export default function useQuotationDetails(quotation) {
  const qid = quotation?.id;
  const { data, isLoading, error } = useGetQuotationQuery(qid, { skip: !qid });
  const q = useMemo(() => data?.data || data || quotation || null, [data, quotation]);

  const prIds = useMemo(() => {
    const set = new Set();
    const qq = q || {};
    if (Array.isArray(qq.items))
      qq.items.forEach((it) => it?.pricing_request_id && set.add(it.pricing_request_id));
    if (qq.primary_pricing_request_id) set.add(qq.primary_pricing_request_id);
    const multi = qq.primary_pricing_request_ids;
    if (Array.isArray(multi)) multi.forEach((id) => set.add(id));
    return Array.from(set);
  }, [q]);

  return { q, prIds, isLoading, error };
}
