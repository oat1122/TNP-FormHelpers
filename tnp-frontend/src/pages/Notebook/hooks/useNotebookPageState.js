import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import {
  setDialogFocusTarget,
  setDialogMode,
  setDialogOpen,
  setSelectedNotebook,
} from "../../../features/Notebook/notebookSlice";
import { useGetAllUserQuery } from "../../../features/UserManagement/userManagementApi";
import { useDebouncedValue } from "./useDebouncedValue";
import {
  buildNotebookFilterSummary,
  getDefaultNotebookPeriodFilter,
  getStoredNotebookUser,
} from "../utils/notebookAdapters";

export const useNotebookPageState = () => {
  const dispatch = useDispatch();
  const currentUser = useMemo(() => getStoredNotebookUser(), []);
  const canFilterBySales = currentUser?.role === "admin" || currentUser?.role === "manager";
  const defaultPeriodFilter = useMemo(() => getDefaultNotebookPeriodFilter(), []);
  const defaultFilters = useMemo(
    () => ({
      keyword: "",
      statusFilter: "all",
      actionFilter: "all",
      salesFilter: "all",
      dateFilterBy: "all",
      periodFilter: defaultPeriodFilter,
      viewMode: "table",
    }),
    [defaultPeriodFilter]
  );

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 15 });
  const [searchInput, setSearchInput] = useState(defaultFilters.keyword);
  const [periodFilter, setPeriodFilter] = useState(defaultFilters.periodFilter);
  const [dateFilterBy, setDateFilterBy] = useState(defaultFilters.dateFilterBy);
  const [statusFilter, setStatusFilter] = useState(defaultFilters.statusFilter);
  const [actionFilter, setActionFilter] = useState(defaultFilters.actionFilter);
  const [salesFilter, setSalesFilter] = useState(defaultFilters.salesFilter);
  const [viewMode, setViewMode] = useState(defaultFilters.viewMode);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 400);

  const { data: salesData } = useGetAllUserQuery(
    { per_page: 1000 },
    {
      skip: !canFilterBySales,
    }
  );

  const salesOptions = useMemo(() => {
    if (!canFilterBySales) {
      return [];
    }

    return (salesData?.data || []).map((user) => ({
      value: String(user.user_id),
      label: user.username || user.user_nickname || `User ${user.user_id}`,
    }));
  }, [canFilterBySales, salesData?.data]);

  useEffect(() => {
    setPaginationModel((previous) => (previous.page === 0 ? previous : { ...previous, page: 0 }));
  }, [
    debouncedSearch,
    periodFilter.startDate,
    periodFilter.endDate,
    periodFilter.mode,
    dateFilterBy,
    statusFilter,
    actionFilter,
    salesFilter,
  ]);

  const queryFilters = useMemo(
    () => ({
      page: paginationModel.page,
      per_page: paginationModel.pageSize,
      search: debouncedSearch || undefined,
      start_date: periodFilter.startDate,
      end_date: periodFilter.endDate,
      date_filter_by: dateFilterBy,
      status: statusFilter !== "all" ? statusFilter : undefined,
      action: actionFilter !== "all" ? actionFilter : undefined,
      manage_by: salesFilter !== "all" ? Number(salesFilter) : undefined,
      include: "histories",
    }),
    [
      paginationModel.page,
      paginationModel.pageSize,
      debouncedSearch,
      periodFilter.startDate,
      periodFilter.endDate,
      dateFilterBy,
      statusFilter,
      actionFilter,
      salesFilter,
    ]
  );

  const exportFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      start_date: periodFilter.startDate,
      end_date: periodFilter.endDate,
      date_filter_by: dateFilterBy,
      status: statusFilter !== "all" ? statusFilter : undefined,
      action: actionFilter !== "all" ? actionFilter : undefined,
      manage_by: salesFilter !== "all" ? Number(salesFilter) : undefined,
      include: "histories",
    }),
    [
      debouncedSearch,
      periodFilter.startDate,
      periodFilter.endDate,
      dateFilterBy,
      statusFilter,
      actionFilter,
      salesFilter,
    ]
  );

  const filterSummary = useMemo(
    () =>
      buildNotebookFilterSummary({
        keyword: debouncedSearch,
        periodFilter,
        dateFilterBy,
        statusFilter,
        actionFilter,
        salesFilter,
        salesOptions,
        defaults: defaultFilters,
      }),
    [
      debouncedSearch,
      periodFilter,
      dateFilterBy,
      statusFilter,
      actionFilter,
      salesFilter,
      salesOptions,
      defaultFilters,
    ]
  );

  const openDialog = (mode, notebook = null, focusTarget = null) => {
    dispatch(setDialogMode(mode));
    dispatch(setSelectedNotebook(notebook));
    dispatch(setDialogFocusTarget(focusTarget));
    dispatch(setDialogOpen(true));
  };

  const handleAdd = () => {
    openDialog("create", null, null);
  };

  const handleEdit = (notebook) => {
    openDialog("edit", notebook, null);
  };

  const handleEditWorkflow = (notebook) => {
    openDialog("edit", notebook, "workflow");
  };

  const handleView = (notebook) => {
    openDialog("view", notebook, null);
  };

  const handleClearFilters = () => {
    setSearchInput(defaultFilters.keyword);
    setPeriodFilter(getDefaultNotebookPeriodFilter());
    setDateFilterBy(defaultFilters.dateFilterBy);
    setStatusFilter(defaultFilters.statusFilter);
    setActionFilter(defaultFilters.actionFilter);
    setSalesFilter(defaultFilters.salesFilter);
    setPaginationModel((previous) => ({ ...previous, page: 0 }));
  };

  return {
    currentUser,
    userRole: currentUser?.role,
    canFilterBySales,
    paginationModel,
    setPaginationModel,
    searchInput,
    setSearchInput,
    periodFilter,
    setPeriodFilter,
    dateFilterBy,
    setDateFilterBy,
    statusFilter,
    setStatusFilter,
    actionFilter,
    setActionFilter,
    salesFilter,
    setSalesFilter,
    salesOptions,
    viewMode,
    setViewMode,
    customerDialogOpen,
    setCustomerDialogOpen,
    exportDialogOpen,
    setExportDialogOpen,
    queryFilters,
    exportFilters,
    filterSummary,
    handleClearFilters,
    handleAdd,
    handleEdit,
    handleEditWorkflow,
    handleView,
  };
};
