import { format } from "date-fns";
import { useCallback, useMemo, useState } from "react";

import {
  useGetCompaniesQuery,
  useGetQuotationReportQuery,
} from "../../../../../features/Accounting/accountingApi";

const computeCounts = (rows) => {
  const counts = {};
  rows.forEach((r) => {
    counts[r.status] = (counts[r.status] || 0) + 1;
  });
  return counts;
};

// Totals exclude rejected rows (matches the table footer convention).
const computeSummary = (rows) => {
  const activeRows = rows.filter((r) => r.status !== "rejected");
  return {
    count: rows.length,
    subtotal: activeRows.reduce((s, r) => s + Number(r.subtotal || 0), 0),
    tax_amount: activeRows.reduce((s, r) => s + Number(r.tax_amount || 0), 0),
    total_amount: activeRows.reduce((s, r) => s + Number(r.final_total_amount || 0), 0),
  };
};

// Wires the report's filter state, RTK queries, and derived counts/totals.
// `dateRange` comes from `useReportDateFilter` — passed in by the shell.
export function useQuotationReport({ dateFrom, dateTo }) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [companyId, setCompanyId] = useState("");

  const queryParams = useMemo(() => {
    const p = {};
    if (dateFrom) p.date_from = format(dateFrom, "yyyy-MM-dd");
    if (dateTo) p.date_to = format(dateTo, "yyyy-MM-dd");
    if (search) p.search = search;
    if (companyId) p.company_id = companyId;
    return p;
  }, [dateFrom, dateTo, search, companyId]);

  const { data, error, isLoading, isFetching, refetch } = useGetQuotationReportQuery(queryParams);
  const { data: companiesData } = useGetCompaniesQuery();

  const allReportData = useMemo(() => data?.data?.data ?? data?.data ?? [], [data]);
  const companies = useMemo(
    () => (Array.isArray(companiesData?.data) ? companiesData.data : (companiesData ?? [])),
    [companiesData]
  );

  const countsByStatus = useMemo(() => computeCounts(allReportData), [allReportData]);

  const displayData = useMemo(() => {
    if (activeTab === "all") return allReportData;
    return allReportData.filter((r) => r.status === activeTab);
  }, [allReportData, activeTab]);

  const dynamicSummary = useMemo(() => computeSummary(displayData), [displayData]);

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      setSearch(searchInput);
    },
    [searchInput]
  );

  const handleRefresh = useCallback(() => refetch(), [refetch]);

  return {
    activeTab,
    setActiveTab,
    searchInput,
    setSearchInput,
    companyId,
    setCompanyId,
    queryParams,
    error,
    isLoading,
    isFetching,
    companies,
    countsByStatus,
    displayData,
    dynamicSummary,
    handleSearchSubmit,
    handleRefresh,
  };
}
