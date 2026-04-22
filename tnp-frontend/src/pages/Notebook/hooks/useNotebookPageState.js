import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { useDebouncedValue } from "./useDebouncedValue";
import {
  setDialogFocusTarget,
  setDialogMode,
  setDialogOpen,
  setSelectedNotebook,
} from "../../../features/Notebook/notebookSlice";
import { useGetAllUserQuery } from "../../../features/UserManagement/userManagementApi";
import {
  canExportNotebookSelfReport,
  canCreateCustomerCare,
  canViewAllNotebookScope,
  canViewNotebookQueue,
  getDefaultNotebookScope,
  getNotebookQueueActionMode,
  isSupportSalesUser,
} from "../../../utils/userAccess";
import {
  buildNotebookFilterSummary,
  getDefaultNotebookPeriodFilter,
  getStoredNotebookUser,
} from "../utils/notebookAdapters";

export const useNotebookPageState = () => {
  const dispatch = useDispatch();
  const currentUser = useMemo(() => getStoredNotebookUser(), []);
  const canViewAllScope = canViewAllNotebookScope(currentUser);
  const canFilterBySales = canViewAllScope;
  const canUseQueueTabs = canViewNotebookQueue(currentUser);
  const canSelfReport = canExportNotebookSelfReport(currentUser);
  const canOpenCustomerCare = canCreateCustomerCare(currentUser);
  const canCreateMineCustomer = isSupportSalesUser(currentUser);
  const queueActionMode = getNotebookQueueActionMode(currentUser);
  const defaultScopeFilter = useMemo(() => getDefaultNotebookScope(currentUser), [currentUser]);
  const defaultPeriodFilter = useMemo(() => getDefaultNotebookPeriodFilter(), []);
  const defaultFilters = useMemo(
    () => ({
      scopeFilter: defaultScopeFilter,
      keyword: "",
      statusFilter: "all",
      actionFilter: "all",
      entryTypeFilter: "all",
      salesFilter: "all",
      dateFilterBy: "all",
      periodFilter: defaultPeriodFilter,
      viewMode: "table",
    }),
    [defaultPeriodFilter, defaultScopeFilter]
  );

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 15 });
  const [scopeFilter, setScopeFilter] = useState(defaultFilters.scopeFilter);
  const [searchInput, setSearchInput] = useState(defaultFilters.keyword);
  const [periodFilter, setPeriodFilter] = useState(defaultFilters.periodFilter);
  const [dateFilterBy, setDateFilterBy] = useState(defaultFilters.dateFilterBy);
  const [statusFilter, setStatusFilter] = useState(defaultFilters.statusFilter);
  const [actionFilter, setActionFilter] = useState(defaultFilters.actionFilter);
  const [entryTypeFilter, setEntryTypeFilter] = useState(defaultFilters.entryTypeFilter);
  const [salesFilter, setSalesFilter] = useState(defaultFilters.salesFilter);
  const [viewMode, setViewMode] = useState(defaultFilters.viewMode);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [customerCareDialogState, setCustomerCareDialogState] = useState({
    open: false,
    mode: "create",
    selectedRecord: null,
  });
  const [personalActivityDialogState, setPersonalActivityDialogState] = useState({
    open: false,
    mode: "create",
    selectedRecord: null,
  });
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

    const SALES_SUBROLES = new Set([
      "SALES_OFFLINE",
      "SALES_ONLINE",
      "SUPPORT_SALES",
      "HEAD_OFFLINE",
      "HEAD_ONLINE",
      "TALESALES",
    ]);

    const isSalesUser = (user) => {
      if (user?.role === "sale") {
        return true;
      }

      const subRoleCodes = (user?.sub_roles || [])
        .map((subRole) => subRole?.msr_code)
        .filter(Boolean);

      return subRoleCodes.some((code) => SALES_SUBROLES.has(code));
    };

    return (salesData?.data || []).filter(isSalesUser).map((user) => ({
      value: String(user.user_id),
      label: user.username || user.user_nickname || `User ${user.user_id}`,
    }));
  }, [canFilterBySales, salesData?.data]);

  useEffect(() => {
    setPaginationModel((previous) => (previous.page === 0 ? previous : { ...previous, page: 0 }));
  }, [
    debouncedSearch,
    scopeFilter,
    periodFilter.startDate,
    periodFilter.endDate,
    periodFilter.mode,
    dateFilterBy,
    statusFilter,
    actionFilter,
    entryTypeFilter,
    salesFilter,
  ]);

  const queryFilters = useMemo(
    () => ({
      page: paginationModel.page,
      per_page: paginationModel.pageSize,
      scope: scopeFilter,
      search: debouncedSearch || undefined,
      start_date: periodFilter.startDate,
      end_date: periodFilter.endDate,
      date_filter_by: dateFilterBy,
      status: statusFilter !== "all" ? statusFilter : undefined,
      action: actionFilter !== "all" ? actionFilter : undefined,
      entry_type: entryTypeFilter !== "all" ? entryTypeFilter : undefined,
      manage_by: salesFilter !== "all" ? Number(salesFilter) : undefined,
      include: "histories",
    }),
    [
      paginationModel.page,
      paginationModel.pageSize,
      debouncedSearch,
      scopeFilter,
      periodFilter.startDate,
      periodFilter.endDate,
      dateFilterBy,
      statusFilter,
      actionFilter,
      entryTypeFilter,
      salesFilter,
    ]
  );

  const exportFilters = useMemo(
    () => ({
      scope: scopeFilter,
      search: debouncedSearch || undefined,
      start_date: periodFilter.startDate,
      end_date: periodFilter.endDate,
      date_filter_by: dateFilterBy,
      status: statusFilter !== "all" ? statusFilter : undefined,
      action: actionFilter !== "all" ? actionFilter : undefined,
      entry_type: entryTypeFilter !== "all" ? entryTypeFilter : undefined,
      manage_by: salesFilter !== "all" ? Number(salesFilter) : undefined,
      include: "histories",
    }),
    [
      debouncedSearch,
      scopeFilter,
      periodFilter.startDate,
      periodFilter.endDate,
      dateFilterBy,
      statusFilter,
      actionFilter,
      entryTypeFilter,
      salesFilter,
    ]
  );

  const filterSummary = useMemo(
    () =>
      buildNotebookFilterSummary({
        keyword: debouncedSearch,
        scopeFilter,
        periodFilter,
        dateFilterBy,
        statusFilter,
        actionFilter,
        entryTypeFilter,
        salesFilter,
        salesOptions,
        defaults: defaultFilters,
      }),
    [
      debouncedSearch,
      scopeFilter,
      periodFilter,
      dateFilterBy,
      statusFilter,
      actionFilter,
      entryTypeFilter,
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

  const openPersonalActivityDialog = (mode, record = null) => {
    setPersonalActivityDialogState({
      open: true,
      mode,
      selectedRecord: record,
    });
  };

  const handleAddPersonalActivity = () => {
    openPersonalActivityDialog("create", null);
  };

  const openCustomerCareDialog = (mode, record = null) => {
    setCustomerCareDialogState({
      open: true,
      mode,
      selectedRecord: record,
    });
  };

  const handleAddCustomerCare = () => {
    if (!canOpenCustomerCare) {
      return;
    }

    openCustomerCareDialog("create", null);
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

  const handleCustomerCareEdit = (notebook) => {
    openCustomerCareDialog("edit", notebook);
  };

  const handleCustomerCareView = (notebook) => {
    openCustomerCareDialog("view", notebook);
  };

  const closeCustomerCareDialog = () => {
    setCustomerCareDialogState({
      open: false,
      mode: "create",
      selectedRecord: null,
    });
  };

  const closePersonalActivityDialog = () => {
    setPersonalActivityDialogState({
      open: false,
      mode: "create",
      selectedRecord: null,
    });
  };

  const handleClearFilters = () => {
    setSearchInput(defaultFilters.keyword);
    setScopeFilter(defaultFilters.scopeFilter);
    setPeriodFilter(getDefaultNotebookPeriodFilter());
    setDateFilterBy(defaultFilters.dateFilterBy);
    setStatusFilter(defaultFilters.statusFilter);
    setActionFilter(defaultFilters.actionFilter);
    setEntryTypeFilter(defaultFilters.entryTypeFilter);
    setSalesFilter(defaultFilters.salesFilter);
    setPaginationModel((previous) => ({ ...previous, page: 0 }));
  };

  const handleScopeChange = (nextScope) => {
    setScopeFilter(nextScope);
    setSearchInput(defaultFilters.keyword);
    setPeriodFilter(getDefaultNotebookPeriodFilter());
    setDateFilterBy(defaultFilters.dateFilterBy);
    setStatusFilter(defaultFilters.statusFilter);
    setActionFilter(defaultFilters.actionFilter);
    setEntryTypeFilter(defaultFilters.entryTypeFilter);
    setSalesFilter(defaultFilters.salesFilter);
    setPaginationModel((previous) => ({ ...previous, page: 0 }));
  };

  return {
    currentUser,
    userRole: currentUser?.role,
    canViewAllScope,
    canFilterBySales,
    canUseQueueTabs,
    queueActionMode,
    canSelfReport,
    canCreateMineCustomer,
    canCreateCustomerCare: canOpenCustomerCare,
    paginationModel,
    setPaginationModel,
    scopeFilter,
    setScopeFilter,
    handleScopeChange,
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
    entryTypeFilter,
    setEntryTypeFilter,
    salesFilter,
    setSalesFilter,
    salesOptions,
    viewMode,
    setViewMode,
    customerDialogOpen,
    setCustomerDialogOpen,
    exportDialogOpen,
    setExportDialogOpen,
    customerCareDialogState,
    personalActivityDialogState,
    queryFilters,
    exportFilters,
    filterSummary,
    handleClearFilters,
    handleAdd,
    handleAddPersonalActivity,
    handleAddCustomerCare,
    handleEdit,
    handleEditWorkflow,
    handleView,
    handleCustomerCareEdit,
    handleCustomerCareView,
    closeCustomerCareDialog,
    openPersonalActivityDialog,
    closePersonalActivityDialog,
  };
};
