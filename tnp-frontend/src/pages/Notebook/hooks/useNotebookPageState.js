import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  setDialogMode,
  setDialogOpen,
  setSelectedNotebook,
} from "../../../features/Notebook/notebookSlice";
import { buildNotebookFilterSummary, getStoredNotebookUser } from "../utils/notebookAdapters";

export const useNotebookPageState = () => {
  const dispatch = useDispatch();
  const globalKeyword = useSelector((state) => state.global.keyword);
  const currentUser = useMemo(() => getStoredNotebookUser(), []);

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 15 });
  const [periodFilter, setPeriodFilter] = useState({
    mode: "month",
    shiftUnit: "month",
    startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
    endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
  });
  const [dateFilterBy, setDateFilterBy] = useState("all");
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const queryFilters = useMemo(
    () => ({
      page: paginationModel.page,
      per_page: paginationModel.pageSize,
      search: globalKeyword,
      start_date: periodFilter.startDate,
      end_date: periodFilter.endDate,
      date_filter_by: dateFilterBy,
      include: "histories",
    }),
    [
      paginationModel.page,
      paginationModel.pageSize,
      globalKeyword,
      periodFilter.startDate,
      periodFilter.endDate,
      dateFilterBy,
    ]
  );

  const exportFilters = useMemo(
    () => ({
      search: globalKeyword,
      start_date: periodFilter.startDate,
      end_date: periodFilter.endDate,
      date_filter_by: dateFilterBy,
      include: "histories",
    }),
    [globalKeyword, periodFilter.startDate, periodFilter.endDate, dateFilterBy]
  );

  const filterSummary = useMemo(
    () => buildNotebookFilterSummary({ keyword: globalKeyword, periodFilter, dateFilterBy }),
    [globalKeyword, periodFilter, dateFilterBy]
  );

  const handleAdd = () => {
    dispatch(setDialogMode("create"));
    dispatch(setSelectedNotebook(null));
    dispatch(setDialogOpen(true));
  };

  const handleEdit = (notebook) => {
    dispatch(setDialogMode("edit"));
    dispatch(setSelectedNotebook(notebook));
    dispatch(setDialogOpen(true));
  };

  const handleView = (notebook) => {
    dispatch(setDialogMode("view"));
    dispatch(setSelectedNotebook(notebook));
    dispatch(setDialogOpen(true));
  };

  return {
    currentUser,
    userRole: currentUser?.role,
    paginationModel,
    setPaginationModel,
    periodFilter,
    setPeriodFilter,
    dateFilterBy,
    setDateFilterBy,
    customerDialogOpen,
    setCustomerDialogOpen,
    exportDialogOpen,
    setExportDialogOpen,
    queryFilters,
    exportFilters,
    filterSummary,
    handleAdd,
    handleEdit,
    handleView,
  };
};
